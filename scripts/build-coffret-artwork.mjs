import {readFile,writeFile} from 'node:fs/promises';
import {DOMParser} from '@xmldom/xmldom';
const catalogue=JSON.parse(await readFile('data/coffrets-catalogue.json'));
const top={Ananas:112,Coco:140,Banane:190,'Girl-box':90,Sardine:133,Hibiscus:100,Mangue:110,Letchi:100};
const bottom={Ananas:550,Coco:615,Banane:505,'Girl-box':625,Sardine:505,Hibiscus:625,Mangue:600,Letchi:620};
const result={};
for(const [model,item] of Object.entries(catalogue.modeles)){
 const root=new DOMParser().parseFromString(await readFile(`public/coffrets/${item.svg}`,'utf8'),'image/svg+xml');
 const groups=root.getElementsByTagName('g');const layers=[];let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(let i=0;i<groups.length;i++){
  const g=groups.item(i);if(g.getAttribute('id')==='fond')continue;
  const transform=g.getAttribute('transform');const tr=transform.match(/translate\(([^)]+)\) scale\(([^)]+)\)/);
  if(!tr)throw Error('Unsupported artwork transform');
  const [tx,ty]=tr[1].split(/\s+/).map(Number),[sx,sy]=tr[2].split(/\s+/).map(Number);let kept=[];
  const paths=g.getElementsByTagName('path');
  for(let j=0;j<paths.length;j++)for(const d of paths.item(j).getAttribute('d').split(/(?=M)/)){
   const values=(d.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);if(!values.length)continue;
   const xs=values.filter((_,k)=>k%2===0).map(x=>tx+sx*x),ys=values.filter((_,k)=>k%2===1).map(y=>ty+sy*y);
   const x1=Math.min(...xs),y1=Math.min(...ys),x2=Math.max(...xs),y2=Math.max(...ys);
   if(x1<(model==='Coco'?200:65)||x2>(model==='Coco'?1000:1135)||y1<top[model]||y2>bottom[model]||(x2-x1)*(y2-y1)<12)continue;
   kept.push(d);minX=Math.min(minX,x1);minY=Math.min(minY,y1);maxX=Math.max(maxX,x2);maxY=Math.max(maxY,y2);
  }
  if(kept.length)layers.push({fill:g.getAttribute('fill'),transform,d:kept.join('')});
 }
 if(!layers.length)throw Error(`Empty illustration ${model}`);
 const background=Array.from({length:groups.length},(_,i)=>groups.item(i)).find(g=>g.getAttribute('id')==='fond').getAttribute('fill');
 result[model]={background,bounds:[minX,minY,maxX,maxY],layers};
 console.log(model,layers.length,'couleurs',result[model].bounds.map(Math.round));
}
await writeFile('data/coffrets-artwork.json',JSON.stringify(result)+'\n');
