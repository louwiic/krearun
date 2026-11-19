import {isAdmin} from '@/lib/auth';
import {libraryAsset} from '@/lib/library-3d';
export const runtime='nodejs';
export async function GET(){
 if(!await isAdmin())return new Response(null,{status:401});
 return new Response(new Uint8Array(await libraryAsset('rangement-report.html')),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Content-Security-Policy':"sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:",'X-Content-Type-Options':'nosniff'}});
}
