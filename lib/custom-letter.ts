import jscad from "@jscad/modeling";
import ClipperLib from "clipper-lib";
import { LETTER_MANUFACTURING } from "./custom-letter-settings";
import type { Font } from "opentype.js";
import { flattenPath, type NameplateContour } from "./nameplate-3d";

const { booleans, extrusions, geometries, hulls, measurements, primitives, transforms } = jscad;
type Shape = ReturnType<typeof geometries.geom2.fromPoints>;
export type LetterOptions = {
  initial: string; name: string; height: number; thickness: number;
  nameWidth: number; position: number; clearance: number; socketDepth: number;
};
export const DEFAULT_LETTER: LetterOptions = {
  initial: "L", name: "Lola", height: 160,
  nameWidth: 115, position: 52, ...LETTER_MANUFACTURING,
};

function between(value: number, min: number, max: number) {
  if (!Number.isFinite(value) || value < min || value > max) throw new Error("Dimensions hors limites.");
}
function area(points: NameplateContour) {
  return points.reduce((sum, a, i) => {
    const b = points[(i + 1) % points.length];
    return sum + a[0] * b[1] - b[0] * a[1];
  }, 0) / 2;
}
function glyph(text: string, font: Font) {
  if ([...text].some((character) => !font.charToGlyphIndex(character))) throw new Error("Ce caractère n'est pas disponible dans la police.");
  const contours = flattenPath(font.getPath(text, 0, 0, 100).commands);
  if (!contours.length) throw new Error("Saisissez un prénom.");
  const areas = contours.map(area);
  const largest = areas.reduce((a, b) => Math.abs(a) > Math.abs(b) ? a : b);
  const outer: NameplateContour[] = [];
  const holes: Shape[] = [];
  const parts: Shape[] = [];
  contours.forEach((points, index) => {
    const part = geometries.geom2.fromPoints(areas[index] < 0 ? [...points].reverse() : points);
    if (Math.sign(areas[index]) === Math.sign(largest)) { parts.push(part); outer.push(points); }
    else holes.push(part);
  });
  const filled = booleans.union(parts);
  return { shape: holes.length ? booleans.subtract(filled, booleans.union(holes)) : filled, outer };
}
function fit(shape: Shape, target: number, axis: 0 | 1) {
  const [min, max] = measurements.measureBoundingBox(shape);
  const scale = target / (max[axis] - min[axis]);
  return transforms.scale([scale, scale, 1], transforms.translate([-min[0], -min[1], 0], shape));
}

function centralGlyphBounds(name: string, font: Font) {
  const spans: Array<[number, number]> = [];
  font.forEachGlyph(name, 0, 0, 100, {}, (letter, x, y, size) => {
    const path = letter.getPath(x, y, size);
    if (path.commands.length) {
      const box = path.getBoundingBox();
      spans.push([box.x1, box.x2]);
    }
  });
  const count = Math.min(spans.length, spans.length % 2 ? 3 : 2);
  const middle = spans.slice(Math.floor((spans.length - count) / 2), Math.floor((spans.length - count) / 2) + count);
  return [Math.min(...middle.map(([left]) => left)), Math.max(...middle.map(([, right]) => right))];
}

// Measure the body at the name's height, excluding feet and top serifs.
function bodySpan(shape: Shape, y: number): [number, number] {
  const crossings: number[] = [];
  for (const points of geometries.geom2.toOutlines(shape)) {
    points.forEach((a, index) => {
      const b = points[(index + 1) % points.length];
      if ((a[1] > y) !== (b[1] > y)) crossings.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    });
  }
  if (crossings.length < 2) throw new Error("Déplacez le prénom sur la partie pleine de la lettre.");
  return [Math.min(...crossings), Math.max(...crossings)];
}

function widenBody(shape: Shape, span: [number, number], requiredWidth: number) {
  const [left, right] = span;
  const extra = Math.max(0, requiredWidth - (right - left));
  if (!extra) return shape;
  return geometries.geom2.create(geometries.geom2.toOutlines(shape).flatMap((points) =>
    geometries.geom2.toSides(geometries.geom2.fromPoints(points.map(([x, y]) => [
      x + extra * Math.max(0, Math.min(1, (x - left) / (right - left))), y,
    ]))),
  ));
}
function svgPath(shape: Shape) {
  return geometries.geom2.toOutlines(shape).map((points) =>
    `M ${points.map((point) => `${point[0].toFixed(3)} ${point[1].toFixed(3)}`).join(" L ")} Z`,
  ).join(" ");
}

function socketOutline(shape: Shape, clearance: number) {
  const precision = 10_000;
  const paths = geometries.geom2.toOutlines(shape).map((outline) => outline.map(([x, y]) => ({ X: Math.round(x * precision), Y: Math.round(y * precision) })));
  const offset = new ClipperLib.ClipperOffset(2, precision * 0.01);
  offset.AddPaths(paths, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
  const result: ClipperLib.Paths = [];
  offset.Execute(result, clearance * precision);
  return geometries.geom2.create(result.flatMap((path) => geometries.geom2.toSides(
    geometries.geom2.fromPoints(path.map(({ X, Y }) => [X / precision, Y / precision])),
  )));
}

// Join detached dots, accents and glyphs with short printable bridges.
function connectedName(shape: Shape, contours: NameplateContour[], scale: number) {
  const connected = new Set([0]);
  const bridges: Shape[] = [];
  while (connected.size < contours.length) {
    let best = Infinity;
    let next = -1;
    let pair: [[number, number], [number, number]] | null = null;
    for (const index of connected) for (let other = 0; other < contours.length; other++) {
      if (connected.has(other)) continue;
      for (const a of contours[index]) for (const b of contours[other]) {
        const distance = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
        if (distance < best) { best = distance; next = other; pair = [a, b]; }
      }
    }
    if (!pair || next < 0) throw new Error("Impossible de relier les lettres.");
    bridges.push(hulls.hull(...pair.map((center) => primitives.circle({ center, radius: 0.65 / scale, segments: 12 }))));
    connected.add(next);
  }
  return bridges.length ? booleans.union(shape, ...bridges) : shape;
}

export function layoutCustomLetter(options: LetterOptions, initialFont: Font, nameFont: Font) {
  if (!/^[A-Z]$/.test(options.initial)) throw new Error("Choisissez une initiale de A à Z.");
  const name = options.name.trim().normalize("NFC");
  if (!/^[\p{L}][\p{L}' -]{0,17}$/u.test(name)) throw new Error("Le prénom doit contenir de 1 à 18 lettres, espaces ou tirets.");
  between(options.height, 100, 220);
  between(options.nameWidth, 70, 145); between(options.position, 30, 70);
  for (const key of ["thickness", "socketDepth", "clearance"] as const) {
    if (options[key] !== LETTER_MANUFACTURING[key]) throw new Error("Les paramètres de fabrication sont fixes.");
  }
  const originalInitial = fit(glyph(options.initial, initialFont).shape, options.height, 1);
  const [, initialMax] = measurements.measureBoundingBox(originalInitial);
  const raw = glyph(name, nameFont);
  const [min, max] = measurements.measureBoundingBox(raw.shape);
  const targetWidth = Math.min(220, Math.max(initialMax[0], options.height * 0.55) * options.nameWidth / 100);
  const factor = targetWidth / (max[0] - min[0]);
  const connected = connectedName(raw.shape, raw.outer, factor);
  const [connectedMin, connectedMax] = measurements.measureBoundingBox(connected);
  const fitted = fit(connected, targetWidth, 0);
  const [, nameMax] = measurements.measureBoundingBox(fitted);
  if (nameMax[1] > options.height * 0.6) throw new Error("Réduisez la largeur du prénom.");
  const actualScale = targetWidth / (connectedMax[0] - connectedMin[0]);
  const middle = centralGlyphBounds(name, nameFont).map((x) => (x - connectedMin[0]) * actualScale);
  const centerY = options.height * options.position / 100;
  const initial = widenBody(originalInitial, bodySpan(originalInitial, centerY), middle[1] - middle[0] + 4);
  const support = bodySpan(initial, centerY);
  const insert = transforms.translate([
    (support[0] + support[1] - middle[0] - middle[1]) / 2,
    centerY - nameMax[1] / 2, 0,
  ], fitted);
  const socket = socketOutline(insert, options.clearance);
  const contact = booleans.intersect(initial, insert);
  if (measurements.measureArea(contact) < 40) throw new Error("Déplacez le prénom pour augmenter son contact avec la lettre.");
  const recess = booleans.intersect(initial, socket);
  const bounds = measurements.measureBoundingBox(booleans.union(initial, insert));
  return { initial, insert, socket, recess, name, bounds,
    initialPath: svgPath(initial), namePath: svgPath(insert), recessPath: svgPath(recess) };
}

export function buildCustomLetter(options: LetterOptions, initialFont: Font, nameFont: Font) {
  const layout = layoutCustomLetter(options, initialFont, nameFont);
  const blank = extrusions.extrudeLinear({ height: options.thickness }, layout.initial);
  const cutter = transforms.translate([0, 0, options.thickness - options.socketDepth],
    extrusions.extrudeLinear({ height: options.socketDepth + 1 }, layout.socket));
  const base = booleans.subtract(blank, cutter);
  // The insert seats on the pocket floor, with 2 mm remaining above the initial.
  const letters = extrusions.extrudeLinear({ height: options.socketDepth + 2 }, layout.insert);
  const assembledLetters = transforms.translate([0, 0, options.thickness - options.socketDepth], letters);
  const combined = booleans.union(base, assembledLetters);
  return { ...layout, base, letters, assembledLetters, combined, printableName: layout.name,
    width: layout.bounds[1][0] - layout.bounds[0][0], height: options.height,
    depth: options.thickness + 2, previewPath: layout.namePath, previewBasePath: layout.initialPath };
}

export function arrangeCustomLetter(model: ReturnType<typeof buildCustomLetter>) {
  const [, baseMax] = measurements.measureBoundingBox(model.base);
  const [nameMin] = measurements.measureBoundingBox(model.letters);
  return { ...model, letters: transforms.translate([baseMax[0] + 10 - nameMin[0], -nameMin[1], 0], model.letters) };
}
