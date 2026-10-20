import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
function load(path) {
 const source = readFileSync(new URL(path, import.meta.url), 'utf8');
 const {outputText} = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 const module={exports:{}};
 new Function('module','exports',outputText)(module,module.exports);
 return module.exports;
}
const lamp=load('../lib/lamp-personalization.ts');
const metadata=load('../lib/checkout-item-metadata.ts');
const fields={initial:'l',text:'Louane',secondName:'Ketty',motif:'Étoiles',otherMotif:'',hearts:'2',inscription:'Éphésiens 5:31'};
test('letter, text and alternative symbols survive checkout without first-name truncation',()=>{
 const details=lamp.buildLampPersonalization(lamp.LETTER_LAMP_SLUG,{...fields,motif:'Autre',otherMotif:'Papillons'});
 assert.equal(details,'Lettre : L | Texte : Louane | Motif : Papillons');
 assert.equal(lamp.normalizeLampPersonalization(lamp.LETTER_LAMP_SLUG,details),details);
 assert.equal(lamp.buildLampPersonalization(lamp.LETTER_LAMP_SLUG,{...fields,initial:''}),'');
 assert.equal(lamp.buildLampPersonalization(lamp.LETTER_LAMP_SLUG,{...fields,motif:'Autre'}),'');
});
test('Double Love requires a second name only for two hearts and preserves the inscription',()=>{
 const details=lamp.buildLampPersonalization(lamp.LOVE_LAMP_SLUG,fields);
 assert.equal(lamp.normalizeLampPersonalization(lamp.LOVE_LAMP_SLUG,details),details);
 assert.ok(details.includes('Prénom 2 : Ketty'));
 assert.ok(details.includes('Inscription : Éphésiens 5:31'));
 assert.equal(lamp.buildLampPersonalization(lamp.LOVE_LAMP_SLUG,{...fields,secondName:''}),'');
 const single=lamp.buildLampPersonalization(lamp.LOVE_LAMP_SLUG,{...fields,hearts:'1',secondName:''});
 assert.equal(lamp.normalizeLampPersonalization(lamp.LOVE_LAMP_SLUG,single),single);
 assert.ok(!single.includes('Prénom 2'));
 assert.equal(lamp.normalizeLampPersonalization(lamp.LOVE_LAMP_SLUG,'un texte arbitraire'),'');
});
test('multiple personalized lamps fit Stripe metadata and restore exactly, including older orders',()=>{
 const items=Array.from({length:5},(_,i)=>({p:String(i),n:lamp.buildLampPersonalization(lamp.LOVE_LAMP_SLUG,fields)}));
 const packed=metadata.packCheckoutItems(items);
 assert.ok(Object.keys(packed).length>1);
 assert.ok(Object.values(packed).every(value=>Array.from(value).length<=450));
 assert.deepEqual(JSON.parse(metadata.readCheckoutItems(packed)),items);
 assert.deepEqual(JSON.parse(metadata.readCheckoutItems({items:JSON.stringify(items)})),items);
});
