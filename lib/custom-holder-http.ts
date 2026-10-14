import { LOGO_MAX_BYTES } from "./custom-holder";

export function holderSiteUrl(request?: Request): string {
  const url=new URL(process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV==='production'?'https://krearun.re':request?.url||'http://localhost:3000'));
  if(url.hostname==='krearun.re'||url.hostname.endsWith('.krearun.re'))return 'https://krearun.re';
  return url.origin;
}

export function checkHolderOrigin(request: Request) {
  const origin=request.headers.get("origin");
  if (!origin) return;
  const allowed=[new URL(request.url).origin];
  allowed.push(holderSiteUrl(request));
  if(!allowed.includes(origin))throw new Error("Origine de la demande invalide.");
}
export async function holderFormData(request: Request): Promise<FormData> {
  checkHolderOrigin(request);
  const limit=LOGO_MAX_BYTES+64*1024;
  if(Number(request.headers.get("content-length"))>limit)throw new Error("Fichier trop volumineux (5 Mo maximum).");
  const reader=request.body?.getReader();
  if(!reader)throw new Error("Fichier manquant.");
  const chunks:Uint8Array[]=[];let size=0;
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new Error("Fichier trop volumineux (5 Mo maximum).");}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return new Request(request.url,{method:"POST",headers:{"content-type":request.headers.get("content-type")??""},body:bytes}).formData();
}
