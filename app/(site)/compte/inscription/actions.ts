"use server";
import { registerCustomizationCustomer, createCustomerActivationToken } from "@/lib/store";
import { sendCustomerActivation } from "@/lib/email";

export async function registerCustomizationAction(_previous:{error?:string;sent?:boolean},form:FormData):Promise<{error?:string;sent?:boolean}> {
  const name=String(form.get('name')??'').trim().slice(0,120);
  const email=String(form.get('email')??'').trim().toLowerCase().slice(0,160);
  if(!name||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return {error:'Renseignez votre nom et une adresse e-mail valide.'};
  try {
    await registerCustomizationCustomer(email,name);
    const token=await createCustomerActivationToken(email);
    const sent=await sendCustomerActivation(email,name,token);
    if(!sent)return {error:'Le message n’a pas pu être envoyé. Réessayez dans un instant ou contactez-nous.'};
    return {sent:true};
  }catch{return {error:'Impossible de préparer votre compte. Réessayez dans un instant.'};}
}
