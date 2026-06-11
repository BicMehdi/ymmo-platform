from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.v1.auth import get_current_user, require_roles
from app.db import get_db
from app.models.db_models import Property, Reservation, Transaction, User
from app.models.schemas import ReservationCreate, ReservationDetailOut

router = APIRouter(prefix="/reservations", tags=["reservations"])

# Transitions autorisées par rôle
TRANSITIONS_ADMIN = {
    "pending":   {"accepted", "rejected", "cancelled"},
    "accepted":  {"sold", "cancelled"},
    "rejected":  set(),
    "cancelled": set(),
    "sold":      set(),
}
TRANSITIONS_AGENT = {
    "pending":   {"accepted", "rejected"},
    "accepted":  {"sold"},
    "rejected":  set(),
    "cancelled": set(),
    "sold":      set(),
}


def _load_enriched(db: Session, reservation_id: int) -> Reservation:
    return db.scalar(
        select(Reservation)
        .options(
            selectinload(Reservation.user),
            selectinload(Reservation.property),
            selectinload(Reservation.transaction),
        )
        .where(Reservation.id == reservation_id)
    )


@router.post("", response_model=ReservationDetailOut, status_code=201)
def create_reservation(
    payload: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Client soumet une demande → statut PENDING. Le bien reste published."""
    prop = db.get(Property, payload.property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Bien introuvable")
    if prop.status != "published":
        raise HTTPException(status_code=409, detail="Ce bien n'est pas disponible à la réservation")

    # Pas de doublon pending/accepted pour ce client sur ce bien
    existing = db.scalar(
        select(Reservation).where(
            Reservation.user_id == current_user.id,
            Reservation.property_id == payload.property_id,
            Reservation.status.in_(["pending", "accepted"]),
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="Vous avez déjà une demande en cours sur ce bien")

    reservation = Reservation(
        user_id=current_user.id,
        property_id=payload.property_id,
        amount=payload.amount,
        status="pending",
    )
    db.add(reservation)
    db.flush()

    # Transaction en attente — encaissée seulement à l'acceptation
    transaction = Transaction(
        reservation_id=reservation.id,
        user_id=current_user.id,
        property_id=payload.property_id,
        amount=payload.amount,
        status="pending",
        payment_method="card",
    )
    db.add(transaction)
    db.commit()
    db.refresh(reservation)
    return _load_enriched(db, reservation.id)


@router.get("", response_model=list[ReservationDetailOut])
def list_reservations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin/super_admin : tout. Agent : ses biens. Client : ses demandes."""
    query = (
        select(Reservation)
        .options(
            selectinload(Reservation.user),
            selectinload(Reservation.property),
            selectinload(Reservation.transaction),
        )
        .order_by(Reservation.id.desc())
    )
    if current_user.role in ("admin", "super_admin"):
        pass
    elif current_user.role == "agent":
        owned_ids = list(db.scalars(select(Property.id).where(Property.owner_user_id == current_user.id)).all())
        query = query.where(Reservation.property_id.in_(owned_ids))
    else:
        query = query.where(Reservation.user_id == current_user.id)
    return list(db.scalars(query).all())


@router.put("/{reservation_id}/status", response_model=ReservationDetailOut)
def update_reservation_status(
    reservation_id: int,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    pending  → accepted | rejected | cancelled
    accepted → sold | cancelled
    Agent : seulement ses biens, peut accepted/rejected/sold. Pas cancelled.
    Admin : tout.
    """
    if current_user.role not in ("admin", "super_admin", "agent"):
        raise HTTPException(status_code=403, detail="Accès refusé")

    new_status = body.get("status", "")
    valid = {"pending", "accepted", "rejected", "cancelled", "sold"}
    if new_status not in valid:
        raise HTTPException(status_code=400, detail=f"Statut invalide")

    reservation = db.get(Reservation, reservation_id)
    if not reservation:
        raise HTTPException(status_code=404, detail="Réservation introuvable")

    prop = db.get(Property, reservation.property_id)

    if current_user.role == "agent":
        if not prop or prop.owner_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Vous ne pouvez gérer que les réservations de vos propres biens")
        allowed = TRANSITIONS_AGENT.get(reservation.status, set())
    else:
        allowed = TRANSITIONS_ADMIN.get(reservation.status, set())

    if new_status not in allowed:
        raise HTTPException(status_code=400, detail=f"Transition impossible : {reservation.status} → {new_status}")

    reservation.status = new_status
    reservation.validated_by = current_user.id
    reservation.validated_at = datetime.utcnow()

    # Sync bien et transaction
    if prop:
        if new_status == "accepted":
            prop.status = "reserved"
            if reservation.transaction:
                reservation.transaction.status = "paid"
        elif new_status == "sold":
            prop.status = "sold"
            # Annuler les autres demandes pending sur ce bien
            others = db.scalars(
                select(Reservation).where(
                    Reservation.property_id == reservation.property_id,
                    Reservation.id != reservation.id,
                    Reservation.status == "pending",
                )
            ).all()
            for o in others:
                o.status = "cancelled"
        elif new_status in ("rejected", "cancelled"):
            prop.status = "published"
            if reservation.transaction:
                reservation.transaction.status = "cancelled"

    db.commit()
    db.refresh(reservation)
    return _load_enriched(db, reservation.id)


@router.get("/user/{user_id}", response_model=list[ReservationDetailOut])
def get_user_reservations(
    user_id: int,
    current_user: User = Depends(require_roles("admin", "super_admin")),
    db: Session = Depends(get_db),
):
    """Admin : toutes les réservations d'un utilisateur."""
    if not db.get(User, user_id):
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
    if current_user.role in ("admin", "super_admin"):
        pass  # tout voir
    elif current_user.role == "agent":
        # L'agent voit les réservations sur ses propres biens
        from app.models.db_models import Property as Prop
        owned_ids = db.scalars(select(Prop.id).where(Prop.owner_user_id == current_user.id)).all()
        query = query.where(Reservation.property_id.in_(owned_ids))
    else:
        # Client : seulement ses propres réservations
        query = query.where(Reservation.user_id == current_user.id)
    return list(db.scalars(query).all())


@router.put("/{reservation_id}/status", response_model=ReservationDetailOut)
def update_reservation_status(
    reservation_id: int,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin/super_admin : accès total. Agent : seulement ses propres biens."""
    if current_user.role not in ("admin", "super_admin", "agent"):
        raise HTTPException(status_code=403, detail="Accès refusé")

    new_status = body.get("status", "")
    if new_status not in ("confirmed", "cancelled", "refunded", "sold"):
        raise HTTPException(status_code=400, detail="Statut invalide")

    reservation = db.get(Reservation, reservation_id)
    if not reservation:
        raise HTTPException(status_code=404, detail="Réservation introuvable")

    # L'agent ne peut agir que sur les réservations de ses propres biens
    if current_user.role == "agent":
        prop_check = db.get(Property, reservation.property_id)
        if not prop_check or prop_check.owner_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Vous ne pouvez gérer que les réservations de vos propres biens")
        # L'agent ne peut que confirmer ou marquer vendu (pas rembourser/annuler)
        if new_status not in ("confirmed", "sold"):
            raise HTTPException(status_code=403, detail="L'agent peut seulement confirmer ou marquer vendu")

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
