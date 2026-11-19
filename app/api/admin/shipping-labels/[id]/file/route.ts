import {isAdmin} from '@/lib/auth';
import {getPostageLabel,downloadPostageDocument} from '@/lib/store';
export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!await isAdmin())return new Response(null,{status:401});
 const type=new URL(request.url).searchParams.get('type')||'output';if(!['source','preview','output'].includes(type))return new Response(null,{status:400});
 try{const record=await getPostageLabel((await params).id);if(!record)return new Response(null,{status:404});const response=await downloadPostageDocument(record,type as 'source'|'preview'|'output');if(!response)return new Response(null,{status:404});
 return new Response(response.body,{headers:{'Content-Type':type==='preview'?'image/png':'application/pdf','Content-Disposition':`inline; filename="${type==='output'?'timbre-et-adresse.pdf':type==='source'?'timbre-original.pdf':'apercu.png'}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response(null,{status:404});}
}
