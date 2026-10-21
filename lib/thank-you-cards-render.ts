import { readFile } from "node:fs/promises";
import { join } from "node:path";
import opentype, { type Font } from "opentype.js";
import sharp from "sharp";
import { PDFDocument, PrintScaling, rgb } from "pdf-lib";
import { thankYouLayout, type ThankYouRequest } from "./thank-you-cards";

const W = 1748, H = 1240;
let assets: Promise<{ font: Font; wordmark: string; nozzle: string }> | undefined;
function loadAssets() {
  if (!assets) assets = Promise.all([
    readFile(join(process.cwd(), "public/fonts/DejaVuSansCondensed-Bold.ttf")),
    sharp(join(process.cwd(), "public/brand/krearun-wordmark.webp")).png().toBuffer(),
    sharp(join(process.cwd(), "public/brand/krearun-nozzle.webp")).png().toBuffer(),
  ]).then(([font, wordmark, nozzle]) => ({
    font: opentype.parse(font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength) as ArrayBuffer),
    wordmark: `data:image/png;base64,${wordmark.toString("base64")}`,
    nozzle: `data:image/png;base64,${nozzle.toString("base64")}`,
  })).catch(error => { assets = undefined; throw error; });
  return assets;
}

function wrap(text: string, font: Font, size: number, width: number) {
  return text.split("\n").flatMap(paragraph => {
    if (!paragraph.trim()) return [""];
    const lines: string[] = [];
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.getAdvanceWidth(next, size) <= width) { line = next; continue; }
      if (line) lines.push(line);
      line = "";
      for (const character of word) {
        if (font.getAdvanceWidth(line + character, size) > width && line) { lines.push(line); line = ""; }
        line += character;
      }
    }
    if (line) lines.push(line);
    return lines;
  });
}

function textBlock(font: Font, text: string, x: number, y: number, width: number, height: number, maxSize: number, options: { fill?: string; shadow?: boolean; align?: "left" | "center" } = {}) {
  if (!text) return "";
  for (const character of text.replace(/\s/g, "")) {
    if (!font.charToGlyphIndex(character)) throw new Error(`Le caractère « ${character} » n’est pas disponible pour l’impression. Remplacez-le dans le texte.`);
  }
  let size = maxSize, lines = wrap(text, font, size, width);
  const ascender = font.ascender / font.unitsPerEm, descender = -font.descender / font.unitsPerEm;
  while (((lines.length - 1) * size * 1.2 + (ascender + descender) * size > height || lines.some(line => font.getAdvanceWidth(line, size) > width)) && size > 20) {
    size -= 1; lines = wrap(text, font, size, width);
  }
  if ((lines.length - 1) * size * 1.2 + (ascender + descender) * size > height) throw new Error("Ce texte est trop long pour la carte. Raccourcissez-le avant l’export.");
  const blockHeight = (lines.length - 1) * size * 1.2 + (ascender + descender) * size;
  return lines.map((line, index) => {
    const tx = options.align === "left" ? x : x + (width - font.getAdvanceWidth(line, size)) / 2;
    const ty = y + (height - blockHeight) / 2 + ascender * size + index * size * 1.2;
    const path = font.getPath(line, tx, ty, size).toPathData(2);
    return `${options.shadow ? `<path d="${path}" fill="#984115" transform="translate(7 8)"/>` : ""}<path d="${path}" fill="${options.fill ?? "#171717"}"/>`;
  }).join("");
}

function stars() {
  return `<g fill="#ffc600"><path d="M158 89Q164 131 174 132L194 137Q173 145 168 153L158 184Q152 145 141 144L121 137Q147 131 150 121Z"/><path d="M102 151Q107 177 116 181L133 189Q109 193 108 203L102 230Q97 202 89 198L73 189Q97 185 97 176Z"/><path d="M170 206Q174 224 181 226L190 232Q177 236 175 243L170 257Q166 238 159 237L150 232Q165 227 166 222Z"/></g>`;
}
function gift() {
  return `<g transform="translate(1310 881)" fill="none" stroke="#171717" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 82 143 45 266 85 148 133Z M20 82l4 167 126 24 116-42V85 M148 133l2 140 M79 105l1 154 M205 112v139 M22 103l126 24 118-22"/><path fill="#ece9e4" d="M137 55C44-37 11 17 69 52L137 67C223-30 281-3 227 48L154 68Z M140 64 40 124 79 126 57 148 154 81 250 132 230 102 258 109 164 61Z"/><ellipse cx="145" cy="65" rx="20" ry="14" fill="#ece9e4"/></g>`;
}

export async function renderThankYouCardSvg(input: ThankYouRequest) {
  const { font, wordmark, nozzle } = await loadAssets();
  const { texts, model } = input;
  const logo = (cx: number, cy: number, radius: number) => `<g><circle cx="${cx}" cy="${cy}" r="${radius}" fill="#f6f3ee" stroke="#171717" stroke-width="9"/><image href="${nozzle}" x="${cx - radius * .27}" y="${cy - radius * .65}" width="${radius * .54}" height="${radius * .72}"/><image href="${wordmark}" x="${cx - radius * .81}" y="${cy + radius * .19}" width="${radius * 1.62}" height="${radius * .35}"/></g>`;
  let art = `<rect width="${W}" height="${H}" fill="#fff9e2"/><path fill="#ece9e4" d="M0 491Q100 395 183 469T350 473T516 473T682 473T848 473T1014 473T1180 473T1346 473T1512 473T1678 473T1844 473V1240H0Z"/>${stars()}`;
  if (model === "merci") {
    // Editable vector recreation of the supplied card; originals are archived separately.
    const petals = Array.from({ length: 10 }, (_, i) => `<ellipse cx="632" cy="724" rx="98" ry="178" transform="rotate(${i * 36} 632 850)"/>`).join("");
    art += `<g fill="#b9dff2">${petals}<ellipse cx="632" cy="850" rx="310" ry="174"/></g>`;
    art += textBlock(font, texts.heading, 215, 100, 1320, 440, 480, { fill: "#ff6b35", shadow: true });
    art += textBlock(font, texts.message, 318, 668, 635, 365, 52);
    art += logo(1420, 938, 163);
    art += textBlock(font, texts.signature, 1150, 1144, 550, 64, 48);
  } else {
    art += textBlock(font, texts.heading, 150, 290, 1515, texts.message ? 445 : 570, 170, { fill: "#ff6b35", shadow: true });
    art += textBlock(font, texts.message, 440, 751, 810, 237, 48);
    art += logo(188, 961, 106) + gift();
    art += textBlock(font, texts.signature, 920, 1160, 760, 52, 40);
  }
  const footerWidth = model === "merci" ? 1000 : texts.signature ? 820 : 1100;
  art += textBlock(font, texts.code, 48, 1108, footerWidth, 53, 44, { align: "left" });
  art += textBlock(font, texts.offer, 48, 1163, footerWidth, 55, 42, { align: "left" });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${art}</svg>`;
}

export async function generateThankYouCardsPdf(input: ThankYouRequest) {
  const svg = await renderThankYouCardSvg(input);
  const png = await sharp(Buffer.from(svg)).resize({ width: 1748 }).png().toBuffer();
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Kréarun - Cartes ${input.model === "merci" ? "Merci" : "Essence"} - Planche A4`);
  pdf.setAuthor("Kréarun"); pdf.setLanguage("fr-FR");
  pdf.catalog.getOrCreateViewerPreferences().setPrintScaling(PrintScaling.None);
  const image = await pdf.embedPng(png), layout = thankYouLayout(input.perPage);
  const mm = (value: number) => value * 72 / 25.4;
  for (let offset = 0; offset < input.quantity; offset += input.perPage) {
    const page = pdf.addPage([mm(layout.pageWidth), mm(layout.pageHeight)]);
    for (let index = 0; index < Math.min(input.perPage, input.quantity - offset); index++) {
      const x = layout.left + index % layout.columns * (layout.width + layout.gap);
      const y = layout.pageHeight - layout.top - Math.floor(index / layout.columns) * (layout.height + layout.gap) - layout.height;
      page.drawImage(image, { x: mm(x), y: mm(y), width: mm(layout.width), height: mm(layout.height) });
      if (input.cropMarks) for (const [cx, cy, dx, dy] of [[x, y, -1, -1], [x + layout.width, y, 1, -1], [x, y + layout.height, -1, 1], [x + layout.width, y + layout.height, 1, 1]]) {
        page.drawLine({ start: { x: mm(cx + dx * .5), y: mm(cy) }, end: { x: mm(cx + dx * 1.8), y: mm(cy) }, thickness: .3, color: rgb(.55, .55, .55) });
        page.drawLine({ start: { x: mm(cx), y: mm(cy + dy * .5) }, end: { x: mm(cx), y: mm(cy + dy * 1.8) }, thickness: .3, color: rgb(.55, .55, .55) });
      }
    }
  }
  return pdf.save();
}
