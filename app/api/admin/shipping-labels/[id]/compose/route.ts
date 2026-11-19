import {isAdmin} from '@/lib/auth';
import {getPostageLabel,downloadPostageDocument,updatePostageLabel} from '@/lib/store';
import {parsePostageAddress,parsePostageSettings} from '@/lib/postage-labels';
import {generatePostageLabelsPdf} from '@/lib/postage-labels-pdf';
export const runtime='nodejs';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!await isAdmin())return Response.json({error:'Accès administrateur requis.'},{status:401});
 try{const record=await getPostageLabel((await params).id);if(!record)return Response.json({error:'Étiquette introuvable.'},{status:404});const body=await request.json(),settings=parsePostageSettings(body.settings),address=parsePostageAddress(body.address);
 const original=await downloadPostageDocument(record,'source');if(!original)throw Error('Timbre original introuvable.');
 const {bytes}=await generatePostageLabelsPdf(new Uint8Array(await original.arrayBuffer()),settings,address,record.label);
 return Response.json(await updatePostageLabel(record.id,{settings,address,printed:false},bytes),{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Génération impossible.'},{status:400});}
}
