import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-ts.mjs';
import {readFileSync} from 'node:fs';
const {recolorCoffretPixels,rgbHsl}=loadTs(new URL('../lib/coffret-color.ts',import.meta.url));
const palette=loadTs(new URL('../lib/coffrets.ts',import.meta.url)).COFFRET_COLORS;
test('changing the body colour preserves jewellery, cloth and ivory inserts',()=>{
 for(const target of palette){
  const pixels=new Uint8ClampedArray(10*10*4).fill(255);
  const set=(x,y,rgb)=>pixels.set([...rgb,255],(y*10+x)*4);
  set(2,6,[242,155,4]);set(6,2,[242,155,4]);set(3,6,[238,235,215]);set(4,6,[225,190,110]);set(0,0,[242,155,4]);
  recolorCoffretPixels(pixels,10,10,target.hex);
  const get=(x,y)=>Array.from(pixels.slice((y*10+x)*4,(y*10+x)*4+3));
  assert.deepEqual(get(3,6),[238,235,215]);assert.deepEqual(get(4,6),[225,190,110]);assert.deepEqual(get(0,0),[242,155,4]);
  const expected=rgbHsl(...target.hex.slice(1).match(/../g).map(v=>parseInt(v,16)));
  const body=rgbHsl(...get(2,6)),rim=rgbHsl(...get(6,2));
  assert.ok(Math.abs(body[0]-expected[0])<2);assert.ok(Math.abs(rim[0]-expected[0])<2);
 }
});
test('neutral silver stays desaturated and invalid colour values fail clearly',()=>{
 const pixels=new Uint8ClampedArray(400).fill(255);pixels.set([242,155,4,255],(6*10+2)*4);
 recolorCoffretPixels(pixels,10,10,'#b6bdc4');assert.ok(rgbHsl(...pixels.slice((6*10+2)*4,(6*10+2)*4+3))[1]<.15);
 assert.throws(()=>recolorCoffretPixels(pixels,10,10,'invalid'));
});
test('all eight isolated illustrations have bounded, nonempty coloured vector layers',()=>{
 const arts=JSON.parse(readFileSync(new URL('../data/coffrets-artwork.json',import.meta.url)));
 assert.equal(Object.keys(arts).length,8);
 for(const [model,art] of Object.entries(arts)){
  assert.ok(art.layers.length>0,model);const [x1,y1,x2,y2]=art.bounds;
  assert.ok(x2>x1&&y2>y1&&x1>=65&&x2<=1135&&y1>=90&&y2<=625,model);
  for(const layer of art.layers){assert.match(layer.fill,/^#[a-f0-9]{6}$/i);assert.match(layer.d,/^M/);assert.ok(!/NaN|Infinity/.test(layer.d));}
 }
});

test('pull tab colour mapping covers the whole cutout and preserves transparent holes and contact shadow',()=>{
 const pixels=new Uint8ClampedArray([242,155,4,255,0,0,0,0,0,0,0,90]);
 recolorCoffretPixels(pixels,3,1,'#3277be',true);
 assert.ok(rgbHsl(...pixels.slice(0,3))[0]>200);
 assert.equal(pixels[3],255);
 assert.deepEqual(Array.from(pixels.slice(4)),[0,0,0,0,0,0,0,90]);
});
