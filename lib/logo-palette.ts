export function recolorLogoPixels(pixels:Uint8Array|Uint8ClampedArray,source:string[],target:string[]):Uint8Array {
  if(source.length!==target.length)throw new Error("La palette du logo a changé. Importez-le à nouveau.");
  const mapping=new Map(source.map((hex,index)=>[hex.toLowerCase(),target[index]]));
  const output=new Uint8Array(pixels);
  for(let i=0;i<output.length;i+=4){if(!output[i+3])continue;const hex='#'+[output[i],output[i+1],output[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('');const replacement=mapping.get(hex);if(replacement){const value=parseInt(replacement.slice(1),16);output[i]=(value>>16)&255;output[i+1]=(value>>8)&255;output[i+2]=value&255;}}
  return output;
}
// Shared deterministic quantization: opaque pixels use at most four RGB colors.
// Transparent/antialiased edges do not create extra printing colors.
export function reduceLogoColors(pixels: Uint8Array, maxColors = 4): { pixels: Uint8Array; palette: string[]; reduced: boolean } {
  const histogram = new Map<number, { rgb: number[]; count: number }>();
  const exact = new Set<number>();
  for (let i=0;i<pixels.length;i+=4) {
    if (pixels[i+3]<128) continue;
    const [r,g,b]=[pixels[i],pixels[i+1],pixels[i+2]];
    exact.add((r<<16)|(g<<8)|b);
    const key=((r>>3)<<10)|((g>>3)<<5)|(b>>3);
    const bin=histogram.get(key);
    if (bin) { bin.rgb[0]+=r;bin.rgb[1]+=g;bin.rgb[2]+=b;bin.count++; }
    else histogram.set(key,{rgb:[r,g,b],count:1});
  }
  if (!exact.size) throw new Error("Le logo est vide ou entièrement transparent.");
  let centers: number[][];
  const distance=(a:number[],b:number[])=>a.reduce((sum,v,i)=>sum+(v-b[i])**2,0);
  const bins=[...histogram.values()].map(bin=>({rgb:bin.rgb.map(v=>v/bin.count),count:bin.count}));
  const reduced=exact.size>maxColors;
  if (!reduced) centers=[...exact].map(v=>[(v>>16)&255,(v>>8)&255,v&255]);
  else {
    bins.sort((a,b)=>b.count-a.count);
    centers=[bins[0].rgb];
    while (centers.length<maxColors && centers.length<bins.length) {
      const next=bins.reduce((best,bin)=>{
        const score=Math.min(...centers.map(c=>distance(c,bin.rgb)))*Math.sqrt(bin.count);
        return score>best.score?{rgb:bin.rgb,score}:best;
      },{rgb:bins[0].rgb,score:-1});
      if (next.score<=0) break;
      centers.push(next.rgb);
    }
    for (let iteration=0;iteration<12;iteration++) {
      const sums=centers.map(()=>[0,0,0,0]);
      for (const bin of bins) {
        const idx=centers.map(c=>distance(c,bin.rgb)).reduce((best,v,i,all)=>v<all[best]?i:best,0);
        bin.rgb.forEach((v,i)=>sums[idx][i]+=v*bin.count);sums[idx][3]+=bin.count;
      }
      centers=centers.map((c,i)=>sums[i][3]?sums[i].slice(0,3).map(v=>v/sums[i][3]):c);
    }
  }
  centers=centers.map(c=>c.map(v=>Math.round(v)));
  const output=new Uint8Array(pixels.length);const used=new Set<string>();
  for(let i=0;i<pixels.length;i+=4) {
    if(pixels[i+3]<128) continue;
    const rgb=[pixels[i],pixels[i+1],pixels[i+2]];
    const idx=centers.map(c=>distance(c,rgb)).reduce((best,v,i,all)=>v<all[best]?i:best,0);
    output.set([...centers[idx],255],i);
    used.add('#'+centers[idx].map(v=>v.toString(16).padStart(2,'0')).join(''));
  }
  return {pixels:output,palette:[...used],reduced};
}
