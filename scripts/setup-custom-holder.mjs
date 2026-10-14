// node --env-file=.env scripts/setup-custom-holder.mjs
// Provision the request workflow and an inactive catalog product before deploy.
const base=process.env.POCKETBASE_URL?.replace(/\/$/,'');
const authResponse=await fetch(`${base}/api/collections/_superusers/auth-with-password`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identity:process.env.POCKETBASE_ADMIN_EMAIL,password:process.env.POCKETBASE_ADMIN_PASSWORD})});
const auth=await authResponse.json();if(!authResponse.ok||!auth.token)throw new Error('PocketBase authentication failed');
async function pb(path,method='GET',body){const response=await fetch(`${base}/api${path}`,{method,headers:{Authorization:auth.token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const data=response.status===204?null:await response.json();if(!response.ok)throw new Error(`PocketBase ${response.status}: ${JSON.stringify(data)}`);return data;}
async function ensureCollection(name,fields,indexes){
  const list=await pb(`/collections?filter=${encodeURIComponent(`name='${name}'`)}`);
  if(list.items[0]) {console.log(`Collection ${name} already exists`);return list.items[0];}
  const created=await pb('/collections','POST',{name,type:'base',listRule:null,viewRule:null,createRule:null,updateRule:null,deleteRule:null,fields,indexes});console.log(`Created ${name}`);return created;
}
const customers=await pb('/collections/customers');const orders=await pb('/collections/orders');
const dates=[{name:'created',type:'autodate',onCreate:true,onUpdate:false},{name:'updated',type:'autodate',onCreate:true,onUpdate:true}];
const text=(name,max=1000)=>({name,type:'text',max});
const requests=await ensureCollection('holder_requests',[
  {name:'customerId',type:'relation',collectionId:customers.id,maxSelect:1,required:true,cascadeDelete:false},
  {name:'orderId',type:'relation',collectionId:orders.id,maxSelect:1,cascadeDelete:false},
  text('customerEmail',160),text('customerName',120),text('note'),text('submissionKey',80),text('stripeSessionId',160),
  {name:'quantity',type:'number',required:true,onlyInt:true,min:1,max:20},
  {name:'configuration',type:'json',required:true,maxSize:4096},{name:'palette',type:'json',required:true,maxSize:1024},
  {name:'logo',type:'file',required:true,maxSelect:1,maxSize:2097152,mimeTypes:['image/png'],protected:true},
  {name:'originalLogo',type:'file',required:true,maxSelect:1,maxSize:20971520,mimeTypes:['image/png'],protected:true},...dates,
],['CREATE UNIQUE INDEX idx_holder_submission ON holder_requests (submissionKey)']);
await ensureCollection('holder_decisions',[
  {name:'requestId',type:'relation',collectionId:requests.id,maxSelect:1,required:true,cascadeDelete:false},
  {name:'status',type:'select',maxSelect:1,required:true,values:['approved','rejected']},
  {name:'unitPriceCents',type:'number',onlyInt:true,min:0,max:1000000},
  {name:'shippingCents',type:'number',onlyInt:true,min:0,max:1000000},text('message'),...dates,
],['CREATE UNIQUE INDEX idx_holder_decision ON holder_decisions (requestId)']);
if(!orders.indexes.some(index=>index.includes('idx_holder_order'))){
  await pb(`/collections/${orders.id}`,'PATCH',{indexes:[...orders.indexes,"CREATE UNIQUE INDEX idx_holder_order ON orders (sourceId) WHERE sourceId LIKE 'holder:%'"]});
  console.log('Added unique custom-holder order index');
}
const slug='porte-boisson-500ml-personnalise';
const existing=await pb(`/collections/products/records?filter=${encodeURIComponent(`slug='${slug}'`)}`);
if(!existing.items.length){
  await pb('/collections/products/records','POST',{
    name:'Porte-boisson 500 ml personnalisé',slug,tagline:'Votre logo en quatre couleurs maximum, avec aperçu 3D avant validation.',
    description:'Porte-boisson avec poignée pour canette 500 ml. Importez votre logo et personnalisez sa taille, sa position et la couleur du support.\n\nLe logo est préparé en quatre couleurs maximum. Nous vérifions sa faisabilité dans notre atelier avant de vous proposer un prix. Aucun paiement avant validation. Retrouvez votre demande et payez ensuite dans votre espace client.',
    category:'porte-boisson',images:['/products/porte-boisson-personnalise.svg'],priceCents:0,compareAtCents:0,stock:0,weightGrams:180,
    colors:[],variants:[],quantityDiscounts:[],videoUrl:'',active:false,featured:false,isNew:true,preorder:false,partnerShared:false,namePersonalizationEnabled:false,namePersonalizationPriceCents:0,
  });console.log('Created inactive personalized-holder product');
}else console.log('Catalog product already exists');
