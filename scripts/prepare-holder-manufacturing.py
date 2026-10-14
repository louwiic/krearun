"""Export full-resolution manufacturing templates, never the decimated GLBs.
Run with outputs/holder-models/.venv/bin/python scripts/prepare-holder-manufacturing.py
Uses dependencies documented in export-holder-preview.py. Source CAD is read-only.
"""
from pathlib import Path
import importlib.util,gzip,json,zipfile,sys,xml.etree.ElementTree as ET
sys.dont_write_bytecode=True
import trimesh,numpy as np
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('preview',ROOT/'scripts/export-holder-preview.py');preview=importlib.util.module_from_spec(spec);spec.loader.exec_module(preview)
SOURCE=Path('/Users/loic/3D/porte_boisson')
OUT=ROOT/'assets/holder-manufacturing';OUT.mkdir(parents=True,exist_ok=True)
CORE=preview.CORE;NS={'m':CORE}
def meshdata(mesh):
    mesh.remove_unreferenced_vertices();mesh.fix_normals()
    assert mesh.is_watertight and mesh.volume>0
    return {'vertices':mesh.vertices.reshape(-1).tolist(),'triangles':mesh.faces.reshape(-1).tolist()}
def load(path,model):
    with zipfile.ZipFile(path) as archive:
        root=ET.fromstring(archive.read('3D/3dmodel.model'));cfg=ET.fromstring(archive.read('Metadata/model_settings.config'))
        meta={o.get('id'):o for o in cfg.findall('object')};cache={}
        def objs(file):
            if file not in cache:cache[file]={o.get('id'):o for o in ET.fromstring(archive.read(file)).findall('m:resources/m:object',NS)}
            return cache[file]
        def visit(file,oid,transform):
            obj=objs(file)[oid];points=obj.findall('m:mesh/m:vertices/m:vertex',NS)
            if points:
                mesh=trimesh.Trimesh([[float(p.get(k)) for k in ('x','y','z')] for p in points],[[int(f.get(k)) for k in ('v1','v2','v3')] for f in obj.findall('m:mesh/m:triangles/m:triangle',NS)],process=False)
                mesh.apply_transform(transform)
                yield mesh,obj.get('name') or f'Piece {oid}'
            for c in obj.findall('m:components/m:component',NS):
                yield from visit((c.get('{'+preview.PROD+'}path') or file).lstrip('/'),c.get('objectid'),transform@preview.matrix(c.get('transform')))
        objects=[]
        for item in root.findall('m:build/m:item',NS):
            oid=item.get('objectid');objcfg=meta[oid];name=next((e.get('value') for e in objcfg.findall('metadata') if e.get('key')=='name'),f'Piece {oid}')
            plate=next(int(next(m.get('value') for m in plate.findall('metadata') if m.get('key')=='plater_id')) for plate in cfg.findall('plate') if any(any(m.get('key')=='object_id' and m.get('value')==oid for m in instance.findall('metadata')) for instance in plate.findall('model_instance')))
            parts=[]
            for mesh,pname in visit('3D/3dmodel.model',oid,np.eye(4)):
                slot=-1
                if plate>=5:
                    if model=='om':slot=1 if oid in ('10','12') else 0
                    else:slot=next(i for word,i in [('Rouge',1),('Blanc',2),('Bleu',3),('Dore',0)] if word in pname)
                parts.append({'name':pname,'slot':slot,**meshdata(mesh)})
            objects.append({'name':name,'plate':plate,'transform':item.get('transform'),'parts':parts})
        project=json.loads(archive.read('Metadata/project_settings.config'))
        licenses=[{'name':m.get('name'),'value':m.text or ''} for m in root.findall('m:metadata',NS) if m.get('name') in ('CopyRight','Copyright','License','Designer','DesignerUserId','Origin')]
        return {'objects':objects,'project':project,'attribution':licenses}
def save(name,data):
    path=OUT/f'{name}.json.gz';path.write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),mtime=0));print(name,path.stat().st_size,flush=True)
om=load(SOURCE/'OM_500ML/FINAL/01_IMPRESSION/PORTE CANETTE OM 500ML - FINAL.3mf','om');save('om',om)
arsenal=load(SOURCE/'Arsenal/FINAL/01_IMPRESSION/PORTE CANETTE ARSENAL 500ML - COULEURS AMS.3mf','arsenal');save('arsenal',arsenal)
neutral={**om,'objects':[o for o in om['objects'] if o['plate']<5]}
body=next(o for o in neutral['objects'] if o['plate']==4)
original=trimesh.load(SOURCE/'OM_500ML/FINAL/01_IMPRESSION/STL/01_Cylindre_logements_et_devise_gravee.stl')
body['parts']=[{'name':'Cylindre neutre — filetages d’origine','slot':-1,**meshdata(preview.neutralize(original))}];body['name']='Cylindre avec logement personnalisé'
save('custom',neutral)
