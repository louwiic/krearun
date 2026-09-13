import test from "node:test";
import assert from "node:assert/strict";
import jscad from "@jscad/modeling";
import {
  buildNameplateModel,
  calculateNameplateLayout,
  DEFAULT_NAMEPLATE_OPTIONS,
  printableFirstName,
  serializeNameplate,
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
