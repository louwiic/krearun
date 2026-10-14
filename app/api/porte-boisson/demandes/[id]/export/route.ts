import { isAdmin } from "@/lib/auth";
import { getHolderRequest, getHolderLogo } from "@/lib/store";
import { checkHolderOrigin } from "@/lib/custom-holder-http";
import { exportHolder3mf } from "@/lib/holder-manufacturing-server";
import { manufacturingOptions } from "@/lib/holder-manufacturing-options.mjs";
export const runtime='nodejs';
export const maxDuration=130;
let exporting=false;
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  if(!await isAdmin())return Response.json({error:'Connexion administrateur requise.'},{status:401});
  if(exporting)return Response.json({error:'Un export est déjà en cours. Patientez avant de réessayer.'},{status:409});
  exporting=true;
  try{
    checkHolderOrigin(request);
    const holder=await getHolderRequest((await params).id);
    if(!holder)return Response.json({error:'Demande introuvable.'},{status:404});
    const body=await request.text();if(body.length>1024)throw new Error('Réglages invalides.');
    const options=manufacturingOptions(body?JSON.parse(body):{});
    const logo=await getHolderLogo(holder);
    const {file,report}=await exportHolder3mf(holder,logo,options);
    return new Response(new Uint8Array(file),{headers:{'Content-Type':'model/3mf','Content-Disposition':`attachment; filename="krearun-${holder.id}.3mf"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Krearun-Export-Warnings':encodeURIComponent(report.warnings.join('\n'))}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:'Export impossible.'},{status:400});}
  finally{exporting=false;}
}
