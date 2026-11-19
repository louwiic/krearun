import test from 'node:test';import assert from 'node:assert/strict';
import {PDFDocument,PageSizes,PDFName,PDFDict,PDFArray} from 'pdf-lib';
import {loadTs} from './load-ts.mjs';
const shared=loadTs(new URL('../lib/postage-labels.ts',import.meta.url));
const generator=loadTs(new URL('../lib/postage-labels-pdf.ts',import.meta.url));
const address={name:'Élodie EXEMPLE',street:'12 rue des Tamarins',extra:'Bâtiment A',postalCode:'97410',city:'Saint-Pierre',country:'LA REUNION'};
const settings={...shared.DEFAULT_POSTAGE_SETTINGS,crop:{x:5,y:12,width:65,height:36}};
async function source(){const doc=await PDFDocument.create();const page=doc.addPage(PageSizes.A4);page.drawText('TIMBRE TEST',{x:25,y:760,size:12});return doc.save();}
test('23 by 16 cm with five centimetres on every side leaves exactly 13 by 6 cm',()=>{
 const g=shared.postageGeometry(settings);assert.equal(g.availableWidth,130);assert.equal(g.availableHeight,60);assert.equal(g.width,130);assert.equal(g.height,60);assert.equal(g.stampWidth,69);assert.equal(g.addressWidth,56);
});
test('larger parcels keep margins and remain printable on one A4',()=>{
 const g=shared.postageGeometry({...settings,packageWidthMm:300,packageHeightMm:200});assert.equal(g.availableWidth,200);assert.ok(g.width<=190);assert.equal(g.addressWidth,110);
});
test('insufficient parcel area, invalid dimensions and a full untrimmed A4 are rejected instead of shrinking postage',()=>{
 assert.throws(()=>shared.postageGeometry({...settings,packageWidthMm:160}));
 assert.throws(()=>shared.postageGeometry({...settings,crop:{x:0,y:0,width:210,height:297}}));
 assert.throws(()=>shared.parsePostageSettings({...settings,marginMm:NaN}));
 assert.throws(()=>shared.parsePostageSettings({...settings,crop:{x:-1,y:0,width:60,height:35}}));
});
test('manual address requires delivery fields and retains French accents',()=>{
 assert.equal(shared.parsePostageAddress(address).name,'Élodie EXEMPLE');assert.throws(()=>shared.parsePostageAddress({...address,street:''}));assert.throws(()=>shared.parsePostageAddress({...address,name:'x'.repeat(161)}));
});
test('generated PDF is one A4 at actual print size and embeds a vector source crop',async()=>{
 const original=await source(),before=new Uint8Array(original);const result=await generator.generatePostageLabelsPdf(original,settings,address,'Test');assert.deepEqual(original,before);
 const doc=await PDFDocument.load(result.bytes);assert.equal(doc.getPageCount(),1);const page=doc.getPage(0);assert.ok(Math.abs(page.getWidth()-PageSizes.A4[0])<.01);assert.ok(Math.abs(page.getHeight()-PageSizes.A4[1])<.01);
 assert.equal(String(doc.catalog.lookup(PDFName.of('ViewerPreferences'),PDFDict).get(PDFName.of('PrintScaling'))),'/None');
 const forms=doc.context.enumerateIndirectObjects().map(([,object])=>object).filter(object=>object.dict&&String(object.dict.get(PDFName.of('Subtype')))==='/Form');assert.equal(forms.length,1);
 const bbox=forms[0].dict.lookup(PDFName.of('BBox'),PDFArray).asArray().map(n=>n.asNumber());assert.ok(Math.abs(bbox[2]-bbox[0]-shared.mm(65))<.001);assert.ok(Math.abs(bbox[3]-bbox[1]-shared.mm(36))<.001);
});
test('invalid crop beyond source page, multiple pages and overlong addresses cannot generate a shipping label',async()=>{
 const bytes=await source();await assert.rejects(generator.generatePostageLabelsPdf(bytes,{...settings,crop:{x:200,y:0,width:65,height:36}},address));
 const doc=await PDFDocument.create();doc.addPage();doc.addPage();await assert.rejects(generator.generatePostageLabelsPdf(await doc.save(),settings,address));
 await assert.rejects(generator.generatePostageLabelsPdf(bytes,settings,{...address,name:'MOT '.repeat(40),street:'LONGUE ADRESSE '.repeat(10)}));
});
test('all label endpoints require an admin session before reading documents or changing records',async()=>{
 const mocks={'@/lib/auth':{isAdmin:async()=>false},'@/lib/store':{},'@/lib/postage-labels':{},'@/lib/postage-labels-pdf':{},'@/lib/postage-label-inspect':{}};
 for(const [endpoint,method]of [['route.ts','GET'],['route.ts','POST'],['[id]/compose/route.ts','POST'],['[id]/file/route.ts','GET'],['[id]/route.ts','PATCH']]){
  const api=loadTs(new URL('../app/api/admin/shipping-labels/'+endpoint,import.meta.url),mocks);assert.equal((await api[method](new Request('http://localhost/api/admin/shipping-labels'),{params:Promise.resolve({id:'anything'})})).status,401);
 }
});
