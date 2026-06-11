from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.api.v1.auth import router as auth_router
from app.api.v1.favorites import router as favorites_router
from app.api.v1.leads import router as leads_router
from app.api.v1.properties import router as properties_router
from app.api.v1.reservations import router as reservations_router
from app.db import Base, engine, get_db
from app.models.db_models import Favorite, Lead, Property, Reservation, Transaction, User  # noqa: F401
from app.models.schemas import PriceEstimateInput, PriceEstimateOutput
from app.services.analytics import (
    avg_price_by_city,
    avg_price_by_type,
    estimate_price,
    monthly_listings,
    price_distribution,
    top_cities_by_leads,
)

app = FastAPI(title="Ymmo DEV API", version="0.1.0")

Base.metadata.create_all(bind=engine)

# Migration manuelle : ajouter is_active si la colonne n'existe pas encore (SQLite)
with engine.connect() as conn:
    cols = [row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
    if "is_active" not in cols:
        conn.execute(text("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1"))
        conn.commit()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(properties_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(leads_router, prefix="/api/v1")
app.include_router(favorites_router, prefix="/api/v1")
app.include_router(reservations_router, prefix="/api/v1")


@app.get("/api/v1/analytics/overview")
def analytics_overview(db: Session = Depends(get_db)) -> dict:
    properties_count = db.scalar(select(func.count(Property.id))) or 0
    leads_count = db.scalar(select(func.count(Lead.id))) or 0
    users_count = db.scalar(select(func.count(User.id))) or 0
    avg_price = db.scalar(select(func.avg(Property.price)))

    return {
        "properties_count": properties_count,
        "leads_count": leads_count,
        "users_count": users_count,
        "avg_price": round(float(avg_price), 2) if avg_price is not None else 0,
    }


@app.get("/api/v1/analytics/charts")
def analytics_charts(db: Session = Depends(get_db)) -> dict:
    return {
        "avg_price_by_city": avg_price_by_city(db),
        "avg_price_by_type": avg_price_by_type(db),
        "monthly_listings": monthly_listings(db),
        "price_distribution": price_distribution(db),
        "top_cities_by_leads": top_cities_by_leads(db),
    }


@app.post("/api/v1/analytics/estimate-price", response_model=PriceEstimateOutput)
def analytics_estimate_price(payload: PriceEstimateInput) -> PriceEstimateOutput:
    value = estimate_price(payload.area_m2, payload.rooms, payload.city)
    return PriceEstimateOutput(
        estimated_price=value,
        confidence_note="Estimation baseline. A affiner avec des données historiques réelles.",
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
