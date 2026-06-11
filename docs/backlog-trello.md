# Backlog Trello - Ymmo DEV

## Sprint 0 - Cadrage et setup (2-3 jours)

### Epic: Pilotage
- [ ] Créer le board Trello avec colonnes Backlog, Todo, Doing, Review, Done
- [ ] Définir conventions Git (branches, commits, PR)
- [ ] Définir DoD équipe (tests, revues, documentation)
- [ ] Écrire user stories MVP (admin, agent, client)

### Epic: Setup technique
- [ ] Initialiser backend FastAPI + structure modulaire
- [ ] Initialiser frontend React + routing
- [ ] Créer base SQL + script d'init
- [ ] Configurer variables d'environnement
- [ ] Créer CI minimale (lint + tests)

## Sprint 1 - Domaine immobilier (1 semaine)

### Epic: Biens immobiliers
- [ ] Créer entité Property (titre, prix, ville, surface, type, statut)
- [ ] Implémenter API CRUD Property
- [ ] Ajouter upload d'images (placeholder au début)
- [ ] Créer page liste des biens
- [ ] Créer page détail d'un bien

### Epic: Recherche
- [ ] Ajouter filtres (prix min/max, ville, type, surface)
- [ ] Ajouter tri (prix, date, surface)
- [ ] Ajouter pagination
- [ ] Afficher état vide + erreurs

## Sprint 2 - Utilisateurs et opérations (1 semaine)

### Epic: Authentification
- [ ] Créer inscription/connexion
- [ ] JWT + refresh token
- [ ] Gestion rôles admin/agent/client
- [ ] Protéger routes API sensibles

### Epic: Workflow achat/vente
- [ ] Créer demande de contact sur un bien
- [ ] Créer suivi de statut demande (nouvelle, en cours, traitée)
- [ ] Créer vue agent des demandes
- [ ] Notifier utilisateur (mail mock ou log)

## Sprint 3 - Data et dashboard (1 semaine)

### Epic: Analytics
- [ ] Construire jeu de données propre pour analyse
- [ ] Calculer prix moyen par zone
- [ ] Identifier biens les plus demandés
- [ ] Ajouter tendance mensuelle ventes/demandes

### Epic: IA simple (bonus fortement recommandé)
- [ ] Créer baseline de prédiction de prix (régression)
- [ ] Exposer endpoint estimation prix
- [ ] Afficher estimation dans l'UI admin/agent
- [ ] Documenter limites du modèle

## Sprint 4 - Qualité et soutenance (4-5 jours)

### Epic: Qualité
- [ ] Tests backend (routes critiques)
- [ ] Tests frontend (liste, détail, filtres)
- [ ] Vérifier responsive et accessibilité
- [ ] Améliorer performance (lazy loading, cache)

### Epic: Documentation et oral
- [ ] Finaliser documentation fonctionnelle
- [ ] Finaliser documentation technique
- [ ] Préparer démo scriptée (happy path + plan B)
- [ ] Préparer slides architecture et data
- [ ] Répéter oral 10 min (chrono)

## Priorisation MoSCoW

### Must
- CRUD biens
- recherche/filtres
- authentification + rôles
- demandes de contact
- dashboard basique

### Should
- statistiques avancées
- tests solides front/back
- gestion fine des erreurs

### Could
- recommandation de biens similaires
- carte interactive
- export CSV/PDF

### Won't (MVP)
- paiement en ligne
- signature électronique
- app mobile native
