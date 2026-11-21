// Runtime colour mapping for the neutral product photo. Illustration and text are
// separate SVG layers and never pass through this operation.
export function rgbHsl(r:number,g:number,b:number):[number,number,number] {
 r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2,d=max-min;
 if(!d)return [0,0,l];const s=d/(1-Math.abs(2*l-1));
 let h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;
 h=(h*60+360)%360;return [h,s,l];
}
function hslRgb(h:number,s:number,l:number):[number,number,number] {
 const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
 const v=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
 return v.map(n=>Math.round((n+m)*255)) as [number,number,number];
}
export function recolorCoffretPixels(data:Uint8ClampedArray,width:number,height:number,hex:string,wholeAsset=false) {
 if(!/^#[0-9a-f]{6}$/i.test(hex))throw Error('Invalid preview colour');
 const [h,s,l]=rgbHsl(parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16));
 for(let i=0;i<data.length;i+=4){
  const x=(i/4)%width,y=Math.floor(i/4/width);const nx=x/width,ny=y/height;
  const lid=nx>.34&&nx<.9&&ny<.45,body=nx>.09&&nx<.68&&ny>.44&&ny<.94;
  if(data[i+3]===0||(!wholeAsset&&!lid&&!body))continue;
  const r=data[i],g=data[i+1],b=data[i+2];
  // Very saturated orange plastic; cream inserts, cloth and jewellery remain intact.
  if(wholeAsset ? (r<50||g<10||g<r*.12||r<g*1.05||b>g*.7) : (r<70||g<30||g<r*.42||r<g*1.1||b>g*.28))continue;
  const [,sourceS,sourceL]=rgbHsl(r,g,b);if(sourceS<.65)continue;
  const light=Math.max(.055,Math.min(.95,l+(sourceL-.5)*.88));
  const mapped=hslRgb(h,Math.min(1,s*(.85+sourceS*.15)),light);
  data[i]=mapped[0];data[i+1]=mapped[1];data[i+2]=mapped[2];
 }
 return data;
}
