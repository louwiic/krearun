import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { PDFDocument, decodePDFRawStream } from "pdf-lib";
import sharp from "sharp";
import jsQR from "jsqr";

const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", outputText)(name => mocks[name] ?? require(name), compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const cards = load("../lib/thank-you-cards.ts");
const renderer = load("../lib/thank-you-cards-render.ts", { "./thank-you-cards": cards });
const request = (extra = {}) => ({ model: "merci", texts: cards.THANK_YOU_DEFAULTS.merci, perPage: 8, quantity: 8, cropMarks: true, ...extra });

test("both A4 layouts retain original card proportions, safe margins and cut marks", () => {
  for (const count of [4, 8]) {
    const l = cards.thankYouLayout(count);
    assert.equal(l.columns * l.rows, count);
    assert.ok(Math.abs(l.width / l.height - 1748 / 1240) < 1e-9);
    assert.ok(l.left >= 8 && l.top >= 8 - 1e-9);
    assert.ok(l.left + l.columns * l.width + (l.columns - 1) * l.gap + 1.8 < l.pageWidth);
    assert.ok(l.top + l.rows * l.height + (l.rows - 1) * l.gap + 1.8 < l.pageHeight);
    assert.ok(l.width * cards.THANK_YOU_QR_LAYOUT.size / 1748 >= 20, "QR codes must remain at least 20 mm wide, including their quiet zone");
  }
});

test("all three QR codes decode to the right destinations on both cards at the smallest print size", async () => {
  for (const model of ["merci", "essence"]) {
    const svg = await renderer.renderThankYouCardSvg(request({ model, texts: cards.THANK_YOU_DEFAULTS[model] }));
    const width = Math.round(cards.thankYouLayout(8).width / 25.4 * 300), scale = width / 1748;
    const png = await sharp(Buffer.from(svg)).resize({ width }).png().toBuffer();
    const layout = cards.THANK_YOU_QR_LAYOUT;
    for (const [index, link] of cards.THANK_YOU_LINKS.entries()) {
      const crop = { left: Math.round(layout.x[index] * scale), top: Math.round(layout.y * scale), width: Math.round(layout.size * scale), height: Math.round(layout.size * scale) };
      const { data, info } = await sharp(png).extract(crop).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height, { inversionAttempts: "dontInvert" });
      assert.equal(decoded?.data, link.url, `${model}: ${link.label}`);
    }
  }
});

test("invalid models, card counts, control characters and oversized text cannot be exported", () => {
  for (const patch of [{ model: "../secret" }, { perPage: 9 }, { quantity: 0 }, { quantity: 81 }, { quantity: 2.5 }, { cropMarks: "true" }, { texts: null }, { texts: { ...request().texts, message: "x".repeat(451) } }, { texts: { ...request().texts, heading: "Merci\u0000" } }]) {
    assert.throws(() => cards.parseThankYouRequest(request(patch)));
  }
  const parsed = cards.parseThankYouRequest(request({ texts: { ...request().texts, message: "  Élodie\r\nMerci !  " } }));
  assert.equal(parsed.texts.message, "Élodie\nMerci !");
});

test("each model exports the requested number of pages in the matching A4 orientation", async () => {
  for (const [model, perPage, quantity] of [["merci", 8, 9], ["essence", 4, 5]]) {
    const input = cards.parseThankYouRequest(request({ model, texts: cards.THANK_YOU_DEFAULTS[model], perPage, quantity }));
    const pdf = await PDFDocument.load(await renderer.generateThankYouCardsPdf(input));
    assert.equal(pdf.getPageCount(), 2);
    const page = pdf.getPage(0), layout = cards.thankYouLayout(perPage);
    assert.ok(Math.abs(page.getWidth() - layout.pageWidth * 72 / 25.4) < .01);
    assert.ok(Math.abs(page.getHeight() - layout.pageHeight * 72 / 25.4) < .01);
    const counts = pdf.getPages().map(p => (p.node.Contents()?.asArray() ?? []).reduce((count, ref) => {
      const stream = pdf.context.lookup(ref);
      const content = Buffer.from(decodePDFRawStream(stream).decode()).toString("latin1");
      return count + (content.match(/\/[^\s]+ Do\b/g) ?? []).length;
    }, 0));
    assert.deepEqual(counts, [perPage, 1]);
  }
});

test("edited and accented text affects the preview without injecting markup or dropping unsupported glyphs", async () => {
  const initial = await renderer.renderThankYouCardSvg(request());
  const edited = await renderer.renderThankYouCardSvg(request({ texts: { ...request().texts, heading: "ÉLODIE & <script>", message: "Merci beaucoup, Loïc !" } }));
  assert.notEqual(initial, edited);
  assert.ok(!edited.includes("<script>"));
  assert.ok(edited.includes("<path"));
  await assert.rejects(renderer.renderThankYouCardSvg(request({ texts: { ...request().texts, message: "\u{10ffff}" } })), /caractère/);
});

test("the export and preview endpoint requires an admin before reading or rendering documents", async () => {
  const route = load("../app/api/admin/doc/cartes-remerciement/route.ts", {
    "@/lib/auth": { isAdmin: async () => false }, "@/lib/thank-you-cards": cards,
    "@/lib/thank-you-cards-render": { generateThankYouCardsPdf() { assert.fail("Unauthorized PDF generation"); }, renderThankYouCardSvg() { assert.fail("Unauthorized preview"); } },
  });
  const response = await route.POST(new Request("http://localhost/api/admin/doc/cartes-remerciement", { method: "POST", body: JSON.stringify(request()) }));
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});
