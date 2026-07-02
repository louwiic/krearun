// Génère des visuels produits SVG doux dans public/products/
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "public", "products");
mkdirSync(outDir, { recursive: true });

// Palettes douces (fond, fond2, matière, matière ombre, accent)
const palettes = {
  creme: ["#f6efe6", "#efe3d3", "#fdfaf5", "#e8dcc9", "#d8c7ae"],
  sauge: ["#e9eee4", "#dbe4d2", "#f2f5ee", "#c9d6bc", "#a8bb97"],
  blush: ["#f7e9e4", "#f1dcd4", "#fbf3f0", "#e6c8bc", "#d4a894"],
  terracotta: ["#f3e3d7", "#ecd4c1", "#f9f0e8", "#ddb394", "#c98d63"],
  lavande: ["#ebe8f0", "#dfdae9", "#f4f2f7", "#c9c2dc", "#a99fc4"],
  ciel: ["#e5edf0", "#d5e3e8", "#f0f5f7", "#bcd2da", "#96b8c4"],
};

function grain(id) {
  return `<filter id="g${id}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.04 0"/><feComposite operator="over" in2="SourceGraphic"/></filter>`;
}

const shapes = {
  lune: (m, s, a) => `
    <circle cx="400" cy="380" r="170" fill="${m}"/>
    <circle cx="340" cy="330" r="28" fill="${s}" opacity="0.55"/>
    <circle cx="450" cy="420" r="40" fill="${s}" opacity="0.5"/>
    <circle cx="410" cy="300" r="18" fill="${s}" opacity="0.45"/>
    <circle cx="330" cy="430" r="22" fill="${s}" opacity="0.4"/>
    <rect x="330" y="545" width="140" height="18" rx="9" fill="${a}"/>
    <path d="M355 545 L370 505 h60 l15 40 Z" fill="${a}" opacity="0.85"/>`,
  nuage: (m, s, a) => `
    <ellipse cx="400" cy="420" rx="185" ry="95" fill="${m}"/>
    <circle cx="310" cy="380" r="75" fill="${m}"/>
    <circle cx="410" cy="345" r="90" fill="${m}"/>
    <circle cx="500" cy="390" r="65" fill="${m}"/>
    <ellipse cx="400" cy="440" rx="150" ry="55" fill="${s}" opacity="0.35"/>
    <rect x="350" y="530" width="100" height="14" rx="7" fill="${a}"/>`,
  vaseondule: (m, s, a) => `
    <path d="M320 220 q80 -30 160 0 q-25 60 -12 105 q30 90 12 175 q-8 55 -50 60 h-60 q-42 -5 -50 -60 q-18 -85 12 -175 q13 -45 -12 -105 Z" fill="${m}"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M315 ${290 + i * 45} q85 ${i % 2 ? 26 : -26} 170 0" stroke="${s}" stroke-width="7" fill="none" opacity="0.5"/>`).join("")}
    <path d="M355 250 q10 140 0 260" stroke="${a}" stroke-width="5" fill="none" opacity="0.25"/>`,
  vasetorsade: (m, s, a) => `
    <path d="M330 210 h140 q-15 70 0 140 q20 100 -10 180 q-10 40 -60 40 t-60 -40 q-30 -80 -10 -180 q15 -70 0 -140 Z" fill="${m}"/>
    ${[0, 1, 2, 3, 4].map(i => `<path d="M${338 + i * 30} 215 q30 180 ${-20 + i * 10} 350" stroke="${s}" stroke-width="9" fill="none" opacity="0.45"/>`).join("")}
    <ellipse cx="400" cy="210" rx="70" ry="12" fill="${a}" opacity="0.5"/>`,
  support: (m, s, a) => `
    <path d="M270 520 L430 250 q18 -25 40 -12 t8 40 L340 540 Z" fill="${m}"/>
    <path d="M270 520 h230 q20 0 20 20 t-20 20 H290 q-25 0 -20 -40 Z" fill="${s}"/>
    <rect x="376" y="300" width="120" height="200" rx="16" transform="rotate(28 436 400)" fill="${a}" opacity="0.85"/>
    <rect x="392" y="318" width="88" height="160" rx="10" transform="rotate(28 436 398)" fill="${m}" opacity="0.6"/>`,
  champignon: (m, s, a) => `
    <path d="M240 380 q0 -160 160 -160 t160 160 q0 20 -22 20 H262 q-22 0 -22 -20 Z" fill="${a}"/>
    <circle cx="330" cy="300" r="17" fill="${m}" opacity="0.8"/>
    <circle cx="430" cy="270" r="13" fill="${m}" opacity="0.8"/>
    <circle cx="470" cy="330" r="15" fill="${m}" opacity="0.8"/>
    <path d="M355 400 h90 q10 110 25 150 h-140 q15 -40 25 -150 Z" fill="${m}"/>
    <ellipse cx="400" cy="555" rx="95" ry="16" fill="${s}" opacity="0.6"/>`,
  coquillage: (m, s, a) => `
    <path d="M400 540 L250 350 q-15 -25 5 -45 q60 -60 145 -60 t145 60 q20 20 5 45 Z" fill="${m}"/>
    ${[-2, -1, 0, 1, 2].map(i => `<path d="M400 535 Q ${400 + i * 55} 400 ${400 + i * 68} 268" stroke="${s}" stroke-width="7" fill="none" opacity="0.55"/>`).join("")}
    <circle cx="400" cy="540" r="14" fill="${a}"/>`,
  galet: (m, s, a) => `
    <ellipse cx="400" cy="430" rx="200" ry="120" fill="${m}"/>
    <ellipse cx="400" cy="415" rx="170" ry="92" fill="${s}" opacity="0.45"/>
    <ellipse cx="360" cy="400" rx="55" ry="30" fill="${a}" opacity="0.5"/>
    <circle cx="470" cy="430" r="26" fill="${a}" opacity="0.4"/>
    <ellipse cx="400" cy="570" rx="185" ry="18" fill="${s}" opacity="0.4"/>`,
  ondes: (m, s, a) => `
    <circle cx="330" cy="350" r="120" fill="${m}"/>
    ${[35, 60, 85].map(r => `<circle cx="330" cy="350" r="${r}" stroke="${s}" stroke-width="7" fill="none" opacity="0.55"/>`).join("")}
    <circle cx="480" cy="470" r="120" fill="${a}" opacity="0.9"/>
    ${[35, 60, 85].map(r => `<circle cx="480" cy="470" r="${r}" stroke="${m}" stroke-width="7" fill="none" opacity="0.6"/>`).join("")}`,
  visage: (m, s, a) => `
    <path d="M300 250 h200 q14 0 13 15 l-15 240 q-12 75 -98 75 t-98 -75 l-15 -240 q-1 -15 13 -15 Z" fill="${m}"/>
    <path d="M340 390 q15 14 30 0 M430 390 q15 14 30 0" stroke="${a}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M385 455 q15 12 30 0" stroke="${a}" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.7"/>
    <circle cx="330" cy="430" r="12" fill="${s}" opacity="0.8"/>
    <circle cx="470" cy="430" r="12" fill="${s}" opacity="0.8"/>
    <path d="M330 250 q10 -60 45 -75 M400 245 q0 -55 25 -80 M465 252 q5 -50 -20 -78" stroke="${s}" stroke-width="10" fill="none" stroke-linecap="round"/>`,
  lampe: (m, s, a) => `
    <path d="M250 370 q0 -150 150 -150 t150 150 q0 25 -28 25 H278 q-28 0 -28 -25 Z" fill="${m}"/>
    <ellipse cx="400" cy="330" rx="90" ry="40" fill="${s}" opacity="0.35"/>
    <rect x="375" y="395" width="50" height="130" rx="12" fill="${a}"/>
    <path d="M310 545 h180 q16 0 16 16 t-16 16 H310 q-16 0 -16 -16 t16 -16 Z" fill="${a}" opacity="0.8"/>
    <circle cx="400" cy="300" r="26" fill="#fff" opacity="0.5"/>`,
  dune: (m, s, a) => `
    <path d="M240 540 V420 q0 -20 20 -20 h80 q20 0 20 20 v120 Z" fill="${m}"/>
    <path d="M380 540 V340 q0 -20 20 -20 h80 q20 0 20 20 v200 Z" fill="${s}"/>
    <path d="M520 540 V450 q0 -20 20 -20 h60 q20 0 20 20 v90 Z" fill="${a}"/>
    <rect x="230" y="540" width="400" height="16" rx="8" fill="${a}" opacity="0.6"/>
    <rect x="398" y="300" width="10" height="60" rx="5" fill="${m}"/>
    <rect x="420" y="285" width="10" height="75" rx="5" fill="${m}" opacity="0.8"/>`,
  bougie: (m, s, a) => `
    <path d="M320 320 h160 v200 q0 40 -80 40 t-80 -40 Z" fill="${m}"/>
    <path d="M320 330 q80 26 160 0" stroke="${s}" stroke-width="8" fill="none" opacity="0.5"/>
    <rect x="392" y="270" width="16" height="55" rx="8" fill="${a}"/>
    <path d="M400 230 q22 25 0 45 q-22 -20 0 -45 Z" fill="${a}" opacity="0.85"/>
    <ellipse cx="400" cy="580" rx="110" ry="15" fill="${s}" opacity="0.4"/>`,
};

function svg(paletteName, shapeName, variant = 0) {
  const [bg1, bg2, m, s, a] = palettes[paletteName];
  const id = `${shapeName}${variant}`;
  const rot = variant === 0 ? 0 : variant === 1 ? -4 : 5;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
<defs>
<radialGradient id="bg${id}" cx="42%" cy="32%" r="90%">
<stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/>
</radialGradient>
${grain(id)}
</defs>
<rect width="800" height="800" fill="url(#bg${id})" filter="url(#g${id})"/>
<ellipse cx="400" cy="600" rx="215" ry="34" fill="${s}" opacity="0.35"/>
<g transform="rotate(${rot} 400 400)">${shapes[shapeName](m, s, a)}</g>
</svg>`;
}

const products = [
  ["veilleuse-lune", "lune", "creme"],
  ["veilleuse-nuage", "nuage", "ciel"],
  ["lampe-champignon", "lampe", "blush"],
  ["bougie-cocon", "bougie", "creme"],
  ["vase-ondule", "vaseondule", "sauge"],
  ["vase-torsade", "vasetorsade", "terracotta"],
  ["cache-pot-visage", "visage", "blush"],
  ["support-telephone", "support", "sauge"],
  ["pot-champignon", "champignon", "terracotta"],
  ["organiseur-dune", "dune", "lavande"],
  ["boite-coquillage", "coquillage", "blush"],
  ["vide-poche-galet", "galet", "creme"],
  ["dessous-verre-ondes", "ondes", "sauge"],
];

for (const [slug, shape, palette] of products) {
  writeFileSync(join(outDir, `${slug}.svg`), svg(palette, shape, 0));
  writeFileSync(join(outDir, `${slug}-2.svg`), svg(palette, shape, 1));
}

// Visuel hero / atelier
writeFileSync(join(outDir, "hero.svg"), svg("creme", "lune", 2));
writeFileSync(join(outDir, "atelier.svg"), svg("terracotta", "dune", 2));
console.log(`✓ ${products.length * 2 + 2} images générées dans public/products/`);
