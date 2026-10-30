"use server";
import { setAdminNotice } from "@/lib/admin-notice";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { createHolderDecision, getHolderRequest } from "@/lib/store";
import { euroCents } from "@/lib/custom-holder";
import { sendHolderDecisionNotification } from "@/lib/email";

export async function decideHolderAction(form:FormData) {
  if(!(await isAdmin()))redirect('/admin/login');
  const id=String(form.get('id')??'');
  let error='';
  try {
    const request=await getHolderRequest(id);
    if(!request||request.decision||request.orderId)throw new Error("Cette demande a déjà été examinée ou n’existe plus.");
    const decision=String(form.get('decision'));
    if(!['approved','rejected'].includes(decision))throw new Error("Décision invalide.");
    const message=String(form.get('message')??'').trim().slice(0,1000);
    if(decision==='rejected'&&!message)throw new Error("Expliquez au client pourquoi son logo n’est pas réalisable.");
    const unitPriceCents=decision==='approved'?euroCents(form.get('price')):0;
    const shippingCents=decision==='approved'?euroCents(form.get('shipping'),true):0;
    await createHolderDecision(id,{status:decision as 'approved'|'rejected',unitPriceCents,shippingCents,message});
    const saved=await getHolderRequest(id);
    if(saved)try{await sendHolderDecisionNotification(saved);}catch{console.error('[Holder] Decision notification failed');}
  }catch(e){error=e instanceof Error&&!e.message.startsWith('PocketBase')?e.message:"Cette demande vient d’être examinée. Actualisez la liste.";}
  revalidatePath('/admin/personnalisations');revalidatePath('/compte');
  await setAdminNotice(error ? "error" : "success", error || "Décision enregistrée pour cette personnalisation.");
  redirect(`/admin/personnalisations?${error?`error=${encodeURIComponent(error)}`:'saved=1'}#${id}`);
}
