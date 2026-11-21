import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import opentype from 'opentype.js';
import {loadTs} from './load-ts.mjs';
const c=loadTs(new URL('../lib/coffrets.ts',import.meta.url));
const lettering=loadTs(new URL('../lib/coffret-lettering.ts',import.meta.url));
test('all four robust font binaries are licensed, hashed and have distinct glyph outlines matching the catalogue text',()=>{
 assert.equal(lettering.COFFRET_FONTS.length,4);
 const shapes=new Set();
 for(const font of lettering.COFFRET_FONTS){
  const bytes=readFileSync(new URL(`../public/coffrets/fonts/${font.file}`,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),font.sha256);
  assert.match(readFileSync(new URL(`../public/coffrets/fonts/${font.license}`,import.meta.url),'utf8'),/SIL OPEN FONT LICENSE/);
  const parsed=opentype.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
  for(const model of c.COFFRET_MODELS){
   const text=c.COFFRET_CATALOGUE.modeles[model];const paths=lettering.COFFRET_LETTERING[font.code][model];
   assert.equal(paths.title.d,parsed.getPath(text.titre,0,0,100,{kerning:true}).toPathData(2));
   assert.equal(paths.phrase?.d||'',text.phrase?parsed.getPath(text.phrase,0,0,100,{kerning:true}).toPathData(2):'');
   assert.ok(existsSync(new URL(`../public/coffrets/${text.fond_sans_texte}`,import.meta.url)));
  }
  shapes.add(lettering.COFFRET_LETTERING[font.code].Sardine.title.d);
 }
 assert.equal(shapes.size,4);
});
test('every title and long subtitle fits its zone including descenders, capitals and spaces',()=>{
 for(const font of lettering.COFFRET_FONTS)for(const model of c.COFFRET_MODELS){
  const paths=lettering.COFFRET_LETTERING[font.code][model];
  for(const [outline,width,height] of [[paths.title,460,52],[paths.phrase,525,42]]){
   if(!outline)continue;
   const [x1,y1,x2,y2]=outline.bounds;const fit=lettering.fittedGlyph(outline,width,height);
   assert.ok(Number.isFinite(fit.scale)&&fit.scale>0);
   assert.ok((x2-x1)*fit.scale<=width+1e-8);assert.ok((y2-y1)*fit.scale<=height+1e-8);
  }
 }
});
test('server freezes the real chosen font file and hash, discarding forged manufacture instructions',()=>{
 for(const font of lettering.COFFRET_FONTS){
  const config=c.coffretConfiguration({formule:'coffret_avec_poissons',format:'petit',modele:'Coco',couleur:'bleu',police:font.code,policeNom:'forged',policeSha256:'forged',policeFichier:'evil.ttf'});
  assert.equal(config.policeNom,font.name);assert.equal(config.policeSha256,font.sha256);assert.equal(config.policeFichier,font.file);
  assert.ok(c.coffretDetails(config).some(d=>d.label==='Police'&&d.value.includes(font.name)));
 }
});


test('thin script fonts are unavailable for new configurations',()=>{
 for(const police of ['F1','F5','F6','F7','F9'])assert.throws(()=>c.coffretConfiguration({formule:'coffret_avec_poissons',format:'petit',modele:'Coco',couleur:'bleu',police}),/trop fine/);
});
