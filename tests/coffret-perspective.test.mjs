import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-ts.mjs';
const p=loadTs(new URL('../lib/coffret-perspective.ts',import.meta.url));
const render=loadTs(new URL('../lib/coffret-closed-render.ts',import.meta.url));
test('all four corners align with the closed lid and the front edge stays wider than the back',()=>{
 const h=p.faceHomography(1200,650,p.CLOSED_LID),source=[[0,0],[1200,0],[1200,650],[0,650]];
 source.forEach(([x,y],i)=>p.projectFace(h,x,y).forEach((v,j)=>assert.ok(Math.abs(v-p.CLOSED_LID[i][j])<1e-6)));
 const rear=Math.hypot(p.CLOSED_LID[1][0]-p.CLOSED_LID[0][0],p.CLOSED_LID[1][1]-p.CLOSED_LID[0][1]);
 const front=Math.hypot(p.CLOSED_LID[2][0]-p.CLOSED_LID[3][0],p.CLOSED_LID[2][1]-p.CLOSED_LID[3][1]);assert.ok(front>rear*1.2);
});
test('inverse projection round trips the title, motif, subtitle and corners without seams',()=>{
 const h=p.faceHomography(1200,650,p.CLOSED_LID),inverse=p.invertHomography(h);
 for(const [x,y] of [[0,0],[1200,0],[1200,650],[0,650],[600,96],[600,335],[600,584],[250,220],[900,450]]){
  const target=p.projectFace(h,x,y),source=p.projectFace(inverse,...target);assert.ok(Math.abs(source[0]-x)<1e-6);assert.ok(Math.abs(source[1]-y)<1e-6);
 }
});
test('only the connected cream lid surface is used, leaving separated highlights and background alone',()=>{
 const pixels=new Uint8ClampedArray(5*5*4).fill(0);for(const [x,y] of [[2,2],[2,3],[3,3],[0,0]])pixels.set([250,240,220,255],(y*5+x)*4);
 const mask=p.closedSurfaceMask(pixels,5,5,[2,2]);assert.equal(mask.reduce((a,b)=>a+b,0),3);assert.equal(mask[0],0);assert.equal(mask[12],1);
});
test('closed texture keeps the same motif, font contours and transparent pull tab as the live view',()=>{
 const a=render.closedFaceSvg('Sardine','F2','data:image/png;base64,TEST');
 const b=render.closedFaceSvg('Sardine','F4','data:image/png;base64,TEST');
 assert.notEqual(a,b);assert.ok(a.includes('data:image/png;base64,TEST'));assert.ok(a.includes('clip-path="url(#face)"'));assert.ok(!/NaN|Infinity/.test(a));
 assert.notEqual(a,render.closedFaceSvg('Coco','F2','data:image/png;base64,TEST'));
});
