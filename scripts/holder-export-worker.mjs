import {parentPort,workerData} from 'node:worker_threads';
import {buildHolderManufacturing} from '../lib/holder-manufacturing.mjs';
try{const result=await buildHolderManufacturing(workerData);parentPort.postMessage(result,[result.file.buffer]);}catch(error){parentPort.postMessage({error:error instanceof Error?error.message:'Export impossible.'});}
