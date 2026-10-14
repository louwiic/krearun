import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

const ALLOWED = new Set(["svg","g","path","rect","circle","ellipse","line","polyline","polygon","defs","linearGradient","radialGradient","stop","clipPath","mask","pattern","title","desc","use","text","tspan","style"]);
function checkPaint(value:string) {
  const localReferences=value.replace(/url\(\s*(['"]?)#[\w:.-]+\1\s*\)/gi,'');
  if (/url\s*\(|@|expression\s*\(|javascript:|data:|https?:|file:|[\\\x00-\x08\x0b\x0c\x0e-\x1f]/i.test(localReferences)) throw new Error("Le SVG doit contenir uniquement des formes et des couleurs, sans ressources externes.");
}
// SVG uploads are parsed as XML and rasterized server-side; never inserted into HTML.
export function sanitizeHolderSvg(buffer:Buffer):Buffer {
  const source=buffer.toString('utf8').replace(/^\uFEFF/,'');
  if (/<!DOCTYPE|<!ENTITY|<\?(?!xml\s)/i.test(source)) throw new Error("Les déclarations externes ne sont pas acceptées dans un SVG.");
  const document=new DOMParser({onError:()=>{throw new Error("Le fichier SVG est mal formé.");}}).parseFromString(source,'image/svg+xml');
  const root=document.documentElement;
  if (!root || root.localName!=='svg' || root.namespaceURI!=='http://www.w3.org/2000/svg')throw new Error("Choisissez un véritable fichier SVG.");
  const elements=document.getElementsByTagName('*');
  if(elements.length>5000)throw new Error("Le SVG est trop complexe. Simplifiez ses tracés avant de l’importer.");
  for(let i=0;i<elements.length;i++) {
    const element=elements.item(i)!;
    if(!ALLOWED.has(element.localName??'')||element.namespaceURI!=='http://www.w3.org/2000/svg')throw new Error("Ce SVG contient un élément non pris en charge. Exportez un logo vectoriel simple.");
    if(element.localName==='style')checkPaint(element.textContent??'');
    for(let j=0;j<element.attributes.length;j++) {
      const attribute=element.attributes.item(j)!;
      if(/^on/i.test(attribute.localName??''))throw new Error("Les scripts ne sont pas acceptés dans un SVG.");
      if(attribute.localName==='href'&&!/^#[\w:.-]+$/.test(attribute.value))throw new Error("Les images et ressources externes ne sont pas acceptées dans un SVG.");
      if(!attribute.name.startsWith('xmlns'))checkPaint(attribute.value);
    }
  }
  // Vector coordinate systems may be very large; bound raster dimensions before
  // handing the document to Sharp while preserving the vector viewBox.
  const box=(root.getAttribute('viewBox')??'').trim().split(/[\s,]+/).map(Number);
  const width=box.length===4?box[2]:parseFloat(root.getAttribute('width')??'');
  const height=box.length===4?box[3]:parseFloat(root.getAttribute('height')??'');
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||Math.max(width/height,height/width)>100)throw new Error("Le SVG doit avoir des dimensions ou un viewBox valides.");
  if(box.length!==4)root.setAttribute('viewBox',`0 0 ${width} ${height}`);
  const scale=2048/Math.max(width,height);
  root.setAttribute('width',String(Math.max(1,Math.round(width*scale))));
  root.setAttribute('height',String(Math.max(1,Math.round(height*scale))));
  return Buffer.from(new XMLSerializer().serializeToString(root));
}
