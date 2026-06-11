# Plan oral DEV - 10 minutes

## 0:00 - 1:00 | Contexte et objectif

- Problème métier: centraliser achat/vente de biens pour clients et agences
- Objectif produit: plateforme web robuste, simple d'usage, orientée décision
- Périmètre présenté: partie DEV uniquement

## 1:00 - 3:00 | Démo fonctionnelle (valeur utilisateur)

Parcours conseillé:

1. Connexion agent
2. Création d'un bien
3. Consultation liste + filtres
4. Ouverture fiche détail
5. Création d'une demande de contact
6. Vue agent des demandes

Message à dire:

- "On couvre le flux principal de mise en vente et de prise de contact sans friction."

## 3:00 - 5:00 | Architecture technique

- Frontend React: pages, composants, appels API
- Backend FastAPI: routes, services, validation
- SQL: modèle relationnel des entités métier
- Séparation des responsabilités (SOLID, DRY, KISS)

Message à dire:

- "L'architecture permet d'ajouter des features sans casser l'existant."

## 5:00 - 6:30 | Data / IA

- Nettoyage des données immobilières
- KPI: prix moyen par zone, demandes par type de bien, tendance mensuelle
- Bonus IA: endpoint d'estimation de prix basé sur une régression

Message à dire:

- "On ne fait pas juste de l'affichage, on aide à la décision."

## 6:30 - 8:00 | Qualité et bonnes pratiques

- Validation front + back
- Gestion des erreurs et logs
- Tests critiques (API + composants)
- Responsive et accessibilité

## 8:00 - 9:00 | Limites et axes d'amélioration

- Plus de données pour fiabiliser la prédiction
- Notifications temps réel
- Optimisation perf sur gros volumes

## 9:00 - 10:00 | Conclusion

- Résumé valeur métier
- Résumé qualité technique
- Démo prête à l'usage et évolutive

## Questions du jury probables (et réponses courtes)

1. Pourquoi ce stack?
- Productivité, lisibilité, rapidité de prototypage, écosystème solide.

2. Comment garantissez-vous la qualité?
- Validation stricte, tests ciblés, revues de code, conventions Git.

3. Votre IA est-elle fiable?
- C'est une estimation d'aide à la décision, pas une vérité absolue; performance monitorée.

4. Et la sécurité?
- Auth JWT, contrôle des rôles, validation entrées, secret management par variables d'environnement.
