// Runs only in a disposable Node worker: CAD meshes never enter the client bundle.
import Module from 'manifold-3d';
import opentype from 'opentype.js';
import {holderTextContours} from './holder-text.mjs';
import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {join} from 'node:path';
import {zipSync,strToU8} from 'fflate';
const RADIUS=38.35, PREVIEW_RADIUS=38.65, GLUE_GAP=.02;
const PRESET_COLORS={om:['#c5a459','#0097d7'],arsenal:['#9c854d','#d41936','#fbf9f7','#023a77']};
const xml=value=>String(value).replace(/[<>&"']/g,char=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]));
import {manufacturingOptions} from './holder-manufacturing-options.mjs';
export {manufacturingOptions} from './holder-manufacturing-options.mjs';
// Follow pixel boundary edges, keeping diagonal islands separate and all holes.
export function maskContours(mask,width,height,scaleX,scaleY) {
  const stride=width+1,edges=new Map();let count=0;
  const edge=(x,y,dir)=>{const key=y*stride+x;if(!edges.has(key))edges.set(key,[]);edges.get(key).push(dir);if(++count>45000)throw new Error('Le logo est trop détaillé pour cet export. Simplifiez les petits détails avant fabrication.');};
  const filled=(x,y)=>x>=0&&y>=0&&x<width&&y<height&&mask[y*width+x];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(filled(x,y)){
    if(!filled(x,y-1))edge(x,y,0);if(!filled(x+1,y))edge(x+1,y,1);if(!filled(x,y+1))edge(x+1,y+1,2);if(!filled(x-1,y))edge(x,y+1,3);
  }
  const polygons=[],deltas=[1,stride,-1,-stride];
  while(edges.size){const start=edges.keys().next().value;let key=start,previous=-1;const polygon=[];
    do{polygon.push([(key%stride-width/2)*scaleX,(height/2-Math.floor(key/stride))*scaleY]);const choices=edges.get(key);if(!choices?.length)throw new Error('Contour du logo non fermé.');
      let selected=0;if(previous>=0&&choices.length>1){const rank=dir=>[1,0,3,2].indexOf((dir-previous+4)%4);selected=choices.reduce((best,dir,index)=>rank(dir)<rank(choices[best])?index:best,0);}
      const [dir]=choices.splice(selected,1);if(!choices.length)edges.delete(key);key+=deltas[dir];previous=dir;
    }while(key!==start);
    if(polygon.length>=3)polygons.push(polygon);
  }
  return polygons;
}
function meshData(solid){const mesh=solid.getMesh();return {vertices:Array.from(mesh.vertProperties).filter((_,index)=>index%mesh.numProp<3),triangles:Array.from(mesh.triVerts)};}
function solidFrom(data,wasm){return new wasm.Manifold(new wasm.Mesh({numProp:3,vertProperties:new Float32Array(data.vertices),triVerts:new Uint32Array(data.triangles)}));}
function checkSolid(solid,label){if(solid.status()!=='NoError'||solid.isEmpty()||solid.volume()<=0)throw new Error(`Géométrie invalide : ${label}.`);}
async function engraveText(template,configuration,logoHeight,report){
 if(!configuration.verticalName&&!configuration.engravingText&&!configuration.topEngravingText&&!configuration.bottomEngravingText)return;
 const font=opentype.loadSync(join(process.cwd(),'public/fonts/DejaVuSansCondensed-Bold.ttf'));
 const wasm=await Module();wasm.setup();const bodyObject=template.objects.find(o=>o.plate===4);let body=solidFrom(bodyObject.parts[0],wasm);let removed=0;
 const placements=holderTextContours(font,configuration,logoHeight);
 for(const placement of placements){if(!placement.polygons.length)continue;
  const points=placement.polygons.flat();if(points.some(p=>Math.abs(p[1])>58))throw new Error('La gravure empiète sur les filetages. Raccourcissez le texte.');
  const section=new wasm.CrossSection(placement.polygons,'EvenOdd').simplify(.01);const cutter=section.extrude(1.9).refineToLength(.8).warp(v=>{const angle=v[0]/38.38+placement.angle,radius=RADIUS-.4+v[2];v[2]=v[1];v[0]=radius*Math.sin(angle);v[1]=-radius*Math.cos(angle);});
  checkSolid(cutter,'gravure');const next=body.subtract(cutter).simplify(.0005);checkSolid(next,'corps gravé');removed+=body.volume()-next.volume();body=next;
 }
 if(removed<=.001)throw new Error('La gravure n’a pas pu être créée.');bodyObject.parts[0]={...bodyObject.parts[0],...meshData(body)};
 report.engraving={verticalName:configuration.verticalName||'',text:configuration.bottomEngravingText??configuration.engravingText??'',topText:configuration.topEngravingText||'',bottomText:configuration.bottomEngravingText??configuration.engravingText??'',depthMm:.4,removedVolumeMm3:removed,placements:placements.length};
 report.warnings.push('Textes personnalisés gravés à 0,4 mm dans le corps. Vérifier les petits caractères au tranchage.');
}
export async function buildHolderManufacturing(input) {
  const model=input.configuration.model??'custom';if(!['custom','om','arsenal'].includes(model))throw new Error('Modèle inconnu.');
  const template=JSON.parse(gunzipSync(await readFile(join(process.cwd(),'assets/holder-manufacturing',`${model}.json.gz`))));
  const report={version:1,requestId:input.requestId,model,unit:'millimeter',quantityPerProject:1,bodyColor:input.configuration.bodyColor,logoColors:input.palette,warnings:[],checks:{}};
  if(model!=='custom'){
    report.settings={depth:1.17,clearance:.2,thickness:1,sourceGeometryUnchanged:true};report.warnings.push('Modèle OM/Arsenal : logements, logos plats et orientations d’impression d’origine conservés.');
    await engraveText(template,input.configuration,8,report);
    if(report.engraving)report.settings.sourceGeometryUnchanged=false;
    const file=write3mf(template,input.configuration,report);return {file,report};
  }
  const faces=input.configuration.logoFaces??1;if(faces!==1&&faces!==2)throw new Error("Nombre de faces invalide.");
  const options=manufacturingOptions(input.options);report.settings={...options,glueGap:GLUE_GAP,remainingWallMm:Number((1.95-options.depth-GLUE_GAP).toFixed(2)),faces};
  const {data,info}=await sharp(Buffer.from(input.logo)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(info.width>384||info.height>384)throw new Error('Utilisez le logo préparé enregistré avec la demande.');
  const palette=input.palette;if(!Array.isArray(palette)||palette.length<1||palette.length>4||palette.some(color=>!/^#[a-f0-9]{6}$/i.test(color)))throw new Error('Palette du logo invalide.');
  const masks=palette.map(()=>new Uint8Array(info.width*info.height)),opaque=new Uint8Array(opaqueLength(info));const counts=palette.map(()=>0);
  for(let pixel=0;pixel<opaque.length;pixel++){const i=pixel*4;if(data[i+3]<128)continue;const hex='#'+[data[i],data[i+1],data[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('');const slot=palette.indexOf(hex);if(slot<0)throw new Error('La palette ne correspond pas au logo enregistré.');opaque[pixel]=1;masks[slot][pixel]=1;counts[slot]++;}
  const width=input.configuration.logoWidth,height=Math.min(88,width*info.height/info.width),sx=width/info.width,sy=height/info.height;
  const wasm=await Module();wasm.setup();const {CrossSection}=wasm;
  const silhouette=new CrossSection(maskContours(opaque,info.width,info.height,sx,sy),'EvenOdd').simplify(.025);
  if(silhouette.isEmpty())throw new Error('Logo vide.');
  const contours=silhouette.toPolygons(),ys=contours.flatMap(p=>p.map(v=>v[1]+input.configuration.logoOffset));
  if(Math.min(...ys)-options.clearance < -58 || Math.max(...ys)+options.clearance>58)throw new Error('Le logo empiète sur la zone des filetages : réduisez sa hauteur ou rapprochez-le du centre avant fabrication.');
  const islands=silhouette.decompose();report.checks.islands=islands.length;
  if(islands.length>1)report.warnings.push(`Le logo comporte ${islands.length} îlots séparés : chaque îlot devra être collé dans son logement.`);
  if(islands.some(part=>part.area()<.25))report.warnings.push('Le logo comporte des éléments de moins de 0,25 mm² : vérifier leur imprimabilité dans le trancheur.');
  const dominant=counts.indexOf(Math.max(...counts)),parts=[];let remaining=silhouette;
  const neutralRadius=RADIUS-options.depth+options.thickness/2;const flatScale=neutralRadius/PREVIEW_RADIUS;
  const base=silhouette.extrude(options.thickness-.4);
  for(const slot of [...palette.keys()].filter(index=>index!==dominant).concat(dominant)){
    const section=slot===dominant?remaining:new CrossSection(maskContours(masks[slot],info.width,info.height,sx,sy),'EvenOdd').simplify(.025).intersect(remaining);
    if(section.isEmpty())continue;
    remaining=remaining.subtract(section);
    let solid=section.extrude(.4).translate([0,0,options.thickness-.4]);if(slot===dominant)solid=base.add(solid);
    checkSolid(solid,`logo couleur ${slot+1}`);parts.push({name:`Logo à plat — ${palette[slot]}`,slot,...meshData(solid.scale([flatScale,1,1]))});
  }
  const bodyObject=template.objects.find(object=>object.plate===4);const body=solidFrom(bodyObject.parts[0],wasm);checkSolid(body,'cylindre source');
  const bend=solid=>solid.refineToLength(1.2).warp(v=>{const x=v[0],y=v[1],z=v[2],angle=x/PREVIEW_RADIUS,radius=RADIUS-options.depth+z;v[0]=radius*Math.sin(angle);v[1]=-radius*Math.cos(angle);v[2]=y+input.configuration.logoOffset;});
  const cutter=bend(silhouette.offset(options.clearance,'Round',2,24).simplify(.015).extrude(options.depth+1.5+GLUE_GAP).translate([0,0,-GLUE_GAP]));checkSolid(cutter,'logement');
  const cutters=faces===2?cutter.add(cutter.rotate([0,0,180])):cutter;
  const engraved=body.subtract(cutters).simplify(.0005);checkSolid(engraved,'cylindre avec logement');
  const frontInsert=bend(silhouette.extrude(options.thickness));
  const seated=faces===2?frontInsert.add(frontInsert.rotate([0,0,180])):frontInsert;checkSolid(seated,'logo cintré de contrôle');
  const overlap=engraved.intersect(seated).volume();if(overlap>.02)throw new Error('Le contrôle d’ajustement a détecté une intersection. Export interrompu.');
  const removed=body.volume()-engraved.volume();if(removed<=.001)throw new Error('Le logement n’a pas été créé.');
  bodyObject.parts[0]={...bodyObject.parts[0],...meshData(engraved)};
  for(let face=0;face<faces;face++)template.objects.push({name:face?'Logo multicolore à plat — face opposée':'Logo multicolore à plat — à coller',plate:5,transform:`1 0 0 0 1 0 0 0 1 435.2 ${-179.2+(face-(faces-1)/2)*(height+10)} 0`,parts});
  if(faces===2)report.warnings.push('Deux logements opposés à 180° et deux exemplaires du logo à plat, un pour chaque côté.');
  report.checks={...report.checks,bodyManifold:true,logoManifold:true,removedVolumeMm3:removed,insertBodyOverlapMm3:overlap,threadsExcludedFromCut:true};
  report.logoBoundsMm={previewArcWidth:width,flatWidth:width*flatScale,bendingNeutralRadius:neutralRadius,height,offset:input.configuration.logoOffset};
  report.warnings.push('Logo fourni à plat, à mettre en forme pour épouser le cylindre selon le matériau, comme les inserts OM/Arsenal. Vérifier une première pièce avant série.');
  await engraveText(template,input.configuration,height,report);
  return {file:write3mf(template,input.configuration,report),report};
}
function opaqueLength(info){return info.width*info.height;}
function meshXml(part){const vs=[],ts=[];for(let i=0;i<part.vertices.length;i+=3)vs.push(`<vertex x="${part.vertices[i].toFixed(7)}" y="${part.vertices[i+1].toFixed(7)}" z="${part.vertices[i+2].toFixed(7)}"/>`);for(let i=0;i<part.triangles.length;i+=3)ts.push(`<triangle v1="${part.triangles[i]}" v2="${part.triangles[i+1]}" v3="${part.triangles[i+2]}"/>`);return `<mesh><vertices>${vs.join('')}</vertices><triangles>${ts.join('')}</triangles></mesh>`;}
export function write3mf(template,configuration,report){
  const logoColors=configuration.model&&configuration.model!=='custom'?(configuration.logoColors??PRESET_COLORS[configuration.model]):report.logoColors;
  const colors=[...new Set([configuration.bodyColor,configuration.topColor??configuration.bodyColor,configuration.bottomColor??configuration.bodyColor,...logoColors].map(hex=>hex.toLowerCase()))];
  const materialIndex=(part,object)=>colors.indexOf((part.slot<0?(object?.plate===1?(configuration.topColor??configuration.bodyColor):object?.plate===2?(configuration.bottomColor??configuration.bodyColor):configuration.bodyColor):logoColors[part.slot]).toLowerCase());
  const resources=[`<basematerials id="1">${colors.map((color,i)=>`<base name="Filament ${i+1}" displaycolor="${color.toUpperCase()}FF"/>`).join('')}</basematerials>`],build=[],settings=[],plates=new Map();let nextId=100;
  template.objects.forEach((object,index)=>{
    const oid=10+index,children=[],partSettings=[];
    for(const part of object.parts){const id=nextId++,material=materialIndex(part,object);if(material<0)throw new Error('Matière manquante.');
      resources.push(`<object id="${id}" name="${xml(part.name)}" type="model" pid="1" pindex="${material}">${meshXml(part)}</object>`);
      children.push(`<component objectid="${id}"/>`);partSettings.push(`<part id="${id}" subtype="normal_part"><metadata key="name" value="${xml(part.name)}"/><metadata key="extruder" value="${material+1}"/><metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/><mesh_stat face_count="${part.triangles.length/3}" edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/></part>`);
    }
    resources.push(`<object id="${oid}" name="${xml(object.name)}" type="model"><components>${children.join('')}</components></object>`);
    build.push(`<item objectid="${oid}" transform="${object.transform}" printable="1"/>`);
    settings.push(`<object id="${oid}"><metadata key="name" value="${xml(object.name)}"/><metadata key="extruder" value="${materialIndex(object.parts[0],object)+1}"/>${object.plate===3?'<metadata key="enable_support" value="1"/><metadata key="support_type" value="normal(auto)"/>':'<metadata key="enable_support" value="0"/>'}${partSettings.join('')}</object>`);
    if(!plates.has(object.plate))plates.set(object.plate,[]);plates.get(object.plate).push(oid);
  });
  const plateNames=['Haut','Bas','Anse','Cylindre avec logement','Logos à plat','Étoiles à plat'];
  for(const [plate,ids] of plates)settings.push(`<plate><metadata key="plater_id" value="${plate}"/><metadata key="plater_name" value="${plateNames[plate-1]}"/><metadata key="locked" value="false"/>${ids.map(id=>`<model_instance><metadata key="object_id" value="${id}"/><metadata key="instance_id" value="0"/><metadata key="identify_id" value="${id+1000}"/></model_instance>`).join('')}</plate>`);
  const metadata=[...(template.attribution??[]),{name:'Application',value:'BambuStudio-02.08.02.61'},{name:'BambuStudio:3mfVersion',value:'1'},{name:'Title',value:`KREARUN — porte-boisson ${report.requestId}`},{name:'Description',value:'Pièces séparées pour impression et collage, dimensions en millimètres.'}].map(m=>`<metadata name="${xml(m.name)}">${xml(m.value)}</metadata>`).join('');
  if(colors.length>1)report.warnings.push('Affecter les filaments réels et recalculer les volumes de purge dans Bambu Studio ; le projet contient une matrice initiale conservatrice.');
  const project={...template.project,flush_volumes_matrix:colors.flatMap((_,i)=>colors.map((__,j)=>i===j?'0':'600')),flush_volumes_vector:Array(colors.length*2).fill('140'),filament_colour:colors,enable_prime_tower:colors.length>1?'1':'0',wipe_tower_x:Array(plates.size).fill('180'),wipe_tower_y:Array(plates.size).fill('170')};
  for(const [key,value] of Object.entries(project))if(Array.isArray(value)&&value.length===5)project[key]=Array.from({length:colors.length},(_,index)=>value[index]??value[0]);
  const instructions='Projet pour UN porte-boisson. Imprimer le corps, les bagues et la poignée sur leurs plateaux. Le logo est un objet multicolore séparé, dos à plat sur son plateau ; ses couleurs sont des parties du même objet. Conserver leurs positions relatives. Les zones transparentes restent vides et les îlots détachés restent séparés. La largeur à plat du logo personnalisé est compensée pour le rayon neutre du cintrage. Mettre le logo en forme pour épouser le cylindre selon le matériau, puis coller dans le logement. Affecter les filaments réels et recalculer les volumes de purge dans Bambu Studio (matrice initiale conservatrice). Contrôler le tranchage, le jeu et une première pièce avant production en série. La quantité commandée ne duplique pas automatiquement le projet. Réglages et contrôles : Metadata/krearun-fabrication.json.';
  return zipSync({
    '[Content_Types].xml':strToU8('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/><Default Extension="json" ContentType="application/json"/><Default Extension="txt" ContentType="text/plain"/><Default Extension="config" ContentType="application/xml"/></Types>'),
    '_rels/.rels':strToU8('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'),
    '3D/3dmodel.model':strToU8(`<?xml version="1.0" encoding="UTF-8"?><model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021" unit="millimeter" xml:lang="fr-FR">${metadata}<resources>${resources.join('')}</resources><build>${build.join('')}</build></model>`),
    'Metadata/model_settings.config':strToU8(`<?xml version="1.0"?><config>${settings.join('')}</config>`),
    'Metadata/project_settings.config':strToU8(JSON.stringify(project)),
    'Metadata/krearun-fabrication.json':strToU8(JSON.stringify({...report,filaments:colors},null,2)),
    'Metadata/NOTICE-COLLAGE.txt':strToU8(instructions),
  },{level:6});
}
