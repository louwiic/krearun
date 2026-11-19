import {isAdmin} from '@/lib/auth';
import {redirect} from 'next/navigation';
import {readLibrary} from '@/lib/library-3d';
import Library3D from '@/components/admin/Library3D';
export const dynamic='force-dynamic';
export default async function Page(){
 if(!await isAdmin())redirect('/admin/login');
 const data=await readLibrary();
 return <Library3D root={data.root} scannedAt={data.scannedAt} projects={data.projects} categories={data.entries.filter(e=>e.parent===''&&e.kind==='directory').map(e=>({path:e.path,files:data.entries.filter(n=>n.kind!=='directory'&&n.path.startsWith(e.path+'/')).length}))} fileCount={data.entries.filter(e=>e.kind!=='directory').length} folderCount={data.entries.filter(e=>e.kind==='directory').length}/>;
}
