import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const require=createRequire(import.meta.url);
export function loadTs(filename,mocks={},cache=new Map()){
 const file=filename instanceof URL?fileURLToPath(filename):filename;
 if(cache.has(file))return cache.get(file).exports;
 const module={exports:{}};cache.set(file,module);
 const compiled=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',compiled)(name=>{
  if(Object.hasOwn(mocks,name))return mocks[name];
  if(name.startsWith('.')){const local=path.resolve(path.dirname(file),name.replace(/\.ts$/,''))+'.ts';if(existsSync(local))return loadTs(local,mocks,cache);}
  return require(name);
 },module,module.exports);
 return module.exports;
}
