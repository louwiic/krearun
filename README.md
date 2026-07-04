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

## E-mails transactionnels (Resend)

`RESEND_API_KEY` et `EMAIL_FROM` dans `.env`. Envois automatiques :
confirmation de commande + notification admin (webhook Stripe), e-mail
d'expédition avec n° de suivi (statut → Expédiée), petit mot de livraison
(statut → Livrée). Suivi client public sur `/suivi`.

⚠️ Tant qu'aucun domaine n'est vérifié sur resend.com/domains, Resend
n'envoie que vers l'adresse du compte. Après vérification, mettre
`EMAIL_FROM="Krearun Studio <bonjour@votredomaine.fr>"`.

## Données : PocketBase

Les données (produits, commandes, newsletter, réglages) vivent dans
**PocketBase** (instance Coolify), derrière la couche `lib/store.ts` — le reste
du code n'y touche jamais directement. Configuration dans `.env` :
`POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`.

Les collections ont toutes leurs règles d'accès à `null` (superuser
uniquement) : seul le serveur Next.js parle à PocketBase, jamais le
navigateur.

- `scripts/setup-pocketbase.mjs` — crée les collections (idempotent) et
  importe les données de `data/*.json` (seed initial conservé en backup)
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
