import {createHash} from "node:crypto";
import {isAdmin} from "@/lib/auth";
import {parseProductEvent} from "@/lib/product-events";
import {getProductById,recordProductEvent} from "@/lib/store";
import {CLICKER_PRODUCT_ID} from "@/lib/clicker";
const buckets=new Map<string,{count:number;until:number}>();
export async function POST(request:Request){
  const origin=request.headers.get("origin");
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get("sec-fetch-site")==="cross-site")return new Response(null,{status:403});
  if(await isAdmin())return new Response(null,{status:204});
  if(/bot|crawler|spider|headless|preview/i.test(request.headers.get("user-agent")||""))return new Response(null,{status:204});
  const now=Date.now();for(const [key,bucket] of buckets)if(bucket.until<now)buckets.delete(key);
  // Abuse protection only: this short-lived hash is never saved with events.
  const key=createHash("sha256").update(request.headers.get("x-forwarded-for")?.split(",")[0]||"unknown").digest("hex");
  const bucket=buckets.get(key)||{count:0,until:now+60000};
  if(bucket.count>=150||buckets.size>2000)return new Response(null,{status:429});bucket.count++;buckets.set(key,bucket);
  let value:unknown;
  try{
    if(Number(request.headers.get("content-length"))>1024)return new Response(null,{status:413});
    const reader=request.body?.getReader();if(!reader)return new Response(null,{status:400});
    const chunks:Uint8Array[]=[];let size=0;
    for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>1024){await reader.cancel();return new Response(null,{status:413});}chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    value=JSON.parse(new TextDecoder().decode(bytes));
  }catch{return new Response(null,{status:400});}
  const event=parseProductEvent(value);if(!event)return new Response(null,{status:400});
  try{
    if(event.productId!==CLICKER_PRODUCT_ID){const product=await getProductById(event.productId);if(!product?.active)return new Response(null,{status:204});}
    await recordProductEvent(event);return new Response(null,{status:202});
  }catch{console.error("[Product stats] Persistence unavailable");return new Response(null,{status:503});}
}
