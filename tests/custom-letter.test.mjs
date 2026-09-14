import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createJiti } from "jiti";
import opentype from "opentype.js";
import jscad from "@jscad/modeling";

const jiti = createJiti(import.meta.url, { fsCache: false });
const { DEFAULT_LETTER, buildCustomLetter, layoutCustomLetter, arrangeCustomLetter } = await jiti.import("../lib/custom-letter.ts");
const { serializeNameplate } = await jiti.import("../lib/nameplate-3d.ts");
const fonts = ["LibreBaskerville.ttf", "Lobster-Regular.ttf"].map((name) => {
  const buffer = readFileSync(new URL(`../public/fonts/${name}`, import.meta.url));
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
});
const { measurements, booleans, extrusions } = jscad;

function connectedComponents(parts) {
  const view = new DataView(parts[2]);
  const neighbors = new Map();
  for (let offset = 0; offset < view.byteLength; offset += 50) {
    const vertices = [0, 1, 2].map((i) => [0, 1, 2].map((axis) =>
      Math.round(view.getFloat32(offset + 12 + i * 12 + axis * 4, true) * 1000),
    ).join(","));
    for (const a of vertices) {
      if (!neighbors.has(a)) neighbors.set(a, new Set());
      for (const b of vertices) neighbors.get(a).add(b);
    }
  }
  let count = 0;
  const visited = new Set();
  for (const vertex of neighbors.keys()) {
    if (visited.has(vertex)) continue;
    count++;
    const stack = [vertex];
    while (stack.length) {
      const point = stack.pop();
      if (visited.has(point)) continue;
      visited.add(point);
      for (const next of neighbors.get(point)) if (!visited.has(next)) stack.push(next);
    }
  }
  return count;
}

test("the initial has a blind pocket and the insert seats without collision", () => {
  const model = buildCustomLetter(DEFAULT_LETTER, ...fonts);
  const blank = extrusions.extrudeLinear({ height: DEFAULT_LETTER.thickness }, model.initial);
  const removed = measurements.measureVolume(blank) - measurements.measureVolume(model.base);
  const expected = measurements.measureArea(model.recess) * DEFAULT_LETTER.socketDepth;
  assert.ok(Math.abs(removed - expected) < 0.1);
  assert.ok(Math.abs(measurements.measureVolume(booleans.intersect(model.base, model.assembledLetters))) < 0.01);
  const [min, max] = measurements.measureBoundingBox(model.assembledLetters);
  assert.equal(min[2], DEFAULT_LETTER.thickness - DEFAULT_LETTER.socketDepth);
  assert.equal(max[2], DEFAULT_LETTER.thickness + 2);
  assert.ok(measurements.measureArea(model.recess) > measurements.measureArea(booleans.intersect(model.initial, model.insert)));
});

test("both pieces export flat-backed binary STL, including accents and detached glyphs", () => {
  for (const [initial, name] of [["L", "Lola"], ["E", "Éloïse"], ["J", "Jean-Luc"]]) {
    const model = buildCustomLetter({ ...DEFAULT_LETTER, initial, name }, ...fonts);
    for (const solid of [model.base, model.letters]) {
      assert.ok(measurements.measureVolume(solid) > 0);
      assert.ok(Math.abs(measurements.measureBoundingBox(solid)[0][2]) < 0.001);
      const output = serializeNameplate(solid);
      assert.ok(new Uint32Array(output[1])[0] > 100);
      assert.equal(connectedComponents(output), 1, `${name}: each STL must contain one connected piece`);
    }
  }
});

test("invalid initials, names and impossible dimensions are rejected", () => {
  for (const overrides of [{ initial: "AB" }, { name: "" }, { name: "😀" }, { socketDepth: 12 }, { clearance: -1 }, { height: NaN }]) {
    assert.throws(() => layoutCustomLetter({ ...DEFAULT_LETTER, ...overrides }, ...fonts));
  }
});

test("manufacturing parameters cannot be customized", () => {
  for (const overrides of [{ thickness: 20 }, { socketDepth: 1 }, { clearance: 0.4 }]) {
    assert.throws(() => layoutCustomLetter({ ...DEFAULT_LETTER, ...overrides }, ...fonts), /fabrication sont fixes/);
  }
});

test("3MF layout separates the two pieces and keeps both on the print bed", () => {
  const model = arrangeCustomLetter(buildCustomLetter(DEFAULT_LETTER, ...fonts));
  const [, baseMax] = measurements.measureBoundingBox(model.base);
  const [nameMin] = measurements.measureBoundingBox(model.letters);
  assert.ok(nameMin[0] >= baseMax[0] + 9.99);
  assert.ok(Math.abs(nameMin[2]) < 0.001);
});

test("Louise is centered on the L stem, with room for its middle u and i", () => {
  const name = "Louise";
  const boxes = [];
  fonts[1].forEachGlyph(name, 0, 0, 100, {}, (glyph, x, y, size) => boxes.push(glyph.getPath(x, y, size).getBoundingBox()));
  const raw = fonts[1].getPath(name, 0, 0, 100).getBoundingBox();
  for (const [position, nameWidth] of [[30, 85], [52, 115], [70, 145]]) {
    const model = layoutCustomLetter({ ...DEFAULT_LETTER, name, position, nameWidth }, ...fonts);
    const [min, max] = measurements.measureBoundingBox(model.insert);
    const scale = (max[0] - min[0]) / (raw.x2 - raw.x1);
    const middleLeft = min[0] + (Math.min(boxes[2].x1, boxes[3].x1) - raw.x1) * scale;
    const middleRight = min[0] + (Math.max(boxes[2].x2, boxes[3].x2) - raw.x1) * scale;
    const band = jscad.primitives.rectangle({ center: [0, DEFAULT_LETTER.height * position / 100], size: [1000, 0.05] });
    const [left, right] = measurements.measureBoundingBox(booleans.intersect(model.initial, band));
    assert.ok(Math.abs((left[0] + right[0] - middleLeft - middleRight) / 2) < 0.2);
    assert.ok(left[0] < middleLeft - 1.5 && right[0] > middleRight + 1.5);
  }
});
