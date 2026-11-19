import {isAdmin} from '@/lib/auth';
import {getPostageLabel,updatePostageLabel} from '@/lib/store';
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!await isAdmin())return Response.json({error:'Accès administrateur requis.'},{status:401});
 try{const record=await getPostageLabel((await params).id),body=await request.json();if(!record?.output||typeof body.printed!=='boolean')return Response.json({error:'Génère une planche avant de la marquer imprimée.'},{status:400});return Response.json(await updatePostageLabel(record.id,{printed:body.printed}),{headers:{'Cache-Control':'private, no-store'}});
 }catch{return Response.json({error:'Mise à jour impossible.'},{status:400});}
}
