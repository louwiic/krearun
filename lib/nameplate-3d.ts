import jscad from "@jscad/modeling";
import stlSerializer from "@jscad/stl-serializer";
import { strToU8, zipSync } from "fflate";
import opentype, { type Font, type PathCommand } from "opentype.js";

const { booleans, expansions, extrusions, geometries, measurements, modifiers, transforms } = jscad;

export type NameplateOptions = {
  name: string;
  maxWidth: number;
  maxHeight: number;
  baseThickness: number;
  reliefHeight: number;
  contourWidth: number;
};

export type NameplateContour = Array<[number, number]>;
type Solid = ReturnType<typeof extrusions.extrudeLinear>;

export type NameplateModel = {
  printableName: string;
  width: number;
  height: number;
  depth: number;
  base: Solid;
  letters: Solid;
  combined: Solid;
  previewPath: string;
  previewBasePath: string;
};

export type NameplateLayout = Pick<
  NameplateModel,
  "printableName" | "width" | "height" | "depth" | "previewPath" | "previewBasePath"
> & { contours: NameplateContour[] };

export const DEFAULT_NAMEPLATE_OPTIONS: NameplateOptions = {
  name: "Aurélie",
  maxWidth: 75,
  maxHeight: 22,
  baseThickness: 1.2,
  reliefHeight: 0.8,
  contourWidth: 1.6,
};

let browserFontPromise: Promise<Font> | null = null;

export function loadNameplateFont() {
  if (!browserFontPromise) {
    browserFontPromise = fetch("/fonts/DejaVuSansCondensed-Bold.ttf")
      .then((response) => {
        if (!response.ok) throw new Error("Impossible de charger la police du générateur.");
        return response.arrayBuffer();
      })
      .then((buffer) => opentype.parse(buffer));
  }
  return browserFontPromise;
}

function finiteBetween(value: number, min: number, max: number, label: string) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label} doit être compris entre ${min} et ${max} mm.`);
  }
  return value;
}

export function printableFirstName(value: string) {
  return value
    .trim()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N} '\-]/gu, "")
    .replace(/\s+/g, " ")
    .slice(0, 24);
}

function pointOnQuadratic(
  start: [number, number],
  control: [number, number],
  end: [number, number],
  progress: number,
): [number, number] {
  const inverse = 1 - progress;
  return [
    inverse * inverse * start[0] + 2 * inverse * progress * control[0] + progress * progress * end[0],
    inverse * inverse * start[1] + 2 * inverse * progress * control[1] + progress * progress * end[1],
  ];
}

function pointOnCubic(
  start: [number, number],
  first: [number, number],
  second: [number, number],
  end: [number, number],
  progress: number,
): [number, number] {
  const inverse = 1 - progress;
  return [
    inverse ** 3 * start[0] + 3 * inverse ** 2 * progress * first[0] + 3 * inverse * progress ** 2 * second[0] + progress ** 3 * end[0],
    inverse ** 3 * start[1] + 3 * inverse ** 2 * progress * first[1] + 3 * inverse * progress ** 2 * second[1] + progress ** 3 * end[1],
  ];
}

export function flattenPath(commands: PathCommand[]) {
  const contours: NameplateContour[] = [];
  let contour: NameplateContour = [];
  let current: [number, number] = [0, 0];
  const finish = () => {
    if (contour.length >= 3) contours.push(contour);
    contour = [];
  };
  const add = (point: [number, number]) => {
    const normalized: [number, number] = [point[0], -point[1]];
    const previous = contour.at(-1);
    if (!previous || Math.abs(previous[0] - normalized[0]) > 0.0001 || Math.abs(previous[1] - normalized[1]) > 0.0001) {
      contour.push(normalized);
    }
  };

  for (const command of commands) {
    if (command.type === "M") {
      finish();
      current = [command.x, command.y];
      add(current);
    } else if (command.type === "L") {
      current = [command.x, command.y];
      add(current);
    } else if (command.type === "Q") {
      const start = current;
      const end: [number, number] = [command.x, command.y];
      for (let step = 1; step <= 10; step += 1) add(pointOnQuadratic(start, [command.x1, command.y1], end, step / 10));
      current = end;
    } else if (command.type === "C") {
      const start = current;
      const end: [number, number] = [command.x, command.y];
      for (let step = 1; step <= 12; step += 1) add(pointOnCubic(start, [command.x1, command.y1], [command.x2, command.y2], end, step / 12));
      current = end;
    } else if (command.type === "Z") {
      finish();
    }
  }
  finish();
  return contours;
}

function signedArea(contour: NameplateContour) {
  return contour.reduce((area, point, index) => {
    const next = contour[(index + 1) % contour.length];
    return area + point[0] * next[1] - next[0] * point[1];
  }, 0) / 2;
}

function pathData(contours: NameplateContour[]) {
  return contours.map((contour) => `M ${contour.map(([x, y]) => `${x.toFixed(3)} ${y.toFixed(3)}`).join(" L ")} Z`).join(" ");
}

export function calculateNameplateLayout(options: NameplateOptions, font: Font): NameplateLayout {
  const printableName = printableFirstName(options.name);
  if (!printableName) throw new Error("Saisis un prénom valide.");
  const maxWidth = finiteBetween(options.maxWidth, 20, 85.9, "La largeur maximale");
  const maxHeight = finiteBetween(options.maxHeight, 8, 60, "La hauteur maximale");
  const baseThickness = finiteBetween(options.baseThickness, 0.6, 4, "L’épaisseur du fond");
  const reliefHeight = finiteBetween(options.reliefHeight, 0.3, 4, "Le relief");
  const contourWidth = finiteBetween(options.contourWidth, 0.8, 4, "Le contour");

  const raw = flattenPath(font.getPath(printableName, 0, 0, 100).commands);
  if (!raw.length) throw new Error("Ce prénom ne peut pas être transformé en objet 3D.");
  const points = raw.flat();
  const minX = Math.min(...points.map(([x]) => x));
  const maxX = Math.max(...points.map(([x]) => x));
  const minY = Math.min(...points.map(([, y]) => y));
  const maxY = Math.max(...points.map(([, y]) => y));
  const rawWidth = Math.max(maxX - minX, 0.1);
  const rawHeight = Math.max(maxY - minY, 0.1);
  const scale = Math.min(
    (maxWidth - 2 * contourWidth) / rawWidth,
    (maxHeight - 2 * contourWidth) / rawHeight,
  );
  if (!(scale > 0)) throw new Error("Les dimensions choisies sont trop petites.");

  const contours: NameplateContour[] = raw.map((contour) =>
    contour.map(([x, y]) => [
      (x - minX) * scale + contourWidth,
      (y - minY) * scale + contourWidth,
    ]),
  );
  const areas = contours.map(signedArea);
  const referenceIndex = areas.reduce((largest, area, index) => Math.abs(area) > Math.abs(areas[largest]) ? index : largest, 0);
  const outerSign = Math.sign(areas[referenceIndex]);
  return {
    printableName,
    width: rawWidth * scale + 2 * contourWidth,
    height: rawHeight * scale + 2 * contourWidth,
    depth: baseThickness + reliefHeight,
    contours,
    previewPath: pathData(contours),
    previewBasePath: pathData(contours.filter((_, index) => Math.sign(areas[index]) === outerSign)),
  };
}

export function buildNameplateModel(options: NameplateOptions, font: Font): NameplateModel {
  const layout = calculateNameplateLayout(options, font);
  const { baseThickness, reliefHeight, contourWidth } = options;
  const areas = layout.contours.map(signedArea);
  const referenceIndex = areas.reduce((largest, area, index) => Math.abs(area) > Math.abs(areas[largest]) ? index : largest, 0);
  const outerSign = Math.sign(areas[referenceIndex]);
  const geometryFromContour = (contour: NameplateContour, area: number) =>
    geometries.geom2.fromPoints(area < 0 ? [...contour].reverse() : contour);
  const outerParts = layout.contours
    .filter((_, index) => Math.sign(areas[index]) === outerSign)
    .map((contour) => geometryFromContour(contour, signedArea(contour)));
  const holes = layout.contours
    .filter((_, index) => Math.sign(areas[index]) !== outerSign)
    .map((contour) => geometryFromContour(contour, signedArea(contour)));
  const outerShape = booleans.union(outerParts);
  const letterShape = holes.length ? booleans.subtract(outerShape, booleans.union(holes)) : outerShape;
  const baseShape = expansions.offset({ delta: contourWidth, corners: "round", segments: 16 }, outerShape);
  const rawBase = extrusions.extrudeLinear({ height: baseThickness }, baseShape);
  const rawLetters = extrusions.extrudeLinear({ height: reliefHeight }, letterShape);
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
    previewPath: layout.previewPath,
    previewBasePath: layout.previewBasePath,
  };
}

export function serializeNameplate(solid: Solid) {
  return stlSerializer.serialize({ binary: true }, solid);
}

function threeMfColor(value: string) {
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error("Couleur 3MF invalide.");
  return `${value.toUpperCase()}FF`;
}

function xml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function meshXml(solid: Solid) {
  // 3MF only accepts triangle meshes. JSCAD extrusion caps can be concave,
  // so a simple triangle fan leaves open/non-manifold edges in slicers.
  // This is the same normalization used by the official JSCAD STL serializer.
  const generalize = modifiers.generalize as unknown as (
    options: { snap: boolean; triangulate: boolean },
    geometry: Solid,
  ) => Solid;
  const triangulated = generalize({ snap: true, triangulate: true }, solid);
  const vertices: Array<[number, number, number]> = [];
  const triangles: Array<[number, number, number]> = [];
  const indexes = new Map<string, number>();
  const vertexIndex = (point: [number, number, number]) => {
    const normalized = point.map((coordinate) =>
      Math.abs(coordinate) < 0.0000005 ? 0 : coordinate,
    ) as [number, number, number];
    const key = normalized.map((coordinate) => coordinate.toFixed(6)).join(",");
    const existing = indexes.get(key);
    if (existing !== undefined) return existing;
    const index = vertices.length;
    indexes.set(key, index);
    vertices.push(normalized);
    return index;
  };

  for (const polygon of geometries.geom3.toPolygons(triangulated)) {
    const polygonIndexes = polygon.vertices.map((point) =>
      vertexIndex(point as [number, number, number]),
    );
    if (polygonIndexes.length === 3) triangles.push(polygonIndexes as [number, number, number]);
  }
  if (!triangles.length) throw new Error("Le modèle 3D ne contient aucune surface exportable.");

  return `<mesh><vertices>${vertices
    .map(([x, y, z]) => `<vertex x="${x.toFixed(6)}" y="${y.toFixed(6)}" z="${z.toFixed(6)}"/>`)
    .join("")}</vertices><triangles>${triangles
    .map(([v1, v2, v3]) => `<triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`)
    .join("")}</triangles></mesh>`;
}

export function serializeNameplate3mf(
  model: NameplateModel,
  colors: { base: string; letters: string },
) {
  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="fr-FR" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">Prénom 3D ${xml(model.printableName)} — Krearun</metadata>
  <metadata name="Designer">Krearun Studio</metadata>
  <resources>
    <basematerials id="1">
      <base name="Base et contour" displaycolor="${threeMfColor(colors.base)}"/>
      <base name="Lettres" displaycolor="${threeMfColor(colors.letters)}"/>
    </basematerials>
    <object id="2" type="model" name="Base et contour" pid="1" pindex="0">${meshXml(model.base)}</object>
    <object id="3" type="model" name="Lettres" pid="1" pindex="1">${meshXml(model.letters)}</object>
  </resources>
  <build><item objectid="2"/><item objectid="3"/></build>
</model>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;
  const relationships = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
  return zipSync({
    "[Content_Types].xml": strToU8(contentTypes),
    "_rels/.rels": strToU8(relationships),
    "3D/3dmodel.model": strToU8(modelXml),
  });
}
