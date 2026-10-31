import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as kits from '../lib/noel-kits.ts';
const require=createRequire(import.meta.url);
const slug='noel-thermoforme-2072645',legacy='noel-2072645-kit';
test('legacy kit remains one decoration and bundle IDs must match their own motif',()=>{
 assert.equal(kits.noelKitCount(slug,legacy),1);assert.equal(kits.noelKitCount(slug,legacy+'-5'),5);
 for(const bad of [legacy+'-0',legacy+'-11','noel-999-kit-5','noel-2072645-ready'])assert.equal(kits.noelKitCount(slug,bad),null);
 assert.equal(kits.noelKitCount('lamp',legacy),null);
});
test('one mould set is charged once; tier totals rise while average per decoration falls',()=>{
 const totals=Array.from({length:10},(_,i)=>kits.noelKitPriceCents(2190,290,i+1));
 assert.equal(totals[0],2190);assert.equal(totals[2],2740);assert.equal(totals[4],3230);assert.equal(totals[9],4410);
 for(let i=1;i<10;i++){assert.ok(totals[i]>totals[i-1]);assert.ok(totals[i]/(i+1)<totals[i-1]/i);}
 for(const n of [0,-1,11,1.5,NaN])assert.throws(()=>kits.noelKitPriceCents(2190,290,n));
});
test('kit quantity discount is not applied twice and ready-made quantity tiers are preserved',()=>{
 const product={slug,quantityDiscounts:[{minQuantity:2,percent:20}]};
 assert.deepEqual(kits.variantQuantityDiscounts(product,legacy+'-5'),[]);assert.deepEqual(kits.variantQuantityDiscounts(product,'ready'),product.quantityDiscounts);
 const variants=kits.noelKitVariants({slug,variants:[{id:legacy+'-5',active:true},{id:legacy+'-3',active:false},{id:legacy,active:true},{id:'ready',active:true}]});
 assert.deepEqual(variants.map(v=>v.id),[legacy,legacy+'-5']);
});
test('bundle selector shows piece counts, a single mould set, total and average prices',()=>{
 const output=ts.transpileModule(readFileSync(new URL('../components/product/NoelKitOptions.tsx',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const mod={exports:{}};new Function('require','module','exports',output)(name=>name==='@/lib/noel-kits'?kits:name==='@/lib/format'?{formatPrice:c=>(c/100).toFixed(2)+' €'}:require(name),mod,mod.exports);
 const variants=[{id:'ready',active:true,priceCents:1490,stock:10},...Array.from({length:10},(_,i)=>({id:i===0?legacy:legacy+'-'+(i+1),active:true,priceCents:kits.noelKitPriceCents(2190,290,i+1),stock:10}))];
 const html=renderToStaticMarkup(createElement(mod.exports.default,{product:{slug,id:'id',variants},selected:variants[5],onSelect:()=>{}}));
 assert.ok(html.includes('5 décorations du même motif'));assert.ok(html.includes('un seul jeu de moules réutilisables'));assert.ok(html.includes('32.30 €'));assert.ok(html.includes('6.46 €'));assert.equal((html.match(/<option/g)||[]).length,10);
});
