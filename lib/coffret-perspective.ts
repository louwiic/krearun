export type Point=[number,number];
export const CLOSED_WIDTH=1370;
export const CLOSED_HEIGHT=1148;
export const CLOSED_LID:Point[]=[[225,328],[1230,360],[1352,733],[35,691]];
// A homography preserves the photographed trapezoidal perspective, including
// the wider front edge, instead of stretching the artwork as a parallelogram.
export function faceHomography(width:number,height:number,target:Point[]) {
 const source:Point[]=[[0,0],[width,0],[width,height],[0,height]];
 const a:number[][]=[];
 source.forEach(([x,y],i)=>{const [u,v]=target[i];a.push([x,y,1,0,0,0,-u*x,-u*y,u]);a.push([0,0,0,x,y,1,-v*x,-v*y,v]);});
 for(let col=0;col<8;col++){
  let pivot=col;for(let row=col+1;row<8;row++)if(Math.abs(a[row][col])>Math.abs(a[pivot][col]))pivot=row;
  [a[col],a[pivot]]=[a[pivot],a[col]];const divisor=a[col][col];if(Math.abs(divisor)<1e-10)throw Error('Invalid perspective');
  for(let j=col;j<9;j++)a[col][j]/=divisor;
  for(let row=0;row<8;row++)if(row!==col){const scale=a[row][col];for(let j=col;j<9;j++)a[row][j]-=scale*a[col][j];}
 }
 return a.map(row=>row[8]);
}
export function projectFace(h:number[],x:number,y:number):Point {
 const d=h[6]*x+h[7]*y+1;return [(h[0]*x+h[1]*y+h[2])/d,(h[3]*x+h[4]*y+h[5])/d];
}
export function invertHomography(h:number[]) {
 const [a,b,c,d,e,f,g,k]=h;const base=a*e-b*d;if(Math.abs(base)<1e-12)throw Error('Invalid inverse perspective');
 return [(e-f*k)/base,(c*k-b)/base,(b*f-c*e)/base,(f*g-d)/base,(a-c*g)/base,(c*d-a*f)/base,(d*k-e*g)/base,(b*g-a*k)/base];
}
export function closedSurfaceMask(pixels:Uint8ClampedArray,width:number,height:number,seed:Point):Uint8Array {
 const mask=new Uint8Array(width*height),visited=new Uint8Array(width*height),queue=new Int32Array(width*height);
 let start=0,end=0;const origin=Math.floor(seed[1])*width+Math.floor(seed[0]);queue[end++]=origin;visited[origin]=1;
 while(start<end){const i=queue[start++],p=i*4,r=pixels[p],g=pixels[p+1],b=pixels[p+2];
  if(r<180||g<170||b<150||r<g||g<b||r-g>55||g-b>65)continue;
  mask[i]=1;const x=i%width,y=Math.floor(i/width);const neighbors=[x>0?i-1:-1,x+1<width?i+1:-1,y>0?i-width:-1,y+1<height?i+width:-1];
  for(const n of neighbors)if(n>=0&&!visited[n]){visited[n]=1;queue[end++]=n;}
 }
 return mask;
}
