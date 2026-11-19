import {PDFDocument,PageSizes,PrintScaling,StandardFonts,rgb,type PDFFont} from 'pdf-lib';
import {mm,parsePostageAddress,parsePostageSettings,postageGeometry,type PostageAddress,type PostageSettings} from './postage-labels';
const printable=(s:string)=>s.replace(/[\u2010-\u2015\u2212]/g,'-').replace(/\u00a0/g,' ');
function wrap(text:string,font:PDFFont,size:number,width:number){const lines:string[]=[];let line='';for(const word of printable(text).split(/\s+/).filter(Boolean)){if(font.widthOfTextAtSize(word,size)>width){if(line){lines.push(line);line='';}let part='';for(const char of word){if(font.widthOfTextAtSize(part+char,size)>width&&part){lines.push(part);part='';}part+=char;}line=part;}else if(font.widthOfTextAtSize(line?line+' '+word:word,size)<=width)line=line?line+' '+word:word;else{lines.push(line);line=word;}}if(line)lines.push(line);return lines;}
export async function generatePostageLabelsPdf(sourceBytes:Uint8Array,settings:PostageSettings,address:PostageAddress,reference=''){
 const s=parsePostageSettings(settings),a=parsePostageAddress(address),g=postageGeometry(s);
 const source=await PDFDocument.load(sourceBytes);if(source.getPageCount()!==1)throw Error('Importe un PDF de timbre d’une seule page.');
 const original=source.getPage(0);if(original.getRotation().angle%360!==0)throw Error('Le PDF du timbre doit être orienté sans rotation.');
 const size=original.getSize(),crop=s.crop;
 if(mm(crop.x+crop.width)>size.width+.1||mm(crop.y+crop.height)>size.height+.1)throw Error('Le recadrage dépasse la page source.');
 const pdf=await PDFDocument.create();pdf.setTitle('Krearun - Timbre et adresse');pdf.setAuthor('Krearun');pdf.catalog.getOrCreateViewerPreferences().setPrintScaling(PrintScaling.None);
 const page=pdf.addPage(PageSizes.A4),regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold),height=page.getHeight();
 page.drawText('KREARUN / TIMBRE + ADRESSE',{x:mm(10),y:height-mm(12),size:11,font:bold});
 page.drawText('A4 - Taille reelle 100 % - Ne pas ajuster a la page - Decouper sur les pointilles',{x:mm(10),y:height-mm(18),size:8,font:regular});
 const left=mm((210-g.width)/2),top=height-mm(32),stampX=left+mm(g.addressWidth+g.gap);
 for(const box of [{x:left,width:g.addressWidth,height:g.addressHeight,label:'ADRESSE'},{x:stampX,width:g.stampWidth,height:g.stampHeight,label:'TIMBRE'}]){
  page.drawText(box.label,{x:box.x,y:top+mm(2),size:7,font:bold,color:rgb(.4,.4,.4)});
  page.drawRectangle({x:box.x,y:top-mm(box.height),width:mm(box.width),height:mm(box.height),borderColor:rgb(.5,.5,.5),borderWidth:.4,borderDashArray:[2,2]});
 }
 const embedded=await pdf.embedPage(original,{left:mm(crop.x),right:mm(crop.x+crop.width),bottom:size.height-mm(crop.y+crop.height),top:size.height-mm(crop.y)});
 page.drawPage(embedded,{x:stampX+mm(g.padding),y:top-mm(g.padding+crop.height),width:mm(crop.width),height:mm(crop.height)});
 const lineWidth=mm(g.addressWidth-6),available=mm(g.addressHeight-7);let fitted:{text:string;font:PDFFont;size:number;advance:number}[]|null=null;
 try{for(const size of [14,13,12,11]){
  const lines=[...wrap(a.name,bold,size+2,lineWidth).map(text=>({text,font:bold,size:size+2,advance:(size+2)*1.2})),...[a.street,a.extra,`${a.postalCode} ${a.city}`,a.country].filter(Boolean).flatMap(text=>wrap(text,regular,size,lineWidth)).map(text=>({text,font:regular,size,advance:size*1.2}))];
  if(lines.reduce((sum,l)=>sum+l.advance,0)<=available){fitted=lines;break;}
 }}catch{throw Error('Un caractère de l’adresse ne peut pas être imprimé. Vérifie le texte.');}
 if(!fitted)throw Error('L’adresse est trop longue pour cette étiquette. Agrandis le paquet ou raccourcis les compléments.');
 let cursor=top-mm(3);for(const line of fitted){page.drawText(line.text,{x:left+mm(3),y:cursor-line.size,font:line.font,size:line.size});cursor-=line.advance;}
 const noteY=top-mm(g.height+9);
 page.drawText(`Paquet ${s.packageWidthMm/10} x ${s.packageHeightMm/10} cm / Marges ${s.marginMm/10} cm par cote`,{x:mm(10),y:noteY,size:9,font:bold});
 page.drawText(`Ensemble a coller : ${g.width.toFixed(1)} x ${g.height.toFixed(1)} mm. Timbre conserve a taille d'origine.`,{x:mm(10),y:noteY-mm(5),size:8,font:regular});
 if(reference)page.drawText(printable(reference).slice(0,95),{x:mm(10),y:noteY-mm(10),size:8,font:regular});
 page.drawLine({start:{x:mm(10),y:mm(18)},end:{x:mm(110),y:mm(18)},thickness:.5});page.drawText('Regle de controle : 100 mm',{x:mm(10),y:mm(13),size:8,font:regular});
 return {bytes:await pdf.save(),geometry:g};
}
