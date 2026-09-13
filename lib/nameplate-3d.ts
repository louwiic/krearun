import jscad from "@jscad/modeling";
import stlSerializer from "@jscad/stl-serializer";

const { booleans, extrusions, geometries, measurements, text, transforms } = jscad;

export type NameplateOptions = {
  name: string;
  maxWidth: number;
  maxHeight: number;
  baseThickness: number;
  reliefHeight: number;
  baseStroke: number;
  letterStroke: number;
};

export type PreviewSegment = Array<[number, number]>;
type Solid = ReturnType<typeof extrusions.extrudeRectangular>;

export type NameplateModel = {
  printableName: string;
  width: number;
  height: number;
  depth: number;
  base: Solid;
  letters: Solid;
  combined: Solid;
  previewSegments: PreviewSegment[];
};

export type NameplateLayout = Pick<
  NameplateModel,
  "printableName" | "width" | "height" | "depth" | "previewSegments"
>;

export const DEFAULT_NAMEPLATE_OPTIONS: NameplateOptions = {
  name: "Aurélie",
  maxWidth: 75,
  maxHeight: 22,
  baseThickness: 1.2,
  reliefHeight: 0.8,
  baseStroke: 3.6,
  letterStroke: 1.5,
};

function finiteBetween(value: number, min: number, max: number, label: string) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label} doit être compris entre ${min} et ${max} mm.`);
  }
  return value;
}

export function printableFirstName(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 '\-]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 24);
}

export function calculateNameplateLayout(options: NameplateOptions): NameplateLayout {
  const printableName = printableFirstName(options.name);
  if (!printableName) throw new Error("Saisis un prénom valide.");
  const maxWidth = finiteBetween(options.maxWidth, 20, 85.9, "La largeur maximale");
  const maxHeight = finiteBetween(options.maxHeight, 8, 60, "La hauteur maximale");
  const baseThickness = finiteBetween(options.baseThickness, 0.6, 4, "L’épaisseur du fond");
  const reliefHeight = finiteBetween(options.reliefHeight, 0.3, 4, "Le relief");
  const baseStroke = finiteBetween(options.baseStroke, 2, 8, "La largeur du fond");
  finiteBetween(options.letterStroke, 0.7, baseStroke - 0.4, "La largeur des lettres");

  const raw = text.vectorText({ height: 10, letterSpacing: 1.05 }, printableName);
  if (!raw.length) throw new Error("Ce prénom ne peut pas être transformé en objet 3D.");
  const points = raw.flat();
  const minX = Math.min(...points.map(([x]) => x));
  const maxX = Math.max(...points.map(([x]) => x));
  const minY = Math.min(...points.map(([, y]) => y));
  const maxY = Math.max(...points.map(([, y]) => y));
  const rawWidth = Math.max(maxX - minX, 0.1);
  const rawHeight = Math.max(maxY - minY, 0.1);
  const scale = Math.min(
    (maxWidth - 2 * baseStroke) / rawWidth,
    (maxHeight - 2 * baseStroke) / rawHeight,
  );
  if (!(scale > 0)) throw new Error("Les dimensions choisies sont trop petites.");

  const scaled: PreviewSegment[] = raw.map((segment) =>
    segment.map(([x, y]) => [
      (x - minX) * scale + baseStroke,
      (y - minY) * scale + baseStroke,
    ]),
  );
  return {
    printableName,
    width: rawWidth * scale + 2 * baseStroke,
    height: rawHeight * scale + 2 * baseStroke,
    depth: baseThickness + reliefHeight,
    previewSegments: scaled,
  };
}

export function buildNameplateModel(options: NameplateOptions): NameplateModel {
  const layout = calculateNameplateLayout(options);
  const { baseThickness, reliefHeight, baseStroke, letterStroke } = options;
  const scaled = layout.previewSegments;
  const paths = scaled.map((segment) =>
    geometries.path2.fromPoints({ closed: false }, segment),
  );
  const baseParts = paths.map((path) =>
    extrusions.extrudeRectangular(
      { size: baseStroke, height: baseThickness, corners: "round", segments: 12 },
      path,
    ),
  );
  const letterParts = paths.map((path) =>
    extrusions.extrudeRectangular(
      { size: letterStroke, height: reliefHeight, corners: "round", segments: 12 },
      path,
    ),
  );
  const rawBase = booleans.union(baseParts);
  const rawLetters = booleans.union(letterParts);
  const [[baseMinX, baseMinY]] = measurements.measureBoundingBox(rawBase);
  const offset: [number, number, number] = [-baseMinX, -baseMinY, 0];
  const base = transforms.translate(offset, rawBase);
  const letters = transforms.translate(
    [-baseMinX, -baseMinY, baseThickness],
    rawLetters,
  );
  const combined = booleans.union(base, letters);
  const [[, , minZ], [finalX, finalY, maxZ]] = measurements.measureBoundingBox(combined);

  return {
    printableName: layout.printableName,
    width: finalX,
    height: finalY,
    depth: maxZ - minZ,
    base,
    letters,
    combined,
    previewSegments: scaled.map((segment) =>
      segment.map(([x, y]) => [x - baseMinX, y - baseMinY]),
    ),
  };
}

export function serializeNameplate(solid: Solid) {
  return stlSerializer.serialize({ binary: true }, solid);
}
