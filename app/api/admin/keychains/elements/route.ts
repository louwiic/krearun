import { isAdmin } from "@/lib/auth";
import { getInventoryColors } from "@/lib/store";
import { validateKeychainColors } from "@/lib/name-keychain";
import { buildElementKeychain, parseElementKeychain } from "@/lib/element-keychain";
import { serializeElementKeychain3mf } from "@/lib/element-keychain-3mf";
import { serializeNameplate } from "@/lib/nameplate-3d";
import { strToU8, zipSync } from "fflate";
export const runtime="nodejs";
export async function POST(request:Request) {
  if(!await isAdmin())return Response.json({error:"Accès administrateur requis."},{status:401});
  try {
    const body=await request.json();
    if(body.format!=="3mf" && body.format!=="stl")throw new Error("Format invalide.");
    const configuration=parseElementKeychain(body.configuration);
    configuration.colors=validateKeychainColors(configuration.colors,await getInventoryColors({includeInactive:true}));
    const model=buildElementKeychain(configuration);
    const config=strToU8(JSON.stringify(configuration,null,2));
    let file:Uint8Array;
    if(body.format==="3mf") {
      file=serializeElementKeychain3mf(model,{base:configuration.colors.baseColor,letters:configuration.colors.textColor},configuration);
    } else {
      const bytes=async(solid:typeof model.base)=>new Uint8Array(await new Blob(serializeNameplate(solid)).arrayBuffer());
      const [base,relief,combined]=await Promise.all([bytes(model.base),bytes(model.letters),bytes(model.combined)]);
      file=zipSync({"fond-avec-oeillet.stl":base,"motifs-relief.stl":relief,"porte-cles-complet.stl":combined,"configuration.json":config,"LISEZ-MOI.txt":strToU8("Dimensions en millimètres. Importer le fond et le relief ensemble comme un objet à plusieurs pièces, puis attribuer les deux couleurs. Le STL complet est la variante fusionnée monochrome. Fond 2,4 mm, relief 1,2 mm, trou traversant de 4 mm. Contrôler le tranchage et l'impression d'une première pièce.")});
    }
    return new Response(new Uint8Array(file),{headers:{"Content-Type":body.format==="3mf"?"model/3mf":"application/zip","Content-Disposition":`attachment; filename="porte-cles-elements.${body.format==="3mf"?"3mf":"zip"}"`,"Cache-Control":"private, no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Génération impossible."},{status:400});}
}
