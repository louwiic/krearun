import jscad from "@jscad/modeling";
import ClipperLib from "clipper-lib";
import type { Font } from "opentype.js";
import { calculateNameplateLayout, type NameplateModel, type NameplateContour } from "./nameplate-3d";
import { parseKeychainConfiguration, type KeychainConfiguration } from "./name-keychain";
const { geometries, booleans, extrusions, transforms, measurements } = jscad;
function area(contour: NameplateContour) { return contour.reduce((sum, [x,y], i) => { const next=contour[(i+1)%contour.length];return sum+x*next[1]-next[0]*y; },0)/2; }
const path = (contours: NameplateContour[]) => contours.map(contour => `M ${contour.map(([x,y])=>`${x.toFixed(3)} ${y.toFixed(3)}`).join(" L ")} Z`).join(" ");
export function keychainShapes(value: KeychainConfiguration, font: Font) {
  const config = parseKeychainConfiguration(value);
  for (const character of config.name) if (character.trim() && font.charToGlyphIndex(character.replace("’", "'")) === 0) throw new Error("Cette police ne contient pas tous les caractères du prénom.");
  const rim = config.style === "relief" ? 2.2 : 0.8;
  const layout = calculateNameplateLayout({ name: config.name.replace(/’/g,"'"), maxWidth: 80, maxHeight: 25, baseThickness: 2.4, reliefHeight: 1.2, contourWidth: rim },font);
  const areas=layout.contours.map(area);
  const reference=areas.reduce((largest,a,i)=>Math.abs(a)>Math.abs(areas[largest])?i:largest,0);
  const sign=Math.sign(areas[reference]);
  const precision=10_000;
  const integer=(contour:NameplateContour)=>contour.map(([x,y])=>({X:Math.round(x*precision),Y:Math.round(y*precision)}));
  const positive=(contour:NameplateContour)=>integer(area(contour)<0?[...contour].reverse():contour);
  const outers=layout.contours.filter((_,i)=>Math.sign(areas[i])===sign);
  const holes=layout.contours.filter((_,i)=>Math.sign(areas[i])!==sign);
  function clip(subject:ClipperLib.Paths, clips:ClipperLib.Paths, operation:ClipperLib.ClipType){
    const engine=new ClipperLib.Clipper();
    engine.AddPaths(subject,ClipperLib.PolyType.ptSubject,true);
    if(clips.length)engine.AddPaths(clips,ClipperLib.PolyType.ptClip,true);
    const result:ClipperLib.Paths=[];
    engine.Execute(operation,result,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);
    return ClipperLib.Clipper.CleanPolygons(result,precision*0.0005);
  }
  const normalized=layout.contours.map((contour,i)=>integer((Math.sign(areas[i])===sign)===(area(contour)>0)?contour:[...contour].reverse()));
  const letterPaths=clip(normalized,[],ClipperLib.ClipType.ctUnion);
  const offset=new ClipperLib.ClipperOffset(2,precision*0.015);
  offset.AddPaths(outers.map(positive),ClipperLib.JoinType.jtRound,ClipperLib.EndType.etClosedPolygon);
  const backing:ClipperLib.Paths=[];offset.Execute(backing,rim*precision);
  const circle=(x:number,y:number,r:number)=>positive(Array.from({length:64},(_,i)=>[x+r*Math.cos(i*2*Math.PI/64),y+r*Math.sin(i*2*Math.PI/64)] as [number,number]));
  const y=layout.height*0.58;
  let joined=clip([...backing,circle(-4,y,5)],[],ClipperLib.ClipType.ctUnion);
  // Connect detached glyphs/accents by the shortest local bridge, without a bar across the name.
  for(let attempt=0;attempt<64;attempt++){
    const components=joined.filter(points=>ClipperLib.Clipper.Area(points)>0);
    if(components.length<=1)break;
    const main=components.reduce((largest,points)=>ClipperLib.Clipper.Area(points)>ClipperLib.Clipper.Area(largest)?points:largest);
    let best=Infinity,pair:ClipperLib.Path=[];
    for(const component of components){
      if(component===main)continue;
      for(const a of main)for(const b of component){const distance=(a.X-b.X)**2+(a.Y-b.Y)**2;if(distance<best){best=distance;pair=[a,b];}}
    }
    const bridge=new ClipperLib.ClipperOffset(2,precision*0.015);
    bridge.AddPath(pair,ClipperLib.JoinType.jtRound,ClipperLib.EndType.etOpenRound);
    const bridgePaths:ClipperLib.Paths=[];bridge.Execute(bridgePaths,precision*1.2);
    joined=clip([...joined,...bridgePaths],[],ClipperLib.ClipType.ctUnion);
    if(attempt===63)throw new Error("Ce prénom ne peut pas être relié solidement. Essayez une autre police.");
  }
  const basePaths=clip(joined.filter(points=>ClipperLib.Clipper.Area(points)>0),[circle(-4,y,2),...(config.style==="mono"?holes.map(positive):[])],ClipperLib.ClipType.ctDifference);
  const contours=(paths:ClipperLib.Paths):NameplateContour[]=>paths.map(points=>points.map(point=>[point.X/precision,point.Y/precision]));
  const shape=(paths:ClipperLib.Paths)=>geometries.geom2.create(contours(paths).flatMap(points=>geometries.geom2.toSides(geometries.geom2.fromPoints(points))));
  const baseShape=shape(basePaths),lettersShape=shape(letterPaths);

  const bounds=measurements.measureBoundingBox(baseShape);
  const [min,max]=bounds;
  return {config,layout,baseShape,lettersShape,width:max[0]-min[0],height:max[1]-min[1],previewFlipY:min[1]+max[1],viewBox:`${min[0]-2} ${min[1]-2} ${max[0]-min[0]+4} ${max[1]-min[1]+4}`,basePath:path(geometries.geom2.toOutlines(baseShape) as NameplateContour[]),lettersPath:path(contours(letterPaths))};
}
export function buildKeychainModel(value: KeychainConfiguration, font: Font): NameplateModel {
  const shapes=keychainShapes(value,font);
  const baseThickness=2.4,reliefHeight=1.2;
  const rawBase=extrusions.extrudeLinear({height:baseThickness},shapes.baseShape);
  const rawLetters=transforms.translateZ(baseThickness,extrusions.extrudeLinear({height:reliefHeight},shapes.lettersShape));
  // flattenPath already converted the font into upward-Y manufacturing coordinates.
  const [min]=measurements.measureBoundingBox(rawBase);
  const offset:[number,number,number]=[-min[0],-min[1],0];
  const base=transforms.translate(offset,rawBase),letters=transforms.translate(offset,rawLetters);
  return {printableName:shapes.config.name,width:shapes.width,height:shapes.height,depth:baseThickness+reliefHeight,base,letters,combined:booleans.union(base,letters),previewPath:shapes.lettersPath,previewBasePath:shapes.basePath};
}
