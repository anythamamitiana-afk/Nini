# Gestion des Notes

Application de gestion scolaire en français : accueil, élèves, matières, notes, bulletins, résultats et paramètres.

## Développement

Node.js 24, sans dépendance externe.

- `npm run dev` : aperçu local avec SQLite en mémoire et les données initiales de démonstration. Les modifications locales disparaissent au redémarrage.
- `npm test` : tests de l’API avec SQLite et contraintes de clés étrangères activées.
- `npm run build` : crée le Worker de production dans `dist/server/index.js`.

Le site déployé utilise une base D1 persistante. Les migrations existantes et les données du site sont conservées.

## Organisation

- `../docs/` : interface principale, publiée gratuitement par GitHub Pages.
- `worker/api.js` : routes CRUD, validations et calcul des bulletins.
- `worker/seed.js` : jeu initial, inséré seulement à la première ouverture d’une base vide.
- `drizzle/` : migrations du schéma.
- `original/` : copie de référence du projet fourni avant adaptation.

La version GitHub Pages enregistre les données dans le navigateur. Consultez `../GITHUB_PAGES.md` pour activer le déploiement.

## Règles

Les notes vont de 0 à 20 ; les coefficients sont strictement positifs. Une note absente n’est pas assimilée à zéro. La moyenne pondérée est provisoire tant qu’une matière du niveau n’est pas notée. Un bulletin complet est admis si la moyenne non arrondie est au moins 10. Les suppressions de données référencées sont refusées ; les notes se suppriment explicitement depuis la saisie. Les identifiants d’élèves et de matières sont stables. Les niveaux et années peuvent être renommés en conservant leurs associations.

Le modèle original utilise un niveau courant par élève et des matières courantes par niveau. Il ne conserve pas un historique des inscriptions ou des coefficients par année ; modifier un coefficient recalcule donc aussi les anciens bulletins. Pour un usage pluriannuel complet, une évolution du schéma sera nécessaire.
