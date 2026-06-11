from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import require_roles
from app.db import get_db
from app.models.db_models import Property, User
from app.models.schemas import PropertyCreate, PropertyOut

router = APIRouter(prefix="/properties", tags=["properties"])

@router.get("", response_model=list[PropertyOut])
def list_properties(
    city: str | None = None,
    property_type: str | None = None,
    min_price: float | None = Query(default=None, gt=0),
    max_price: float | None = Query(default=None, gt=0),
    min_area: float | None = Query(default=None, gt=0),
    max_area: float | None = Query(default=None, gt=0),
    rooms: int | None = Query(default=None, ge=1),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[Property]:
    query = select(Property)

    if city:
        query = query.where(Property.city.ilike(f"%{city.strip()}%"))
    if property_type:
        query = query.where(Property.property_type.ilike(f"%{property_type.strip()}%"))
    if min_price is not None:
        query = query.where(Property.price >= min_price)
    if max_price is not None:
        query = query.where(Property.price <= max_price)
    if min_area is not None:
        query = query.where(Property.area_m2 >= min_area)
    if max_area is not None:
        query = query.where(Property.area_m2 <= max_area)
    if rooms is not None:
        query = query.where(Property.rooms == rooms)

    query = query.offset(skip).limit(limit)
    return list(db.scalars(query).all())


@router.get("/{property_id}", response_model=PropertyOut)
def get_property(property_id: int, db: Session = Depends(get_db)) -> Property:
    item = db.get(Property, property_id)
    if item:
        return item
    raise HTTPException(status_code=404, detail="Property not found")


@router.post("", response_model=PropertyOut, status_code=201)
def create_property(
    payload: PropertyCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("admin", "agent")),
) -> Property:
    new_item = Property(**payload.model_dump(), status="published", owner_user_id=user.id)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.delete("/{property_id}", status_code=204)
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "agent")),
) -> None:
    item = db.get(Property, property_id)
    if item:
        db.delete(item)
        db.commit()
        return
    raise HTTPException(status_code=404, detail="Property not found")
