# Kits de Noël : un moule, plusieurs décorations

Les variantes des produits `noel-thermoforme-{sourceId}` proposent une formule déjà thermoformée et un kit contenant de 1 à 10 décorations du même motif. Un jeu de moules réutilisables est inclus par kit complet ; pièces plates, connecteurs et cordons sont multipliés par le nombre de décorations.

L’ancien identifiant `noel-{sourceId}-kit` désigne toujours le kit d’une décoration. Les autres identifiants sont `noel-{sourceId}-kit-{nombre}`, de 2 à 10. Le nom du lot, son prix et son poids sont enregistrés dans les variantes existantes du produit et restent modifiables dans l’admin. Les produits masqués restent masqués.

Le sélecteur « Nombre de décorations » choisit un lot. La quantité du panier est un nombre de kits complets : deux kits de cinq décorations comportent dix décorations et deux jeux de moules. L’identifiant du lot et sa désignation sont transmis à Stripe et à la commande par le circuit des variantes existant. Le prix et le poids du lot sont relus côté serveur.

## Chiffrage initial

Prévisualisation locale :

`node --experimental-strip-types scripts/configure-noel-kit-bundles.mjs`

Ajouter `--apply` pour enregistrer le plan préalablement vérifié. Le script nécessite le rapport local `outputs/thermoformed-noel-2026-10-30/costed-products.json` et les accès PocketBase de l’environnement. Il conserve un instantané avant modification et exporte le détail des tarifs et poids dans `outputs/noel-kit-bundles-2026-10-31/`. Une nouvelle exécution recalcule les tarifs des lots ; sauvegarder d’abord toute modification manuelle.

Le prix initial du kit d’une décoration reste inchangé. Chaque décoration supplémentaire comprend le coût PLA et machine du rapport de tranchage (purges comprises, réserve de 10 %), une minute de préparation et son cordon. Le taux machine inclut déjà l’électricité : elle n’est pas comptée deux fois. Le prix de base des pièces supplémentaires reprend le coefficient commercial du premier chiffrage, puis une réduction de 5 %, 10 % ou 15 % s’applique à ces seules pièces dès 3, 5 ou 10 décorations. Les totaux sont arrondis à dix centimes. Le prix moyen diminue, le prix total et le poids augmentent avec chaque décoration.

Les poids ajoutés sont estimés avec les grammes imprimés du rapport, une marge pour le cordon et un arrondi de colis à 50 g. Ils restent à confronter à la pesée réelle. Les coûts et marges sont des estimations avant frais généraux, impôts et cotisations ; la puissance électrique n’a pas été mesurée sur les machines du client.

Les remises générales de quantité du produit s’appliquent à la formule déjà thermoformée. Elles ne se cumulent pas sur les kits, qui possèdent déjà leur tarif de lot. Les promotions de commande restent régies par le fonctionnement habituel du checkout.

Exemple Boule Nid d’abeille : kit 1 = 21,90 €, 3 = 27,40 €, 5 = 32,30 €, 10 = 44,10 €, avec un jeu de moules dans chaque lot.
