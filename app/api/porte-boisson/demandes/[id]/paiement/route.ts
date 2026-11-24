import { LEGAL_VERSION } from "@/lib/legal";
import { getCustomerSession } from "@/lib/customer-auth";
import { getHolderRequest, saveHolderCheckout } from "@/lib/store";
import { canPayHolder } from "@/lib/custom-holder";
import { holderCheckoutParams } from "@/lib/custom-holder-payment";
import { checkHolderOrigin, holderSiteUrl } from "@/lib/custom-holder-http";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { isHolderDemo } from "@/lib/holder-cart";
import { HolderCheckoutConflict, withHolderCheckoutLocks } from "@/lib/holder-checkout-lock";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  const customer=await getCustomerSession();
  if(!customer)return Response.json({error:"Connectez-vous à votre espace client."},{status:401});
  try {
    checkHolderOrigin(request);
    const { id } = await params;
    if (!/^[a-z0-9]{15}$/.test(id)) return Response.json({error:"Demande introuvable."},{status:404});
    const original = await getHolderRequest(id);
    if (!original || original.customerId !== customer.id) return Response.json({error:"Demande introuvable."},{status:404});
    if (isHolderDemo(original)) return Response.json({error:"Ajoutez la démonstration au panier pour la tester."},{status:409});
    return await withHolderCheckoutLocks([id], async () => {
    const holder=await getHolderRequest(id);
    if(!holder || holder.customerId!==customer.id)return Response.json({error:"Demande introuvable."},{status:404});
    if(!canPayHolder(holder,customer.id))return Response.json({error:"Le paiement n'est disponible qu'après validation de cette demande."},{status:409});
    const body = await request.json();
    if (body.termsAccepted !== true || body.termsVersion !== LEGAL_VERSION) return Response.json({error:"Acceptez les conditions générales de vente à jour."},{status:400});
    if(!stripeConfigured())return Response.json({error:"Le paiement est momentanément indisponible."},{status:503});
    const stripe=getStripe();
    if(holder.stripeSessionId) {
      const previous=await stripe.checkout.sessions.retrieve(holder.stripeSessionId);
      if(previous.status==='open' && previous.url){
        if (previous.metadata?.holderCart === "1") return Response.json({error:"Cette création est déjà dans un paiement groupé. Reprenez le paiement depuis votre panier."},{status:409});
        await stripe.checkout.sessions.update(previous.id,{metadata:{termsVersion:LEGAL_VERSION,termsAcceptedAt:new Date().toISOString()}});return Response.json({url:previous.url});
      }
      if(previous.status==='complete')return Response.json({error:"Paiement reçu, votre commande est en cours de confirmation. Actualisez votre compte dans un instant."},{status:409});
    }
    const siteUrl=holderSiteUrl(request);
    const checkout=await stripe.checkout.sessions.create(holderCheckoutParams(holder,customer.id,siteUrl),{
      idempotencyKey:`holder-${holder.id}-${holder.decision!.id}-${holder.stripeSessionId||'first'}`,
    });
    await saveHolderCheckout(holder.id,checkout.id);
    return Response.json({url:checkout.url});
    });
  }catch(error){
    if (error instanceof HolderCheckoutConflict) return Response.json({error:error.message},{status:409});
    console.error('[Holder] Checkout failed');return Response.json({error:"Impossible de préparer le paiement. Réessayez."},{status:502});
  }
}
