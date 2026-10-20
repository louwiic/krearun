import { LEGAL_VERSION } from "./legal";
import type Stripe from "stripe";
import { canPayHolder, holderModelLabel, holderTotal, HOLDER_NAME, type HolderRequest } from "./custom-holder";

export function holderCheckoutParams(request:HolderRequest,customerId:string,siteUrl:string):Stripe.Checkout.SessionCreateParams {
  if(!canPayHolder(request,customerId))throw new Error("Cette demande n'est pas disponible au paiement.");
  const quote=request.decision!;
  return {
    mode:'payment',payment_method_types:['card'],customer_email:request.customerEmail,
    client_reference_id:request.id,
    metadata:{termsVersion:LEGAL_VERSION,termsAcceptedAt:new Date().toISOString(),customHolderRequest:request.id,holderCustomerId:customerId},
    line_items:[{price_data:{currency:'eur',unit_amount:quote.unitPriceCents,product_data:{name:HOLDER_NAME,description:`${holderModelLabel(request.configuration)} · Logo validé · coloris ${request.configuration.bodyColorName}`}},quantity:request.quantity}],
    shipping_address_collection:{allowed_countries:['FR','RE']},
    phone_number_collection:{enabled:true},
    shipping_options:[{shipping_rate_data:{type:'fixed_amount',fixed_amount:{amount:quote.shippingCents,currency:'eur'},display_name:'Livraison du devis validé'}}],
    success_url:`${siteUrl}/compte?personnalisation=payee#personnalisations`,
    cancel_url:`${siteUrl}/compte?personnalisation=annulee#personnalisations`,
  };
}
export function validHolderPayment(request:HolderRequest,session:Pick<Stripe.Checkout.Session,'id'|'metadata'|'payment_status'|'currency'|'amount_total'|'amount_subtotal'>):boolean {
  return request.decision?.status==='approved' && request.stripeSessionId===session.id
    && session.metadata?.customHolderRequest===request.id && session.metadata.holderCustomerId===request.customerId
    && session.payment_status==='paid' && session.currency==='eur'
    && session.amount_total===holderTotal(request)
    && session.amount_subtotal===request.quantity*request.decision.unitPriceCents;
}
