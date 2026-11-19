"use client";
import {useEffect,useState} from 'react';
import {macOpenCommand,type LibraryEntry,type LibraryProject} from '@/lib/library-3d-client';
const pretty=(s:string)=>s.replace(/^\d+_/, '').replace(/_/g,' ');
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const formatBytes=(n:number)=>n<1024?`${n} o`:n<1048576?`${(n/1024).toFixed(1)} Ko`:`${(n/1048576).toFixed(1)} Mo`;
const button='rounded-lg border border-sand bg-cream px-3 py-2 text-xs font-bold hover:border-terra focus-visible:outline-2 focus-visible:outline-terra';
type View={entries:LibraryEntry[];total:number;page:number;pages:number};
export default function Library3D({root,scannedAt,projects,categories,fileCount,folderCount}:{root:string;scannedAt:string;projects:LibraryProject[];categories:{path:string;files:number}[];fileCount:number;folderCount:number}){
 const [mode,setMode]=useState<'projects'|'files'>('projects'),[category,setCategory]=useState(''),[query,setQuery]=useState(''),[folder,setFolder]=useState(''),[page,setPage]=useState(1),[view,setView]=useState<View|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 useEffect(()=>{
  if(mode!=='files')return;
  const controller=new AbortController();
  const timer=setTimeout(()=>{
   setBusy(true);setError('');
   fetch(`/api/admin/library-3d?folder=${encodeURIComponent(folder)}&q=${encodeURIComponent(query)}&page=${page}`,{signal:controller.signal,cache:'no-store'}).then(async r=>{const data=await r.json();if(!r.ok)throw Error(data.error||'Lecture impossible.');setView(data);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});
  },180);
  return()=>{clearTimeout(timer);controller.abort();};
 },[mode,folder,query,page]);
 async function copy(value:string){
  try{await navigator.clipboard.writeText(value);setNotice('Copié dans le presse-papiers.');}
  catch{setNotice(`Copie automatique indisponible. Sélectionne le chemin affiché ci-dessous : ${value}`);}
 }
 async function open3mf(relative:string){
  setNotice('Ouverture du 3MF sur ton Mac…');
  try{
   const grant=await fetch('/api/admin/library-3d/open-ticket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:relative})});
   const permission=await grant.json();if(!grant.ok)throw Error(permission.error);
   const response=await fetch('http://127.0.0.1:8791/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(permission),signal:AbortSignal.timeout(20000)});
   const result=await response.json();if(!response.ok)throw Error(result.error);
   setNotice('3MF ouvert dans l’application associée sur ton Mac.');
  }catch(error){setNotice(`Ouverture impossible : ${error instanceof TypeError ? 'lance npm run library:bridge dans Terminal sur ce Mac et autorise l’accès au réseau local si ton navigateur le demande.' : error instanceof Error ? error.message : 'Vérifie la passerelle locale.'} Tu peux aussi copier la commande open.`);}
 }
 function browse(p:string){setFolder(p);setMode('files');setQuery('');setPage(1);setView(null);}
 const currentProject=projects.filter(p=>folder===p.path||folder.startsWith(p.path+'/')).sort((a,b)=>b.path.length-a.path.length)[0];
 const visible=projects.filter(p=>(!category||p.category===category)&&normalize(`${p.name} ${p.path} ${p.description}`).includes(normalize(query)));
 function actions(relative:string){const full=relative?`${root}/${relative}`:root;return <div className="mt-3 flex flex-wrap gap-2">{relative.toLowerCase().endsWith(".3mf")&&<button type="button" className={`${button} !border-terra !bg-terra/10`} onClick={()=>open3mf(relative)}>Ouvrir le 3MF sur mon Mac</button>}<button type="button" className={button} onClick={()=>copy(full)}>Copier le chemin</button><button type="button" className={button} onClick={()=>copy(macOpenCommand(full))}>Copier la commande open</button></div>;}
 return <div className="space-y-6">
  <header><p className="text-xs font-bold uppercase tracking-wider text-terra">Production · fichiers sur ton Mac</p><h1 className="mt-2 font-display text-3xl font-bold">Bibliothèque 3D</h1><p className="mt-3 text-sm text-ink-soft">{projects.length} projets avec aperçu · {fileCount.toLocaleString('fr-FR')} fichiers et liens · {folderCount.toLocaleString('fr-FR')} dossiers.</p>
   <p className="mt-2 break-all font-mono text-xs">{root}</p>{actions('')}
  </header>
  <section className="rounded-2xl border border-sand bg-cream p-4 text-sm leading-6"><p><strong>Inventaire du {new Date(scannedAt).toLocaleString('fr-FR',{timeZone:'Indian/Reunion'})}.</strong> Tous les types de fichiers et les fichiers cachés sont inclus. Les liens symboliques sont répertoriés sans parcourir leurs destinations.</p><p className="mt-2">Pour ouvrir un élément dans Finder : copie la commande <code>open</code> puis colle-la dans Terminal sur ton Mac. L’admin en ligne présente un instantané, sans déplacer ni supprimer tes fichiers. Pour ouvrir directement un 3MF dans ton application habituelle, lance une fois la passerelle locale : <code className="select-all">npm run library:bridge</code>. La passerelle utilise le même AUTH_SECRET que le site, ne répond qu’aux demandes admin signées et ouvre uniquement les 3MF de cette bibliothèque.</p>
  <div className="mt-3 flex flex-wrap gap-3"><a href="http://127.0.0.1:8790/INDEX.html" target="_blank" rel="noreferrer" className="underline">Index HTML sur ce Mac ↗</a><a href="/api/admin/library-3d/document" target="_blank" rel="noreferrer" className="underline">Bilan du rangement ↗</a></div><p className="mt-2 text-xs text-ink-soft">L’index local nécessite le serveur local sur le port 8790. Pour actualiser l’inventaire : <code className="select-all">npm run library:sync</code> depuis le projet Kréarun. L’inventaire est synchronisé dans le stockage privé et actualisé en ligne sous une minute.</p></section>
  <div role="status" aria-live="polite" className="break-all text-sm text-terra-deep">{notice}</div>
  <div className="flex flex-wrap gap-3"><button type="button" aria-pressed={mode==='projects'} onClick={()=>{setMode('projects');setQuery('');}} className={`${button} ${mode==='projects'?'!border-terra !bg-terra/10':''}`}>Projets et aperçus</button><button type="button" aria-pressed={mode==='files'} onClick={()=>browse('')} className={`${button} ${mode==='files'?'!border-terra !bg-terra/10':''}`}>Tous les dossiers et fichiers</button></div>
  <label className="block text-sm font-bold">{mode==='files'?'Rechercher dans toute la bibliothèque (nom ou chemin)':'Rechercher un projet'}<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} placeholder="GTA, Monster, STL, sauvegarde…" className="mt-2 w-full rounded-xl border border-sand bg-cream p-3 outline-none focus:border-terra"/></label>
  <div className="flex flex-wrap gap-2" aria-label="Catégories de la bibliothèque"><button type="button" className={button} onClick={()=>{setCategory('');if(mode==='files')browse('');}}>Tout</button>{categories.map(c=><button type="button" key={c.path} aria-pressed={mode==='projects'?category===c.path:folder===c.path} className={`${button} ${(mode==='projects'?category===c.path:folder===c.path)?'!border-terra !bg-terra/10':''}`} onClick={()=>{if(mode==='files')browse(c.path);else setCategory(c.path);}}>{pretty(c.path)} <span className="text-ink-soft">({c.files.toLocaleString('fr-FR')})</span></button>)}</div>
  {mode==='projects'?<><p className="text-sm text-ink-soft">{visible.length} projet(s) affiché(s). Pour les autres contenus, utilise « Tous les dossiers et fichiers ».</p><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visible.map(p=><article key={p.path} className="overflow-hidden rounded-2xl border border-sand bg-cream">
   {/* eslint-disable-next-line @next/next/no-img-element -- Authenticated private library preview. */}
   <img src={`/api/admin/library-3d/preview?id=${p.previewId}&v=${encodeURIComponent(scannedAt)}`} alt={`Aperçu de ${p.name}`} width={480} height={320} loading="lazy" className="h-52 w-full bg-linen object-contain"/>
   <div className="p-4"><p className="text-xs text-terra">{pretty(p.category)}</p><h2 className="mt-1 text-lg font-bold">{p.name}</h2><p className="mt-2 text-sm text-ink-soft">{p.description}</p><p className="mt-3 select-all break-all font-mono text-xs">{root}/{p.path}</p>{actions(p.path)}<button type="button" onClick={()=>browse(p.path)} className="mt-3 text-sm font-bold text-terra-deep underline">Voir tous les fichiers et variantes →</button></div>
  </article>)}</div></>:<section aria-label="Explorateur de fichiers" className="rounded-2xl border border-sand bg-cream p-4">
   {currentProject&&<div className="mb-5 flex flex-col gap-4 rounded-xl bg-linen p-4 sm:flex-row sm:items-center">
    {/* eslint-disable-next-line @next/next/no-img-element -- Private project preview, also visible in file explorer. */}
    <img src={`/api/admin/library-3d/preview?id=${currentProject.previewId}&v=${encodeURIComponent(scannedAt)}`} alt={`Aperçu du projet ${currentProject.name}`} width={480} height={320} className="h-56 w-full rounded-lg object-contain sm:w-80"/>
    <div><p className="text-xs font-bold uppercase text-terra">Aperçu du projet</p><h2 className="mt-2 text-xl font-bold">{currentProject.name}</h2><p className="mt-2 text-sm text-ink-soft">{currentProject.description}</p></div>
   </div>}
   <nav aria-label="Chemin du dossier" className="mb-4 flex flex-wrap items-center gap-2 text-sm"><button type="button" className="underline" onClick={()=>browse('')}>Bibliothèque 3D</button>{folder.split('/').filter(Boolean).map((part,i)=><span key={i}> / <button type="button" className="underline" onClick={()=>browse(folder.split('/').slice(0,i+1).join('/'))}>{part}</button></span>)}</nav>
   <p className="select-all break-all font-mono text-xs">{root}{folder?`/${folder}`:''}</p>{actions(folder)}
   {error&&<p role="alert" className="my-4 text-terra-deep">{error}</p>}
   {busy?<p role="status" className="my-5">Chargement…</p>:view&&!error&&<><p className="my-4 text-sm">{view.total.toLocaleString('fr-FR')} entrée(s){query?' dans toute la bibliothèque':''} · page {view.page}/{view.pages}</p><ul className="divide-y divide-sand">{view.entries.map(e=><li key={e.path} className="py-4"><div className="flex flex-wrap items-start justify-between gap-2">{e.previewId&&
     // eslint-disable-next-line @next/next/no-img-element -- Embedded 3MF thumbnail behind admin authentication.
     <img src={`/api/admin/library-3d/preview?id=${e.previewId}&v=${encodeURIComponent(scannedAt)}`} alt={`Aperçu de ${e.name}`} width={240} height={180} loading="lazy" className="h-32 w-44 shrink-0 rounded-lg bg-linen object-contain"/>
    }<div className="min-w-0 flex-1">{e.kind==='directory'?<button type="button" onClick={()=>browse(e.path)} className="break-all text-left font-bold text-terra-deep underline">📁 {e.name}</button>:<h3 className="break-all text-sm font-bold">{e.kind==='symlink'?'↗':'▤'} {e.name}</h3>}<p className="mt-1 text-xs text-ink-soft">{e.kind==='directory'?'Dossier':e.kind==='symlink'?'Lien symbolique':formatBytes(e.size)} · {new Date(e.modified).toLocaleDateString('fr-FR')}</p><p className="mt-2 select-all break-all font-mono text-xs">{root}/{e.path}</p>{e.target&&<p className="mt-1 break-all text-xs text-ink-soft">Destination du lien : {e.target}</p>}</div></div>{actions(e.path)}</li>)}</ul>{view.total===0&&<p className="py-6">Aucun résultat.</p>}<div className="mt-5 flex items-center justify-between"><button type="button" disabled={page<=1} className={`${button} disabled:opacity-40`} onClick={()=>setPage(p=>p-1)}>← Précédent</button><button type="button" disabled={page>=view.pages} className={`${button} disabled:opacity-40`} onClick={()=>setPage(p=>p+1)}>Suivant →</button></div></>}
  </section>}
 </div>;
}
