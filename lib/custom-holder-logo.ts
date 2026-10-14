import sharp from "sharp";
import { LOGO_MAX_BYTES } from "./custom-holder";
import { reduceLogoColors } from "./logo-palette";

export async function prepareHolderLogo(file: File) {
  if (!file.size || file.size>LOGO_MAX_BYTES) throw new Error("Le logo doit peser moins de 5 Mo.");
  const buffer=Buffer.from(await file.arrayBuffer());
  const image=sharp(buffer,{limitInputPixels:16_777_216,animated:false});
  const metadata=await image.metadata();
  if (!['png','jpeg','webp'].includes(metadata.format ?? '') || !metadata.width || !metadata.height || metadata.width>4096 || metadata.height>4096 || (metadata.pages ?? 1)>1) {
    throw new Error("Utilisez une image PNG, JPG ou WebP fixe de 4096 pixels maximum.");
  }
  const original=await image.clone().rotate().resize(2048,2048,{fit:'inside',withoutEnlargement:true}).png().toBuffer();
  const {data,info}=await image.rotate().resize(384,384,{fit:'inside',withoutEnlargement:true}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const prepared=reduceLogoColors(data);
  const logo=await sharp(Buffer.from(prepared.pixels),{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
  return {logo,original,palette:prepared.palette,reduced:prepared.reduced};
}
