import {isAdmin} from '@/lib/auth';
import {inspectPostagePdf} from '@/lib/postage-label-inspect';
import {DEFAULT_POSTAGE_SETTINGS} from '@/lib/postage-labels';
import {listPostageLabels,savePostageSource} from '@/lib/store';
export const runtime='nodejs';
export async function GET(){if(!await isAdmin())return Response.json({error:'Accès administrateur requis.'},{status:401});return Response.json(await listPostageLabels(),{headers:{'Cache-Control':'private, no-store'}});}
export async function POST(request:Request){
 if(!await isAdmin())return Response.json({error:'Accès administrateur requis.'},{status:401});
 try{const form=await request.formData(),file=form.get('file');if(!(file instanceof File)||file.size>15*1024*1024||!file.name.toLowerCase().endsWith('.pdf'))throw Error('Importe un PDF d’une page, 15 Mo maximum.');
 const source=new Uint8Array(await file.arrayBuffer()),{preview,crop}=await inspectPostagePdf(source);
 const record=await savePostageSource({label:String(form.get('label')||file.name).slice(0,100),sourceName:file.name.slice(0,160),settings:{...DEFAULT_POSTAGE_SETTINGS,crop}},source,preview);
 return Response.json(record,{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Import impossible.'},{status:400});}
}
