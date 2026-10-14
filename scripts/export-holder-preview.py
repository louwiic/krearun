"""Build web preview GLBs from the supplied assembled 3MF projects.
Usage: outputs/holder-models/.venv/bin/python scripts/export-holder-preview.py
Dependencies: numpy trimesh manifold3d shapely mapbox-earcut fast-simplification scipy networkx.
Only public preview assets are written; the original CAD files are never changed.
"""
from pathlib import Path
import zipfile, xml.etree.ElementTree as ET, math, json
import numpy as np
import trimesh
from shapely.geometry import Polygon

ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path('/Users/loic/3D/porte_boisson')
OUT=ROOT/'public/models/holders';OUT.mkdir(parents=True,exist_ok=True)
CORE='http://schemas.microsoft.com/3dmanufacturing/core/2015/02'
PROD='http://schemas.microsoft.com/3dmanufacturing/production/2015/06'
NS={'m':CORE}
OM=SOURCE/'OM_500ML/FINAL/03_VISUEL/PORTE CANETTE OM 500ML - ASSEMBLE.3mf'
ARSENAL=SOURCE/'Arsenal/FINAL/03_VISUEL/PORTE CANETTE ARSENAL 500ML - ASSEMBLE.3mf'

def matrix(value):
    if not value:return np.eye(4)
    a=np.array([float(v) for v in value.split()])
    result=np.eye(4);result[:3,:3]=a[:9].reshape(3,3).T;result[:3,3]=a[9:12];return result

def extract(path):
    parts=[]
    with zipfile.ZipFile(path) as z:
        metadata=ET.fromstring(z.read('Metadata/model_settings.config'))
        part_data={p.get('id'):{e.get('key'):e.get('value') for e in p.findall('metadata')} for p in metadata.findall('.//part')}
        project=json.loads(z.read('Metadata/project_settings.config'))
        colors=project.get('filament_colour',['#FFFFFF','#0097d7','#c5a459','#003976'])
        cache={}
        def objects(filename):
            if filename not in cache:
                root=ET.fromstring(z.read(filename));cache[filename]={o.get('id'):o for o in root.findall('m:resources/m:object',NS)}
            return cache[filename]
        def visit(filename,identifier,transform):
            ob=objects(filename)[identifier]
            vertices=ob.findall('m:mesh/m:vertices/m:vertex',NS)
            if vertices:
                points=np.array([[float(v.get(c)) for c in ['x','y','z']] for v in vertices])
                faces=np.array([[int(f.get(c)) for c in ['v1','v2','v3']] for f in ob.findall('m:mesh/m:triangles/m:triangle',NS)])
                mesh=trimesh.Trimesh(points,faces,process=False)
                data=part_data.get(identifier,{})
                name=ob.get('name') or data.get('name') or f'part-{identifier}'
                extruder=int(data.get('extruder') or 1)-1
                color=colors[min(extruder,len(colors)-1)]
                parts.append({'name':name,'mesh':mesh,'transform':transform,'color':color})
            for c in ob.findall('m:components/m:component',NS):
                child_file=(c.get('{'+PROD+'}path') or filename).lstrip('/')
                visit(child_file,c.get('objectid'),transform@matrix(c.get('transform')))
        root=ET.fromstring(z.read('3D/3dmodel.model'))
        for item in root.findall('m:build/m:item',NS):visit('3D/3dmodel.model',item.get('objectid'),matrix(item.get('transform')))
    return parts

def neutralize(mesh):
    # Same clean-up envelope used in the modeled Arsenal source: fill the two
    # decorative faces and keep the existing thread/handle geometry untouched.
    patches=[]
    for angle in (-90,90):
        a=np.linspace(math.radians(angle-60),math.radians(angle+60),241)
        points=[(38.35*math.cos(t),38.35*math.sin(t)) for t in a]
        points += [(36.4*math.cos(t),36.4*math.sin(t)) for t in a[::-1]]
        patch=trimesh.creation.extrude_polygon(Polygon(points),120,engine='earcut')
        patch.apply_translation([0,0,-60]);patches.append(patch)
    cleaned=trimesh.boolean.union([mesh,*patches],engine='manifold')
    assert cleaned.is_watertight
    return cleaned

def role(name):
    name=name.lower()
    if name in ['cylindre','corps']:return 'body'
    if name=='haut':return 'top'
    if name=='bas':return 'bottom'
    if name=='anse':return 'handle'
    return 'logo'

def export(parts,variant):
    meshes=[]
    for index,part in enumerate(parts):
        kind=role(part['name'])
        if variant=='custom' and kind=='logo':continue
        mesh=part['mesh'].copy()
        if variant=='custom' and kind=='body':mesh=neutralize(mesh)
        mesh.apply_transform(part['transform'])
        meshes.append((part,kind,mesh,index))
    body=next(m for _,kind,m,_ in meshes if kind=='body')
    cx,cy=body.bounds.mean(axis=0)[:2]
    low=min(m.bounds[0,2] for _,_,m,_ in meshes);high=max(m.bounds[1,2] for _,_,m,_ in meshes)
    centre_z=(low+high)/2
    scene=trimesh.Scene();triangles=0
    report=[]
    for part,kind,mesh,index in meshes:
        mesh.apply_translation([-cx,-cy,-centre_z])
        # CAD is Z-up with logos facing -Y. glTF/Three.js is Y-up, front +Z.
        rotation=np.array([[1,0,0,0],[0,0,1,0],[0,-1,0,0],[0,0,0,1]],dtype=float)
        mesh.apply_transform(rotation)
        original_faces=len(mesh.faces)
        target=35000 if kind=='body' else 16000
        if len(mesh.faces)>target:mesh=mesh.simplify_quadric_decimation(face_count=target,aggression=3)
        mesh.remove_unreferenced_vertices();mesh.fix_normals()
        color='#f3eee5' if variant=='custom' else part['color']
        rgba=trimesh.visual.color.hex_to_rgba(color)
        mesh.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(name=kind,baseColorFactor=rgba,metallicFactor=0,roughnessFactor=.65))
        name=f'{kind}_{index}_{part["name"]}'
        scene.add_geometry(mesh,node_name=name,geom_name=name)
        triangles+=len(mesh.faces);report.append({'part':part['name'],'role':kind,'sourceTriangles':original_faces,'previewTriangles':len(mesh.faces)})
    path=OUT/f'{variant}.glb';path.write_bytes(scene.export(file_type='glb'))
    result={'variant':variant,'heightMm':round(high-low,3),'triangles':triangles,'bytes':path.stat().st_size,'parts':report}
    print(json.dumps(result,ensure_ascii=False),flush=True);return result

if __name__=='__main__':
    om=extract(OM);arsenal=extract(ARSENAL)
    reports=[export(om,'custom'),export(om,'om'),export(arsenal,'arsenal')]
    (OUT/'manifest.json').write_text(json.dumps({'sourcePrintProject':'OM_500ML/FINAL/01_IMPRESSION/PORTE CANETTE OM 500ML - FINAL.3mf','assemblySources':[str(OM.relative_to(SOURCE)),str(ARSENAL.relative_to(SOURCE))],'models':reports},ensure_ascii=False,indent=2))
