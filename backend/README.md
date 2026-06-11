# Backend — FastAPI

API REST du projet Ymmo. SQLite en développement, migrations automatiques au démarrage.

## Démarrage

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API disponible sur `http://localhost:8000`  
Swagger UI : `http://localhost:8000/docs`

## Variables d'environnement

Copier `.env.example` en `.env` :

```
DATABASE_URL=sqlite:///./ymmo.db
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE_MINUTES=60
```

## Migrations

Les colonnes manquantes sont ajoutées automatiquement via `ALTER TABLE` au démarrage (`main.py`). Pas besoin de lancer Alembic manuellement en dev.

## Données de démo

```bash
python seed.py
```

## Endpoints principaux

### Auth
| Méthode | Route | Accès |
|---|---|---|
| POST | `/api/v1/auth/register` | public |
| POST | `/api/v1/auth/token` | public |
| GET | `/api/v1/auth/me` | connecté |
| PUT | `/api/v1/auth/me/password` | connecté |
| GET | `/api/v1/auth/users` | admin |
| PUT | `/api/v1/auth/users/{id}/role` | admin/super_admin |
| PUT | `/api/v1/auth/users/{id}/active` | admin |

### Biens
| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/v1/properties` | public |
| GET | `/api/v1/properties/{id}` | public |
| POST | `/api/v1/properties` | agent/admin |
| PUT | `/api/v1/properties/{id}` | agent (propre bien)/admin |
| DELETE | `/api/v1/properties/{id}` | agent (propre bien)/admin |

Filtres disponibles : `city`, `property_type`, `min_price`, `max_price`, `min_area`, `max_area`, `status`, `owner_user_id`

### Réservations
| Méthode | Route | Accès |
|---|---|---|
| POST | `/api/v1/reservations` | client |
| GET | `/api/v1/reservations` | selon rôle |
| PUT | `/api/v1/reservations/{id}/status` | agent/admin |

Flux : `pending → accepted → sold` (ou `rejected` / `cancelled`)

### Leads
| Méthode | Route | Accès |
|---|---|---|
| POST | `/api/v1/leads` | connecté |
| GET | `/api/v1/leads/me` | connecté |
| GET | `/api/v1/leads/agent` | agent/admin |
| PATCH | `/api/v1/leads/{id}/status` | agent |

### Analytiques
| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/v1/analytics/overview` | admin/agent |
| POST | `/api/v1/analytics/estimate-price` | connecté |

## Tests

```bash
pytest tests/
```

- rooms
- skip / limit
