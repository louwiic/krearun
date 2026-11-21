import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const fonts=[
 {code:'F1',name:'Allura',original:'Autography',folder:'allura',filename:'Allura-Regular.ttf',style:'normal'},
 {code:'F2',name:'Jost',original:'Century Gothic',folder:'jost',filename:'Jost[wght].ttf',style:'normal'},
 {code:'F3',name:'Arimo',original:'Arial',folder:'arimo',filename:'Arimo[wght].ttf',style:'normal'},
 {code:'F4',name:'Caladea italique',original:'Cambria',folder:'caladea',filename:'Caladea-Italic.ttf',style:'italic'},
 {code:'F5',name:'Norican',original:'Norican',folder:'norican',filename:'Norican-Regular.ttf',style:'normal'},
 {code:'F6',name:'Great Vibes',original:'Great Vibes',folder:'greatvibes',filename:'GreatVibes-Regular.ttf',style:'normal'},
 {code:'F7',name:'Sofia',original:'Sofia',folder:'sofia',filename:'Sofia-Regular.ttf',style:'normal'},
 {code:'F8',name:'Libre Baskerville',original:'Calisto MT',folder:'librebaskerville',filename:'LibreBaskerville[wght].ttf',style:'normal'},
 {code:'F9',name:'Niconne',original:'Niconne',folder:'niconne',filename:'Niconne-Regular.ttf',style:'normal'},
];
const directory='public/coffrets/fonts';await mkdir(directory,{recursive:true});
async function download(url){const r=await fetch(url);if(!r.ok)throw Error(`${r.status} ${url}`);return Buffer.from(await r.arrayBuffer());}
for(const font of fonts){
 const base=`https://raw.githubusercontent.com/google/fonts/main/ofl/${font.folder}/`;
 const [binary,license]=await Promise.all([download(base+encodeURIComponent(font.filename)),download(base+'OFL.txt')]);
 if(binary.length<10000||!license.toString().includes('SIL OPEN FONT LICENSE'))throw Error(`Invalid font/license: ${font.code}`);
 font.active=['F2','F3','F4','F8'].includes(font.code);
 font.file=`${font.code}.ttf`;font.source=base+encodeURIComponent(font.filename);font.license=`${font.code}-OFL.txt`;font.sha256=createHash('sha256').update(binary).digest('hex');
 await writeFile(`${directory}/${font.file}`,binary);await writeFile(`${directory}/${font.license}`,license);
 console.log(`${font.code} ${font.name}: ${binary.length} octets`);
}
await writeFile('data/coffrets-fonts.json',JSON.stringify(fonts,null,2)+'\n');
