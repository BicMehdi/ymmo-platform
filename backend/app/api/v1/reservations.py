from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.v1.auth import get_current_user, require_roles
from app.db import get_db
from app.models.db_models import Property, Reservation, Transaction, User
from app.models.schemas import ReservationCreate, ReservationDetailOut, ReservationOut

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.post("", response_model=ReservationDetailOut, status_code=201)
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
    enriched = db.scalar(
        select(Reservation)
        .options(
            selectinload(Reservation.user),
            selectinload(Reservation.property),
            selectinload(Reservation.transaction),
        )
        .where(Reservation.id == reservation.id)
    )
    return enriched


@router.get("", response_model=list[ReservationDetailOut])
def list_reservations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin/Super Admin : toutes les réservations avec user+property. Client : les siennes."""
    query = (
        select(Reservation)
        .options(
            selectinload(Reservation.user),
            selectinload(Reservation.property),
            selectinload(Reservation.transaction),
        )
        .order_by(Reservation.id.desc())
    )
    if current_user.role not in ("admin", "super_admin"):
        query = query.where(Reservation.user_id == current_user.id)
    return list(db.scalars(query).all())


@router.put("/{reservation_id}/status", response_model=ReservationDetailOut)
def update_reservation_status(
    reservation_id: int,
    body: dict,
    current_user: User = Depends(require_roles("admin", "super_admin")),
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
    # Recharger avec les relations pour ReservationDetailOut
    enriched = db.scalar(
        select(Reservation)
        .options(
            selectinload(Reservation.user),
            selectinload(Reservation.property),
            selectinload(Reservation.transaction),
        )
        .where(Reservation.id == reservation.id)
    )
    return enriched


@router.get("/user/{user_id}", response_model=list[ReservationDetailOut])
def get_user_reservations(
    user_id: int,
    current_user: User = Depends(require_roles("admin", "super_admin")),
    db: Session = Depends(get_db),
):
    """Admin : voir toutes les réservations d'un utilisateur spécifique."""
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return list(
        db.scalars(
            select(Reservation)
            .options(
                selectinload(Reservation.user),
                selectinload(Reservation.property),
                selectinload(Reservation.transaction),
            )
            .where(Reservation.user_id == user_id)
            .order_by(Reservation.id.desc())
        ).all()
    )
