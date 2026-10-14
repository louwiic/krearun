import { Worker } from "node:worker_threads";
import { join } from "node:path";
import type { HolderRequest } from "./custom-holder";
export interface ManufacturingOptions {depth:number;clearance:number;thickness:number}
export interface ManufacturingReport {warnings:string[];checks:Record<string,unknown>;settings:Record<string,unknown>}
export async function exportHolder3mf(request:HolderRequest,logo:Buffer,options:ManufacturingOptions):Promise<{file:Uint8Array;report:ManufacturingReport}> {
  return new Promise((resolve,reject)=>{
    const worker=new Worker(join(process.cwd(),'scripts/holder-export-worker.mjs'),{workerData:{requestId:request.id,configuration:request.configuration,palette:request.palette,logo:new Uint8Array(logo),options},resourceLimits:{maxOldGenerationSizeMb:768}});
    let settled=false;
    const finish=(error?:Error,result?:{file:Uint8Array;report:ManufacturingReport})=>{if(settled)return;settled=true;clearTimeout(timeout);void worker.terminate();if(error)reject(error);else resolve(result!);};
    const timeout=setTimeout(()=>finish(new Error('Le calcul a dépassé deux minutes. Simplifiez le logo puis réessayez.')),120000);
    worker.once('message',result=>result.error?finish(new Error(result.error)):finish(undefined,result));
    worker.once('error',()=>finish(new Error('Le calcul 3D a échoué. Réessayez avec un logo plus simple.')));
    worker.once('exit',code=>{if(!settled)finish(new Error(`Le calcul 3D s’est arrêté (${code}).`));});
  });
}
