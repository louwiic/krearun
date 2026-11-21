import artwork from '../data/coffrets-artwork.json';
import {COFFRET_LETTERING,COFFRET_TEXT_COLORS,fittedGlyph,type GlyphOutline} from './coffret-lettering';
import type {CoffretModel,CoffretFont} from './coffrets';
import {CLOSED_WIDTH,CLOSED_HEIGHT,CLOSED_LID,faceHomography,projectFace,invertHomography,closedSurfaceMask} from './coffret-perspective';
function glyph(outline:GlyphOutline,x:number,y:number,width:number,height:number,color:string){const f=fittedGlyph(outline,width-5,height-5);return `<g transform="translate(${x} ${y}) scale(${f.scale}) translate(${-f.centerX} ${-f.centerY})"><path d="${outline.d}" fill="${color}" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" paint-order="stroke fill"/></g>`;}
export function closedFaceSvg(model:CoffretModel,font:CoffretFont,pullTab:string){
 const art=artwork[model],text=COFFRET_LETTERING[font][model],color=COFFRET_TEXT_COLORS[model];const [x1,y1,x2,y2]=art.bounds;
 const scale=Math.min(1010/(x2-x1),(text.phrase?335:395)/(y2-y1));
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="650" viewBox="0 0 1200 650"><defs><clipPath id="face"><rect width="1200" height="650" rx="100"/></clipPath></defs><g clip-path="url(#face)"><rect width="1200" height="650" fill="${art.background}"/>${glyph(text.title,600,96,945,88,color.title)}<g transform="translate(600 ${text.phrase?335:370}) scale(${scale}) translate(${-(x1+x2)/2} ${-(y1+y2)/2})">${art.layers.map(l=>`<g transform="${l.transform}"><path d="${l.d}" fill="${l.fill}" fill-rule="evenodd"/></g>`).join('')}</g>${text.phrase?glyph(text.phrase,600,584,1000,66,color.phrase):''}<g transform="translate(720 160) rotate(-13.3 210 150)"><image href="${pullTab}" width="420" height="300" preserveAspectRatio="xMidYMid meet"/></g></g></svg>`;
}
let surfaceMask:Uint8Array|undefined;
function loadImage(url:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('Closed preview unavailable'));i.src=url;});}
async function drawClosedCoffret(model:CoffretModel,font:CoffretFont,body:string,pullTab:string){
 const faceUrl='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(closedFaceSvg(model,font,pullTab));
 const [background,face]=await Promise.all([loadImage(body),loadImage(faceUrl)]);
 const canvas=document.createElement('canvas');canvas.width=CLOSED_WIDTH;canvas.height=CLOSED_HEIGHT;const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Closed preview unavailable');
 const source=document.createElement('canvas');source.width=1200;source.height=650;
 const sourceContext=source.getContext('2d',{willReadFrequently:true});if(!sourceContext)throw Error('Closed face unavailable');sourceContext.drawImage(face,0,0,1200,650);
 const texture=sourceContext.getImageData(0,0,1200,650);
 ctx.drawImage(background,0,0,CLOSED_WIDTH,CLOSED_HEIGHT);
 const result=ctx.getImageData(0,0,CLOSED_WIDTH,CLOSED_HEIGHT);
 surfaceMask??=closedSurfaceMask(result.data,CLOSED_WIDTH,CLOSED_HEIGHT,[700,520]);
 const inverse=invertHomography(faceHomography(1200,650,CLOSED_LID));
 const hex=artwork[model].background;const color=[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
 // Inverse bilinear sampling has no internal triangle edges or visible seams.
 for(let i=0;i<surfaceMask.length;i++)if(surfaceMask[i]){
  const p=i*4,[u,v]=projectFace(inverse,i%CLOSED_WIDTH+.5,Math.floor(i/CLOSED_WIDTH)+.5);
  if(u<0||u>=1199||v<0||v>=649){result.data[p]=color[0];result.data[p+1]=color[1];result.data[p+2]=color[2];continue;}
  const x=Math.floor(u),y=Math.floor(v),fx=u-x,fy=v-y;
  const indexes=[(y*1200+x)*4,(y*1200+x+1)*4,((y+1)*1200+x)*4,((y+1)*1200+x+1)*4];
  const weights=[(1-fx)*(1-fy),fx*(1-fy),(1-fx)*fy,fx*fy];
  let alpha=0;const value=[0,0,0];
  for(let j=0;j<4;j++){const weight=weights[j]*texture.data[indexes[j]+3]/255;alpha+=weight;for(let channel=0;channel<3;channel++)value[channel]+=weight*texture.data[indexes[j]+channel];}
  for(let channel=0;channel<3;channel++)result.data[p+channel]=Math.round(value[channel]+color[channel]*(1-alpha));
 }
 ctx.putImageData(result,0,0);
 return canvas.toDataURL('image/webp',.97);
}

const renderCache=new Map<string,Promise<string>>();
export function renderClosedCoffret(model:CoffretModel,font:CoffretFont,body:string,pullTab:string,colorKey=body):Promise<string>{
 const key=`${model}:${font}:${colorKey}`;const existing=renderCache.get(key);if(existing)return existing;
 if(renderCache.size>=12)renderCache.delete(renderCache.keys().next().value!);
 const pending=drawClosedCoffret(model,font,body,pullTab);renderCache.set(key,pending);pending.catch(()=>renderCache.delete(key));return pending;
}
