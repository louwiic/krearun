export const MONSTER_MULTICOLOR_CENTS = 200;
export interface MonsterColors { top: string; bottom: string; claws: string }
export function monsterColorLabel(parts:MonsterColors):string {
  return `Multicolore · Haut : ${parts.top} · Bas : ${parts.bottom} · Griffes : ${parts.claws}`;
}
export function parseMonsterColors(value:unknown):MonsterColors|undefined {
  if(typeof value!=="string" || value.length>240)return;
  const match=/^Multicolore · Haut : (.+) · Bas : (.+) · Griffes : (.+)$/.exec(value);
  if(!match)return;
  return {top:match[1],bottom:match[2],claws:match[3]};
}
export function monsterColorNames(value:string):string[] {
  const parts=parseMonsterColors(value);
  return parts ? [parts.top,parts.bottom,parts.claws] : [value];
}

export const MONSTER_PREMIUM_COLORS:MonsterColors = {top:"Noir Monster",bottom:"Noir Monster",claws:"Argenté"};
export function isMonsterPremium(parts:MonsterColors|undefined):boolean {
  return Boolean(parts && parts.top === MONSTER_PREMIUM_COLORS.top && parts.bottom === MONSTER_PREMIUM_COLORS.bottom && parts.claws === MONSTER_PREMIUM_COLORS.claws);
}
