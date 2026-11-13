export const MONSTER_SLUG = "porte-canette-monster";
export const MONSTER_COLOR_EVENT = "krearun:monster-color";
export const MONSTER_MODEL_URL = "/models/monster/monster-holder.glb";
export function monsterPartColor(name:string,color:string):string {return name.startsWith("accent_")?color:"#111313";}

export function monsterRealPhoto(name:string):string|undefined {
  return name.replace(/^PLA\s+/i, "").trim().toLowerCase() === "vert phosphorescent"
    ? "/products/monster/vert-phosphorescent-real.webp" : undefined;
}
