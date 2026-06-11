# Backend - FastAPI + PostgreSQL

## Démarrage local

1. Créer un environnement virtuel Python
2. Installer les dépendances:
   - pip install -r requirements.txt
3. Copier .env.example en .env et adapter les valeurs
4. Lancer l'API:
   - uvicorn app.main:app --reload

## Migrations Alembic

1. Créer la base PostgreSQL `ymmo`
2. Appliquer la migration initiale:
   - alembic upgrade head
3. Créer une migration après changement de modèle:
   - alembic revision --autogenerate -m "message"

## Variables d'environnement

- DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/ymmo
- JWT_SECRET=replace-with-a-long-random-secret
- JWT_EXPIRE_MINUTES=60

## Endpoints principaux

- GET /health
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET /api/v1/auth/me
- GET /api/v1/properties
- GET /api/v1/properties/{id}
- POST /api/v1/properties (admin, agent)
- DELETE /api/v1/properties/{id} (admin, agent)
- POST /api/v1/leads (client)
- GET /api/v1/leads/me (client)
- GET /api/v1/leads/agent (admin, agent)
- PATCH /api/v1/leads/{id}/status (admin, agent)
- GET /api/v1/analytics/overview
- POST /api/v1/analytics/estimate-price

## Filtres sur les biens

Query params supportés sur GET /api/v1/properties:

- city
- property_type
- min_price / max_price
- min_area / max_area
- rooms
- skip / limit
