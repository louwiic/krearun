import { isAdmin } from "@/lib/auth";
import { getInventoryColors, saveKeychainFile } from "@/lib/store";
import { validateKeychainColors } from "@/lib/name-keychain";
import { generateKeychain } from "@/lib/name-keychain-server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if(!await isAdmin())return Response.json({error:"Accès administrateur requis."},{status:401});
  try{
    const {configuration}=await request.json();
    const clean=validateKeychainColors(configuration,await getInventoryColors({includeInactive:true}));
    const file=await generateKeychain(clean);
    const record=await saveKeychainFile({uniqueKey:`admin:${crypto.randomUUID()}`,orderId:"",orderNumber:0,itemIndex:0,source:"admin",configuration:clean},file);
    return Response.json({id:record.id,url:`/api/admin/keychains/${record.id}`},{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Génération impossible."},{status:400});}
}
