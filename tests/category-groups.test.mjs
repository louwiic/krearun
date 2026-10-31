import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const source=ts.transpileModule(readFileSync(new URL('../lib/categories.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{}};new Function('require','module','exports',source)(name=>name==='./types'?{CATEGORIES:[]}:require(name),mod,mod.exports);
test('visible categories appear once under a family and inactive categories stay hidden',()=>{
 const categories=['veilleuses','vases','deco','bureau','rangement','porte-boisson','lunette','noel','salle-de-bain'].map(value=>({value,label:value,active:value!=='salle-de-bain'}));
 const groups=mod.exports.groupStoreCategories(categories);assert.equal(groups.length,4);
 assert.deepEqual(groups.map(g=>g.label),['Maison & décoration','Bureau & rangement','Accessoires','Collections']);
 const all=groups.flatMap(g=>g.categories.map(c=>c.value));assert.equal(all.length,8);assert.equal(new Set(all).size,8);assert.ok(!all.includes('salle-de-bain'));
 assert.deepEqual(mod.exports.groupStoreCategories([{value:'noel',label:'Fêtes',active:true}]).map(g=>g.categories[0].label),['Fêtes']);assert.deepEqual(mod.exports.groupStoreCategories([]),[]);
});
