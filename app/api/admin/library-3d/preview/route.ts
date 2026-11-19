import {isAdmin} from '@/lib/auth';
import {libraryAsset,readLibrary} from '@/lib/library-3d';
import path from 'node:path';
export const runtime='nodejs';
export async function GET(request:Request){
 if(!await isAdmin())return new Response(null,{status:401});
 const id=new URL(request.url).searchParams.get('id');
 const project=(await readLibrary()).projects.find(p=>p.previewId===id);
 if(!project?.previewFile)return new Response(null,{status:404});
 const bytes=await libraryAsset('previews/'+project.previewFile);
 const ext=path.extname(project.previewFile);return new Response(new Uint8Array(bytes),{headers:{'Content-Type':ext==='.png'?'image/png':ext==='.webp'?'image/webp':'image/jpeg','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}});
}
