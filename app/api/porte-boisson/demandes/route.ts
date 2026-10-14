import { getCustomerSession } from "@/lib/customer-auth";
import { createHolderRequest, getCustomerById, getHolderRequests, getInventoryColors, getProductBySlug } from "@/lib/store";
import { HOLDER_SLUG, parseHolderConfiguration } from "@/lib/custom-holder";
import { prepareHolderLogo } from "@/lib/custom-holder-logo";
import { holderFormData } from "@/lib/custom-holder-http";
import { sendHolderRequestNotification } from "@/lib/email";

export async function POST(request:Request) {
  const session=await getCustomerSession();
  if(!session)return Response.json({error:"Connectez-vous pour envoyer votre demande."},{status:401});
  try {
    const form=await holderFormData(request);
    const file=form.get('logo');const quantity=Number(form.get('quantity'));
    const nonce=String(form.get('submissionKey')??'');
    if(!(file instanceof File))throw new Error("Choisissez votre logo.");
    if(!Number.isInteger(quantity)||quantity<1||quantity>20)throw new Error("Choisissez entre 1 et 20 porte-boissons.");
    if(!/^[a-f0-9-]{36}$/i.test(nonce))throw new Error("Rechargez la page et réessayez.");
    if(form.get('confirmed')!=='true')throw new Error("Validez l'aperçu du logo avant l'envoi.");
    const configuration=parseHolderConfiguration(JSON.parse(String(form.get('configuration')??'')));
    const [product,customer,colors,requests]=await Promise.all([getProductBySlug(HOLDER_SLUG),getCustomerById(session.id),getInventoryColors(),getHolderRequests(session.id)]);
    if(!product?.active || !customer)throw new Error("Ce produit est momentanément indisponible.");
    const submissionKey=`${session.id}_${nonce}`;
    const duplicate=requests.find(r=>r.submissionKey===submissionKey);
    if(duplicate)return Response.json({id:duplicate.id});
    if(requests.filter(r=>Date.parse(r.created)>Date.now()-86400000).length>=10)throw new Error("Vous avez atteint la limite de 10 demandes par jour.");
    const color=colors.find(c=>c.hex.toLowerCase()===configuration.bodyColor && c.name===configuration.bodyColorName);
    if(!color)throw new Error("Choisissez une couleur disponible dans l'inventaire.");
    const prepared=await prepareHolderLogo(file);
    const saved=await createHolderRequest({customerId:session.id,customerEmail:customer.email,customerName:customer.name,quantity,note:String(form.get('note')??'').trim().slice(0,1000),configuration,palette:prepared.palette,submissionKey},prepared.logo,prepared.original);
    try {await sendHolderRequestNotification(saved);}catch{console.error('[Holder] Request notification failed');}
    return Response.json({id:saved.id});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Impossible d'envoyer la demande."},{status:400});}
}
