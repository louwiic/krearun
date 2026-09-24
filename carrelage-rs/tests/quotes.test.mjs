import test from 'node:test';
import assert from 'node:assert/strict';
import { newQuote, floorArea, totalCents, validQuote, roomArea } from '../lib/quotes.ts';

test('only selected rooms feed the floor area and pricing', () => {
  const q = newQuote();
  Object.assign(q.rooms[0], {selected:true,length:5,width:4});
  Object.assign(q.rooms[1], {selected:false,length:7,width:3});
  q.lines[0].price=30;
  q.lines.push({id:'plinthes',label:'Plinthes',unit:'ml',quantity:18,price:8,source:'manual'});
  assert.equal(floorArea(q),20);
  assert.equal(totalCents(q),74400);
  q.rooms[0].selected=false;
  assert.equal(totalCents(q),14400);
});
test('manual surveyed area and cent rounding', () => {
  const q=newQuote();
  Object.assign(q.rooms[0],{selected:true,area:12.34});
  q.lines[0].price=19.99;
  assert.equal(roomArea(q.rooms[0]),12.34);
  assert.equal(totalCents(q),24668);
});
test('rejects invalid manufacturing values, prices and executable plan data', () => {
  const q=newQuote();
  assert.equal(validQuote(q),true);
  assert.equal(validQuote({...q,answers:{screedDepth:'6'}}),false);
  assert.equal(validQuote({...q,answers:{screedDepth:'5'}}),true);
  assert.equal(validQuote({...q,answers:{showerLength:'-4'}}),false);
  assert.equal(validQuote({...q,plan:'data:image/svg+xml,<svg/>'}),false);
  assert.equal(validQuote({...q,lines:[{...q.lines[0],price:-1}]}),false);
  assert.equal(validQuote({...q,id:'../secret'}),false);
});
