import env from '@next/env';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {S3Client,PutObjectCommand} from '@aws-sdk/client-s3';
import sharp from 'sharp';
env.loadEnvConfig(process.cwd());
const directory='outputs/thermoformed-noel-2026-10-30';
const report=JSON.parse(readFileSync(`${directory}/costed-products.json`,'utf8'));
const publish=process.argv.includes('--publish');
if(!process.argv.includes('--apply')&&!publish){console.log(JSON.stringify({ready:report.products.filter(p=>p.ready).length,drafts:report.products.filter(p=>!p.ready).length,action:'Pass --apply to prepare inactive records; --publish activates prepared records with photos.'}));process.exit(0);}
const base=process.env.POCKETBASE_URL.replace(/\/$/,'');
function api(path,method='GET',body,token){
 const config=[`url = ${JSON.stringify(`${base}/api${path}`)}`,`request = "${method}"`,'header = "Content-Type: application/json"'];
 if(token)config.push(`header = ${JSON.stringify(`Authorization: ${token}`)}`);
 if(body)config.push(`data = ${JSON.stringify(JSON.stringify(body))}`);
 return JSON.parse(execFileSync('curl',['--fail-with-body','--silent','--show-error','--config','-'],{input:config.join('\n'),encoding:'utf8'}));
}
const {token}=api('/collections/_superusers/auth-with-password','POST',{identity:process.env.POCKETBASE_ADMIN_EMAIL,password:process.env.POCKETBASE_ADMIN_PASSWORD});
if(!token)throw Error('Authentication failed');
mkdirSync(directory,{recursive:true});
let manifest=[];try{manifest=JSON.parse(readFileSync(`${directory}/imported-products.json`,'utf8'));}catch{}
const save=()=>writeFileSync(`${directory}/imported-products.json`,JSON.stringify(manifest,null,2),{mode:0o600});
if(publish){
 for(const entry of manifest){
  if(!entry.hasImage)continue;
  const current=api(`/collections/products/records/${entry.id}`,'GET',undefined,token);
  if(current.slug!==entry.slug||!current.images?.length||current.variants?.length!==2)throw Error(`Prepared record mismatch: ${entry.slug}`);
  if(!current.active)api(`/collections/products/records/${entry.id}`,'PATCH',{active:true},token);
  console.log(JSON.stringify({slug:entry.slug,published:true}));
 }
 process.exit(0);
}
const schema=api('/collections/products','GET',undefined,token);
writeFileSync(`${directory}/products-schema-before.json`,JSON.stringify(schema,null,2),{mode:0o600});
const category=schema.fields.find(field=>field.name==='category');
if(category?.type==='select'&&!category.values.includes('noel'))api('/collections/products','PATCH',{fields:schema.fields.map(field=>field.name==='category'?{...field,values:[...field.values,'noel']}:field)},token);
const endpoint=process.env.R2_ENDPOINT||`https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const r2=new S3Client({region:'auto',endpoint,credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID,secretAccessKey:process.env.R2_SECRET_ACCESS_KEY}});
for(const p of report.products){
 const list=api(`/collections/products/records?perPage=1&filter=${encodeURIComponent(`slug='${p.slug}'`)}`,'GET',undefined,token);
 let record=list.items[0];
 if(record&&!manifest.some(entry=>entry.id===record.id)){console.log(JSON.stringify({slug:p.slug,skippedExisting:true}));continue;}
 const data={name:p.name,slug:p.slug,category:'noel',tagline:'Une décoration à fabriquer vous-même ou à recevoir déjà mise en forme.',description:`Choisissez votre formule pour un exemplaire du motif ${p.name.replace(/ thermoformée?$/,'')}.\n\n• Déjà thermoformée : décoration mise en forme et assemblée dans notre atelier, avec cordon. Moules non fournis.\n• Kit complet : pièces plates imprimées, moules réutilisables adaptés au motif, connecteurs nécessaires et cordon. Sèche-cheveux non fourni.\n\nFabrication artisanale à la commande. Les moules du kit restent chez vous pour de prochaines réalisations du même motif. Activité de mise en forme à chaud réalisée par un adulte.\n\nVisuel d’illustration du résultat final ; les teintes et le maillage peuvent varier selon l’impression. Décoration vendue vide, sans bonbons ni guirlande. Design : MIHAI_T.`,priceCents:p.readyPriceCents,compareAtCents:0,images:[],videoUrl:'',weightGrams:p.readyShippingGrams,colors:[],stock:20,active:false,featured:false,isNew:true,preorder:false,partnerShared:false,namePersonalizationEnabled:false,namePersonalizationPriceCents:0,variants:[{id:`noel-${p.sourceId}-ready`,name:'Déjà thermoformée · prête à installer',priceCents:p.readyPriceCents,stock:10,weightGrams:p.readyShippingGrams,image:'',active:true},{id:`noel-${p.sourceId}-kit`,name:'Kit complet · moules réutilisables inclus',priceCents:p.kitPriceCents,stock:10,weightGrams:p.kitShippingGrams,image:'',active:true}],quantityDiscounts:[]};
 if(!record){record=api('/collections/products/records','POST',data,token);manifest.push({id:record.id,slug:p.slug,sourceId:p.sourceId,hasImage:false});save();}
 if(p.imageFile&&!record.images?.length){
  const body=await sharp(p.imageFile).rotate().resize(1400,1400,{fit:'contain',background:'#ffffff'}).webp({quality:88}).toBuffer();
  const hash=createHash('sha256').update(body).digest('hex').slice(0,16);const key=`products/${record.id}/noel-${p.sourceId}-${hash}.webp`;
  await r2.send(new PutObjectCommand({Bucket:process.env.R2_BUCKET,Key:key,Body:body,ContentType:'image/webp',CacheControl:'public, max-age=31536000, immutable'}));
  const image=`/api/r2/${key}`;
  record=api(`/collections/products/records/${record.id}`,'PATCH',{images:[image],variants:data.variants.map(variant=>({...variant,image}))},token);
 }
 const entry=manifest.find(entry=>entry.id===record.id);if(entry){entry.hasImage=Boolean(record.images?.length);entry.readyPriceCents=p.readyPriceCents;entry.kitPriceCents=p.kitPriceCents;save();}
 console.log(JSON.stringify({slug:p.slug,prepared:true,hasImage:Boolean(record.images?.length),readyPrice:p.readyPriceCents/100,kitPrice:p.kitPriceCents/100}));
}
