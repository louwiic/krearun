import { isAdmin } from "@/lib/auth";
import { generateKeychain } from "@/lib/name-keychain-server";
import { parseKeychainConfiguration } from "@/lib/name-keychain";
export const runtime="nodejs";
export async function POST(request:Request){
  if(!await isAdmin())return new Response(null,{status:401});
  try{
    const body=await request.json();
    const file=await generateKeychain(parseKeychainConfiguration(body.configuration),"stl");
    return new Response(new Uint8Array(file),{headers:{"Content-Type":"application/zip","Content-Disposition":'attachment; filename="porte-cles-prenom-stl.zip"',"Cache-Control":"private, no-store"}});
  }catch{return Response.json({error:"Export impossible."},{status:400});}
}
