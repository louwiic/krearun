import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import sharp from 'sharp';import {PDFDocument} from 'pdf-lib';
const run=promisify(execFile);
export async function inspectPostagePdf(bytes:Uint8Array){
 if(bytes.length>15*1024*1024||!Buffer.from(bytes.subarray(0,1024)).includes(Buffer.from('%PDF-')))throw Error('Importe un PDF de 15 Mo maximum.');
 const pdf=await PDFDocument.load(bytes);if(pdf.getPageCount()!==1)throw Error('Importe un PDF contenant une seule page de timbre.');const size=pdf.getPage(0).getSize();
 if(pdf.getPage(0).getRotation().angle%360!==0)throw Error('Importe un PDF sans rotation.');
 if(size.width>1800||size.height>1800)throw Error('La page du PDF est trop grande.');
 const dir=await mkdtemp(path.join(os.tmpdir(),'krearun-postage-'));
 try{
  const source=path.join(dir,'source.pdf'),target=path.join(dir,'page');await writeFile(source,bytes);
  await run('pdftoppm',['-f','1','-singlefile','-r','144','-png',source,target],{timeout:30000,maxBuffer:1024*1024});
  const preview=await readFile(target+'.png');const meta=await sharp(preview).metadata();
  const trimmed=await sharp(preview).flatten({background:'#fff'}).trim({background:'#fff',threshold:12}).toBuffer({resolveWithObject:true});
  const sx=size.width/(meta.width||1)*25.4/72,sy=size.height/(meta.height||1)*25.4/72;
  const x=Math.max(0,Math.abs(trimmed.info.trimOffsetLeft||0)*sx-2),y=Math.max(0,Math.abs(trimmed.info.trimOffsetTop||0)*sy-2);
  const width=Math.min(size.width*25.4/72-x,trimmed.info.width*sx+4),height=Math.min(size.height*25.4/72-y,trimmed.info.height*sy+4);
  if(width<10||height<10)throw Error('Aucun timbre détecté.');
  return {preview,crop:{x,y,width,height}};
 }finally{await rm(dir,{recursive:true,force:true});}
}
