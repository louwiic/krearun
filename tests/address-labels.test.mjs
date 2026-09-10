import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import ts from "typescript";
import { PDFDocument, PDFArray, PDFRawStream, decodePDFRawStream, PrintScaling } from "pdf-lib";
import { Encodings } from "@pdf-lib/standard-fonts";
import * as selection from "../lib/address-labels.ts";
import * as generator from "../lib/address-labels-pdf.ts";

const { selectReadyAddressLabels } = selection;
const { generateAddressLabelsPdf, ADDRESS_LABEL_LAYOUT } = generator;
const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../components/admin/AddressLabelsButton.tsx", import.meta.url), "utf8");
const winAnsiCharacters = new Map(Encodings.WinAnsi.supportedCodePoints.map((point) => [
  Encodings.WinAnsi.encodeUnicodeCodePoint(point).code, String.fromCodePoint(point),
]));

function order(id, extra = {}) {
  return {
    id: `order-${id}`, number: 1000 + id, status: "ready", name: "Élodie Dupré",
    addressLine1: "12 rue des Fleurs", addressLine2: "Bâtiment B - Appartement 4",
    postalCode: "97400", city: "Saint-Denis", country: "FR",
    note: "PRIVATE-NOTE", email: "private@example.invalid", phone: "PRIVATE-PHONE",
    items: [{ name: "PRIVATE-PRODUCT", quantity: 1 }], totalCents: 999,
    paymentStatus: "unpaid", ...extra,
  };
}

async function pdfText(bytes) {
  const pdf = await PDFDocument.load(bytes);
  const pages = pdf.getPages().map((page) => {
    const contents = page.node.Contents();
    const refs = contents instanceof PDFArray ? contents.asArray() : [contents];
    return refs.flatMap((ref) => {
      const stream = pdf.context.lookup(ref, PDFRawStream);
      const operators = new TextDecoder().decode(decodePDFRawStream(stream).decode());
      return [...operators.matchAll(/<([0-9a-f]+)> Tj/gi)]
        .map((match) => [...Buffer.from(match[1], "hex")].map((code) => winAnsiCharacters.get(code)).join(""));
    }).join("\n");
  });
  return { pdf, pages, text: pages.join("\n") };
}

test("labels include every ready order, once per order, regardless of payment or current page", () => {
  const orders = Array.from({ length: 37 }, (_, i) => order(i));
  orders.push(order(0), order(80, { status: "shipped" }), order(81, { status: "pending" }));
  const copy = structuredClone(orders);
  const result = selectReadyAddressLabels(orders);
  assert.equal(result.readyCount, 37);
  assert.equal(result.labels.length, 37);
  assert.equal(result.issues.length, 0);
  assert.deepEqual(result.labels[0], {
    id: "order-0", number: 1000, name: "Élodie Dupré",
    lines: ["12 rue des Fleurs", "Bâtiment B - Appartement 4", "97400 Saint-Denis", "France"],
  });
  assert.deepEqual(orders, copy);
  const manager = readFileSync(new URL("../components/admin/OrdersManager.tsx", import.meta.url), "utf8");
  assert.match(manager, /<AddressLabelsButton orders=\{orders\} disabled=\{pending\}/);
});

test("incomplete addresses are excluded with correction reasons, never guessed from private notes", () => {
  const result = selectReadyAddressLabels([
    order(1, { name: "  ", addressLine1: "", postalCode: "", city: "" }),
    order(2, { addressLine1: undefined, note: "12 rue des Fleurs 97400 Saint-Denis" }),
    order(3, { addressLine2: "", country: "" }),
    order(4, { country: "RE" }),
    order(5, { name: "Client à renseigner" }),
  ]);
  assert.equal(result.readyCount, 5);
  assert.equal(result.issues.length, 3);
  assert.match(result.issues[0].reason, /nom \/ prénom, numéro et voie, code postal, ville/);
  assert.match(result.issues[1].reason, /numéro et voie/);
  assert.match(result.issues[2].reason, /nom \/ prénom/);
  assert.equal(result.labels.length, 2);
  assert.deepEqual(result.labels[0].lines, ["12 rue des Fleurs", "97400 Saint-Denis"]);
  assert.equal(result.labels[1].lines.at(-1), "La Réunion");
});

test("real PDFs have eight labels per A4 page, intact accents, no duplicates, no order numbers or private data", async () => {
  for (const count of [1, 8, 9, 17, 37]) {
    const labels = selectReadyAddressLabels(Array.from({ length: count }, (_, i) =>
      order(i, { name: `Élodie Dupré ${i}` }),
    )).labels;
    const result = await generateAddressLabelsPdf(labels);
    assert.equal(result.count, count);
    assert.equal(result.pages, Math.ceil(count / 8));
    assert.equal(result.issues.length, 0);
    const { pdf, text, pages } = await pdfText(result.bytes);
    assert.equal(pdf.getPageCount(), result.pages);
    for (const page of pdf.getPages()) {
      assert.ok(Math.abs(page.getWidth() - 595.28) < 0.01);
      assert.ok(Math.abs(page.getHeight() - 841.89) < 0.01);
    }
    assert.equal(pdf.catalog.getOrCreateViewerPreferences().getPrintScaling(), PrintScaling.None);
    assert.equal(text.match(/Élodie Dupré/g).length, count);
    assert.equal(text.match(/Bâtiment B - Appartement 4/g).length, count);
    assert.equal(text.includes("PRIVATE-"), false);
    assert.equal(text.includes("private@example.invalid"), false);
    assert.equal(text.includes("Commande #"), false);
    for (let i = 0; i < count; i += 1) {
      const recipient = new RegExp(`Élodie Dupré ${i}(?:\\n|$)`, "g");
      assert.equal(text.match(recipient).length, 1);
      assert.ok(pages[Math.floor(i / 8)].match(recipient));
      assert.equal(text.includes(String(1000 + i)), false);
    }
  }
});

test("empty selections produce no blank PDF; overlong or unsupported addresses are reported without truncation", async () => {
  const empty = await generateAddressLabelsPdf([]);
  assert.equal(empty.bytes, null);
  assert.equal(empty.pages, 0);
  const labels = selectReadyAddressLabels([
    order(1, { addressLine2: "Très long complément ".repeat(100) }),
    order(2, { name: "Client 🦄" }),
    order(3, { name: "E\u0301lodie Dœuf", addressLine1: "12–14 rue d’Été" }),
  ]).labels;
  const result = await generateAddressLabelsPdf(labels);
  assert.equal(result.count, 1);
  assert.equal(result.issues.length, 2);
  assert.match(result.issues[0].reason, /trop longue/);
  assert.match(result.issues[1].reason, /Caractère/);
  const { text } = await pdfText(result.bytes);
  assert.ok(text.includes("Élodie Dœuf"));
  assert.ok(text.includes("12-14 rue d’Été"));
  assert.equal(text.includes("Très long complément"), false);
  assert.equal(text.includes("Commande #"), false);
});

test("long names and addresses wrap intact, and label rectangles fit inside A4 printer margins", async () => {
  const result = await generateAddressLabelsPdf(selectReadyAddressLabels([
    order(1, { name: "Jean-Christophe Marie Alexandre de La Rivière", addressLine1: "150 avenue Pierre Mendès France", addressLine2: "Résidence des Bougainvilliers - Bâtiment C - Appartement 204", city: "Sainte-Suzanne", postalCode: "97441" }),
  ]).labels);
  assert.equal(result.count, 1);
  const { text } = await pdfText(result.bytes);
  assert.match(text.replace(/\s+/g, " "), /Jean-Christophe Marie Alexandre de La Rivière/);
  assert.match(text.replace(/\s+/g, " "), /Résidence des Bougainvilliers - Bâtiment C - Appartement 204/);
  const l = ADDRESS_LABEL_LAYOUT;
  assert.ok(l.margin + l.columns * l.width + (l.columns - 1) * l.gap <= 595.28 - l.margin);
  assert.ok(l.top + l.rows * l.height + (l.rows - 1) * l.gap < 841.89 - l.margin);
});

function harness(records, generatePdf = generator.generateAddressLabelsPdf) {
  let index = 0;
  const hooks = [];
  const cleanups = [];
  const dialog = { open: false, showModal() { this.open = true; }, close() { this.open = false; } };
  const mocks = {
    "@/lib/address-labels": selection,
    "@/lib/address-labels-pdf": { generateAddressLabelsPdf: generatePdf },
    "next/link": ({ children, ...props }) => createElement("a", props, children),
    react: {
      useRef(initial) { const slot = index++; return hooks[slot] ??= { current: initial === null ? dialog : initial }; },
      useState(initial) { const slot = index++; if (!(slot in hooks)) hooks[slot] = initial; return [hooks[slot], (value) => { hooks[slot] = value; }]; },
      useEffect(effect) { const slot = index++; if (!(slot in hooks)) { hooks[slot] = true; cleanups.push(effect()); } },
    },
  };
  const compiled = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } });
  const loaded = { exports: {} };
  new Function("require", "module", "exports", compiled.outputText)(
    (name) => mocks[name] ?? require(name), loaded, loaded.exports,
  );
  return {
    dialog,
    render() { index = 0; return loaded.exports.default({ orders: records }); },
    cleanup() { for (const cleanup of cleanups) cleanup?.(); },
  };
}
function find(element, predicate) {
  if (!element || typeof element !== "object") return null;
  if (predicate(element)) return element;
  for (const child of [element.props?.children].flat(Infinity)) {
    const found = find(child, predicate);
    if (found) return found;
  }
  return null;
}

test("button opens a real PDF preview with missing-address warnings and releases its private blob on close", async (t) => {
  const urls = t.mock.method(URL, "createObjectURL", () => "blob:private-labels");
  const revoke = t.mock.method(URL, "revokeObjectURL", () => {});
  const ui = harness([order(1), order(2, { postalCode: "" })]);
  await find(ui.render(), (e) => e.type === "button").props.onClick();
  assert.equal(ui.dialog.open, true);
  assert.equal(urls.mock.calls[0].arguments[0].type, "application/pdf");
  const markup = renderToStaticMarkup(ui.render());
  assert.ok(markup.includes("1 adresse(s) imprimable(s)"));
  assert.ok(markup.includes("1 commande(s) exclue(s)"));
  assert.ok(markup.includes("/admin/commandes/order-2/modifier"));
  assert.ok(markup.includes('src="blob:private-labels"'));
  assert.ok(markup.includes('download="krearun-planche-adresses-pret.pdf"'));
  find(ui.render(), (e) => e.type === "dialog").props.onClose();
  assert.equal(revoke.mock.calls[0].arguments[0], "blob:private-labels");
  assert.equal(renderToStaticMarkup(ui.render()).includes("blob:private-labels"), false);
  ui.cleanup();
});

test("zero ready orders disables generation; closing during generation discards the late result", async (t) => {
  const empty = harness([order(1, { status: "shipped" })]);
  assert.equal(find(empty.render(), (e) => e.type === "button").props.disabled, true);
  empty.cleanup();
  const urls = t.mock.method(URL, "createObjectURL", () => "blob:should-not-exist");
  let release;
  let started;
  const running = new Promise((resolve) => { started = resolve; });
  const ui = harness([order(1)], () => new Promise((resolve) => { release = resolve; started(); }));
  const pending = find(ui.render(), (e) => e.type === "button").props.onClick();
  await running;
  find(ui.render(), (e) => e.type === "dialog").props.onClose();
  release({ bytes: new Uint8Array([1]), count: 1, pages: 1, issues: [] });
  await pending;
  assert.equal(urls.mock.calls.length, 0);
  ui.cleanup();
});

test("generation failures are shown without creating a file or exposing technical/private errors", async () => {
  const ui = harness([order(1)], async () => { throw new Error("PRIVATE-DATA"); });
  await find(ui.render(), (e) => e.type === "button").props.onClick();
  const markup = renderToStaticMarkup(ui.render());
  assert.ok(markup.includes("Impossible de générer la planche"));
  assert.equal(markup.includes("PRIVATE-DATA"), false);
  assert.equal(markup.includes("<iframe"), false);
  ui.cleanup();
});

if (process.env.ADDRESS_LABELS_QA_DIR) {
  test("write a synthetic multi-page fixture for PDF render inspection", async () => {
    const records = Array.from({ length: 9 }, (_, i) => order(i, {
      name: ["Élodie Dupré", "Jean-Christophe Marie Alexandre de La Rivière", "Anaïs Dœuf", "François L’Étang"][i % 4],
      addressLine1: i === 1 ? "150 avenue Pierre Mendès France" : "12 rue des Fleurs",
      addressLine2: i === 1 ? "Résidence des Bougainvilliers - Bâtiment C - Appartement 204" : "Bâtiment B - Appartement 4",
      country: i % 2 ? "RE" : "FR",
    }));
    const result = await generateAddressLabelsPdf(selectReadyAddressLabels(records).labels);
    assert.equal(result.count, 9);
    writeFileSync(`${process.env.ADDRESS_LABELS_QA_DIR}/planche-adresses-test.pdf`, result.bytes, { mode: 0o600 });
  });
}
