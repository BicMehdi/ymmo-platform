from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_roles
from app.db import get_db
from app.models.db_models import Lead, Property, User
from app.models.schemas import LeadCreate, LeadOut, LeadStatusUpdate

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post("", response_model=LeadOut, status_code=201)
def create_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Lead:
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé")
    property_item = db.get(Property, payload.property_id)
    if not property_item:
        raise HTTPException(status_code=404, detail="Property not found")

    lead = Lead(
        property_id=payload.property_id,
        client_user_id=user.id,
        assigned_agent_id=property_item.owner_user_id,
        message=payload.message,
        status="new",
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/me", response_model=list[LeadOut])
def list_my_leads(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Lead]:
    query = (
        select(Lead)
        .where(Lead.client_user_id == user.id)
        .order_by(Lead.created_at.desc())
    )
    return list(db.scalars(query).all())


@router.get("/agent", response_model=list[LeadOut])
def list_agent_leads(
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("admin", "agent")),
) -> list[Lead]:
    query = select(Lead)
    if user.role == "agent":
        query = query.where(Lead.assigned_agent_id == user.id)
    if status_filter:
        query = query.where(Lead.status == status_filter)

    query = query.order_by(Lead.created_at.desc())
    return list(db.scalars(query).all())


@router.patch("/{lead_id}/status", response_model=LeadOut)
def update_lead_status(
    lead_id: int,
    payload: LeadStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("admin", "agent")),
) -> Lead:
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if user.role == "agent" and lead.assigned_agent_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your assigned leads",
        )

    lead.status = payload.status
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Lead:
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if user.role == "client" and lead.client_user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if user.role == "agent" and lead.assigned_agent_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return lead
