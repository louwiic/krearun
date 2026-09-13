import test from "node:test";
import assert from "node:assert/strict";
import jscad from "@jscad/modeling";
import { strFromU8, unzipSync } from "fflate";
import {
  buildNameplateModel,
  calculateNameplateLayout,
  DEFAULT_NAMEPLATE_OPTIONS,
  printableFirstName,
  serializeNameplate,
  serializeNameplate3mf,
} from "../lib/nameplate-3d.ts";

test("nameplates fit the Monster holder limits and preserve readable first names", () => {
  for (const name of ["Aurélie", "Loïc", "Jean-Christophe", "Mia"]) {
    const layout = calculateNameplateLayout({ ...DEFAULT_NAMEPLATE_OPTIONS, name });
    assert.ok(layout.width <= DEFAULT_NAMEPLATE_OPTIONS.maxWidth + 0.01);
    assert.ok(layout.height <= DEFAULT_NAMEPLATE_OPTIONS.maxHeight + 0.01);
    assert.equal(layout.depth, 2);
    assert.ok(layout.previewSegments.length > 0);
  }
  assert.equal(printableFirstName("  Éléonore  "), "Eleonore");
});

test("the exported model has a flat base, raised aligned letters and valid binary STL", () => {
  const options = { ...DEFAULT_NAMEPLATE_OPTIONS, name: "Mia" };
  const model = buildNameplateModel(options);
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
  assert.throws(() => calculateNameplateLayout({ ...DEFAULT_NAMEPLATE_OPTIONS, name: "🦄" }), /prénom valide/);
  assert.throws(() => calculateNameplateLayout({ ...DEFAULT_NAMEPLATE_OPTIONS, maxWidth: 86 }), /85.9/);
  assert.throws(() => calculateNameplateLayout({ ...DEFAULT_NAMEPLATE_OPTIONS, letterStroke: 4 }), /lettres/);
});

test("3MF export keeps the aligned base and letters as two colored materials", () => {
  const model = buildNameplateModel({ ...DEFAULT_NAMEPLATE_OPTIONS, name: "Mia" });
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
});
