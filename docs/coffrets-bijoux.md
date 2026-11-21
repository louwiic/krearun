# Coffrets à bijoux tropicaux

Première intégration de `02-Developpement-site.md` dans le site Next.js existant.
Route : `/boutique/coffrets-bijoux`, accessible depuis la boutique et sa rubrique Rangement.

## Source et aperçu

Les huit motifs, inscriptions, deux formats et codes F1–F9 viennent de
`/Users/loic/Downloads/Krearun-Atelier/Site/catalogue.json`, copié dans
`data/coffrets-catalogue.json`. Les SVG et les inscriptions restent identiques aux originaux.
Les illustrations de couvercle originales restent dans `public/coffrets/Apercus`,
conservées comme références graphiques.

À la demande du 21 novembre, la présentation reste une boîte ouverte avec
ses deux supports et les bijoux, sur tissu clair, avec le couvercle à côté.
La photo de fond neutre `public/coffrets/Live/coffret-neutre-v01.webp` a été
créée avec Imagegen à partir de cette composition ; la face du couvercle est
libre d’inscriptions, d’illustration et de tirette, pour accueillir le décor.
Le prompt et le chemin source sont dans
`outputs/coffrets-2026-11-21/neutral-plate-manifest.json`.
Les précédentes déclinaisons photographiques restent archivées dans `Photos/`.

## Motif, texte et couleur en direct

`scripts/build-coffret-artwork.mjs` extrait séparément les contours du motif
depuis les SVG originaux. Les lettres d’origine et les poussières extérieures
sont écartées par leurs régions graphiques ; le résultat éditable est enregistré
dans `data/coffrets-artwork.json`. L’illustration est ajustée proportionnellement
et centrée dans sa propre zone. Le titre occupe la partie haute, la phrase la
partie basse, avec des intervalles réservés entre les trois zones. À la demande de l’utilisateur, la tirette est de nouveau présente
par-dessus l’illustration, à droite du couvercle ; les zones de texte restent dégagées. La projection du couvercle conserve la présentation
de la photo de référence, sans prétendre être une CAO validée.

Les écritures fines ont été retirées à la demande de l’utilisateur. Les seuls
choix actifs sont F2 Jost, F3 Arimo, F4 Caladea italique et F8 Libre Baskerville.
Les contours reçoivent un renfort de 2,5 unités pour 100 unités typographiques,
également enregistré dans la configuration atelier. Les autres fichiers sont
conservés pour les anciennes références mais refusés pour une nouvelle commande.
Les alternatives libres avaient été explicitement autorisées par l’utilisateur.

Les TTF et leurs licences OFL sont embarqués dans `public/coffrets/fonts/`.
`data/coffrets-fonts.json` conserve la source Google Fonts, le nom réel, le statut
actif et le SHA-256. Le script `setup-coffret-fonts.mjs` retrouve ces fichiers ;
`build-coffret-lettering.mjs` génère les tracés des titres et phrases avec crénage.
Les échantillons et l’aperçu utilisent directement ces mêmes tracés vectoriels.
Il n’y a ni police système de remplacement, ni téléchargement lors d’un clic.
Le nom réel, le fichier, le SHA-256 et le renfort sont recalculés par le serveur
et conservés avec les inscriptions exactes. Version `KR-v04-tirette-relief`.

Le corps est recoloré en direct par Canvas sur la photo neutre, uniquement sur
le plastique orange. Les supports ivoire, les bijoux et le tissu sont préservés.
Le motif et le texte sont ajoutés ensuite en SVG et restent donc indépendants
de la couleur du corps. Les couleurs écran restent indicatives, faute
d’échantillons physiques et de références de bobines confirmés.
Le configurateur, ses vignettes et le panier partagent le même rendu.

Sur mobile, une carte d’aperçu reste visible sous la navigation pendant le choix
du motif, de la couleur et de la police. Son bouton permet de passer de la boîte
ouverte au zoom du couvercle. Le détail des options reste accessible sous cette
carte. Les bijoux sont présentés à titre d’illustration et ne sont pas inclus.
Aucun prénom ni texte libre n’est proposé.

## Commerce et fabrication

Tarifs confirmés par l’utilisateur : petit 9,90 €, grand 14,90 €, pour le
coffret complet avec ses deux supports. Poids retenu : 100 g pour chaque taille.
Ces valeurs sont centralisées dans `data/coffrets-catalogue.json` puis converties
en centimes et relues côté serveur par `COFFRET_TARIFFS`. La quantité multiplie
le prix et le poids. Les tarifs de la fiche de référence ne sont pas utilisés.
Les poissons seuls restent sans tarif ni poids confirmés : cette formule reste
indisponible à l’achat. Le serveur refuse tout prix client ou formule non tarifée.
Les couleurs ont des teintes indicatives. Les `spoolId` de `COFFRET_COLORS` restent
à associer à l'inventaire réel ; les deux roses doivent être confirmés sur échantillons.
Le libellé ambigu « Ensemble rose et poisson » n'est pas activé.
Les dimensions sont indicatives, pas des cotes atelier vérifiées.

La configuration canonique comprend formule, format de compatibilité, motif,
couleur, code police, titre, phrase et version de dessin. La quantité appartient
à la ligne. L'identité de ligne distingue format, motif, police et version ; la
couleur est déjà un discriminant du panier. Les tarifs sont recalculés au serveur.
Les poissons seuls perdent toutes les options du coffret, même si un client les envoie.
Le panier local et les rappels conservent les choix ; les rappels relisent les tarifs
actuels. Les données validées sont archivées dans les métadonnées Stripe puis dans
`OrderItem.coffretConfiguration`. L'administration et le bon atelier utilisent
`orderItemDetails` pour afficher tous les détails exacts, sans recalculer l'ancien
texte depuis un futur catalogue. Aucun stock de produit virtuel n'est décrémenté.

## Vérification

Tests métier : `tests/coffrets.test.mjs` ; paiements simulés : les deux tests
coffrets de `tests/monster-checkout.test.mjs`. Les tarifs des tests sont fictifs,
indépendants de la configuration livrée. Le webhook signé est simulé : aucune
commande réelle et aucun paiement réel ne sont effectués.
Recette : petit Coco F1 / grand Sardine F4, séparation des lignes et conservation
des inscriptions, bascule aux poissons seuls avec changement de prix, rejet des
valeurs falsifiées et quantités invalides, conservation jusqu'au bon atelier.
Contrôle navigateur ordinateur et largeur mobile 390 px.

Restent à valider en atelier : prototypes des deux tailles, dimensions et compatibilité,
poids, références de bobines, finesse des lettres après extrusion et impression,
conditions d'exploitation commerciale de la référence.


## Tirette en relief

L’accessoire visible dans la référence est rétabli comme calque photographique
transparent, au-dessus du décor, dans les vues ouverte et agrandie, les vignettes,
le panier et l’aperçu mobile. L’éclairage, l’épaisseur et l’ombre donnent son relief ;
il ne s’agit pas d’un nouveau modèle CAO ni d’une vue orbitale Three.js.
La tirette suit la couleur du corps. Les deux ouvertures restent transparentes,
laissant voir le motif sous-jacent. La source et le prompt Imagegen sont conservés
dans `outputs/coffrets-2026-11-21/pull-tab-manifest.json` et le calque est livré dans
`public/coffrets/Live/tirette-relief-v01.png`.


## Vue fermée en perspective

Une troisième vue « Coffret fermé » reprend l’angle de la photo utilisateur,
avec le corps strié et le couvercle en place. Elle s’ajoute aux vues ouverte et
agrandie. Le même état de sélection pilote les trois vues, y compris sur mobile.
Changer le motif, la couleur ou la police conserve l’angle choisi.
Le fond neutre Imagegen est dans `public/coffrets/Live/coffret-ferme-neutre-v01.webp` ;
son prompt et sa source sont conservés dans `closed-view-manifest.json` du dossier
`outputs/coffrets-2026-11-21`.
Le décor vectoriel et la tirette sont projetés sur la surface photographiée par
homographie (bord avant plus large que le bord arrière). Le masque connexe de
la face crème empêche le décor de dépasser sur la bordure ou le corps.
La photo est une présentation fixe en perspective, pas une scène orbitale.
