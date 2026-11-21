import outlines from "../data/coffrets-lettering.json";
import fontSources from "../data/coffrets-fonts.json";
import type { CoffretFont, CoffretModel } from "./coffrets";
export const COFFRET_FONTS = fontSources.filter(font => font.active);
export type GlyphOutline = {d:string;bounds:number[]};
export const COFFRET_LETTERING = outlines as Record<CoffretFont,Record<CoffretModel,{title:GlyphOutline;phrase:GlyphOutline|null}>>;
export function fittedGlyph(outline:GlyphOutline,width:number,height:number) {
  const [x1,y1,x2,y2]=outline.bounds;
  const scale=Math.min(width/(x2-x1),height/(y2-y1));
  return {scale,centerX:(x1+x2)/2,centerY:(y1+y2)/2};
}
export const COFFRET_TEXT_COLORS: Record<CoffretModel,{title:string;phrase:string}> = {
  Ananas:{title:"#ffeac0",phrase:"#ffeac0"},Coco:{title:"#ffeac0",phrase:"#ffeac0"},
  Banane:{title:"#ffeac0",phrase:"#ffeac0"},"Girl-box":{title:"#530729",phrase:"#530729"},
  Sardine:{title:"#083b82",phrase:"#fff0c9"},Hibiscus:{title:"#1c6032",phrase:"#1c6032"},
  Mangue:{title:"#1c6032",phrase:"#1c6032"},Letchi:{title:"#ffeac0",phrase:"#ffeac0"},
};
