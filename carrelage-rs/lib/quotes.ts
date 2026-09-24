export type Room = {
  id: string;
  name: string;
  selected: boolean;
  length: number;
  width: number;
  area: number;
  x?: number;
  y?: number;
};
export type Line = {
  id: string;
  label: string;
  unit: string;
  quantity: number;
  price: number;
  source: "manual" | "floors";
};
export type Quote = {
  id: string;
  reference: string;
  client: string;
  email: string;
  phone: string;
  address: string;
  updated: string;
  answers: Record<string, string>;
  rooms: Room[];
  lines: Line[];
  plan: string;
  notes: string;
};
export const roomNames = [
  "Séjour",
  "Cuisine",
  "Chambres",
  "Couloirs",
  "WC",
  "Salle de bain",
  "Cellier",
  "Terrasse",
  "Autre",
];
export function roomArea(room: Room) {
  return room.length > 0 && room.width > 0
    ? room.length * room.width
    : room.area;
}
export function floorArea(q: Quote) {
  return (
    Math.round(
      q.rooms.filter((r) => r.selected).reduce((s, r) => s + roomArea(r), 0) *
        100,
    ) / 100
  );
}
export function quantity(q: Quote, line: Line) {
  return line.source === "floors" ? floorArea(q) : line.quantity;
}
export function lineCents(q: Quote, line: Line) {
  return Math.round(quantity(q, line) * Math.round(line.price * 100));
}
export function totalCents(q: Quote) {
  return q.lines.reduce((sum, line) => sum + lineCents(q, line), 0);
}
export function newQuote(): Quote {
  return {
    id: crypto.randomUUID(),
    reference: `EST-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
    client: "",
    email: "",
    phone: "",
    address: "",
    updated: new Date().toISOString(),
    answers: {},
    rooms: roomNames.map((name) => ({
      id: crypto.randomUUID(),
      name,
      selected: false,
      length: 0,
      width: 0,
      area: 0,
    })),
    plan: "",
    notes: "",
    lines: [
      {
        id: crypto.randomUUID(),
        label: "Pose de carrelage au sol",
        unit: "m²",
        quantity: 0,
        price: 0,
        source: "floors",
      },
    ],
  };
}
type Field = {
  key: string;
  label: string;
  options?: string[];
  number?: boolean;
  max?: number;
};
export const sections: { title: string; fields: Field[] }[] = [
  {
    title: "Sols",
    fields: [
      { key: "floorSize", label: "Dimensions du carrelage au sol" },
      {
        key: "laying",
        label: "Type de pose",
        options: ["À définir", "Droite", "1/3", "1/2", "Autre"],
      },
      { key: "layingOther", label: "Précisions sur la pose" },
      {
        key: "skirting",
        label: "Plinthes",
        options: ["À définir", "En carrelage", "En bois", "Sans plinthes"],
      },
    ],
  },
  {
    title: "Chape",
    fields: [
      {
        key: "screed",
        label: "Chape à réaliser",
        options: ["À confirmer", "Oui", "Non"],
      },
      {
        key: "screedDepth",
        label: "Épaisseur prévue (cm), maximum 5",
        number: true,
        max: 5,
      },
      {
        key: "pipes",
        label: "Gaines électriques ou conduites d’eau",
        options: ["À confirmer", "Non", "Oui"],
      },
    ],
  },
  {
    title: "Étage et escalier",
    fields: [
      {
        key: "floor",
        label: "Maison avec étage",
        options: ["À confirmer", "Non", "R+1"],
      },
      {
        key: "stairs",
        label: "Escalier à carreler",
        options: ["À confirmer", "Non", "Oui"],
      },
      { key: "steps", label: "Nombre de marches", number: true },
      {
        key: "risers",
        label: "Contremarches à carreler",
        options: ["À confirmer", "Oui", "Non"],
      },
      {
        key: "nose",
        label: "Finition du nez de marche",
        options: ["À définir", "Carrelage", "Profilé"],
      },
    ],
  },
  {
    title: "Douche à l’italienne",
    fields: [
      {
        key: "shower",
        label: "Douche à l’italienne",
        options: ["À confirmer", "Oui", "Non"],
      },
      { key: "showerLength", label: "Longueur de la douche (m)", number: true },
      { key: "showerWidth", label: "Largeur de la douche (m)", number: true },
      { key: "niche", label: "Niche", options: ["À confirmer", "Non", "Oui"] },
      { key: "nicheLength", label: "Longueur niche (cm)", number: true },
      { key: "nicheHeight", label: "Hauteur niche (cm)", number: true },
      { key: "nicheDepth", label: "Profondeur niche (cm)", number: true },
      {
        key: "shelf",
        label: "Tablette",
        options: ["À confirmer", "Non", "Oui"],
      },
      {
        key: "bench",
        label: "Banc / siège",
        options: ["À confirmer", "Non", "Oui"],
      },
      {
        key: "waterproof",
        label: "Étanchéité sous carrelage",
        options: ["À définir", "Oui", "Non"],
      },
    ],
  },
  {
    title: "Faïence salle de bain",
    fields: [
      {
        key: "walls",
        label: "Carrelage mural",
        options: [
          "À définir",
          "Toute la salle de bain",
          "Zone douche",
          "Douche et autre mur",
          "Autre",
        ],
      },
      { key: "wallsOther", label: "Précisions sur les murs" },
      {
        key: "showerWall",
        label: "Hauteur dans la douche",
        options: ["À définir", "Jusqu’au plafond", "Hauteur définie"],
      },
      { key: "showerWallHeight", label: "Hauteur définie (m)", number: true },
      { key: "wallTile", label: "Dimensions de la faïence" },
      {
        key: "otherWalls",
        label: "Autres murs à carreler",
        options: ["À confirmer", "Non", "Oui"],
      },
      { key: "otherHeight", label: "Hauteur hors douche (m)", number: true },
    ],
  },
  {
    title: "Informations complémentaires",
    fields: [
      { key: "bathrooms", label: "Nombre de salles de bain", number: true },
      { key: "toilets", label: "Nombre de WC", number: true },
      { key: "special", label: "Autres zones particulières" },
      {
        key: "hasPlan",
        label: "Plan de la maison disponible",
        options: ["À confirmer", "Oui", "Non"],
      },
      {
        key: "dimensionPlan",
        label: "Plan avec dimensions",
        options: ["À confirmer", "Oui", "Non"],
      },
    ],
  },
];

export function validQuote(value: unknown): value is Quote {
  if (!value || typeof value !== "object") return false;
  const q = value as Quote;
  const text = (s: unknown, max = 1000) =>
    typeof s === "string" && s.length <= max;
  const num = (n: unknown) =>
    typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1e6;
  return (
    typeof q.id === "string" &&
    /^[a-f0-9-]{36}$/.test(q.id) &&
    [q.reference, q.client, q.email, q.phone, q.address, q.updated].every((s) =>
      text(s),
    ) &&
    text(q.notes, 10000) &&
    text(q.plan, 8_000_000) &&
    (!q.plan ||
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(q.plan)) &&
    !!q.answers &&
    typeof q.answers === "object" &&
    !Array.isArray(q.answers) &&
    Object.entries(q.answers).length < 100 &&
    Object.entries(q.answers).every(([k, v]) => text(k, 100) && text(v)) &&
    sections.flatMap(section => section.fields).every(field => {
      const answer = q.answers[field.key];
      return !answer || (!field.number || (num(Number(answer)) && Number(answer) <= (field.max ?? 1e6)));
    }) &&
    (!q.answers.screedDepth ||
      (Number(q.answers.screedDepth) >= 0 &&
        Number(q.answers.screedDepth) <= 5)) &&
    Array.isArray(q.rooms) &&
    q.rooms.length <= 100 &&
    q.rooms.every(
      (r) =>
        r &&
        text(r.id) &&
        text(r.name) &&
        typeof r.selected === "boolean" &&
        [r.length, r.width, r.area].every(num) &&
        (r.x === undefined || (num(r.x) && r.x <= 100)) &&
        (r.y === undefined || (num(r.y) && r.y <= 100)),
    ) &&
    Array.isArray(q.lines) &&
    q.lines.length <= 100 &&
    q.lines.every(
      (l) =>
        l &&
        text(l.id) &&
        text(l.label) &&
        text(l.unit, 20) &&
        num(l.quantity) &&
        num(l.price) &&
        ["manual", "floors"].includes(l.source),
    )
  );
}
