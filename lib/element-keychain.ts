import { CLICKER_ELEMENTS } from "./clicker-elements";
import { parseKeychainConfiguration, type KeychainConfiguration } from "./name-keychain";
import { backedKeychainShapes, modelFromKeychainShapes } from "./name-keychain-3d";
import type { NameplateContour, NameplateLayout } from "./nameplate-3d";
export type ElementKeychainConfiguration = { elements: string[]; colors: KeychainConfiguration };
export function parseElementKeychain(value: unknown): ElementKeychainConfiguration {
  if (!value || typeof value !== "object") throw new Error("Configuration invalide.");
  const v=value as Record<string,unknown>;
  if (!Array.isArray(v.elements) || v.elements.length<1 || v.elements.length>8 || v.elements.some(id=>typeof id!=="string" || !CLICKER_ELEMENTS.some(item=>item.id===id))) throw new Error("Choisissez entre 1 et 8 éléments du catalogue.");
  const options=v.colors && typeof v.colors === "object" ? v.colors as Record<string,unknown> : {};
  return {elements: [...v.elements], colors:parseKeychainConfiguration({...options,name:"Motifs",font:"chewy",style:"relief"})};
}
export function elementKeychainShapes(value: unknown) {
  const config=parseElementKeychain(value);
  let cursor=0;const contours:NameplateContour[]=[];
  // All glyphs retain the native pack's common scale, including punctuation and accents.
  for (const id of config.elements) {
    const item=CLICKER_ELEMENTS.find(item=>item.id===id)!;
    const [minX,minY,maxX,maxY]=item.boundsMm;
    const centerY=(minY+maxY)/2;
    contours.push(...item.contours.map(ring=>ring.map(([x,y])=>[x-minX+cursor,y-centerY] as [number,number])));
    cursor+=maxX-minX+2.8;
  }
  const xs=contours.flatMap(r=>r.map(p=>p[0])),ys=contours.flatMap(r=>r.map(p=>p[1]));
  const minY=Math.min(...ys),maxY=Math.max(...ys),width=Math.max(...xs),height=maxY-minY;
  const scale=Math.min(1.8,80/width,25/height);
  const scaled=contours.map(ring=>ring.map(([x,y])=>[x*scale,(y-minY)*scale] as [number,number]));
  const layout:NameplateLayout={printableName:config.elements.map(id=>CLICKER_ELEMENTS.find(item=>item.id===id)!.label).join(" · "),width:width*scale,height:height*scale,depth:3.6,contours:scaled,previewPath:"",previewBasePath:""};
  const shapes=backedKeychainShapes(config.colors,layout);
  if(shapes.width>95 || shapes.height>32)throw new Error("La composition dépasse le gabarit du porte-clés.");
  return {...shapes,configuration:config};
}
export function buildElementKeychain(value: unknown) {
  const shapes=elementKeychainShapes(value);
  return {...modelFromKeychainShapes(shapes),printableName:shapes.layout.printableName};
}
