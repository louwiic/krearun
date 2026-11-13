export const MONSTER_SLUG = "porte-canette-monster";
export const MONSTER_COLOR_EVENT = "krearun:monster-color";
export const MONSTER_MODEL_URL = "/models/monster/monster-holder.glb";
export function monsterPartColor(name:string,color:string,parts?:{top:string;bottom:string;claws:string}):string {
  if(!name.startsWith("accent_"))return "#111313";
  if(!parts)return color;
  return name==="accent_top"?parts.top:name==="accent_bottom"?parts.bottom:parts.claws;
}

export function monsterRealPhoto(name:string):string|undefined {
  const key=name.replace(/^PLA\s+/i, "").trim().toLowerCase();
  if(key === "vert phosphorescent") return "/products/monster/vert-phosphorescent-real.webp";
  if(key === "orange fluo" || key === "orange") return "/products/monster/orange-real.webp";
  if(key === "bleu reflet mauve") return "/products/monster/bleu-reflet-mauve-real.webp";
  return undefined;
}
