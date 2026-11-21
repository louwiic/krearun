import fontSources from "../data/coffrets-fonts.json";
import catalogue from "../data/coffrets-catalogue.json";

export const COFFRET_ID = "coffrets-bijoux";
export const COFFRET_SLUG = "coffrets-bijoux";
export const COFFRET_VERSION = "KR-v04-tirette-relief";
export const COFFRET_CATALOGUE = catalogue;
export const COFFRET_MODELS = Object.keys(catalogue.modeles) as CoffretModel[];
export type CoffretModel = keyof typeof catalogue.modeles;
export type CoffretFont = keyof typeof catalogue.polices;
export type CoffretSize = keyof typeof catalogue.formats_mm;
export type CoffretConfiguration = {
  formule: "coffret_avec_poissons" | "poissons_seuls";
  format: CoffretSize;
  modele?: CoffretModel;
  couleur?: string;
  police?: CoffretFont;
  policeNom?: string;
  policeFichier?: string;
  policeSha256?: string;
  renfortPolice?: number;
  titre: string;
  phrase: string;
  dessinVersion: string;
};
export type CoffretTariffs = Record<CoffretSize, { coffret_avec_poissons: number | null; poissons_seuls: number | null; poids_coffret_g: number | null; poids_poissons_g: number | null }>;
// Tarifs Kréarun en centimes, poids mesurés en grammes. Les tarifs source ne sont pas des tarifs Kréarun.
export const COFFRET_TARIFFS: CoffretTariffs = {
  petit: {coffret_avec_poissons:Math.round(catalogue.prix_krearun_eur.coffret_avec_poissons.petit*100),poissons_seuls:null,poids_coffret_g:catalogue.poids_coffret_avec_poissons_g.petit,poids_poissons_g:null},
  grand: {coffret_avec_poissons:Math.round(catalogue.prix_krearun_eur.coffret_avec_poissons.grand*100),poissons_seuls:null,poids_coffret_g:catalogue.poids_coffret_avec_poissons_g.grand,poids_poissons_g:null},
};
export const COFFRET_COLORS = [
  {name:"bleu",hex:"#3277be",spoolId:null}, {name:"jaune",hex:"#f3c638",spoolId:null},
  {name:"rose",hex:"#f3a9c1",spoolId:null}, {name:"violet",hex:"#8b66b0",spoolId:null},
  {name:"Pink2",hex:"#e34c8b",spoolId:null}, {name:"orange",hex:"#ec8224",spoolId:null},
  {name:"vert",hex:"#60a878",spoolId:null}, {name:"argenté",hex:"#b6bdc4",spoolId:null},
];
export function coffretConfiguration(value: unknown): CoffretConfiguration {
  if (!value || typeof value !== "object") throw Error("Choisissez une configuration de coffret.");
  const v = value as Record<string, unknown>;
  if (!catalogue.formules.includes(String(v.formule)) || !Object.hasOwn(catalogue.formats_mm, String(v.format))) throw Error("Formule ou format invalide.");
  const base = {formule:v.formule as CoffretConfiguration["formule"],format:v.format as CoffretSize,dessinVersion:COFFRET_VERSION};
  // Le passage aux supports seuls retire tous les champs du coffret, même s'ils sont encore envoyés par le client.
  if (base.formule === "poissons_seuls") return {...base,titre:"",phrase:""};
  if (!Object.hasOwn(catalogue.modeles,String(v.modele)) || !catalogue.couleurs.includes(String(v.couleur)) || !Object.hasOwn(catalogue.polices,String(v.police))) throw Error("Modèle, couleur ou police invalide.");
  const modele = v.modele as CoffretModel;
  const font = fontSources.find(f => f.code === v.police && f.active);
  if (!font) throw Error("Cette police est trop fine pour ce coffret. Choisissez une police proposée.");
  return {...base,modele,couleur:String(v.couleur),police:v.police as CoffretFont,policeNom:font.name,policeFichier:font.file,policeSha256:font.sha256,renfortPolice:2.5,titre:catalogue.modeles[modele].titre,phrase:catalogue.modeles[modele].phrase};
}
export function coffretLineId(c: CoffretConfiguration) { return [c.formule,c.format,c.modele,c.police,c.dessinVersion].filter(Boolean).join(":"); }
export function coffretQuantity(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 20) throw Error("Choisissez une quantité entière de 1 à 20.");
  return value;
}
export function coffretQuote(value: unknown, quantity: unknown, tariffs = COFFRET_TARIFFS) {
  const configuration = coffretConfiguration(value);
  const q = coffretQuantity(quantity);
  const rate = tariffs[configuration.format];
  const priceCents = rate[configuration.formule];
  const weightGrams = configuration.formule === "poissons_seuls" ? rate.poids_poissons_g : rate.poids_coffret_g;
  if (!Number.isSafeInteger(priceCents) || priceCents! <= 0 || !Number.isFinite(weightGrams) || weightGrams! <= 0) throw Error("Les tarifs et poids Kréarun de cette formule sont en cours de préparation.");
  return {configuration,quantity:q,priceCents:priceCents!,weightGrams:weightGrams!,totalCents:priceCents!*q};
}
export function coffretDetails(c: CoffretConfiguration) {
  return [
    {label:"Formule",value:c.formule === "poissons_seuls" ? "Ensemble de poissons seul" : "Coffret + ensemble de poissons"},
    {label:"Format de compatibilité",value:c.format === "petit" ? "Petit" : "Grand"},
    ...(c.formule === "poissons_seuls" ? [] : [{label:"Décor",value:c.modele!},{label:"Couleur du coffret",value:c.couleur!},{label:"Police",value:`${c.police} · ${c.policeNom || catalogue.polices[c.police!]}`},{label:"Titre",value:c.titre},...(c.phrase ? [{label:"Phrase",value:c.phrase}] : [])]),
    {label:"Version du dessin",value:c.dessinVersion},
  ];
}
export function coffretImage(c: CoffretConfiguration) { return c.modele ? `/coffrets/${catalogue.modeles[c.modele].apercu}` : "/coffrets/reference/coffret.webp"; }
export function coffretLabel(c: CoffretConfiguration) { return `${c.formule === "poissons_seuls" ? "Ensemble de poissons" : "Coffret tropical"} · ${c.format}${c.modele ? ` · ${c.modele}` : ""}`; }
