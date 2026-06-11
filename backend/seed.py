"""
Script de seed: injecte 20 biens immobiliers réalistes + 1 utilisateur agent de demo.

Usage:
    python seed.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
import random

from app.core.security import hash_password
from app.db import Base, SessionLocal, engine
from app.models.db_models import Property, User  # noqa: F401 (registers models)

CITIES = [
    "Paris", "Lyon", "Marseille", "Bordeaux", "Nice",
    "Montpellier", "Nantes", "Strasbourg", "Lille", "Toulouse",
]

TYPES = ["Appartement", "Maison", "Studio", "Bureau", "Local commercial"]

PROPERTIES_DATA = [
    {"title": "Appartement lumineux 3 pièces", "city": "Paris", "price": 480000, "area_m2": 72, "rooms": 3, "property_type": "Appartement", "description": "Bel appartement Haussmannien au 4ème étage avec balcon."},
    {"title": "Maison avec jardin", "city": "Lyon", "price": 320000, "area_m2": 110, "rooms": 5, "property_type": "Maison", "description": "Maison familiale avec grand jardin arboré."},
    {"title": "Studio centre-ville", "city": "Marseille", "price": 89000, "area_m2": 28, "rooms": 1, "property_type": "Studio", "description": "Studio idéal pour investissement locatif."},
    {"title": "T2 proche mer", "city": "Nice", "price": 195000, "area_m2": 45, "rooms": 2, "property_type": "Appartement", "description": "Appartement T2 à 5 minutes de la Promenade des Anglais."},
    {"title": "Loft industriel", "city": "Bordeaux", "price": 275000, "area_m2": 90, "rooms": 3, "property_type": "Appartement", "description": "Loft atypique dans ancienne usine rénovée."},
    {"title": "Maison 4 chambres", "city": "Toulouse", "price": 289000, "area_m2": 130, "rooms": 6, "property_type": "Maison", "description": "Belle maison de ville avec patio."},
    {"title": "Bureau open space", "city": "Paris", "price": 520000, "area_m2": 85, "rooms": 2, "property_type": "Bureau", "description": "Bureaux modernes dans quartier d'affaires."},
    {"title": "Appartement T4 neuf", "city": "Nantes", "price": 345000, "area_m2": 88, "rooms": 4, "property_type": "Appartement", "description": "Programme neuf BBC, livraison immédiate."},
    {"title": "Villa avec piscine", "city": "Nice", "price": 890000, "area_m2": 220, "rooms": 7, "property_type": "Maison", "description": "Somptueuse villa avec vue mer et piscine à débordement."},
    {"title": "Studio étudiant", "city": "Montpellier", "price": 68000, "area_m2": 22, "rooms": 1, "property_type": "Studio", "description": "Proche faculté de médecine, idéal investissement."},
    {"title": "Appartement T3 Hausmann", "city": "Paris", "price": 620000, "area_m2": 78, "rooms": 3, "property_type": "Appartement", "description": "Parquet, moulures, cheminée. Cachet incomparable."},
    {"title": "Local commercial rue piétonne", "city": "Strasbourg", "price": 185000, "area_m2": 60, "rooms": 1, "property_type": "Local commercial", "description": "Emplacement N°1 en rue piétonne très fréquentée."},
    {"title": "Maison mitoyenne", "city": "Lille", "price": 175000, "area_m2": 95, "rooms": 4, "property_type": "Maison", "description": "Maison de ville en briques, idéale pour famille."},
    {"title": "T2 vue canal", "city": "Strasbourg", "price": 198000, "area_m2": 50, "rooms": 2, "property_type": "Appartement", "description": "Vue dégagée sur le canal, calme et lumineux."},
    {"title": "Duplex 5 pièces", "city": "Lyon", "price": 415000, "area_m2": 105, "rooms": 5, "property_type": "Appartement", "description": "Duplex avec terrasse en toiture, vue panoramique."},
    {"title": "Maison de caractère", "city": "Bordeaux", "price": 395000, "area_m2": 150, "rooms": 6, "property_type": "Maison", "description": "Pierres dorées, poutres apparentes, jardin."},
    {"title": "Studio vue mer", "city": "Marseille", "price": 112000, "area_m2": 30, "rooms": 1, "property_type": "Studio", "description": "Vue imprenable sur la rade de Marseille."},
    {"title": "Appartement T3 neuf", "city": "Toulouse", "price": 265000, "area_m2": 68, "rooms": 3, "property_type": "Appartement", "description": "Résidence sécurisée avec parking et cave."},
    {"title": "Maison individuelle", "city": "Nantes", "price": 310000, "area_m2": 120, "rooms": 5, "property_type": "Maison", "description": "Quartier résidentiel calme, école à 200m."},
    {"title": "Penthouse terrasse", "city": "Paris", "price": 1250000, "area_m2": 140, "rooms": 5, "property_type": "Appartement", "description": "Penthouse exceptionnel avec terrasse 60m2 et vue Tour Eiffel."},
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Base déjà seedée. Supprime ymmo.db pour recommencer.")
            return

        # Super Admin principal
        admin = User(
            email="admin@ymmo.fr",
            password_hash=hash_password("Admin123!"),
            role="super_admin",
        )
        db.add(admin)

        # Agent demo
        agent = User(
            email="agent@ymmo.fr",
            password_hash=hash_password("ymmo1234"),
            role="agent",
        )
        db.add(agent)

        # Client demo
        client = User(
            email="client@ymmo.fr",
            password_hash=hash_password("ymmo1234"),
            role="client",
        )
        db.add(client)
        db.commit()
        db.refresh(agent)

        # 20 biens sur les 6 derniers mois
        for i, data in enumerate(PROPERTIES_DATA):
            days_ago = random.randint(0, 180)
            prop = Property(
                **data,
                status="published",
                owner_user_id=agent.id,
                created_at=datetime.utcnow() - timedelta(days=days_ago),
            )
            db.add(prop)

        db.commit()
        print("Seed OK: 20 biens + admin@ymmo.fr (Admin123!) + agent@ymmo.fr + client@ymmo.fr (ymmo1234)")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
