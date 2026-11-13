import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-ts.mjs';
const {monsterColorLabel,parseMonsterColors,monsterColorNames,MONSTER_MULTICOLOR_CENTS,isMonsterPremium,MONSTER_PREMIUM_COLORS}=loadTs(new URL('../lib/monster-multicolor.ts',import.meta.url));
const {cartUnitPriceCents}=loadTs(new URL('../lib/quantity-discounts.ts',import.meta.url));
const {packCheckoutItems,readCheckoutItems}=loadTs(new URL('../lib/checkout-item-metadata.ts',import.meta.url));
test('three distinct color choices survive cart and payment metadata',()=>{
 const parts={top:'Bleu reflet mauve',bottom:'Noir Monster',claws:'Vert phosphorescent'};
 const label=monsterColorLabel(parts);
 assert.deepEqual(parseMonsterColors(label),parts);
 assert.deepEqual(monsterColorNames(label),Object.values(parts));
 assert.equal(readCheckoutItems(packCheckoutItems([{c:label}])),JSON.stringify([{c:label}]));
 assert.notEqual(label,monsterColorLabel({...parts,bottom:'Blanc'}));
});
test('ordinary colors have no multicolor configuration and malformed input is rejected',()=>{
 for(const value of ['Blanc','Multicolore','Multicolore · Haut : Noir',null,{},'x'.repeat(241)])assert.equal(parseMonsterColors(value),undefined);
 assert.deepEqual(monsterColorNames('Blanc'),['Blanc']);
});
test('2 euro option is charged for each piece, without quantity discount on the option',()=>{
 assert.equal(MONSTER_MULTICOLOR_CENTS,200);
 assert.equal(cartUnitPriceCents({priceCents:1990,personalizationPriceCents:200,quantity:1}),1990);
 assert.equal(cartUnitPriceCents({priceCents:1990,personalizationPriceCents:200,quantity:2,quantityDiscounts:[{minQuantity:2,percent:5}]}),1901);
});

test('premium is exactly the black rings and silver claws preset',()=>{
 assert.equal(isMonsterPremium(MONSTER_PREMIUM_COLORS),true);
 assert.equal(isMonsterPremium({...MONSTER_PREMIUM_COLORS,top:'Blanc'}),false);
 assert.equal(isMonsterPremium({...MONSTER_PREMIUM_COLORS,claws:'Rouge'}),false);
 assert.equal(isMonsterPremium(undefined),false);
});
