import sharp from "sharp";
import { LOGO_MAX_BYTES } from "./custom-holder";
import { reduceLogoColors, recolorLogoPixels } from "./logo-palette";
import { sanitizeHolderSvg } from "./holder-svg";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { HolderModel } from "./custom-holder";

export async function prepareHolderLogo(file: File) {
  if (!file.size || file.size>LOGO_MAX_BYTES) throw new Error("Le logo doit peser moins de 5 Mo.");
  let buffer:Buffer=Buffer.from(await file.arrayBuffer());
  const isSvg=file.type==='image/svg+xml'||/\.svg$/i.test(file.name)||/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(buffer.toString('utf8',0,200));
  const sourceSvg=isSvg?sanitizeHolderSvg(buffer):undefined;
  if(sourceSvg)buffer=sourceSvg;
  const image=sharp(buffer,{limitInputPixels:16_777_216,animated:false});
  const metadata=await image.metadata();
  if (!['png','jpeg','webp',...(isSvg?['svg']:[])].includes(metadata.format ?? '') || !metadata.width || !metadata.height || metadata.width>4096 || metadata.height>4096 || (metadata.pages ?? 1)>1) {
    throw new Error("Utilisez un SVG, PNG, JPG ou WebP fixe de 4096 pixels maximum.");
  }
  const original=await image.clone().rotate().resize(2048,2048,{fit:'inside',withoutEnlargement:true}).png().toBuffer();
  const {data,info}=await image.rotate().resize(384,384,{fit:'inside',withoutEnlargement:true}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const prepared=reduceLogoColors(data);
  const logo=await sharp(Buffer.from(prepared.pixels),{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
  return {logo,original,palette:prepared.palette,reduced:prepared.reduced,sourceSvg};
}

export async function prepareHolderPreset(model:Exclude<HolderModel,'custom'>) {
  const source=await readFile(join(process.cwd(),'public/models/holders/logos',`${model}.svg`));
  return prepareHolderLogo(new File([new Uint8Array(source)],`${model}.svg`,{type:'image/svg+xml'}));
}

export async function recolorHolderLogo(prepared:Awaited<ReturnType<typeof prepareHolderLogo>>,colors?:string[]) {
  if(!colors)return prepared;
  const {data,info}=await sharp(prepared.logo).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const pixels=recolorLogoPixels(data,prepared.palette,colors);
  const logo=await sharp(Buffer.from(pixels),{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
  return {...prepared,logo,palette:[...new Set(colors)]};
}
