from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, decode_token, hash_password, verify_password
from app.db import get_db
from app.models.db_models import User
from app.models.schemas import AuthLogin, AuthRegister, AuthTokenOut, UserOut

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
    """Liste tous les utilisateurs — admin uniquement."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return db.scalars(select(User).order_by(User.id)).all()


@router.put("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    role: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change le rôle d'un utilisateur — admin uniquement."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    if role not in ("client", "agent", "admin"):
        raise HTTPException(status_code=400, detail="Rôle invalide")
    target = db.scalar(select(User).where(User.id == user_id))
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if target.role == "admin":
        raise HTTPException(status_code=403, detail="Impossible de modifier le rôle d'un admin")
    target.role = role
    db.commit()
    db.refresh(target)
    return target
