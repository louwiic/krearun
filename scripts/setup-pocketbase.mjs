// Provisionne PocketBase pour Krearun Studio :
// crée les collections (idempotent) puis importe les données de data/*.json.
// Usage : node scripts/setup-pocketbase.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Charge .env à la main (pas de dépendance dotenv)
for (const line of readFileSync(join(process.cwd(), ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const PB_URL = process.env.POCKETBASE_URL?.replace(/\/$/, "");
const EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;
if (!PB_URL || !EMAIL || !PASSWORD) {
  console.error("POCKETBASE_URL / POCKETBASE_ADMIN_EMAIL / POCKETBASE_ADMIN_PASSWORD manquants dans .env");
  process.exit(1);
}

const auth = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity: EMAIL, password: PASSWORD }),
}).then((r) => r.json());
if (!auth.token) {
  console.error("Échec d'authentification PocketBase :", auth);
  process.exit(1);
}
const headers = { "Content-Type": "application/json", Authorization: auth.token };
console.log("✓ Authentifié sur", PB_URL);

async function pb(path, init = {}) {
  const res = await fetch(`${PB_URL}/api${path}`, { ...init, headers });
  const body = res.status === 204 ? null : await res.json();
  return { ok: res.ok, status: res.status, body };
}

// ─── Définition des collections ─────────────────────────────

const autodates = [
  { name: "created", type: "autodate", onCreate: true },
  { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
];

const collections = [
  {
    name: "products",
    type: "base",
    fields: [
      { name: "name", type: "text", required: true },
      { name: "slug", type: "text", required: true },
      { name: "tagline", type: "text" },
      { name: "description", type: "text", max: 10000 },
      { name: "priceCents", type: "number", onlyInt: true },
      { name: "compareAtCents", type: "number", onlyInt: true },
      {
        name: "category",
        type: "select",
        maxSelect: 1,
        values: ["veilleuses", "vases", "bureau", "rangement", "deco"],
      },
      { name: "images", type: "json" },
      { name: "videoUrl", type: "text" },
      { name: "weightGrams", type: "number", onlyInt: true },
      { name: "colors", type: "json" },
      { name: "stock", type: "number", onlyInt: true },
      { name: "featured", type: "bool" },
      { name: "active", type: "bool" },
      { name: "isNew", type: "bool" },
      { name: "preorder", type: "bool" },
      { name: "namePersonalizationEnabled", type: "bool" },
      ...autodates,
    ],
    indexes: ["CREATE UNIQUE INDEX `idx_products_slug` ON `products` (`slug`)"],
  },
  {
    name: "orders",
    type: "base",
    fields: [
      { name: "number", type: "number", onlyInt: true, required: true },
      { name: "email", type: "text" },
      { name: "name", type: "text" },
      { name: "phone", type: "text" },
      { name: "addressLine1", type: "text" },
      { name: "addressLine2", type: "text" },
      { name: "city", type: "text" },
      { name: "postalCode", type: "text" },
      { name: "country", type: "text" },
      { name: "subtotalCents", type: "number", onlyInt: true },
      { name: "shippingCents", type: "number", onlyInt: true },
      { name: "totalCents", type: "number", onlyInt: true },
      {
        name: "status",
        type: "select",
        maxSelect: 1,
        values: ["pending", "paid", "preparing", "shipped", "delivered", "cancelled"],
      },
      { name: "stripeSessionId", type: "text" },
      { name: "note", type: "text", max: 5000 },
      { name: "items", type: "json" },
      ...autodates,
    ],
    indexes: ["CREATE UNIQUE INDEX `idx_orders_number` ON `orders` (`number`)"],
  },
  {
    name: "newsletter",
    type: "base",
    fields: [{ name: "email", type: "text", required: true }, ...autodates],
    indexes: ["CREATE UNIQUE INDEX `idx_newsletter_email` ON `newsletter` (`email`)"],
  },
  {
    name: "customers",
    type: "auth",
    passwordAuth: { enabled: true, identityFields: ["email"] },
    fields: [
      { name: "name", type: "text" },
      { name: "phone", type: "text" },
      { name: "addressLine1", type: "text" },
      { name: "addressLine2", type: "text" },
      { name: "city", type: "text" },
      { name: "postalCode", type: "text" },
      { name: "country", type: "text" },
    ],
  },
  {
    name: "customer_activation_tokens",
    type: "base",
    fields: [
      { name: "email", type: "text", required: true },
      { name: "tokenHash", type: "text", required: true },
      { name: "expiresAt", type: "date", required: true },
      { name: "usedAt", type: "date" },
      ...autodates,
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_customer_activation_token_hash` ON `customer_activation_tokens` (`tokenHash`)",
      "CREATE INDEX `idx_customer_activation_email` ON `customer_activation_tokens` (`email`)",
    ],
  },
  {
    name: "settings",
    type: "base",
    fields: [
      { name: "announcement", type: "text" },
      { name: "shipping_flat_cents", type: "number", onlyInt: true },
      { name: "free_shipping_threshold_cents", type: "number", onlyInt: true },
      { name: "shipping_rates_json", type: "text", max: 10000 },
      { name: "pickup_points_json", type: "text", max: 10000 },
      { name: "store_name", type: "text" },
      { name: "contact_email", type: "text" },
      { name: "instagram", type: "text" },
      { name: "hero_image_url", type: "text" },
      { name: "hero_image_alt", type: "text" },
      { name: "hero_link_url", type: "text" },
      { name: "hero_secondary_media_url", type: "text" },
      {
        name: "hero_secondary_media_type",
        type: "select",
        maxSelect: 1,
        values: ["image", "video"],
      },
      { name: "hero_secondary_media_alt", type: "text" },
      { name: "hero_secondary_link_url", type: "text" },
      ...autodates,
    ],
  },
  {
    name: "inventory_colors",
    type: "base",
    fields: [
      { name: "name", type: "text", required: true },
      { name: "hex", type: "text", required: true },
      { name: "stockGrams", type: "number", onlyInt: true },
      { name: "active", type: "bool" },
      { name: "note", type: "text", max: 5000 },
      { name: "sortOrder", type: "number", onlyInt: true },
      ...autodates,
    ],
  },
];

// Toutes les règles restent null (accès superuser uniquement) : le site
// passe exclusivement par le serveur Next.js, jamais par le client.

for (const col of collections) {
  const existing = await pb(`/collections/${col.name}`);
  if (existing.ok) {
    const fields = existing.body?.fields ?? [];
    const missingFields = col.fields.filter(
      (field) => !fields.some((existingField) => existingField.name === field.name)
    );
    if (missingFields.length > 0) {
      const res = await pb(`/collections/${col.name}`, {
        method: "PATCH",
        body: JSON.stringify({ fields: [...fields, ...missingFields] }),
      });
      if (!res.ok) {
        console.error(`✗ Mise à jour "${col.name}" :`, JSON.stringify(res.body, null, 2));
        process.exit(1);
      }
      console.log(
        `✓ Collection "${col.name}" mise à jour (${missingFields.map((f) => f.name).join(", ")})`
      );
    } else {
      console.log(`• Collection "${col.name}" existe déjà — inchangée`);
    }
    continue;
  }
  const res = await pb("/collections", { method: "POST", body: JSON.stringify(col) });
  if (!res.ok) {
    console.error(`✗ Création "${col.name}" :`, JSON.stringify(res.body, null, 2));
    process.exit(1);
  }
  console.log(`✓ Collection "${col.name}" créée`);
}

// ─── Import des données JSON ────────────────────────────────

function readData(file) {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "data", file), "utf8"));
  } catch {
    return [];
  }
}

async function firstRecord(collection, filter) {
  const res = await pb(
    `/collections/${collection}/records?perPage=1&filter=${encodeURIComponent(filter)}`
  );
  return res.body?.items?.[0] ?? null;
}

// Produits de démonstration : désactivés par défaut pour ne pas écraser la
// vraie boutique. À lancer seulement avec SEED_DEMO_PRODUCTS=1 en local.
if (process.env.SEED_DEMO_PRODUCTS === "1") {
  for (const p of readData("products.json")) {
    const payload = {
      name: p.name,
      slug: p.slug,
      tagline: p.tagline,
      description: p.description,
      priceCents: p.priceCents,
      compareAtCents: p.compareAtCents ?? 0,
      category: p.category,
      images: p.images,
      videoUrl: p.videoUrl ?? "",
      weightGrams: p.weightGrams ?? 0,
      colors: p.colors,
      stock: p.stock,
      featured: p.featured,
      active: p.active,
      isNew: p.isNew,
      preorder: Boolean(p.preorder),
      namePersonalizationEnabled: Boolean(p.namePersonalizationEnabled),
    };
    const existing = await firstRecord("products", `slug='${p.slug}'`);
    const res = existing
      ? await pb(`/collections/products/records/${existing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await pb(`/collections/products/records`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
    console.log(res.ok ? `✓ Produit ${p.slug}` : `✗ Produit ${p.slug}: ${JSON.stringify(res.body)}`);
  }
} else {
  console.log("• Produits de démonstration ignorés (SEED_DEMO_PRODUCTS non défini)");
}

// Réglages (enregistrement unique)
const settingsData = JSON.parse(readFileSync(join(process.cwd(), "data", "settings.json"), "utf8"));
{
  const res = await pb(`/collections/settings/records?perPage=1`);
  const existing = res.body?.items?.[0];
  const r = existing
    ? await pb(`/collections/settings/records/${existing.id}`, {
        method: "PATCH",
        body: JSON.stringify(settingsData),
      })
    : await pb(`/collections/settings/records`, {
        method: "POST",
        body: JSON.stringify(settingsData),
      });
  console.log(r.ok ? "✓ Réglages" : `✗ Réglages: ${JSON.stringify(r.body)}`);
}

// Inventaire matière (upsert par nom)
for (const color of readData("inventory-colors.json")) {
  const payload = {
    name: color.name,
    hex: color.hex,
    stockGrams: color.stockGrams ?? 0,
    active: color.active ?? true,
    note: color.note ?? "",
    sortOrder: color.sortOrder ?? 0,
  };
  const existing = await firstRecord("inventory_colors", `name='${color.name.replace(/'/g, "\\'")}'`);
  const res = existing
    ? await pb(`/collections/inventory_colors/records/${existing.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    : await pb(`/collections/inventory_colors/records`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
  console.log(
    res.ok ? `✓ Couleur ${color.name}` : `✗ Couleur ${color.name}: ${JSON.stringify(res.body)}`
  );
}

// Commandes existantes
for (const o of readData("orders.json")) {
  if (await firstRecord("orders", `number=${o.number}`)) {
    console.log(`• Commande #${o.number} existe déjà`);
    continue;
  }
  const res = await pb(`/collections/orders/records`, {
    method: "POST",
    body: JSON.stringify({ ...o, id: undefined, createdAt: undefined, updatedAt: undefined }),
  });
  console.log(res.ok ? `✓ Commande #${o.number}` : `✗ Commande #${o.number}: ${JSON.stringify(res.body)}`);
}

// Abonnés newsletter
for (const s of readData("newsletter.json")) {
  const res = await pb(`/collections/newsletter/records`, {
    method: "POST",
    body: JSON.stringify({ email: s.email }),
  });
  console.log(res.ok ? `✓ Abonné ${s.email}` : `• Abonné ${s.email} (déjà présent)`);
}

console.log("\n✓ PocketBase prêt pour Krearun Studio");
