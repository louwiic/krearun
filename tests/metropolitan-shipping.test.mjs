import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_METROPOLITAN_SHIPPING as grid, parseMetropolitanShipping, shippingZone, metropolitanQuote, shippingQuoteMetadata, readShippingQuote } from '../lib/metropolitan-shipping.ts';
const quote=weight=>metropolitanQuote(weight,weight,false,false,grid);
test('inclusive Colissimo boundaries follow the supplied grid, including the 500 g minimum',()=>{
 for(const [weight,cents] of [[1,1086],[250,1086],[500,1086],[501,1646],[1000,1646],[1001,2243],[10000,6945],[10001,9731],[30000,18929]]) assert.equal(quote(weight).priceCents,cents);
 for(let index=0;index<grid.rates.length;index++){const rate=grid.rates[index];assert.equal(quote(rate.maxGrams).priceCents,rate.priceCents);if(index+1<grid.rates.length)assert.equal(quote(rate.maxGrams+1).priceCents,grid.rates[index+1].priceCents);}
});
test('mainland excludes other overseas territories and resolves Reunion explicitly',()=>{
 assert.equal(shippingZone('FR','75001'),'FR_METROPOLITAN');assert.equal(shippingZone('FR','20000'),'FR_METROPOLITAN');assert.equal(shippingZone('RE','97430'),'RE');assert.equal(shippingZone('FR','97430'),'RE');
 for(const [country,postal] of [['FR','97200'],['FR','98000'],['FR','00000'],['BE','10000'],['RE','75001']]) assert.throws(()=>shippingZone(country,postal));
});
test('overweight or unknown parcel weights fail even when delivery is offered',()=>{
 for(const weight of [30001,-1,NaN,Infinity])assert.throws(()=>quote(weight));
 assert.throws(()=>metropolitanQuote(200,30001,false,true,grid));
 assert.throws(()=>metropolitanQuote(180,180,true,false,grid));
 const free=metropolitanQuote(0,100,false,false,grid);assert.equal(free.priceCents,0);
 const threshold=metropolitanQuote(600,600,false,true,grid);assert.equal(threshold.baseCents,1646);assert.equal(threshold.priceCents,0);
});
test('invalid editable prices never silently fall back to a cheaper grid',()=>{
 for(const rates of [[{maxGrams:30000,priceCents:1.5,label:'bad'}],[{maxGrams:500,priceCents:1086,label:'missing max'}],[{maxGrams:30000,priceCents:-1,label:'bad'}]]) assert.throws(()=>parseMetropolitanShipping(JSON.stringify({...grid,rates})));
 assert.throws(()=>parseMetropolitanShipping('{broken'));
 assert.equal(parseMetropolitanShipping('').rates[0].priceCents,1086);
});
test('a durable quote preserves the rate version and each amount within Stripe metadata limits',()=>{
 const original=quote(501), metadata=shippingQuoteMetadata(original);
 assert.ok(Object.values(metadata).every(value=>value.length<=500));
 assert.deepEqual(readShippingQuote(metadata),original);
 const edited=parseMetropolitanShipping(JSON.stringify({...grid,version:'next',rates:grid.rates.map(rate=>({...rate,priceCents:rate.priceCents+100}))}));
 assert.equal(metropolitanQuote(501,501,false,false,edited).priceCents,1746);
 assert.equal(readShippingQuote(metadata).priceCents,1646);
 assert.equal(readShippingQuote({}),undefined);
});
