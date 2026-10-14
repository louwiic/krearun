"""Export actual clicker CAD parts for the web viewer; source projects are read-only.
Run: outputs/holder-models/.venv/bin/python scripts/export-clicker-preview.py
Dependencies: numpy, trimesh, manifold3d (same venv as holder export).
"""
from pathlib import Path
import json,zipfile,xml.etree.ElementTree as ET,sys,hashlib
import numpy as np
import trimesh
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path('/Users/loic/3D/Bibliotheque_3D/clicker 3D print')
OUT=ROOT/'public/models/clicker';OUT.mkdir(parents=True,exist_ok=True)
CORE='http://schemas.microsoft.com/3dmanufacturing/core/2015/02';PROD='http://schemas.microsoft.com/3dmanufacturing/production/2015/06';NS={'m':CORE}
def matrix(value):
    out=np.eye(4)
    if value:
        values=np.array(list(map(float,value.split())));out[:3,:3]=values[:9].reshape(3,3).T;out[:3,3]=values[9:12]
    return out

def extract(path):
    with zipfile.ZipFile(path) as archive:
        cfg=ET.fromstring(archive.read('Metadata/model_settings.config'));cache={}
        records={o.get('id'):o for o in cfg.findall('object')}
        def objects(file):
            if file not in cache:cache[file]={o.get('id'):o for o in ET.fromstring(archive.read(file)).findall('m:resources/m:object',NS)}
            return cache[file]
        def visit(file,oid,transform):
            obj=objects(file)[oid];vertices=obj.findall('m:mesh/m:vertices/m:vertex',NS)
            if vertices:
                mesh=trimesh.Trimesh([[float(v.get(k)) for k in ['x','y','z']] for v in vertices],[[int(f.get(k)) for k in ['v1','v2','v3']] for f in obj.findall('m:mesh/m:triangles/m:triangle',NS)],process=False)
                mesh.apply_transform(transform);yield oid,mesh
            for child in obj.findall('m:components/m:component',NS):yield from visit((child.get('{'+PROD+'}path') or file).lstrip('/'),child.get('objectid'),transform@matrix(child.get('transform')))
        result=[]
        root=ET.fromstring(archive.read('3D/3dmodel.model'))
        for obj in root.findall('m:resources/m:object',NS):
            data=records[obj.get('id')];name=next(m.get('value') for m in data.findall('metadata') if m.get('key')=='name')
            part_meta={p.get('id'):{m.get('key'):m.get('value') for m in p.findall('metadata')} for p in data.findall('part')}
            parts=[{'mesh':mesh,'role':'glyph' if part_meta.get(oid,{}).get('extruder')=='2' else 'cap','sourcePart':oid} for oid,mesh in visit('3D/3dmodel.model',obj.get('id'),np.eye(4))]
            result.append({'name':name,'parts':parts})
        return result

def export(name,parts):
    scene=trimesh.Scene();total=0
    for index,part in enumerate(parts):
        mesh=part['mesh'].copy();mesh.remove_unreferenced_vertices();mesh.fix_normals()
        # CAD Z-up -> Three.js Y-up; top lettering reads from the front (+Z).
        mesh.apply_transform(np.array([[1,0,0,0],[0,0,1,0],[0,-1,0,0],[0,0,0,1]],float))
        color='#ffffff' if part['role']!='glyph' else '#e94f26'
        mesh.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(name=part['role'],baseColorFactor=trimesh.visual.color.hex_to_rgba(color),metallicFactor=0,roughnessFactor=.6))
        node=f'{part["role"]}_{index}';scene.add_geometry(mesh,node_name=node,geom_name=node);total+=len(mesh.faces)
    path=OUT/f'{name}.glb';path.write_bytes(scene.export(file_type='glb'))
    return {'file':path.name,'triangles':total,'bytes':path.stat().st_size}

def main():
    bases=extract(SOURCE/'Compact+Fidget+Clicker+-+Base.3mf');keycaps=extract(SOURCE/'Chunky+Keycaps+-+Alphabets,+Numbers,+Icons,+and+Blank.3mf')
    report={'pitchMm':20.5,'baseHeightMm':16,'capBottomMm':17,'capBodyHeightMm':5,'bases':{},'caps':{},'sources':[{'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()} for path in [SOURCE/'Compact+Fidget+Clicker+-+Base.3mf',SOURCE/'Chunky+Keycaps+-+Alphabets,+Numbers,+Icons,+and+Blank.3mf']]}
    meshes={}
    for entry in bases:
        count=int(entry['name'].split()[0]);mesh=entry['parts'][0]['mesh'];center=mesh.bounds.mean(0);mesh.apply_translation([-center[0],-center[1],-mesh.bounds[0,2]]);meshes[count]=mesh
    # Longer counts repeat one native switch module; the original end geometry
    # and the 20.5 mm pitch stay at their exact scale, with no stretched slots.
    ten=meshes[10]
    def slab(low,high):
        box=trimesh.creation.box([high-low,100,100]);box.apply_translation([(low+high)/2,0,0]);return trimesh.boolean.intersection([ten,box],engine='manifold')
    left,right,module=slab(-150,0),slab(0,150),slab(0,20.5)
    for count in range(11,16):
        extra=count-10;end=right.copy();end.apply_translation([extra*20.5,0,0]);parts=[left,end]
        for i in range(extra):
            piece=module.copy();piece.apply_translation([i*20.5,0,0]);parts.append(piece)
        mesh=trimesh.boolean.union(parts,engine='manifold');mesh.apply_translation([-extra*20.5/2,0,0]);assert mesh.is_watertight;meshes[count]=mesh
    for count,mesh in sorted(meshes.items()):
        report['bases'][str(count)]={**export(f'base-{count}',[{'mesh':mesh,'role':'base'}]),'slots':count,'sourceDerived':count>10,'sizeMm':mesh.extents.tolist()}
    names={'keycap':'blank','keycap - star':'star','keycap - heart':'heart','keycap - cloud':'cloud','keycap - clover':'clover'}
    for entry in keycaps:
        key=names.get(entry['name'])
        if entry['name'].startswith('keycap-char-') and len(entry['name'][12:])==1:key=entry['name'][12:]
        if not key:continue
        cap=next(part['mesh'] for part in entry['parts'] if part['role']=='cap');low=cap.bounds[0,2];center=cap.bounds.mean(0)
        for part in entry['parts']:part['mesh'].apply_translation([-center[0],-center[1],-low])
        report['caps'][key]={**export(f'cap-{key}',entry['parts']),'sourceName':entry['name'],'sizeMm':cap.extents.tolist()}
    (OUT/'manifest.json').write_text(json.dumps(report,indent=2,ensure_ascii=False));print('Exported',len(report['bases']),'bases and',len(report['caps']),'keycaps')
if __name__=='__main__':main()
