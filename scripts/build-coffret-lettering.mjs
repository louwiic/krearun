import {readFile,writeFile} from 'node:fs/promises';
import opentype from 'opentype.js';
const catalogue=JSON.parse(await readFile('data/coffrets-catalogue.json'));
const fonts=JSON.parse(await readFile('data/coffrets-fonts.json'));
const result={};
function outline(font,text){
 if(!text)return null;
 for(const letter of text)if(!font.hasChar(letter))throw Error(`Missing glyph ${letter}`);
 const path=font.getPath(text,0,0,100,{kerning:true});const b=path.getBoundingBox();
 return {d:path.toPathData(2),bounds:[b.x1,b.y1,b.x2,b.y2]};
}
for(const entry of fonts){
 const bytes=await readFile(`public/coffrets/fonts/${entry.file}`);
 const font=opentype.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
 result[entry.code]={};
 for(const [name,model] of Object.entries(catalogue.modeles))result[entry.code][name]={title:outline(font,model.titre),phrase:outline(font,model.phrase)};
}
await writeFile('data/coffrets-lettering.json',JSON.stringify(result)+'\n');
console.log(`${fonts.length} polices × ${Object.keys(catalogue.modeles).length} motifs vectorisés`);
