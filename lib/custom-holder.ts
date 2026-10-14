export const HOLDER_SLUG = "porte-boisson-500ml-personnalise";
export const HOLDER_NAME = "Porte-boisson 500 ml personnalisé";
export const HOLDER_WEIGHT_GRAMS = 180;
export const LOGO_MAX_BYTES = 5 * 1024 * 1024;
export const HOLDER_MODELS = [
  { id: "custom", label: "Mon logo", description: "KREARUN ou votre image" },
  { id: "om", label: "OM", description: "Modèle OM déjà modélisé" },
  { id: "arsenal", label: "Arsenal", description: "Modèle Arsenal déjà modélisé" },
] as const;
export type HolderModel = typeof HOLDER_MODELS[number]["id"];
export const HOLDER_PRESET_PALETTES = {om:['#c5a459','#0097d7'],arsenal:['#9c854d','#d41936','#fbf9f7','#023a77']} as const;
export function isHolderBodyColor(color:{name:string}):boolean {return /^(?:PLA\s+)?(?:noir|blanc)$/i.test(color.name.trim());}
export function holderModel(configuration: HolderConfiguration): HolderModel { return configuration.model ?? "custom"; }
export function holderModelLabel(configuration: HolderConfiguration): string { return HOLDER_MODELS.find(m=>m.id===holderModel(configuration))!.label; }

export interface HolderConfiguration {
  model?: HolderModel;
  logoColors?: string[];
  logoFaces?: 1 | 2;
  bodyColor: string;
  bodyColorName: string;
  topColor?: string;
  bottomColor?: string;
  verticalName?: string;
  engravingText?: string;
  logoWidth: number;
  logoOffset: number;
}
export interface HolderDecision {
  id: string;
  requestId: string;
  status: "approved" | "rejected";
  unitPriceCents: number;
  shippingCents: number;
  message: string;
  created: string;
}
export interface HolderRequest {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  quantity: number;
  note: string;
  configuration: HolderConfiguration;
  palette: string[];
  logo: string;
  originalLogo: string;
  sourceSvg?: string;
  submissionKey: string;
  stripeSessionId: string;
  orderId: string;
  created: string;
  decision?: HolderDecision;
}
export const HOLDER_STATUS_LABELS = {
  pending: "En cours de validation",
  approved: "Validée · paiement disponible",
  rejected: "Personnalisation non réalisable",
  paid: "Payée · en préparation",
};
export function holderStatus(request: HolderRequest): keyof typeof HOLDER_STATUS_LABELS {
  return request.orderId ? "paid" : request.decision?.status ?? "pending";
}
export function canPayHolder(request: HolderRequest, customerId: string): boolean {
  const decision = request.decision;
  return request.customerId === customerId && !request.orderId && decision?.status === "approved"
    && Number.isInteger(decision.unitPriceCents) && decision.unitPriceCents > 0
    && Number.isInteger(decision.shippingCents) && decision.shippingCents >= 0;
}
export function holderTotal(request: HolderRequest): number {
  return request.decision ? request.quantity * request.decision.unitPriceCents + request.decision.shippingCents : 0;
}
export function parseHolderConfiguration(value: unknown): HolderConfiguration {
  if (!value || typeof value !== "object") throw new Error("Configuration invalide.");
  const input = value as Record<string, unknown>;
  for(const key of ['topColor','bottomColor'])if(input[key]!==undefined&&(typeof input[key]!=='string'||!/^#[a-f0-9]{6}$/i.test(input[key] as string)))throw new Error("Couleur de bague invalide.");
  for(const [key,max] of [['verticalName',12],['engravingText',32]] as const)if(input[key]!==undefined&&(typeof input[key]!=='string'||Array.from(key==='verticalName'?(input[key] as string).trim().toUpperCase():(input[key] as string).trim()).length>max||!/^[\p{Script=Latin}\p{N} .,'’!?&+()\-]*$/u.test(input[key] as string)))throw new Error(`Texte invalide : ${max} caractères maximum, lettres, chiffres et ponctuation simple.`);
  if(input.logoFaces!==undefined&&input.logoFaces!==1&&input.logoFaces!==2)throw new Error("Nombre de faces du logo invalide.");
  if(input.logoColors!==undefined&&(!Array.isArray(input.logoColors)||input.logoColors.length<1||input.logoColors.length>4||input.logoColors.some(color=>typeof color!=='string'||!/^#[a-f0-9]{6}$/i.test(color))))throw new Error("Choisissez au maximum quatre couleurs pour le logo.");
  if (input.model !== undefined && !HOLDER_MODELS.some(model=>model.id===input.model)) throw new Error("Choisissez un modèle disponible.");
  if (typeof input.bodyColor !== "string" || !/^#[0-9a-f]{6}$/i.test(input.bodyColor)
    || typeof input.bodyColorName !== "string" || !input.bodyColorName.trim()
    || typeof input.logoWidth !== "number" || !Number.isFinite(input.logoWidth) || input.logoWidth < 25 || input.logoWidth > 65
    || typeof input.logoOffset !== "number" || !Number.isFinite(input.logoOffset) || Math.abs(input.logoOffset) > 25) {
    throw new Error("Configuration du porte-boisson invalide.");
  }
  return { bodyColor: input.bodyColor.toLowerCase(), bodyColorName: input.bodyColorName.trim().slice(0,80), logoWidth: input.logoWidth, logoOffset: input.logoOffset,
    ...(input.topColor===undefined?{}:{topColor:(input.topColor as string).toLowerCase()}),
    ...(input.bottomColor===undefined?{}:{bottomColor:(input.bottomColor as string).toLowerCase()}),
    ...(input.verticalName===undefined?{}:{verticalName:(input.verticalName as string).trim()}),
    ...(input.engravingText===undefined?{}:{engravingText:(input.engravingText as string).trim()}),
    ...(input.logoFaces===undefined?{}:{logoFaces:input.logoFaces as 1 | 2}),
    ...(input.logoColors===undefined?{}:{logoColors:(input.logoColors as string[]).map(color=>color.toLowerCase())}),
    ...(input.model === undefined ? {} : { model: input.model as HolderModel }),
  };
}
export function euroCents(value: FormDataEntryValue | null, allowZero = false): number {
  const normalized = String(value ?? "").trim().replace(",", ".");
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(normalized)) throw new Error("Indiquez un montant valide en euros.");
  const cents = Math.round(Number(normalized) * 100);
  if ((!allowZero && cents <= 0) || cents > 1000000) throw new Error("Montant invalide.");
  return cents;
}
