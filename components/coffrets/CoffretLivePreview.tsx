"use client";

import {useEffect,useId,useState} from "react";
import { COFFRET_CATALOGUE, COFFRET_COLORS, type CoffretFont, type CoffretModel } from "@/lib/coffrets";
import { COFFRET_LETTERING, COFFRET_TEXT_COLORS, fittedGlyph, type GlyphOutline } from "@/lib/coffret-lettering";
import {recolorCoffretPixels} from "@/lib/coffret-color";
import {renderClosedCoffret} from "@/lib/coffret-closed-render";
import artworkSource from "@/data/coffrets-artwork.json";

const photoCache=new Map<string,string>();
const imageCache=new Map<string,Promise<HTMLImageElement>>();
const previewAssets={photo:'/coffrets/Live/coffret-neutre-v01.webp',pullTab:'/coffrets/Live/tirette-relief-v01.png',closedPhoto:'/coffrets/Live/coffret-ferme-neutre-v01.webp'};
function photo(asset:keyof typeof previewAssets) {
 let cached=imageCache.get(asset);
 if(!cached){cached=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{imageCache.delete(asset);reject(Error('Photo indisponible'));};image.src=previewAssets[asset];});imageCache.set(asset,cached);}
 return cached;
}
async function coloredPhoto(hex:string,asset:keyof typeof previewAssets) {
 const key=`${asset}:${hex}`,cached=photoCache.get(key);if(cached)return cached;
 const image=await photo(asset);const ready=photoCache.get(key);if(ready)return ready;const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
 const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw Error('Aperçu indisponible');context.drawImage(image,0,0);
 const pixels=context.getImageData(0,0,canvas.width,canvas.height);recolorCoffretPixels(pixels.data,canvas.width,canvas.height,hex,asset!=='photo');context.putImageData(pixels,0,0);
 const url=canvas.toDataURL('image/webp',.95);photoCache.set(key,url);return url;
}
function Glyph({outline,x,y,width,height,color}:{outline:GlyphOutline;x:number;y:number;width:number;height:number;color:string}) {
 const fit=fittedGlyph(outline,width-5,height-5);
 return <g transform={`translate(${x} ${y}) scale(${fit.scale}) translate(${-fit.centerX} ${-fit.centerY})`}><path d={outline.d} fill={color} stroke={color} strokeWidth={2.5} strokeLinejoin="round" paintOrder="stroke fill"/></g>;
}
export function CoffretFontSample({model,font}:{model:CoffretModel;font:CoffretFont}) {
 return <svg viewBox="0 0 240 60" aria-hidden="true"><Glyph outline={COFFRET_LETTERING[font][model].title} x={120} y={30} width={216} height={38} color="currentColor"/></svg>;
}
export type CoffretView="open"|"detail"|"closed";
export default function CoffretLivePreview({model,font,detail=false,className,color="orange",view}:{model:CoffretModel;font:CoffretFont;detail?:boolean;className?:string;color?:string;view?:CoffretView}) {
 const drawing=COFFRET_LETTERING[font][model],colors=COFFRET_TEXT_COLORS[model],art=artworkSource[model];
 const hex=COFFRET_COLORS.find(c=>c.name===color)?.hex||'#ec8224';
 const closed=view==="closed";
 const mode=closed?'closed':'open';
 const renderKey=closed?`${model}:${font}:${hex}:closed`:`${hex}:open`;
 const [paint,setPaint]=useState({hex:'',key:'',mode:'open',url:previewAssets.photo,pullTabUrl:previewAssets.pullTab});
 const id=useId().replace(/:/g,'');
 useEffect(()=>{let active=true;Promise.all([coloredPhoto(hex,closed?'closedPhoto':'photo'),coloredPhoto(hex,'pullTab')]).then(async ([url,pullTabUrl])=>{if(closed)url=await renderClosedCoffret(model,font,url,pullTabUrl,hex);if(active)setPaint({hex,key:renderKey,mode,url,pullTabUrl});}).catch(()=>{});return ()=>{active=false;};},[hex,closed,model,font,renderKey,mode]);
 const [x1,y1,x2,y2]=art.bounds;
 const hasPhrase=Boolean(drawing.phrase);
 const artScale=Math.min(1010/(x2-x1),(hasPhrase?335:395)/(y2-y1));
 if(closed)return <svg className={className} viewBox="0 115 1370 1027.5" role="img" aria-label={`Coffret ${model} fermé en perspective · ${color} · police ${font}`} data-coffret-view="closed" data-coffret-color={color} data-color-ready={paint.key===renderKey} aria-busy={paint.key!==renderKey}><title>{`${model} — coffret fermé en perspective`}</title><image href={paint.mode===mode?paint.url:previewAssets.closedPhoto} width="1370" height="1148"/></svg>;
 return <svg className={className} viewBox={(view==="detail"||detail) ? "500 0 810 490" : "0 0 1455 1081"} role="img" aria-label={`Coffret ${model} ${color} · police ${font} ${COFFRET_CATALOGUE.polices[font]}`} data-coffret-font={font} data-coffret-model={model} data-coffret-color={color} data-color-ready={paint.hex===hex} aria-busy={paint.hex!==hex}>
  <title>{`${COFFRET_CATALOGUE.modeles[model].titre} — ${color} — ${font} ${COFFRET_CATALOGUE.polices[font]}`}</title>
  <defs><clipPath id={`${id}-lid`}><rect width="1200" height="650" rx="100"/></clipPath></defs>
  <image href={paint.mode===mode?paint.url:previewAssets.photo} width="1455" height="1081"/>
  <g transform="matrix(.507 .112 -.123 .48 621 10)" clipPath={`url(#${id}-lid)`}>
   <rect width="1200" height="650" fill={art.background}/>
   <g data-lettering="title"><Glyph outline={drawing.title} x={600} y={96} width={945} height={88} color={colors.title}/></g>
   <g data-illustration="centered" transform={`translate(600 ${hasPhrase?335:370}) scale(${artScale}) translate(${-(x1+x2)/2} ${-(y1+y2)/2})`}>
    {art.layers.map((layer,i)=><g key={i} transform={layer.transform}><path d={layer.d} fill={layer.fill} fillRule="evenodd"/></g>)}
   </g>
   {drawing.phrase&&<g data-lettering="phrase"><Glyph outline={drawing.phrase} x={600} y={584} width={1000} height={66} color={colors.phrase}/></g>}
  </g>
  <image data-preview-role="pull-tab" href={paint.pullTabUrl} x="944" y="174" width="222" height="166" preserveAspectRatio="xMidYMid meet"/>
 </svg>;
}
