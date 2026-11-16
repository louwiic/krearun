import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-ts.mjs';
const shipping=loadTs(new URL('../lib/free-shipping.ts',import.meta.url));
const categories=loadTs(new URL('../lib/categories.ts',import.meta.url));
test('GTA category is visible and included in the collections navigation',()=>{
 const visible=categories.getVisibleCategories('[]');
 assert.equal(visible.find(c=>c.value==='gta-6').label,'GTA 6 · Exclusivité');
 assert.ok(categories.groupStoreCategories(visible).find(g=>g.id==='collections').categories.some(c=>c.value==='gta-6'));
});
test('the four individual GTA keychains include shipping while lamp and holder retain parcel shipping',()=>{
 const slugs=['porte-cles-gta-vi-r-etoile','porte-cles-gta-vi-personnage','porte-cles-gta-vi-logo','porte-cles-gta-vi-vice-city'];
 for(const slug of slugs){assert.ok(shipping.hasFreeShipping(slug));assert.equal(shipping.billableProductWeight({slug,weightGrams:30},4),0);}
 assert.equal(shipping.billableWeight([...slugs.map(slug=>({slug,weightGrams:30,quantity:1})),{slug:'lampe-gta-vi',weightGrams:600,quantity:1}]),600);
 assert.equal(shipping.hasFreeShipping('porte-boisson-gta-vi'),false);
});
