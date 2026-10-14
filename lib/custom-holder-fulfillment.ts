import type Stripe from "stripe";
import { getHolderRequest, createOrder, getOrderBySourceId, getOrderByStripeSession, markHolderPaid } from "./store";
import { validHolderPayment } from "./custom-holder-payment";
import { HOLDER_NAME, HOLDER_WEIGHT_GRAMS, holderModelLabel } from "./custom-holder";
import { sendAdminNewOrder, sendOrderConfirmation } from "./email";

export async function fulfillHolderPayment(session:Stripe.Checkout.Session) {
  const request=await getHolderRequest(session.metadata?.customHolderRequest??'');
  if(!request)throw new Error("Demande de personnalisation introuvable.");
  if(session.payment_status!=='paid')return;
  if(!validHolderPayment(request,session))throw new Error("Paiement incohérent avec la demande validée.");
  const sourceId=`holder:${request.id}`;
  let order=await getOrderByStripeSession(session.id) ?? await getOrderBySourceId('web',sourceId);
  let created=false;
  if(!order) {
    const shipping=session.collected_information?.shipping_details ?? (session as unknown as {shipping_details?:{name?:string;address?:Stripe.Address}}).shipping_details;
    const address=shipping?.address;
    if(!address?.line1 || !address.city || !address.postal_code)throw new Error("Adresse de livraison manquante.");
    try {
      order=await createOrder({email:request.customerEmail,name:shipping?.name||request.customerName,phone:session.customer_details?.phone||'',addressLine1:address.line1,addressLine2:address.line2||'',city:address.city,postalCode:address.postal_code,country:address.country||'RE',
        subtotalCents:session.amount_subtotal!,shippingCents:request.decision!.shippingCents,totalCents:session.amount_total!,status:'paid',stripeSessionId:session.id,trackingNumber:'',source:'web',sourceId,
        note:request.note,internalNote:`Personnalisation validée : /admin/personnalisations#${request.id}\n${request.decision!.message}`,
        items:[{productId:'custom-holder',name:`${HOLDER_NAME} — ${holderModelLabel(request.configuration)}`,quantity:request.quantity,priceCents:request.decision!.unitPriceCents,color:request.configuration.bodyColorName,image:'/products/porte-boisson-personnalise.svg',weightGrams:HOLDER_WEIGHT_GRAMS,holderRequestId:request.id}],
      });created=true;
    }catch(error){order=await getOrderBySourceId('web',sourceId);if(!order)throw error;}
  }
  // Replayed webhooks also repair a request/order link after a partial failure.
  await markHolderPaid(request.id,order.id);
  if(created) {
    try{await sendOrderConfirmation(order);await sendAdminNewOrder(order);}catch{console.error('[Holder] Confirmation email failed');}
  }
}
