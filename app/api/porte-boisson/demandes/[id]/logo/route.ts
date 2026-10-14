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
    const logo=await getHolderLogo(holder,original);
    return new Response(new Uint8Array(logo),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }catch{return new Response(null,{status:404});}
}
