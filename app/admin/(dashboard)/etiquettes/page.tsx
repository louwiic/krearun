import {isAdmin} from '@/lib/auth';import {redirect} from 'next/navigation';
import {getOrders,listPostageLabels} from '@/lib/store';
import PostageLabelManager from '@/components/admin/PostageLabelManager';
export const dynamic='force-dynamic';
export default async function Page(){
 if(!await isAdmin())redirect('/admin/login');const [labels,orders]=await Promise.all([listPostageLabels(),getOrders()]);
 return <PostageLabelManager initialLabels={labels} orders={orders.filter(o=>o.status!=='cancelled').map(o=>({id:o.id,number:o.number,name:o.name,street:o.addressLine1,extra:o.addressLine2,postalCode:o.postalCode,city:o.city,country:o.country}))}/>;
}
