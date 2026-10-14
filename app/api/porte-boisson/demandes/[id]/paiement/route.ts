import { getCustomerSession } from "@/lib/customer-auth";
import { getHolderRequest, saveHolderCheckout } from "@/lib/store";
import { canPayHolder } from "@/lib/custom-holder";
import { holderCheckoutParams } from "@/lib/custom-holder-payment";
import { checkHolderOrigin, holderSiteUrl } from "@/lib/custom-holder-http";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  const customer=await getCustomerSession();
  if(!customer)return Response.json({error:"Connectez-vous à votre espace client."},{status:401});
  try {
    checkHolderOrigin(request);
    const holder=await getHolderRequest((await params).id);
    if(!holder || holder.customerId!==customer.id)return Response.json({error:"Demande introuvable."},{status:404});
    if(!canPayHolder(holder,customer.id))return Response.json({error:"Le paiement n'est disponible qu'après validation de cette demande."},{status:409});
    if(!stripeConfigured())return Response.json({error:"Le paiement est momentanément indisponible."},{status:503});
    const stripe=getStripe();
    if(holder.stripeSessionId) {
      const previous=await stripe.checkout.sessions.retrieve(holder.stripeSessionId);
      if(previous.status==='open' && previous.url)return Response.json({url:previous.url});
      if(previous.status==='complete')return Response.json({error:"Paiement reçu, votre commande est en cours de confirmation. Actualisez votre compte dans un instant."},{status:409});
    }
    const siteUrl=holderSiteUrl(request);
    const checkout=await stripe.checkout.sessions.create(holderCheckoutParams(holder,customer.id,siteUrl),{
      idempotencyKey:`holder-${holder.id}-${holder.decision!.id}-${holder.stripeSessionId||'first'}`,
    });
    await saveHolderCheckout(holder.id,checkout.id);
    return Response.json({url:checkout.url});
  }catch{console.error('[Holder] Checkout failed');return Response.json({error:"Impossible de préparer le paiement. Réessayez."},{status:502});}
}
