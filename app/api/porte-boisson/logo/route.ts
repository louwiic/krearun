import { holderFormData } from "@/lib/custom-holder-http";
import { prepareHolderLogo } from "@/lib/custom-holder-logo";

export async function POST(request:Request) {
  try {
    const form=await holderFormData(request);const file=form.get("logo");
    if(!(file instanceof File))throw new Error("Choisissez votre logo.");
    const result=await prepareHolderLogo(file);
    return Response.json({logo:`data:image/png;base64,${result.logo.toString('base64')}`,palette:result.palette,reduced:result.reduced},{headers:{"Cache-Control":"no-store"}});
  } catch(error) {
    return Response.json({error:error instanceof Error?error.message:"Logo invalide."},{status:400});
  }
}
