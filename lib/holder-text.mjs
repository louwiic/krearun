// Shared millimetre contours for the screen preview and actual engraving.
export function holderTextContours(font,configuration,logoHeight=8){
 const placements=[],name=configuration.verticalName||'',caption=configuration.bottomEngravingText??configuration.engravingText??'',topCaption=configuration.topEngravingText||'';
 if(name){const letters=Array.from(name.toUpperCase()),pitch=9;letters.forEach((letter,i)=>placements.push({text:letter,height:7,width:8,y:((letters.length-1)/2-i)*pitch,angle:-Math.PI/2,kind:'name'}));}
 const preset=configuration.model&&configuration.model!=='custom',faces=configuration.logoFaces??(preset?2:1),offset=configuration.logoOffset||0;
 if(topCaption){const y=preset?54:Math.max(46,logoHeight/2+offset+9);for(let face=0;face<faces;face++)placements.push({text:topCaption,height:6,width:65,y,angle:face*Math.PI,kind:'top-caption'});}
 if(caption){const legacyY=preset?-54:-logoHeight/2+offset-9,y=configuration.bottomEngravingText===undefined?legacyY:preset?-54:Math.min(-38,legacyY);for(let face=0;face<faces;face++)placements.push({text:caption,height:6,width:65,y,angle:face*Math.PI,kind:'caption'});}
 return placements.filter(p=>p.text.trim()).map(placement=>{
  const commands=font.getPath(placement.text,0,0,100).commands,polygons=[];let current=[],x=0,y=0;
  for(const c of commands){if(c.type==='M'){if(current.length)polygons.push(current);current=[[c.x,c.y]];x=c.x;y=c.y;}
   else if(c.type==='L'){current.push([c.x,c.y]);x=c.x;y=c.y;}
   else if(c.type==='Q'||c.type==='C'){const x0=x,y0=y;for(let i=1;i<=12;i++){const t=i/12,u=1-t;current.push(c.type==='Q'?[u*u*x0+2*u*t*c.x1+t*t*c.x,u*u*y0+2*u*t*c.y1+t*t*c.y]:[u*u*u*x0+3*u*u*t*c.x1+3*u*t*t*c.x2+t*t*t*c.x,u*u*u*y0+3*u*u*t*c.y1+3*u*t*t*c.y2+t*t*t*c.y]);}x=c.x;y=c.y;}
   else if(c.type==='Z'){if(current.length)polygons.push(current);current=[];}}
  if(current.length)polygons.push(current);const all=polygons.flat();if(!all.length)return {...placement,polygons:[]};
  const minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1]));
  const scale=Math.min(placement.width/(maxX-minX),placement.height/(maxY-minY));
  return {...placement,polygons:polygons.map(p=>p.map(([x,y])=>[(x-(minX+maxX)/2)*scale,-(y-(minY+maxY)/2)*scale+placement.y]))};
 });
}
