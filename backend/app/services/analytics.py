from statistics import mean


def estimate_price(area_m2: float, rooms: int, city: str) -> float:
    """Very simple baseline estimator for MVP demo."""
    city_multipliers = {
        "paris": 2.2,
        "lyon": 1.5,
        "marseille": 1.3,
        "default": 1.0,
    }

    multiplier = city_multipliers.get(city.strip().lower(), city_multipliers["default"])
    base = area_m2 * 3200
    rooms_bonus = rooms * 7500
    return round((base + rooms_bonus) * multiplier, 2)


def build_overview(properties: list[dict], leads: list[dict]) -> dict:
    prices = [item["price"] for item in properties] if properties else []
    avg_price = round(mean(prices), 2) if prices else 0

    return {
        "properties_count": len(properties),
        "leads_count": len(leads),
        "avg_price": avg_price,
    }
