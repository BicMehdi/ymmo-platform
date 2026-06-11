from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db import get_db
from app.models.db_models import Favorite, Property, User
from app.models.schemas import FavoriteOut

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=list[FavoriteOut])
def list_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retourne tous les favoris de l'utilisateur connecté."""
    return list(db.scalars(
        select(Favorite).where(Favorite.user_id == current_user.id)
    ).all())


@router.post("/{property_id}", response_model=FavoriteOut, status_code=201)
def add_favorite(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ajoute un bien aux favoris. Idempotent : renvoie le favori existant si déjà présent."""
    if not db.get(Property, property_id):
        raise HTTPException(status_code=404, detail="Bien introuvable")

    existing = db.scalar(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.property_id == property_id,
        )
    )
    if existing:
        return existing

    fav = Favorite(user_id=current_user.id, property_id=property_id)
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav


@router.delete("/{property_id}", status_code=204)
def remove_favorite(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retire un bien des favoris."""
    fav = db.scalar(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.property_id == property_id,
        )
    )
    if fav:
        db.delete(fav)
        db.commit()
