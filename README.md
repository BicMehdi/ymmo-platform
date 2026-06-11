# Projet DEV - Ymmo

Ce dépôt couvre uniquement la partie DEV du projet UF B2 INFRA & DEV.

## Contenu

- `docs/backlog-trello.md`: backlog prêt à copier dans Trello
- `docs/architecture-dev.md`: architecture, modèle de données, API, qualité
- `docs/oral-dev-10min.md`: script d'oral DEV sur 10 minutes
- `backend/`: squelette API FastAPI
- `frontend/`: squelette interface React (Vite)

## Objectif MVP

Construire une plateforme web de gestion achat/vente de biens immobiliers avec:

- authentification et rôles (admin, agent, client)
- CRUD des biens
- recherche et filtres
- prise de contact / demandes
- dashboard de métriques
- mini module data (tendances + estimation simple)

## Lancement rapide (quand le code sera complété)

### Backend

1. Créer un environnement Python
2. Installer les dépendances via `pip install -r requirements.txt`
3. Lancer `uvicorn app.main:app --reload`

### Frontend

1. Installer les dépendances via `npm install`
2. Lancer `npm run dev`

## Définitions de done

- Responsive desktop/tablette/mobile
- Validation front et back
- Journalisation et gestion d'erreurs
- Tests API et composants critiques
- Documentation claire et déployable
