// Remplit data/products.json + data/settings.json avec le catalogue de démo.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";

const dataDir = join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

const now = new Date().toISOString();
const P = (p) => ({
  id: randomUUID(),
  tagline: "",
  description: "",
  compareAtCents: null,
  colors: [],
  stock: 10,
  featured: false,
  active: true,
  isNew: false,
  createdAt: now,
  updatedAt: now,
  images: [`/products/${p.slug}.svg`, `/products/${p.slug}-2.svg`],
  ...p,
});

const creme = { name: "Crème", hex: "#f3ead9" };
const blush = { name: "Blush", hex: "#e8c4b8" };
const sauge = { name: "Sauge", hex: "#b8c8a8" };
const terracotta = { name: "Terracotta", hex: "#cf9670" };
const lavande = { name: "Lavande", hex: "#c5bcd8" };
const ciel = { name: "Ciel", hex: "#dbe7ec" };

const products = [
  P({
    name: "Veilleuse Lune",
    slug: "veilleuse-lune",
    tagline: "Un croissant de douceur pour vos nuits",
    description:
      "Imprimée en 3D couche par couche dans notre petit atelier, cette veilleuse en forme de lune diffuse une lumière chaude et tamisée, parfaite pour accompagner les soirs calmes. Son PLA biosourcé laisse passer la lumière comme du papier de riz.\n\n• Ampoule LED basse consommation incluse\n• Câble USB en coton tressé (1,5 m)\n• Diamètre 14 cm\n• Imprimée à la commande, rien que pour vous",
    priceCents: 3900,
    category: "veilleuses",
    colors: [creme, blush],
    stock: 12,
    featured: true,
    isNew: true,
  }),
  P({
    name: "Veilleuse Nuage",
    slug: "veilleuse-nuage",
    tagline: "Un petit nuage qui veille sur vous",
    description:
      "Notre nuage préféré, tout en rondeurs. Posé sur une étagère ou une table de chevet, il enveloppe la pièce d'une lueur douce comme un ciel de fin d'été.\n\n• Variateur tactile 3 intensités\n• Câble USB-C inclus\n• Largeur 18 cm\n• PLA biosourcé, imprimé en circuit court",
    priceCents: 4400,
    category: "veilleuses",
    colors: [ciel, creme],
    stock: 8,
    featured: true,
    isNew: true,
  }),
  P({
    name: "Lampe Champignon",
    slug: "lampe-champignon",
    tagline: "La forêt enchantée, version bureau",
    description:
      "Inspirée des champignons des sous-bois, cette petite lampe apporte une touche de poésie à votre bureau ou votre entrée. Son chapeau translucide diffuse une lumière ambrée très apaisante.\n\n• Hauteur 22 cm\n• Interrupteur sur câble\n• Impression 3D soignée, ponçage à la main",
    priceCents: 5200,
    compareAtCents: 5900,
    category: "veilleuses",
    colors: [blush, terracotta],
    stock: 6,
    featured: true,
  }),
  P({
    name: "Photophore Cocon",
    slug: "bougie-cocon",
    tagline: "Une flamme, un cocon",
    description:
      "Ce photophore ajouré projette des ombres délicates sur les murs. Glissez-y une bougie LED (fournie) et laissez la magie opérer.\n\n• Bougie LED rechargeable incluse\n• Hauteur 12 cm\n• Motif tissé imprimé en 3D",
    priceCents: 2900,
    category: "veilleuses",
    colors: [creme],
    stock: 15,
  }),
  P({
    name: "Vase Ondulé",
    slug: "vase-ondule",
    tagline: "Des vagues douces pour vos fleurs séchées",
    description:
      "Ses ondulations régulières sont le résultat de 14 heures d'impression lente. Un vase sculptural qui se suffit à lui-même, ou qui sublime un bouquet de fleurs séchées.\n\n• Hauteur 20 cm\n• Étanche avec insert en verre (fourni)\n• Chaque pièce est unique, avec ses fines lignes d'impression",
    priceCents: 4600,
    category: "vases",
    colors: [sauge, creme, terracotta],
    stock: 10,
    featured: true,
    isNew: true,
  }),
  P({
    name: "Vase Torsadé",
    slug: "vase-torsade",
    tagline: "Une spirale qui attrape la lumière",
    description:
      "Sa torsion élégante accroche la lumière du matin comme celle du soir. Imprimé en mode « vase » d'une seule paroi continue, sans couture.\n\n• Hauteur 24 cm\n• Insert verre inclus pour fleurs fraîches\n• Fini satiné",
    priceCents: 4200,
    category: "vases",
    colors: [terracotta, sauge],
    stock: 9,
  }),
  P({
    name: "Cache-pot Visage Endormi",
    slug: "cache-pot-visage",
    tagline: "Il dort pendant que vos plantes poussent",
    description:
      "Notre best-seller. Ce cache-pot au visage paisible accueille vos succulentes et petites plantes avec une tendresse infinie. Ses « cheveux » deviennent le feuillage.\n\n• Pour pots de 8–10 cm\n• Trou de drainage + soucoupe intégrée\n• Hauteur 13 cm",
    priceCents: 3400,
    category: "deco",
    colors: [blush, creme, lavande],
    stock: 14,
    featured: true,
  }),
  P({
    name: "Support Téléphone Arche",
    slug: "support-telephone",
    tagline: "Votre téléphone, bien installé",
    description:
      "Une arche minimaliste qui tient votre téléphone à l'angle parfait, en portrait comme en paysage. Passage de câble intégré pour charger pendant vos appels vidéo.\n\n• Compatible tous smartphones (avec ou sans coque)\n• Patins antidérapants\n• Angle de 62°, pensé pour les visios",
    priceCents: 1900,
    category: "bureau",
    colors: [sauge, creme],
    stock: 22,
  }),
  P({
    name: "Pot à Crayons Champignon",
    slug: "pot-champignon",
    tagline: "Un abri douillet pour vos stylos",
    description:
      "Le chapeau se soulève pour révéler un rangement secret, le pied accueille stylos et pinceaux. Un petit compagnon de bureau qui fait sourire.\n\n• Hauteur 16 cm\n• Compartiment secret sous le chapeau\n• Base lestée",
    priceCents: 2600,
    category: "bureau",
    colors: [terracotta, blush],
    stock: 18,
  }),
  P({
    name: "Organiseur Dune",
    slug: "organiseur-dune",
    tagline: "Trois vallons pour tout ranger",
    description:
      "Inspiré des dunes au coucher du soleil, cet organiseur modulable range lunettes, clés, stylos et petits trésors. Ses trois modules s'emboîtent ou vivent séparés.\n\n• 3 modules aimantés\n• Largeur totale 28 cm\n• Feutrine douce sous chaque module",
    priceCents: 3800,
    category: "bureau",
    colors: [lavande, creme],
    stock: 7,
    isNew: true,
  }),
  P({
    name: "Boîte Coquillage",
    slug: "boite-coquillage",
    tagline: "Vos bijoux dans un écrin marin",
    description:
      "Un coquillage qui s'ouvre sur un intérieur nacré, parfait pour bagues, boucles d'oreilles et petits secrets. Charnière imprimée d'une pièce, sans vis.\n\n• Largeur 11 cm\n• Charnière intégrée, ouverture douce\n• Intérieur fini nacré",
    priceCents: 3200,
    category: "rangement",
    colors: [blush, creme],
    stock: 11,
  }),
  P({
    name: "Vide-poche Galet",
    slug: "vide-poche-galet",
    tagline: "Posez tout, respirez",
    description:
      "Comme un galet poli par la mer, ce vide-poche accueille clés, monnaie et bijoux à l'entrée. Sa forme organique est douce au toucher, presque méditative.\n\n• Largeur 19 cm\n• Fond feutré antidérapant\n• Chaque exemplaire varie légèrement — c'est voulu",
    priceCents: 2400,
    category: "rangement",
    colors: [creme, sauge],
    stock: 16,
  }),
  P({
    name: "Dessous de Verre Ondes (x4)",
    slug: "dessous-verre-ondes",
    tagline: "Des ronds dans l'eau sur votre table",
    description:
      "Quatre dessous de verre aux motifs d'ondes concentriques, livrés avec leur support assorti. Le relief retient les gouttes de condensation.\n\n• Set de 4 + support\n• Diamètre 10 cm\n• Relief anti-gouttes",
    priceCents: 2200,
    category: "deco",
    colors: [sauge, terracotta],
    stock: 20,
  }),
];

const settings = {
  announcement: "✿ La Collection Été est arrivée — livraison offerte dès 60 €",
  shipping_flat_cents: 590,
  free_shipping_threshold_cents: 6000,
  store_name: "Krearun Studio",
  contact_email: "bonjour@krearun.studio",
  instagram: "https://instagram.com/coconstudio",
};

const force = process.argv.includes("--force");
if (force || !existsSync(join(dataDir, "products.json"))) {
  writeFileSync(join(dataDir, "products.json"), JSON.stringify(products, null, 2));
  console.log(`✓ ${products.length} produits écrits dans data/products.json`);
}
if (force || !existsSync(join(dataDir, "settings.json"))) {
  writeFileSync(join(dataDir, "settings.json"), JSON.stringify(settings, null, 2));
  console.log("✓ Réglages écrits dans data/settings.json");
}
if (!existsSync(join(dataDir, "orders.json"))) {
  writeFileSync(join(dataDir, "orders.json"), "[]");
}
if (!existsSync(join(dataDir, "newsletter.json"))) {
  writeFileSync(join(dataDir, "newsletter.json"), "[]");
}
console.log("✓ Seed terminé");
