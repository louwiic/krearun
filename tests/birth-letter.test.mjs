import test from 'node:test';import assert from 'node:assert/strict';import {loadTs} from './load-ts.mjs';
const {buildBirthLetter,normalizeBirthLetter,EMPTY_BIRTH_LETTER,BIRTH_LETTER_SLUG}=loadTs(new URL('../lib/birth-letter.ts',import.meta.url));
const lamps=loadTs(new URL('../lib/lamp-personalization.ts',import.meta.url));
const {packCheckoutItems,readCheckoutItems}=loadTs(new URL('../lib/checkout-item-metadata.ts',import.meta.url));
const fields={...EMPTY_BIRTH_LETTER,initial:'l',name:'Lili',date:'2026-10-17',time:'19:35',weight:'3090',length:'49',colors:'Rose et blanc',note:'Prénom en bas'};
test('all birth details survive checkout metadata and remain readable in manufacturing orders',()=>{const text=buildBirthLetter(fields);assert.ok(text.includes('Prénom : Lili'));assert.ok(text.includes('Poids : 3090 g'));assert.equal(normalizeBirthLetter(text),text);assert.ok(lamps.isPersonalizedLamp(BIRTH_LETTER_SLUG));assert.equal(lamps.normalizeLampPersonalization(BIRTH_LETTER_SLUG,text),text);const packed=packCheckoutItems([{n:text},{n:text},{n:text}]);assert.deepEqual(JSON.parse(readCheckoutItems(packed)),[{n:text},{n:text},{n:text}]);});
test('selected birth-information motifs require valid values and unknown motifs are rejected',()=>{for(const invalid of [{initial:''},{name:''},{motifs:[]},{motifs:['Inconnu']},{date:'2026-02-30'},{time:'25:01'},{weight:'0'},{length:'120'}])assert.equal(buildBirthLetter({...fields,...invalid}),'');assert.equal(normalizeBirthLetter(buildBirthLetter(fields)+' | Texte : surprise'),'');});
test('decorative-only versions do not require birth information or expose deselected values',()=>{const text=buildBirthLetter({...fields,motifs:['Lapin','Papillon']});assert.ok(text);assert.ok(!text.includes('3090'));assert.ok(!text.includes('19:35'));assert.equal(normalizeBirthLetter(text),text);});

test('no more than six distinct symbols are accepted',()=>{
 assert.ok(buildBirthLetter(fields));
 assert.equal(buildBirthLetter({...fields,motifs:[...fields.motifs,'Papillon']}),'');
 assert.equal(buildBirthLetter({...fields,motifs:['Ourson','Ourson']}),'');
});

test('a free-form symbol counts toward six and survives the manufacturing summary',()=>{
 const custom={...fields,motifs:fields.motifs.slice(0,5),customSymbol:'Petit renard'};
 const text=buildBirthLetter(custom);assert.ok(text.includes('Symbole libre : Petit renard'));assert.equal(normalizeBirthLetter(text),text);
 assert.equal(buildBirthLetter({...fields,customSymbol:'Petit renard'}),'');
 const alone=buildBirthLetter({...fields,motifs:[],customSymbol:'Petit renard'});assert.ok(alone);assert.equal(normalizeBirthLetter(alone),alone);
});
