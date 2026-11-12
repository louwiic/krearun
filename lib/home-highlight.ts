import type { Product } from "./types";
export type HomeHighlight = {enabled:boolean;productSlug:string;heading:string;description:string;cta:string;mediaMode:"both"|"image"|"video";mediaSource:"product"|"custom";image:string;video:string};
export const DEFAULT_HOME_HIGHLIGHT:HomeHighlight={enabled:false,productSlug:"",heading:"À ne pas rater",description:"",cta:"Je découvre",mediaMode:"both",mediaSource:"product",image:"",video:""};
export function highlightMediaUrl(value:unknown):string {
 if(typeof value!=="string"||value.length>2000)return "";
 const raw=value.trim();if(/^\/(?!\/)/.test(raw)&&!/[\\\r\n]/.test(raw))return raw;
 try{const url=new URL(raw);return url.protocol==="https:"&&!url.username&&!url.password?url.href:"";}catch{return "";}
}
export function parseHomeHighlight(raw:string|undefined):HomeHighlight {
 try{const v=JSON.parse(raw||"{}");return {enabled:v.enabled===true,productSlug:typeof v.productSlug==="string"?v.productSlug.slice(0,200):"",heading:typeof v.heading==="string"?v.heading.slice(0,100):DEFAULT_HOME_HIGHLIGHT.heading,description:typeof v.description==="string"?v.description.slice(0,1000):"",cta:typeof v.cta==="string"?v.cta.slice(0,60):DEFAULT_HOME_HIGHLIGHT.cta,mediaMode:["image","video"].includes(v.mediaMode)?v.mediaMode:"both",mediaSource:v.mediaSource==="custom"?"custom":"product",image:highlightMediaUrl(v.image),video:highlightMediaUrl(v.video)};}catch{return {...DEFAULT_HOME_HIGHLIGHT};}
}
export function resolveHomeHighlight(config:HomeHighlight,products:Product[]) {
 const product=products.find(p=>p.slug===config.productSlug&&p.active&&!p.privateSale);if(!config.enabled||!product)return null;
 const image=highlightMediaUrl(config.mediaSource==="product"?product.images[0]:config.image);
 const video=highlightMediaUrl(config.mediaSource==="product"?product.videoUrl:config.video);
 return {product,image:config.mediaMode==="video"?"":image,video:config.mediaMode==="image"?"":video};
}
