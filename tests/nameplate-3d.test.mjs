import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import jscad from "@jscad/modeling";
import { strFromU8, unzipSync } from "fflate";
import opentype from "opentype.js";
import {
  buildNameplateModel,
  calculateNameplateLayout,
  DEFAULT_NAMEPLATE_OPTIONS,
  printableFirstName,
  serializeNameplate,
  serializeNameplate3mf,
} from "../lib/nameplate-3d.ts";

const fontFile = readFileSync(new URL("../public/fonts/DejaVuSansCondensed-Bold.ttf", import.meta.url));
const font = opentype.parse(fontFile.buffer.slice(fontFile.byteOffset, fontFile.byteOffset + fontFile.byteLength));

test("nameplates fit the Monster holder limits and preserve readable first names", () => {
  for (const name of ["Aurélie", "Loïc", "Jean-Christophe", "Mia"]) {
    const layout = calculateNameplateLayout({ ...DEFAULT_NAMEPLATE_OPTIONS, name }, font);
    assert.ok(layout.width <= DEFAULT_NAMEPLATE_OPTIONS.maxWidth + 0.01);
    assert.ok(layout.height <= DEFAULT_NAMEPLATE_OPTIONS.maxHeight + 0.01);
    assert.equal(layout.depth, 2);
    assert.match(layout.previewPath, /^M /);
  }
  assert.equal(printableFirstName("  Éléonore  "), "Éléonore");
});

test("Geraldine uses clean filled glyphs with a regular backing contour", () => {
  const layout = calculateNameplateLayout({ ...DEFAULT_NAMEPLATE_OPTIONS, name: "Geraldine" }, font);
  assert.ok(layout.width <= DEFAULT_NAMEPLATE_OPTIONS.maxWidth + 0.01);
  assert.ok(layout.height <= DEFAULT_NAMEPLATE_OPTIONS.maxHeight + 0.01);
  assert.ok(layout.contours.length > 10, "filled glyphs should include counters and the i dot");
  assert.ok((layout.previewPath.match(/ Z/g) || []).length > 10);
  const model = buildNameplateModel({ ...DEFAULT_NAMEPLATE_OPTIONS, name: "Geraldine" }, font);
  assert.ok(jscad.measurements.measureVolume(model.base) > 0);
  assert.ok(jscad.measurements.measureVolume(model.letters) > 0);
});

test("the exported model has a flat base, raised aligned letters and valid binary STL", () => {
  const options = { ...DEFAULT_NAMEPLATE_OPTIONS, name: "Mia" };
  const model = buildNameplateModel(options, font);
  const [, baseMax] = jscad.measurements.measureBoundingBox(model.base);
  const [lettersMin, lettersMax] = jscad.measurements.measureBoundingBox(model.letters);
  assert.ok(Math.abs(baseMax[2] - options.baseThickness) < 0.001);
  assert.ok(Math.abs(lettersMin[2] - options.baseThickness) < 0.001);
  assert.ok(Math.abs(lettersMax[2] - model.depth) < 0.001);
  assert.ok(model.width <= options.maxWidth + 0.01);
  assert.ok(model.height <= options.maxHeight + 0.01);

  const parts = serializeNameplate(model.combined);
  assert.equal(parts.length, 3);
  assert.equal(parts[0].byteLength, 80);
  assert.equal(parts[1].byteLength, 4);
  assert.ok(new Uint32Array(parts[1])[0] > 0);
  assert.ok(parts[2].byteLength > 1_000);
});

test("unsafe or physically impossible values are rejected", () => {
  assert.throws(() => calculateNameplateLayout({ ...DEFAULT_NAMEPLATE_OPTIONS, name: "🦄" }, font), /prénom valide/);
  assert.throws(() => calculateNameplateLayout({ ...DEFAULT_NAMEPLATE_OPTIONS, maxWidth: 86 }, font), /85.9/);
  assert.throws(() => calculateNameplateLayout({ ...DEFAULT_NAMEPLATE_OPTIONS, contourWidth: 4.1 }, font), /contour/);
});

test("3MF export keeps the aligned base and letters as two colored materials", () => {
  // Regression: this exact name previously triggered thousands of open edges in Bambu Studio.
  const model = buildNameplateModel({ ...DEFAULT_NAMEPLATE_OPTIONS, name: "Kalillia" }, font);
  const archive = unzipSync(serializeNameplate3mf(model, {
    base: "#16130f",
    letters: "#ff4b17",
  }));
  assert.deepEqual(Object.keys(archive).sort(), [
    "3D/3dmodel.model",
    "[Content_Types].xml",
    "_rels/.rels",
  ]);
  const document = strFromU8(archive["3D/3dmodel.model"]);
  assert.match(document, /unit="millimeter"/);
  assert.match(document, /displaycolor="#16130FFF"/);
  assert.match(document, /displaycolor="#FF4B17FF"/);
  assert.match(document, /object id="2"[^>]+name="Base et contour"[^>]+pindex="0"/);
  assert.match(document, /object id="3"[^>]+name="Lettres"[^>]+pindex="1"/);
  assert.equal((document.match(/<item objectid=/g) || []).length, 2);
  assert.ok((document.match(/<triangle /g) || []).length > 100);

  for (const object of document.matchAll(/<object[^>]*>(.*?)<\/object>/gs)) {
    const edgeUses = new Map();
    for (const triangle of object[1].matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"\/>/g)) {
      const vertices = triangle.slice(1).map(Number);
      for (const [left, right] of [[vertices[0], vertices[1]], [vertices[1], vertices[2]], [vertices[2], vertices[0]]]) {
        const edge = left < right ? `${left}:${right}` : `${right}:${left}`;
        edgeUses.set(edge, (edgeUses.get(edge) || 0) + 1);
      }
    }
    assert.ok(edgeUses.size > 0);
    assert.deepEqual([...new Set(edgeUses.values())], [2], "every 3MF edge must belong to exactly two triangles");
  }
});
