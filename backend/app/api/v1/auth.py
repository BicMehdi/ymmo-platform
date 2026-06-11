from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, decode_token, hash_password, verify_password
from app.db import get_db
from app.models.db_models import User
from app.models.schemas import AuthLogin, AuthRegister, AuthTokenOut, PasswordChange, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer()


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: AuthRegister, db: Session = Depends(get_db)) -> UserOut:
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")

    # Rôle forcé à "client" — seul un admin peut promouvoir ensuite
    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role="client",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=AuthTokenOut)
def login(payload: AuthLogin, db: Session = Depends(get_db)) -> AuthTokenOut:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé. Contactez un administrateur.")

    token = create_access_token(str(user.id), user.role)
    return AuthTokenOut(access_token=token)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.scalar(select(User).where(User.id == int(payload["sub"])))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_roles(*roles: str):
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return checker


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return user


@router.get("/users", response_model=list[UserOut])
def list_users(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Liste tous les utilisateurs — admin et super_admin."""
    if user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    return db.scalars(select(User).order_by(User.id)).all()


@router.put("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    role: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Règles de promotion :
      - admin       : peut promouvoir client → agent (et rétrograder agent → client)
      - super_admin : peut tout faire sauf modifier un autre super_admin
    """
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    target = db.scalar(select(User).where(User.id == user_id))
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    # super_admin : accès total, aucune restriction
    if current_user.role == "super_admin":
        if role not in ("client", "agent", "admin", "super_admin"):
            raise HTTPException(status_code=400, detail="Rôle invalide")
        target.role = role
        db.commit()
        db.refresh(target)
        return target

    # admin : peut seulement promouvoir client ↔ agent
    if target.role in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Un admin ne peut pas modifier un admin ou super_admin")
    if role not in ("client", "agent"):
        raise HTTPException(status_code=403, detail="Un admin ne peut promouvoir qu'en client ou agent")

    target.role = role
    db.commit()
    db.refresh(target)
    return target


@router.put("/users/{user_id}/active", response_model=UserOut)
def toggle_user_active(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin : désactiver ou réactiver un compte utilisateur."""
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Admin only")

    target = db.scalar(select(User).where(User.id == user_id))
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas désactiver votre propre compte")
    if current_user.role == "admin" and target.role in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Un admin ne peut pas désactiver un admin ou super_admin")

    target.is_active = not target.is_active
    db.commit()
    db.refresh(target)
    return target


@router.put("/me/password", response_model=UserOut)
def change_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permet à n'importe quel utilisateur de changer son propre mot de passe."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    db.refresh(current_user)
    return current_user
