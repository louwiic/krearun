"use client";

import { colorSwatchStyle } from "@/lib/color-swatches";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { InventoryColor } from "@/lib/types";
import { publicColorName } from "@/lib/colors";
import { formatPrice } from "@/lib/format";
import { CLICKER_PRICE_CENTS, CLICKER_PRODUCT_ID } from "@/lib/clicker";
import { useCart } from "@/components/cart/CartContext";

const OrbitPreview=dynamic(()=>import('./ClickerOrbitPreview'),{ssr:false,loading:()=> <div className="flex h-[280px] items-center justify-center text-xs">Chargement de l’aperçu 3D…</div>});

const CHARACTER_COUNTS = Array.from({ length: 14 }, (_, index) => index + 1);
const SYMBOLS = [
  { value: "★", label: "Étoile" },
  { value: "♥", label: "Cœur" },
  { value: "✦", label: "Éclat" },
  { value: "☀", label: "Soleil" },
  { value: "☁", label: "Nuage" },
  { value: "♣", label: "Trèfle" },
];
const FALLBACK_COLORS: InventoryColor[] = [
  { id: "blue", name: "Bleu", hex: "#2f62c9", stockGrams: 0, active: true, note: "", sortOrder: 1, createdAt: "", updatedAt: "" },
  { id: "pink", name: "Rose", hex: "#e86a91", stockGrams: 0, active: true, note: "", sortOrder: 2, createdAt: "", updatedAt: "" },
  { id: "purple", name: "Violet", hex: "#7967b5", stockGrams: 0, active: true, note: "", sortOrder: 3, createdAt: "", updatedAt: "" },
  { id: "mint", name: "Menthe", hex: "#8bd6b2", stockGrams: 0, active: true, note: "", sortOrder: 4, createdAt: "", updatedAt: "" },
  { id: "black", name: "Noir", hex: "#252525", stockGrams: 0, active: true, note: "", sortOrder: 5, createdAt: "", updatedAt: "" },
  { id: "yellow", name: "Jaune", hex: "#f3c83f", stockGrams: 0, active: true, note: "", sortOrder: 6, createdAt: "", updatedAt: "" },
  { id: "white", name: "Blanc", hex: "#f7f4ed", stockGrams: 0, active: true, note: "", sortOrder: 7, createdAt: "", updatedAt: "" },
  { id: "orange", name: "Orange", hex: "#ed7325", stockGrams: 0, active: true, note: "", sortOrder: 8, createdAt: "", updatedAt: "" },
];

function ColorPicker({ label, colors, value, onChange }: { label: string; colors: InventoryColor[]; value: InventoryColor; onChange: (color: InventoryColor) => void }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">{label}</legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {colors.map((color) => (
          <button key={color.id} type="button" title={publicColorName(color.name)} onClick={() => onChange(color)} aria-label={`${label} : ${publicColorName(color.name)}`} aria-pressed={value.id === color.id} style={colorSwatchStyle(color)} className={`group flex min-h-14 min-w-0 items-center justify-center overflow-hidden rounded-lg border p-2 text-center transition ${value.id === color.id ? "border-ink shadow-hard" : "border-black/10 hover:-translate-y-0.5 hover:border-ink"}`}>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ClickerPreview({ text, symbol, baseColor, capColor, letterColor }: { text: string; symbol: string; baseColor: string; capColor: string; letterColor: string }) {
  const tiles = symbol ? [...text.split(""), symbol] : text.split("");
  const perRow = tiles.length > 8 ? 6 : tiles.length;
  const rows = Array.from({ length: Math.ceil(tiles.length / perRow) }, (_, index) => tiles.slice(index * perRow, (index + 1) * perRow));
  const tileSize = 62;
  const gap = 7;
  const width = Math.max(190, perRow * tileSize + (perRow - 1) * gap + 34);
  const height = rows.length * (tileSize + gap) + 34;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label={`Aperçu du clicker ${text} ${symbol}`}>
      <defs>
        <filter id="clicker-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="2.5" floodOpacity="0.2" /></filter>
        <linearGradient id="clicker-gold" x1="0" x2="1"><stop stopColor="#9a4b12" /><stop offset="0.45" stopColor="#ffd66b" /><stop offset="1" stopColor="#bd6414" /></linearGradient>
      </defs>
      <rect width={width} height={height} rx="24" fill="#fff3f5" />
      {rows.map((row, rowIndex) => {
        const y = 17 + rowIndex * (tileSize + gap);
        return (
          <g key={`row-${rowIndex}`} filter="url(#clicker-shadow)">
            <path d={`M 7 ${y + tileSize / 2} C -8 ${y - 5}, -8 ${y + tileSize + 5}, 7 ${y + tileSize / 2}`} fill="none" stroke="url(#clicker-gold)" strokeWidth="4" strokeLinecap="round" />
            {row.map((tile, index) => {
              const x = 17 + index * (tileSize + gap);
              const isSymbol = Boolean(symbol) && rowIndex === rows.length - 1 && index === row.length - 1;
              return (
                <g key={`${tile}-${index}`} transform={`translate(${x} ${y})`}>
                  <rect width={tileSize} height={tileSize} rx="16" fill={baseColor} stroke="#fff" strokeWidth="4" />
                  <rect x="5" y="5" width={tileSize - 10} height={tileSize - 10} rx="12" fill={capColor} stroke="#17120f" strokeOpacity=".18" strokeWidth="2" />
                  <text x={tileSize / 2} y={isSymbol ? 42 : 43} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={isSymbol ? 31 : 34} fontWeight="800" fill={letterColor}>{tile}</text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function ClickerSteps({ colors }: { colors: InventoryColor[] }) {
  const palette = colors.slice(0, 12);
  return (
    <div className="border-2 border-ink bg-white p-4 shadow-soft sm:p-5">
      <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-ink-soft">Compose ton clicker</p>
      <div className="space-y-3">
        <div className="rounded-xl border border-sand bg-[#fff8e8] p-3">
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3c83f] font-display text-xl">1</span><div><p className="text-xs font-bold uppercase">Choix des lettres</p><p className="text-[11px] text-ink-soft">Compose ton prénom ou ton mot</p></div></div>
          <div className="mt-3 flex gap-1.5"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e86a91] font-display text-lg text-white">A</span><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7967b5] font-display text-lg text-white">B</span><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2f62c9] font-display text-lg text-white">★</span></div>
        </div>
        <div className="rounded-xl border border-sand bg-[#fff3f7] p-3">
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush font-display text-xl text-white">2</span><div><p className="text-xs font-bold uppercase">Couleur des caps</p><p className="text-[11px] text-ink-soft">Les touches colorées du dessus</p></div></div>
          <div className="mt-3 flex flex-wrap gap-2">{palette.map((color) => <span key={`cap-${color.id}`} title={publicColorName(color.name)} className="h-7 w-7 rounded-lg border border-black/10" style={colorSwatchStyle(color)} />)}</div>
        </div>
        <div className="rounded-xl border border-sand bg-[#f2f7ff] p-3">
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#55a84f] font-display text-xl text-white">3</span><div><p className="text-xs font-bold uppercase">Couleur de la base</p><p className="text-[11px] text-ink-soft">Le corps inférieur du clicker</p></div></div>
          <div className="mt-3 flex flex-wrap gap-2">{palette.map((color) => <span key={`base-${color.id}`} title={publicColorName(color.name)} className="h-7 w-7 rounded-lg border border-black/10" style={colorSwatchStyle(color)} />)}</div>
        </div>
      </div>
    </div>
  );
}

export default function ClickerConfigurator({ colors: inventoryColors }: { colors: InventoryColor[] }) {
  const { addItem } = useCart();
  const colors = inventoryColors.length > 0 ? inventoryColors : FALLBACK_COLORS;
  const [characterCount, setCharacterCount] = useState(1);
  const [text, setText] = useState("");
  const [symbol, setSymbol] = useState("");
  const [symbolNote, setSymbolNote] = useState("");
  const [baseColor, setBaseColor] = useState(colors[0]);
  const [capColor, setCapColor] = useState(colors[1] ?? colors[0]);
  const [letterColor, setLetterColor] = useState(colors[2] ?? colors[0]);

  const price = CLICKER_PRICE_CENTS;
  const displayedText = (text || "KREA").slice(0, characterCount).toUpperCase();
  const clickerConfiguration = {
    text: displayedText,
    characterCount,
    symbol: symbol || undefined,
    symbolNote: symbolNote.trim() || undefined,
    baseColor: publicColorName(baseColor.name),
    capColor: publicColorName(capColor.name),
    letterColor: publicColorName(letterColor.name),
  };
  const configurationKey = `${characterCount}-${displayedText}-${symbol}-${symbolNote}-${baseColor.id}-${capColor.id}-${letterColor.id}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="overflow-hidden border-2 border-ink bg-[#fff8e8] shadow-hard-terra">
        <div className="grid items-center gap-8 px-6 py-10 sm:px-12 lg:grid-cols-[minmax(0,1fr)_330px] lg:py-14">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-terra">KreaRun Studio · sur mesure</p>
            <h1 className="font-display text-5xl uppercase leading-[0.9] sm:text-7xl">Clicker<br /><span className="text-terra">Studio</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink-soft sm:text-lg">Compose ton clicker personnalisé : choisis le nombre de caractères, les couleurs disponibles à l’atelier et ton symbole préféré.</p>
          </div>
          <div className="mx-auto aspect-square w-full max-w-[330px] overflow-hidden border-2 border-ink bg-white shadow-hard">
            <img src="/images/clicker-studio-product.png" alt="Clickers personnalisés KreaRun" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.7fr)]" aria-label="Exemples et étapes de personnalisation">
        <div className="relative flex h-[300px] items-center justify-center overflow-hidden border-2 border-ink bg-black shadow-soft sm:h-[440px]">
          <video className="h-full w-full object-cover" src="/videos/demo_clicker.mp4" poster="/images/clicker-studio-product.png" autoPlay muted loop playsInline controls />
          <div className="pointer-events-none absolute left-4 top-4 flex -rotate-2 items-center gap-3 rounded-2xl border-2 border-cream bg-terra px-4 py-3 text-cream shadow-[4px_4px_0_rgba(22,19,15,.8)] sm:left-6 sm:top-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-xl text-ink">🔊</span>
            <span className="leading-none"><strong className="block font-display text-xl uppercase tracking-wide sm:text-2xl">Click · Click</strong><small className="mt-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-cream/90 sm:text-xs">Monte le son !</small></span>
            <span className="relative ml-1 flex h-5 w-5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cream opacity-60" /><span className="relative inline-flex h-5 w-5 rounded-full bg-cream" /></span>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center rounded-full bg-ink/80 px-5 py-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-cream shadow-lg">
            <span>Descends pour personnaliser le tien</span>
            <span className="mt-1 animate-bounce text-2xl leading-5 text-terra">↓</span>
          </div>
        </div>
        <ClickerSteps colors={colors} />
      </section>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="border-2 border-ink bg-white p-5 shadow-soft sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8" aria-label="Configuration du clicker">
          <div className="space-y-8">
            <div>
            <label htmlFor="clicker-text" className="mb-2 block text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">Ton texte</label>
            <input id="clicker-text" value={text} onChange={(event) => setText(event.target.value.replace(/[^a-zA-ZÀ-ÿ0-9 ]/g, "").slice(0, characterCount))} placeholder="Ex. KREA" className="w-full rounded-lg border-2 border-sand bg-white px-4 py-3 text-lg uppercase outline-none focus:border-terra" />
            <p className="mt-2 text-xs text-ink-faint">{text.length}/{characterCount} caractère{characterCount > 1 ? "s" : ""}</p>
            </div>

            <div>
            <label htmlFor="clicker-count" className="mb-2 block text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">Nombre de caractères (lettres + symboles)</label>
            <select id="clicker-count" value={characterCount} onChange={(event) => { const count = Number(event.target.value); setCharacterCount(count); setText((current) => current.slice(0, count)); }} className="w-full rounded-lg border-2 border-sand bg-white px-4 py-3 text-lg outline-none focus:border-terra">
              {CHARACTER_COUNTS.map((count) => <option key={count} value={count}>{count}</option>)}
            </select>
            </div>

            <div>
            <label htmlFor="clicker-symbol" className="mb-2 block text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">Symbole</label>
            <select id="clicker-symbol" value={symbol} onChange={(event) => setSymbol(event.target.value)} className="w-full rounded-lg border-2 border-sand bg-white px-4 py-3 text-lg outline-none focus:border-terra">
              <option value="">Aucun symbole</option>
              {SYMBOLS.map((item) => <option key={item.value} value={item.value}>{item.value} · {item.label}</option>)}
            </select>
            <label htmlFor="clicker-symbol-note" className="mt-4 block text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">Note sur le placement du symbole <span className="font-normal normal-case text-ink-faint">(facultatif)</span></label>
            <textarea id="clicker-symbol-note" value={symbolNote} onChange={(event) => setSymbolNote(event.target.value.slice(0, 240))} placeholder="Ex. symbole à la fin, après les lettres" rows={2} className="mt-2 w-full resize-none rounded-lg border-2 border-sand bg-white px-3 py-2.5 text-sm outline-none focus:border-terra" />
            </div>

            <div className="grid gap-8 border-t border-sand pt-8 md:grid-cols-2">
              <ColorPicker label="Base · corps inférieur" colors={colors} value={baseColor} onChange={setBaseColor} />
              <ColorPicker label="Caps · touches du dessus" colors={colors} value={capColor} onChange={setCapColor} />
            </div>
            <ColorPicker label="Lettres + symbole · dessus des caps" colors={colors} value={letterColor} onChange={setLetterColor} />
          </div>
          <div className="mt-8 self-start border-2 border-ink bg-[#fff3f5] p-3 lg:sticky lg:top-24 lg:mt-0">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">Aperçu en direct</p>
            <ClickerPreview text={displayedText} symbol={symbol} baseColor={baseColor.hex} capColor={capColor.hex} letterColor={letterColor.hex} />
            <div className="mt-6 border-t-2 border-ink/15 pt-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">Aperçu 3D · tourne ton clicker</p>
              <OrbitPreview text={displayedText} symbol={symbol} baseColor={baseColor.hex} capColor={capColor.hex} letterColor={letterColor.hex} />
            </div>
          </div>
        </section>

        <aside className="sticky top-24 border-2 border-ink bg-ink p-6 text-cream shadow-hard-terra">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage">Ta configuration</p>
          <h2 className="mt-3 font-display text-3xl uppercase">Prêt à cliquer ?</h2>
          <dl className="mt-6 space-y-3 border-t border-cream/20 pt-5 text-sm text-cream/75">
            <div className="flex justify-between gap-4"><dt>Texte</dt><dd className="font-bold text-cream">{displayedText}</dd></div>
            <div className="flex justify-between gap-4"><dt>Symbole</dt><dd className="text-2xl leading-none text-cream">{symbol || "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt>Caractères</dt><dd className="font-bold text-cream">{characterCount}</dd></div>
          </dl>
          <div className="mt-7 flex items-end justify-between border-t border-cream/20 pt-5"><span className="text-sm text-cream/70">À partir de</span><strong className="font-display text-4xl text-cream">{formatPrice(price)}</strong></div>
          <button type="button" onClick={() => addItem({ productId: CLICKER_PRODUCT_ID, slug: "clicker-studio", name: "Clicker Studio personnalisé", priceCents: price, color: clickerConfiguration.baseColor, customName: displayedText, variantId: `clicker-${configurationKey}`, variantName: `${characterCount} caractère(s) · Caps ${clickerConfiguration.capColor} · Lettres ${clickerConfiguration.letterColor}`, image: "/images/clicker-studio-product.png", stock: 999, weightGrams: 30, preorder: true, clickerConfiguration })} className="mt-6 block w-full bg-terra px-5 py-4 text-center text-sm font-bold uppercase tracking-[0.08em] text-cream transition hover:bg-terra-deep">Ajouter cette configuration — {formatPrice(price)}</button>
          <p className="mt-4 text-center text-xs leading-5 text-cream/55">Même configuration : quantité regroupée. Configuration différente : ajoute-la séparément, elle restera sur sa propre ligne.</p>
        </aside>
      </div>
    </div>
  );
}
