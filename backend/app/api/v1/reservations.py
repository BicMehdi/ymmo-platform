from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_roles
from app.db import get_db
from app.models.db_models import Property, Reservation, Transaction, User
from app.models.schemas import ReservationCreate, ReservationOut

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.post("", response_model=ReservationOut, status_code=201)
def create_reservation(
    payload: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crée une réservation + transaction simulée et passe le bien en 'reserved'."""
    prop = db.get(Property, payload.property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Bien introuvable")
    if prop.status not in ("published", "draft"):
        raise HTTPException(status_code=409, detail="Ce bien n'est plus disponible à la réservation")

    # Créer la réservation
    reservation = Reservation(
        user_id=current_user.id,
        property_id=payload.property_id,
        amount=payload.amount,
        status="confirmed",
    )
    db.add(reservation)
    db.flush()  # pour obtenir reservation.id

    # Créer la transaction simulée (paiement immédiatement "paid")
    transaction = Transaction(
        reservation_id=reservation.id,
        user_id=current_user.id,
        property_id=payload.property_id,
        amount=payload.amount,
        status="paid",
        payment_method="card",
    )
    db.add(transaction)

    # Passer le bien en "reserved"
    prop.status = "reserved"

    db.commit()
    db.refresh(reservation)
    return reservation


@router.get("", response_model=list[ReservationOut])
def list_reservations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin : toutes les réservations. Client : les siennes uniquement."""
    if current_user.role == "admin":
        return list(db.scalars(select(Reservation).order_by(Reservation.id.desc())).all())
    return list(
        db.scalars(
            select(Reservation)
            .where(Reservation.user_id == current_user.id)
            .order_by(Reservation.id.desc())
        ).all()
    )


@router.put("/{reservation_id}/status", response_model=ReservationOut)
def update_reservation_status(
    reservation_id: int,
    body: dict,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    """Admin : valider, annuler, rembourser, marquer vendu."""
    new_status = body.get("status", "")
    if new_status not in ("confirmed", "cancelled", "refunded", "sold"):
        raise HTTPException(status_code=400, detail="Statut invalide")

    reservation = db.get(Reservation, reservation_id)
    if not reservation:
        raise HTTPException(status_code=404, detail="Réservation introuvable")

    reservation.status = new_status

    # Sync statut du bien
    prop = db.get(Property, reservation.property_id)
    if prop:
        if new_status == "sold":
            prop.status = "sold"
            if reservation.transaction:
                reservation.transaction.status = "paid"
        elif new_status == "cancelled":
            prop.status = "published"
            if reservation.transaction:
                reservation.transaction.status = "cancelled"
        elif new_status == "refunded":
            prop.status = "published"
            if reservation.transaction:
                reservation.transaction.status = "refunded"

    db.commit()
    db.refresh(reservation)
    return reservation
