# Architecture DEV - Ymmo

## 1. Portée fonctionnelle

Acteurs:
- Admin
- Agent commercial
- Client

Fonctions clés:
- Authentification et gestion des rôles
- Gestion des biens immobiliers
- Recherche multi-critères
- Gestion des demandes de contact
- Tableau de bord analytics
- Estimation de prix (bonus IA)

## 2. Architecture logique

- Frontend SPA (React)
- Backend API REST (FastAPI)
- Base de données relationnelle (PostgreSQL)
- Traitement data Python (pandas, scikit-learn)

Flux:
1. Frontend envoie requêtes HTTP JSON
2. Backend valide les données
3. Services métier appliquent règles métier
4. Persistance SQL
5. Endpoint analytics expose indicateurs

## 3. Modèle de données (version MVP)

### Table users
- id (PK)
- email (unique)
- password_hash
- role (admin, agent, client)
- created_at

### Table properties
- id (PK)
- title
- description
- city
- postal_code
- property_type
- area_m2
- rooms
- price
- status (draft, published, sold)
- owner_user_id (FK users.id)
- created_at

### Table leads
- id (PK)
- property_id (FK properties.id)
- client_user_id (FK users.id)
- message
- status (new, in_progress, closed)
- created_at

### Table property_views (optionnel KPI)
- id (PK)
- property_id (FK properties.id)
- viewed_at

## 4. API (extrait)

Auth:
- POST /api/v1/auth/register
- POST /api/v1/auth/login

Properties:
- GET /api/v1/properties
- GET /api/v1/properties/{id}
- POST /api/v1/properties
- PUT /api/v1/properties/{id}
- DELETE /api/v1/properties/{id}

Leads:
- POST /api/v1/leads
- GET /api/v1/leads
- PATCH /api/v1/leads/{id}/status

Analytics:
- GET /api/v1/analytics/overview
- POST /api/v1/analytics/estimate-price

## 5. Exigences qualité

- Principes SOLID, DRY, KISS
- Lint + format automatiques
- Validation des schémas d'entrée/sortie
- Logs structurés
- Gestion centralisée des erreurs
- Tests unitaires et tests API

## 6. Sécurité DEV

- Hash des mots de passe (argon2 ou bcrypt)
- JWT avec expiration courte + refresh token
- RBAC (contrôle par rôle)
- CORS restreint
- Secrets dans .env (jamais en dur)
- Validation stricte de toutes les entrées

## 7. Critères d'acceptation MVP

- Un agent peut publier un bien complet
- Un client peut rechercher et filtrer les biens
- Un client peut envoyer une demande de contact
- Un agent peut suivre les demandes
- Un dashboard affiche au moins 3 indicateurs
- Le projet est démontrable en 10 minutes
