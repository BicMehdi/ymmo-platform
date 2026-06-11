from __future__ import annotations

from collections import defaultdict
from statistics import mean, stdev

import pandas as pd
from sqlalchemy.orm import Session

from app.models.db_models import Lead, Property


# ---------------------------------------------------------------------------
# Price estimator
# ---------------------------------------------------------------------------

def estimate_price(area_m2: float, rooms: int, city: str) -> float:
    city_multipliers = {
        "paris": 2.2,
        "lyon": 1.5,
        "marseille": 1.3,
        "bordeaux": 1.4,
        "nice": 1.35,
        "default": 1.0,
    }
    multiplier = city_multipliers.get(city.strip().lower(), city_multipliers["default"])
    base = area_m2 * 3200
    rooms_bonus = rooms * 7500
    return round((base + rooms_bonus) * multiplier, 2)


# ---------------------------------------------------------------------------
# Pandas-based analytics
# ---------------------------------------------------------------------------

def _properties_df(db: Session) -> pd.DataFrame:
    rows = db.query(
        Property.id,
        Property.city,
        Property.price,
        Property.area_m2,
        Property.rooms,
        Property.property_type,
        Property.status,
        Property.created_at,
    ).all()

    if not rows:
        return pd.DataFrame(columns=["id", "city", "price", "area_m2", "rooms",
                                      "property_type", "status", "created_at"])

    df = pd.DataFrame(rows, columns=["id", "city", "price", "area_m2", "rooms",
                                      "property_type", "status", "created_at"])
    df["price_per_m2"] = (df["price"] / df["area_m2"]).round(2)
    df["month"] = pd.to_datetime(df["created_at"]).dt.to_period("M").astype(str)
    return df


def avg_price_by_city(db: Session) -> list[dict]:
    df = _properties_df(db)
    if df.empty:
        return []
    result = (
        df.groupby("city")["price"]
        .agg(avg_price="mean", count="count")
        .reset_index()
    )
    result["avg_price"] = result["avg_price"].round(2)
    return result.sort_values("avg_price", ascending=False).to_dict(orient="records")


def avg_price_by_type(db: Session) -> list[dict]:
    df = _properties_df(db)
    if df.empty:
        return []
    result = (
        df.groupby("property_type")["price"]
        .agg(avg_price="mean", count="count")
        .reset_index()
    )
    result["avg_price"] = result["avg_price"].round(2)
    return result.sort_values("avg_price", ascending=False).to_dict(orient="records")


def monthly_listings(db: Session) -> list[dict]:
    df = _properties_df(db)
    if df.empty:
        return []
    result = df.groupby("month").size().reset_index(name="count")
    return result.sort_values("month").to_dict(orient="records")


def price_distribution(db: Session) -> dict:
    df = _properties_df(db)
    if df.empty:
        return {}
    prices = df["price"].dropna().tolist()
    return {
        "min": round(min(prices), 2),
        "max": round(max(prices), 2),
        "mean": round(mean(prices), 2),
        "median": round(float(df["price"].median()), 2),
        "std": round(stdev(prices), 2) if len(prices) > 1 else 0,
    }


def top_cities_by_leads(db: Session) -> list[dict]:
    rows = (
        db.query(Property.city, Lead.id)
        .join(Lead, Lead.property_id == Property.id)
        .all()
    )
    counts: dict[str, int] = defaultdict(int)
    for city, _ in rows:
        counts[city] += 1
    return sorted(
        [{"city": c, "leads": n} for c, n in counts.items()],
        key=lambda x: x["leads"],
        reverse=True,
    )
