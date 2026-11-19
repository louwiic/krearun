import {isAdmin} from '@/lib/auth';
import {readLibrary} from '@/lib/library-3d';
import {createLibraryOpenTicket} from '@/lib/library-open-ticket.mjs';
export const runtime='nodejs';
export async function POST(request:Request){
 if(!await isAdmin())return Response.json({error:'Accès administrateur requis.'},{status:401});
 const secret=process.env.AUTH_SECRET;
 if(!secret)return Response.json({error:'La passerelle nécessite AUTH_SECRET configuré sur le site et sur ce Mac.'},{status:503});
 try{
  const {path}=await request.json();
  if(typeof path!=='string'||!path.toLowerCase().endsWith('.3mf')||!(await readLibrary()).entries.some(e=>e.path===path&&e.kind!=='directory'))return Response.json({error:'Fichier 3MF absent de cet inventaire.'},{status:400});
  return Response.json({ticket:createLibraryOpenTicket(secret,path)},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return Response.json({error:'Demande invalide.'},{status:400});}
}
