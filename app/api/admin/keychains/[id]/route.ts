import { isAdmin } from "@/lib/auth";
import { downloadKeychainFile } from "@/lib/store";
import { printFileDisposition } from "@/lib/print-files";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
  if(!await isAdmin())return new Response(null,{status:401,headers});
  try{
    const result=await downloadKeychainFile((await params).id);
    if(!result)return new Response(null,{status:404,headers});
    return new Response(result.response.body,{headers:{...headers,"Content-Type":"model/3mf","Content-Disposition":printFileDisposition(result.record.originalName)}});
  }catch{return new Response("Fichier indisponible.",{status:503,headers});}
}
