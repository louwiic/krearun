import { getCustomerSession } from "@/lib/customer-auth";
import { isAdmin } from "@/lib/auth";
import { getHolderLogo, getHolderRequest } from "@/lib/store";

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  const [session,admin]=await Promise.all([getCustomerSession(),isAdmin()]);
  if(!session&&!admin)return new Response(null,{status:404});
  const holder=await getHolderRequest((await params).id);
  if(!holder||(!admin&&holder.customerId!==session?.id))return new Response(null,{status:404});
  try {
    const original=admin && new URL(request.url).searchParams.get('original')==='1';
    const svg=admin && new URL(request.url).searchParams.get('source')==='svg';
    if(new URL(request.url).searchParams.get('source')==='svg'&&!admin)return new Response(null,{status:404});
    const logo=await getHolderLogo(holder,original,svg);
    return new Response(new Uint8Array(logo),{headers:{'Content-Type':svg?'image/svg+xml':'image/png','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',...(svg?{'Content-Disposition':'attachment; filename="logo-vectoriel.svg"','Content-Security-Policy':"sandbox; default-src 'none'"}:{})}});
  }catch{return new Response(null,{status:404});}
}
