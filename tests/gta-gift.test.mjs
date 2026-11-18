import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-ts.mjs';
const gift=loadTs(new URL('../lib/gta-gift.ts',import.meta.url));
const shipping=loadTs(new URL('../lib/free-shipping.ts',import.meta.url));
test('only paid GTA products unlock gifts; free gifts and unrelated products cannot chain offers',()=>{
 for(const slug of ['porte-boisson-gta-vi','lampe-gta-vi','porte-cles-gta-vi-palmiers','porte-cles-gta-vi-logo'])assert.equal(gift.qualifiesForGtaGift({slug,priceCents:1490}),true);
 for(const [slug,priceCents] of [['porte-cles-gta-vi-logo',0],['gta-offer-keychain',0],['porte-canette-monster',2490],['porte-cles-prenom',1200]])assert.equal(gift.qualifiesForGtaGift({slug,priceCents}),false);
});
test('one gift pair per order, zero euros, selected name and GTA manufacturing instruction persist',()=>{
 const items=gift.gtaGiftOrderItems('Loïc');assert.equal(items.length,2);
 assert.ok(items.every(item=>item.priceCents===0 && item.quantity===1));
 assert.equal(items[1].customName,'Loïc · Police GTA');
 assert.equal(gift.gtaGiftOrderItems('').length,1);
});
test('new standalone keychain includes shipping',()=>assert.equal(shipping.hasFreeShipping(gift.GTA_GIFT_SLUG),true));
