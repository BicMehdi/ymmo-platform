from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="client")
    is_active: Mapped[bool] = mapped_column(Integer, nullable=False, default=True, server_default="1")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    properties: Mapped[list["Property"]] = relationship("Property", back_populates="owner")
    created_leads: Mapped[list["Lead"]] = relationship(
        "Lead",
        back_populates="client",
        foreign_keys="Lead.client_user_id",
    )
    assigned_leads: Mapped[list["Lead"]] = relationship(
        "Lead",
        back_populates="assigned_agent",
        foreign_keys="Lead.assigned_agent_id",
    )


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    city: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    area_m2: Mapped[float] = mapped_column(Float, nullable=False)
    property_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    rooms: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(20), default="published", nullable=False)
    owner_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped[User] = relationship("User", back_populates="properties")
    leads: Mapped[list["Lead"]] = relationship("Lead", back_populates="property")
    favorites: Mapped[list["Favorite"]] = relationship("Favorite", back_populates="property", cascade="all, delete-orphan")


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"), nullable=False)
    client_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    assigned_agent_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="new", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    property: Mapped[Property] = relationship("Property", back_populates="leads")
    client: Mapped[User] = relationship(
        "User",
        back_populates="created_leads",
        foreign_keys=[client_user_id],
    )
    assigned_agent: Mapped[User | None] = relationship(
        "User",
        back_populates="assigned_leads",
        foreign_keys=[assigned_agent_id],
    )


class Favorite(Base):
    __tablename__ = "favorites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User")
    property: Mapped["Property"] = relationship("Property", back_populates="favorites")


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User")
    property: Mapped["Property"] = relationship("Property")
    transaction: Mapped["Transaction | None"] = relationship("Transaction", back_populates="reservation", uselist=False)


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    reservation_id: Mapped[int] = mapped_column(ForeignKey("reservations.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="paid", index=True)
    payment_method: Mapped[str] = mapped_column(String(30), nullable=False, default="card")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    reservation: Mapped["Reservation"] = relationship("Reservation", back_populates="transaction")
    user: Mapped["User"] = relationship("User")
    property: Mapped["Property"] = relationship("Property")
