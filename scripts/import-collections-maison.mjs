// Import de la collection "Maison" : compresse les photos en WebP,
// crée les produits complets dans PocketBase (avec upload des photos).
// Usage : node scripts/import-collections-maison.mjs <dossier_photos>
import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

for (const line of readFileSync(join(process.cwd(), ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const PB = process.env.POCKETBASE_URL.replace(/\/$/, "");
const srcDir = process.argv[2];
if (!srcDir) {
  console.error("Usage : node scripts/import-collections-maison.mjs <dossier_photos>");
  process.exit(1);
}

const auth = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    identity: process.env.POCKETBASE_ADMIN_EMAIL,
    password: process.env.POCKETBASE_ADMIN_PASSWORD,
  }),
}).then((r) => r.json());
if (!auth.token) {
  console.error("Auth PocketBase échouée :", auth);
  process.exit(1);
}
const H = { Authorization: auth.token };

// 1. Ajoute la valeur "salle-de-bain" au select category (idempotent)
{
  const col = await fetch(`${PB}/api/collections/products`, { headers: H }).then((r) => r.json());
  const cat = col.fields.find((f) => f.name === "category");
  if (!cat.values.includes("salle-de-bain")) {
    cat.values.push("salle-de-bain");
    const res = await fetch(`${PB}/api/collections/products`, {
      method: "PATCH",
      headers: { ...H, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: col.fields }),
    });
    console.log(res.ok ? "✓ Catégorie salle-de-bain ajoutée au select" : "✗ " + (await res.text()));
  } else {
    console.log("• Catégorie salle-de-bain déjà présente");
  }
}

// Coloris réutilisés
const creme = { name: "Crème", hex: "#f3ead9" };
const sable = { name: "Sable", hex: "#d9bd93" };
const terracotta = { name: "Terracotta", hex: "#c96f45" };
const perle = { name: "Gris perle", hex: "#d8d5cf" };
const granit = { name: "Granit clair", hex: "#e3e1dc" };
const blanc = { name: "Blanc cassé", hex: "#f5f2ec" };

// Mapping fichier source (nom horodaté) → photos
const F = (t) => `Capture d’écran ${t}.png`;

const products = [
  {
    name: "Set Salle de Bain Rivage",
    slug: "set-salle-de-bain-rivage",
    tagline: "Le trio strié qui range tout le lavabo",
    description:
      "Un grand pot pour les brosses à dents, deux petits pour les accessoires, le tout posé sur son plateau assorti aux pieds arrondis. Les stries verticales rappellent le sable au retrait de la vague et cachent les traces d'eau du quotidien.\n\n• 3 pots + plateau ovale (28 × 14 cm)\n• Stries anti-traces, nettoyage au chiffon humide\n• PLA biosourcé mat, imprimé à la commande",
    priceCents: 3400,
    category: "salle-de-bain",
    colors: [creme, sable],
    stock: 9,
    featured: true,
    isNew: true,
    photos: [F("2026-07-02 à 18.08.49")],
  },
  {
    name: "Duo Gobelets Rivage",
    slug: "duo-gobelets-rivage",
    tagline: "Deux gobelets striés, un plateau, zéro désordre",
    description:
      "La version compacte de notre set Rivage : deux gobelets généreux sur leur plateau à pieds, pour les brosses à dents d'un côté et le dentifrice de l'autre. Parfait pour les petits lavabos.\n\n• 2 gobelets (h. 11 cm) + plateau (22 × 11 cm)\n• Fond ouvert pour un séchage rapide\n• PLA biosourcé mat, imprimé à la commande",
    priceCents: 2600,
    category: "salle-de-bain",
    colors: [perle, creme],
    stock: 12,
    isNew: true,
    photos: [F("2026-07-02 à 18.12.00")],
  },
  {
    name: "Organisateur de Douche Suspendu",
    slug: "organisateur-douche-suspendu",
    tagline: "Vos flacons et serviettes, suspendus sans percer",
    description:
      "Un support strié pour trois flacons et deux grands crochets qui enjambent la paroi de douche : rien à percer, rien à coller. Le crochet double garde la serviette au sec, côté extérieur.\n\n• Support 3 flacons + 2 crochets pour paroi jusqu'à 10 mm\n• Évacuation d'eau intégrée\n• PLA biosourcé résistant à l'humidité",
    priceCents: 4400,
    category: "salle-de-bain",
    colors: [sable, blanc],
    stock: 7,
    featured: true,
    isNew: true,
    photos: [F("2026-07-02 à 18.09.57"), F("2026-07-02 à 18.10.06")],
  },
  {
    name: "Vide-poche Froissé",
    slug: "vide-poche-froisse",
    tagline: "Comme un papier froissé qui garde vos trésors",
    description:
      "Sa bordure irrégulière semble froissée à la main — chaque exemplaire sort pourtant de l'imprimante avec ses propres plis, doux au toucher. Lunettes, chouchous, écouteurs : tout y trouve refuge.\n\n• Diamètre 20 cm environ\n• Chaque pièce est unique, ses plis aussi\n• PLA biosourcé mat",
    priceCents: 2400,
    category: "rangement",
    colors: [terracotta, blanc],
    stock: 14,
    isNew: true,
    photos: [F("2026-07-02 à 18.09.06")],
  },
  {
    name: "Vase Pétale",
    slug: "vase-petale",
    tagline: "Un pétale enroulé autour de vos fleurs",
    description:
      "Deux teintes qui s'enlacent comme un pétale qui se déplie. Son insert étanche accueille fleurs fraîches ou séchées, et sa silhouette se suffit à elle-même le reste du temps.\n\n• Hauteur 21 cm\n• Insert verre inclus\n• Bicolore crème & sable, fini mat",
    priceCents: 3900,
    category: "vases",
    colors: [creme, sable],
    stock: 10,
    featured: true,
    isNew: true,
    photos: [F("2026-07-02 à 18.09.30")],
  },
  {
    name: "Lampe Pétale",
    slug: "lampe-petale",
    tagline: "La lumière se déplie comme une fleur du soir",
    description:
      "La cousine lumineuse de notre Vase Pétale : son voile s'entrouvre et laisse filtrer une lueur ambrée, chaude comme une fin de journée d'été. Idéale sur une table de chevet ou une enfilade.\n\n• Hauteur 24 cm\n• Ampoule LED E14 incluse, interrupteur sur câble\n• Diffuseur imprimé en couche fine pour une lumière sans éblouissement",
    priceCents: 5400,
    category: "veilleuses",
    colors: [sable],
    stock: 6,
    isNew: true,
    photos: [F("2026-07-02 à 18.09.37")],
  },
  {
    name: "Vases de Propagation Pétale (x3)",
    slug: "vases-propagation-petale",
    tagline: "Trois boutures, trois pétales, un rebord de fenêtre heureux",
    description:
      "Trois petits fourreaux pétale et leurs tubes en verre pour faire raciner vos boutures — posés sur une étagère ou fixés au mur (adhésifs fournis). Regarder les racines pousser devient un rituel.\n\n• Lot de 3 (sable, crème, terracotta) + tubes en verre\n• Utilisation posée ou murale, adhésifs sans perçage fournis\n• Hauteur 12 cm (hors tube)",
    priceCents: 2900,
    category: "vases",
    colors: [sable, creme, terracotta],
    stock: 15,
    featured: true,
    isNew: true,
    photos: [F("2026-07-02 à 18.10.38"), F("2026-07-02 à 18.10.53")],
  },
  {
    name: "Étagère à Parfums Riviera",
    slug: "etagere-parfums-riviera",
    tagline: "Vos parfums méritent leur petite scène",
    description:
      "Trois niveaux aux angles adoucis et une texture granitée qui attrape joliment la lumière : cette étagère met en scène parfums, montres et bijoux sur la coiffeuse ou la commode.\n\n• 3 niveaux, 26 × 24 × 12 cm\n• Texture granitée, pieds antidérapants\n• PLA biosourcé effet pierre",
    priceCents: 4900,
    category: "rangement",
    colors: [granit],
    stock: 8,
    isNew: true,
    photos: [F("2026-07-02 à 18.11.08")],
  },
  {
    name: "Lampe Plissée Trépied",
    slug: "lampe-plissee-trepied",
    tagline: "Un plissé soleil sur trois pieds de bois",
    description:
      "Son abat-jour plissé, imprimé d'une seule pièce, projette au sol une couronne de rayons dès qu'on l'allume. Le trépied en bois foncé lui donne un petit air de lampe de créateur des années 60.\n\n• Hauteur 38 cm, abat-jour Ø 22 cm\n• Pieds en hêtre teinté noyer\n• Ampoule LED E27 incluse, câble avec interrupteur",
    priceCents: 6900,
    category: "veilleuses",
    colors: [creme],
    stock: 5,
    featured: true,
    isNew: true,
    photos: [F("2026-07-02 à 18.11.41"), F("2026-07-02 à 18.11.29")],
  },
  {
    name: "Arche à Chouchous",
    slug: "arche-a-chouchous",
    tagline: "Chouchous, pinces et élastiques enfin réunis",
    description:
      "Une arche striée sur son socle vide-poche : on y empile les chouchous, on y pince les grandes barrettes, et le socle attrape élastiques et épingles. La coiffeuse respire.\n\n• Hauteur 18 cm, socle 16 × 8 cm\n• Stries pour accrocher les pinces crabe\n• PLA biosourcé mat",
    priceCents: 2700,
    category: "rangement",
    colors: [perle, sable],
    stock: 13,
    isNew: true,
    photos: [F("2026-07-02 à 18.12.19")],
  },
  {
    name: "Vase Algue",
    slug: "vase-algue",
    tagline: "Des ondulations qui dansent comme sous l'eau",
    description:
      "Ses vagues verticales semblent onduler au courant — 19 heures d'impression lente pour un vase sculptural qui joue avec la lumière du matin au soir. Une pièce signature, avec ou sans bouquet.\n\n• Hauteur 25 cm\n• Insert verre inclus pour fleurs fraîches\n• Blanc cassé, fini mat profond",
    priceCents: 4600,
    category: "vases",
    colors: [blanc],
    stock: 6,
    isNew: true,
    photos: [F("2026-07-04 à 09.00.49")],
  },
  {
    name: "Lampe Bouteille Lumineuse",
    slug: "lampe-bouteille-lumineuse",
    tagline: "Un vase le jour, une veilleuse le soir",
    description:
      "Cette bouteille striée accueille vos branches d'eucalyptus la journée, puis s'illumine le soir d'une lumière douce qui traverse ses parois fines. Deux objets en un, zéro compromis.\n\n• Hauteur 23 cm\n• LED basse consommation intégrée, câble USB\n• Parois fines translucides, lumière chaude sans éblouir",
    priceCents: 4900,
    category: "veilleuses",
    colors: [blanc],
    stock: 8,
    featured: true,
    isNew: true,
    photos: [F("2026-07-04 à 09.08.04")],
  },
];

// 2. Création des produits
let created = 0;
for (const p of products) {
  const exists = await fetch(
    `${PB}/api/collections/products/records?perPage=1&filter=${encodeURIComponent(`slug='${p.slug}'`)}`,
    { headers: H }
  ).then((r) => r.json());
  if (exists.items?.length) {
    console.log(`• ${p.name} existe déjà — ignoré`);
    continue;
  }

  const form = new FormData();
  form.append("name", p.name);
  form.append("slug", p.slug);
  form.append("tagline", p.tagline);
  form.append("description", p.description);
  form.append("priceCents", String(p.priceCents));
  form.append("compareAtCents", "0");
  form.append("category", p.category);
  form.append("colors", JSON.stringify(p.colors));
  form.append("images", JSON.stringify([]));
  form.append("stock", String(p.stock));
  form.append("featured", String(Boolean(p.featured)));
  form.append("active", "true");
  form.append("isNew", String(Boolean(p.isNew)));

  for (const file of p.photos) {
    const buffer = await sharp(join(srcDir, file))
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const webpName = p.slug + "-" + (p.photos.indexOf(file) + 1) + ".webp";
    form.append("photos", new File([new Uint8Array(buffer)], webpName, { type: "image/webp" }));
  }

  const res = await fetch(`${PB}/api/collections/products/records`, {
    method: "POST",
    headers: H,
    body: form,
  });
  if (!res.ok) {
    console.error(`✗ ${p.name} :`, await res.text());
    continue;
  }
  const rec = await res.json();
  const urls = rec.photos.map((n) => `${PB}/api/files/products/${rec.id}/${n}`);
  const patch = await fetch(`${PB}/api/collections/products/records/${rec.id}`, {
    method: "PATCH",
    headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({ images: urls }),
  });
  console.log(patch.ok ? `✓ ${p.name} (${urls.length} photo${urls.length > 1 ? "s" : ""})` : `✗ images ${p.name}`);
  created++;
}

console.log(`\n✓ Import terminé : ${created} produit(s) créé(s)`);
