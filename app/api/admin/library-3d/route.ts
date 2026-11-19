import {isAdmin} from '@/lib/auth';
import {readLibrary,libraryView} from '@/lib/library-3d';
export const runtime='nodejs';
export async function GET(request:Request){
 if(!await isAdmin())return Response.json({error:'Accès administrateur requis.'},{status:401});
 try{const url=new URL(request.url);return Response.json(libraryView(await readLibrary(),{folder:url.searchParams.get('folder')||'',query:url.searchParams.get('q')||'',page:Number(url.searchParams.get('page')||1)}),{headers:{'Cache-Control':'private, no-store'}});}
 catch{return Response.json({error:'Dossier introuvable ou inventaire indisponible.'},{status:404});}
}
