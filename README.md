# Ymmo — Plateforme immobilière

> Projet UF B2 INFRA & DEV — Ynov Campus

Ymmo est une application web full-stack de gestion de biens immobiliers permettant à des clients de consulter et réserver des biens, à des agents de les gérer, et à des administrateurs de superviser l'ensemble de la plateforme.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | FastAPI 0.116.1 + SQLAlchemy 2.0 + SQLite |
| Auth | JWT (python-jose) + bcrypt 4.0.1 |
| Frontend | React 18 + Vite 5 |
| Graphiques | Recharts |
| Tests | pytest + httpx |

---

## Fonctionnalités

### Authentification & rôles
- 4 rôles : `client`, `agent`, `admin`, `super_admin`
- JWT (expiration 60 min), blocage de compte (`is_active`)
- Changement de mot de passe, promotion de rôle

### Biens immobiliers
- CRUD complet (titre, prix, surface, localisation, type, statuts : `published` / `reserved` / `sold`)
- Filtres multi-critères (type, ville, prix min/max, surface, statut)
- Agents voient et gèrent uniquement leurs propres biens

### Réservations — flux `pending → accepted → sold`
- Le client soumet une demande (`pending`)
- L'agent ou l'admin accepte → bien passe en `reserved`
- L'agent ou l'admin marque vendu → bien passe en `sold`, autres demandes annulées
- Historique complet avec `validated_by` + `validated_at`

### Leads (contacts)
- Tout utilisateur connecté peut soumettre un lead
- Les agents gèrent les leads qui leur sont assignés

### Dashboard admin
- Vue de tous les utilisateurs avec toggle actif/inactif
- Vue de toutes les réservations avec actions (accepter, refuser, annuler, marquer vendu)
- Statistiques et graphiques (Recharts)

### Vue agent
- Panel de réservations sur ses propres biens
- Formulaire d'ajout/modification de biens

### Vue client
- Mes réservations avec statuts en temps réel
- Favoris, détail de bien, page de réservation

---

## Structure du projet

```
ymmo-platform/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # auth, properties, reservations, leads, favorites
│   │   ├── models/          # db_models.py, schemas.py
│   │   ├── core/            # config, security
│   │   ├── services/        # logique métier
│   │   └── main.py          # point d'entrée + migrations SQLite auto
│   ├── requirements.txt
│   ├── seed.py              # données de démo
│   └── tests/
├── frontend/
│   └── src/
│       ├── pages/           # App.jsx, PropertyDetailPage.jsx, ReservationPage.jsx
│       ├── components/      # AdminPanel, AchatsPanel, AgentReservationsPanel,
│       │                    # MesAchatsPanel, PropertyList, PropertyForm,
│       │                    # LeadsPanel, AnalyticsBox, ChartsBox, AuthPanel…
│       └── styles.css
└── docs/
    ├── architecture-dev.md
    ├── backlog-trello.md
    └── oral-dev-10min.md
```

---

## Lancement

### Prérequis
- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
# API disponible sur http://localhost:8000
# Docs Swagger : http://localhost:8000/docs
```

> Les colonnes SQLite manquantes (`is_active`, `validated_by`, `validated_at`) sont ajoutées automatiquement au démarrage via `ALTER TABLE`.

### Frontend

```bash
cd frontend
npm install
npm run dev
# App disponible sur http://localhost:5173
```

### Données de démo

```bash
cd backend
python seed.py
```

| Email | Mot de passe | Rôle |
|---|---|---|
| admin@ymmo.fr | Admin123! | admin |
| agent@ymmo.fr | ymmo1234 | agent |
| pack@gmail.com | 12345678 | client |

---

## API — Endpoints principaux

| Méthode | Route | Description |
|---|---|---|
| POST | `/auth/register` | Créer un compte |
| POST | `/auth/token` | Connexion (JWT) |
| GET | `/properties` | Liste des biens (filtres) |
| POST | `/properties` | Créer un bien (agent/admin) |
| POST | `/reservations` | Soumettre une demande |
| PUT | `/reservations/{id}/status` | Changer le statut (agent/admin) |
| GET | `/reservations` | Voir les réservations (selon rôle) |
| GET | `/leads` | Leads (agent/admin) |
| PUT | `/auth/users/{id}/role` | Changer le rôle (admin/super_admin) |
| PUT | `/auth/users/{id}/active` | Activer/désactiver un compte (admin) |

Documentation complète disponible sur `/docs` (Swagger UI) quand le backend tourne.

---

## Tests

```bash
cd backend
pytest tests/
```

---

## Dépôt

[https://github.com/BicMehdi/ymmo-platform](https://github.com/BicMehdi/ymmo-platform)
