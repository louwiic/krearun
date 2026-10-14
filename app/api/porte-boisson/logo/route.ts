import { holderFormData } from "@/lib/custom-holder-http";
import { prepareHolderLogo, prepareHolderPreset } from "@/lib/custom-holder-logo";

export async function POST(request:Request) {
  try {
    const form=await holderFormData(request);const file=form.get("logo");
    const model=form.get('model');
    if(model!==null&&!['custom','om','arsenal'].includes(String(model)))throw new Error("Modèle inconnu.");
    if(model!=='om'&&model!=='arsenal'&&!(file instanceof File))throw new Error("Choisissez votre logo.");
    const result=model==='om'||model==='arsenal'?await prepareHolderPreset(model):await prepareHolderLogo(file as File);
    return Response.json({logo:`data:image/png;base64,${result.logo.toString('base64')}`,palette:result.palette,reduced:result.reduced},{headers:{"Cache-Control":"no-store"}});
  } catch(error) {
    return Response.json({error:error instanceof Error?error.message:"Logo invalide."},{status:400});
  }
}
