import test from 'node:test';
import assert from 'node:assert/strict';
import {colorSwatchStyle} from '../lib/color-swatches.ts';
import {availableInventoryPalette} from '../lib/color-availability.ts';
test('material reference swatch keeps a solid fallback and does not replace product photographs',()=>{
 const color={name:'Cuivre rouge',hex:'#B96A3E',swatchImage:'https://krearun.re/api/r2/site/inventory/copper.png',image:'/products/red-cup.webp'};
 const style=colorSwatchStyle(color);assert.equal(style.backgroundColor,color.hex);assert.match(style.backgroundImage,/copper.png/);assert.ok(!style.backgroundImage.includes('red-cup'));assert.equal(style.backgroundPosition,'50% 65%');
 assert.deepEqual(colorSwatchStyle({hex:'#ffffff'}),{backgroundColor:'#ffffff'});
});
test('unsafe image URLs cannot become swatch backgrounds',()=>{
 for(const swatchImage of ['javascript:alert(1)','data:text/html,foo','file:///secret','http://example.com/photo.png'])assert.deepEqual(colorSwatchStyle({hex:'#000000',swatchImage}),{backgroundColor:'#000000'});
 assert.match(colorSwatchStyle({hex:'#000000',swatchImage:'/api/r2/site/inventory/ref.png'}).backgroundImage,/ref.png/);
});
test('available inventory palettes preserve material previews while ignoring unavailable spools',()=>{
 const colors=availableInventoryPalette([{name:'Cuivre rouge',hex:'#B96A3E',active:true,swatchImage:'https://example.com/copper.png'},{name:'Vert phosphorescent',hex:'#8FE55B',active:false,swatchImage:'https://example.com/green.png'}]);
 assert.equal(colors.length,1);assert.equal(colors[0].swatchImage,'https://example.com/copper.png');
});
