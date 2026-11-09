# Déploiement gratuit sur GitHub Pages

Le site principal est servi directement depuis `docs/` par GitHub Pages. Le workflow `.github/workflows/pages.yml` le publie à chaque mise à jour de la branche `main`.

## Activation

1. Envoyez le dépôt sur GitHub.
2. Dans **Settings > Pages**, choisissez **GitHub Actions** comme source de déploiement.
3. Lancez le workflow **Deploy GitHub Pages** depuis l’onglet **Actions**, ou poussez une modification sur `main`.

GitHub affichera ensuite l’adresse publique dans **Settings > Pages** et dans l’exécution du workflow.

## Données

La version Pages fonctionne sans serveur. Les données de démonstration et les modifications sont enregistrées dans le stockage local du navigateur; elles ne sont donc visibles que depuis le même navigateur et le même appareil. Elles ne sont pas partagées entre utilisateurs. L’aperçu Worker de `Noteo/` continue d’utiliser l’API existante.