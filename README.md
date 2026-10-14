# Krearun Studio — boutique d'objets imprimés en 3D

E-shop complet (front + admin) au ton très doux, inspiré de cozyleigh.studio.

## Démarrer

```bash
npm install
node scripts/seed.mjs   # (déjà fait) catalogue de démo dans data/
npm run dev             # http://localhost:3000
```

## Espace admin

- URL : http://localhost:3000/admin
- Comptes gérés dans PocketBase (collection auth `boutique_admins`) —
  création/reset via `node scripts/setup-admin-collection.mjs <email> <mdp>`
  ou depuis l'interface PocketBase `/_/`.

L'admin permet de gérer : produits (création, édition, stock, photos, coloris,
mise en avant), commandes (statuts En attente → Payée → En préparation →
Expédiée → Livrée), abonnés newsletter, réglages (bandeau d'annonce, frais de
port, seuil livraison offerte, e-mail de contact, Instagram).

## Activer les paiements Stripe

1. Renseigner dans `.env` : `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
2. Créer un webhook Stripe vers `/api/stripe/webhook` (événement
   `checkout.session.completed`) et renseigner `STRIPE_WEBHOOK_SECRET`.
   En local : `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. Redémarrer le serveur.

Le checkout relit **toujours** les prix côté serveur (jamais ceux du client),
la commande est créée par le webhook (idempotent) et le stock est décrémenté
automatiquement.

## E-mails transactionnels (SMTP LWS)

Renseigner dans `.env` :

```dotenv
SMTP_HOST="mail95.lwspanel.com"
SMTP_PORT="465"
SMTP_USER="contact@krearun.re"
SMTP_PASSWORD="mot-de-passe-de-la-boite-mail"
EMAIL_FROM="Krearun Studio <contact@krearun.re>"
ADMIN_NOTIFICATION_EMAIL="loicbatonnet.dev@gmail.com"
```

Le port 465 utilise SSL/TLS. Le serveur LWS direct est utilisé afin d'éviter
le proxy Cloudflare du sous-domaine `mail.krearun.re`. Envois automatiques :
confirmation de commande + notification admin (webhook Stripe), e-mail
d'expédition avec n° de suivi (statut → Expédiée), petit mot de livraison
(statut → Livrée). L'administrateur reçoit aussi un e-mail à chaque changement
de statut. Suivi client public sur `/suivi`.

## Données : PocketBase + R2

Les données (produits, commandes, newsletter, réglages) vivent dans
**PocketBase** (instance Coolify), derrière la couche `lib/store.ts` — le reste
du code n'y touche jamais directement. Les photos produits sont stockées dans
**Cloudflare R2** et les produits gardent uniquement les URLs publiques dans
leur champ `images`.

Configuration dans `.env` :
`POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`,
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
`R2_PUBLIC_URL`. Si le bucket reste privé, `R2_PUBLIC_URL` peut pointer vers
la route proxy du site, par exemple `https://krearun.re/api/r2`.

Les collections ont toutes leurs règles d'accès à `null` (superuser
uniquement) : seul le serveur Next.js parle à PocketBase, jamais le
navigateur.

- `scripts/setup-pocketbase.mjs` — crée les collections (idempotent) et
  importe les données de `data/*.json` (seed initial conservé en backup)
- `scripts/migrate-product-images-to-r2.mjs` — copie les images produit
  existantes vers R2 et remplace les URLs PocketBase
- `scripts/seed.mjs` — régénère les JSON de seed (`--force` pour écraser)
- `scripts/gen-images.mjs` — régénère les visuels SVG de `public/products/`

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · Stripe
Checkout · Auth admin par cookie JWT signé (`jose`) via `proxy.ts`.

## Arborescence

```
app/(site)/        → boutique publique (accueil, boutique, fiche, FAQ, contact…)
app/admin/         → back-office (login + dashboard, produits, commandes…)
app/api/           → checkout Stripe, webhook, newsletter
components/        → site, produit, panier (drawer + contexte), admin
lib/               → store.ts (PocketBase), auth.ts, stripe.ts, types.ts, format.ts
data/              → seed JSON initial (backup, plus utilisé au runtime)
public/products/   → visuels générés
public/uploads/    → photos ajoutées depuis l'admin
```

## Porte-boisson 500 ml personnalisé

La fiche `/boutique/porte-boisson-500ml-personnalise` propose les modèles OM / Arsenal et un dépôt SVG/PNG/JPG/WebP
(5 Mo maximum ; images raster de 4096 pixels maximum, SVG rasterisé sous limite de 2048 pixels), une préparation du logo en quatre couleurs maximum
et un aperçu Three.js orientable avec corps noir ou blanc, choix des couleurs du logo parmi l’inventaire (quatre maximum), réglage de la largeur et du
placement. Le client vérifie l’aperçu avant l’envoi. Un compte est nécessaire pour
envoyer la demande ; `/compte/inscription` envoie un lien d’activation aux nouveaux clients.

Les logos original et préparé, ainsi que la source SVG assainie lorsqu’elle existe, sont des fichiers **protégés** dans PocketBase,
consultables uniquement par le propriétaire de la demande et l’administrateur.
Dans `/admin/personnalisations`, l’atelier vérifie la faisabilité, saisit le prix
unitaire et la livraison, puis accepte ou refuse avec un message. Le devis accepté
est immuable. Le client retrouve la réponse et le paiement dans `/compte`.
Seule une confirmation Stripe signée crée la commande payée. Des index uniques
protègent l’envoi, la décision et la création de commande contre les doublons.

Provisionner avant déploiement :

```bash
node --env-file=.env scripts/setup-custom-holder.mjs
```

Ce script crée `holder_requests`, `holder_decisions`, ajoute les champs manquants (dont le SVG protégé), l’index des commandes et la
fiche produit inactive. Activer la fiche dans l’admin une fois le code déployé.
Les GLB de `public/models/holders` proviennent des projets 3MF assemblés OM et Arsenal
stockés dans `/Users/loic/3D/porte_boisson`. Le neutre conserve le corps et la poignée,
rebouche les décors OM et reçoit le marquage KREARUN en relief dans Three.js.
`scripts/export-holder-preview.py` régénère ces fichiers (dépendances Python indiquées
en tête du script). Les projets d’impression originaux ne sont pas modifiés.
Les logos OM / Arsenal restent à leur placement d’origine et leurs couleurs sont modifiables ; le logo importé est
projeté en texture sur le corps courbe, avec largeur et position réglables.

Dans `/admin/personnalisations`, « Générer le 3MF de fabrication » télécharge
un projet Bambu Studio avec les pièces séparées sur leurs plateaux, leurs couleurs,
le cylindre avec logement et le logo à plat. L’export est réservé aux administrateurs,
y compris pour une demande encore en attente afin d’en vérifier la faisabilité.

Pour un logo personnalisé, le contour du PNG préparé (aussi utilisé pour un SVG
importé) est vectorisé en conservant transparence, trous et îlots. Les petites marches
issues du raster sont simplifiées à 0,025 mm. Une sous-couche commune de la couleur
dominante relie les zones adjacentes ; les îlots transparents restent séparés.
Valeurs initiales : creux 0,6 mm, jeu latéral 0,2 mm, épaisseur du logo 1 mm, jeu de
colle au fond 0,02 mm. La largeur à plat est compensée pour la fibre neutre du cintrage
pour retrouver le placement de l’aperçu. Le logo doit être mis en forme selon le
matériau avant collage. Les filetages sont exclus de la découpe et un logo qui
empiète sur leur zone est refusé à l’export. Le contrôle vérifie les volumes fermés
et l’absence d’intersection entre l’insert cintré et le logement.

Les modèles OM / Arsenal conservent exactement les géométries et placements de
leurs projets d’impression ; seules les affectations des couleurs sont remplacées.
Les maillages de fabrication non décimés sont dans `assets/holder-manufacturing`
(hors du dossier public). `scripts/prepare-holder-manufacturing.py` les extrait des
3MF sources et reconstruit le cylindre neutre, sans modifier les fichiers originaux.
Le calcul Manifold WASM s’exécute dans un worker Node jetable, limité à deux minutes,
avec un seul export simultané par processus. Aucun service CAO externe ni Python
n’est nécessaire sur le serveur. Un projet correspond à UN exemplaire ; la quantité
commandée ne duplique pas les pièces. Le rapport et la notice sont inclus dans
`Metadata/krearun-fabrication.json` et `Metadata/NOTICE-COLLAGE.txt` du 3MF.
Affecter les filaments réels et recalculer la purge dans Bambu Studio (la matrice
initiale est conservatrice), puis contrôler le tranchage et une première pièce
avant série. La génération d’un fichier ne vaut pas validation du devis.

L’aperçu du Clicker Studio comporte aussi une scène Three.js orientable et zoomable,
avec autant de touches que de lettres/symboles affichés, et les trois couleurs de
la configuration. Le placement libre du symbole demandé en note reste vérifié
à l’atelier. Ce modèle indicatif n’est pas un fichier de fabrication du clicker.

```bash
node --test tests/custom-holder.test.mjs tests/holder-manufacturing.test.mjs
```

## API publique pour les sites partenaires

`GET /api/partenaires/produits` renvoie en JSON uniquement les produits actifs
cochés « Partager avec les sites partenaires » dans leur fiche d'administration.
La route accepte les appels cross-origin (`CORS`) et expose les prix en centimes,
les médias, les coloris, la disponibilité et l'URL de la fiche produit.

Après déploiement initial de cette fonctionnalité, ajouter le champ PocketBase :

```bash
node scripts/setup-partner-products.mjs
```
