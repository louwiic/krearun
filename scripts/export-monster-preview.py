"""Export a web preview from the original, assembled Monster manufacturing parts."""
from pathlib import Path
import numpy as np
import trimesh
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path('/Users/loic/3D/Bibliotheque_3D/porte_boisson/PORTE MONSTER/APERCU_R_F_BRINKS_VERTICAL_500ML/03_SOURCE')
OUT=ROOT/'public/models/monster';OUT.mkdir(parents=True,exist_ok=True)
parts=[('body',SOURCE/'ORIGINAUX/CORPS_POIGNEE.stl'),('accent_bottom',SOURCE/'BAS.stl'),('accent_top',SOURCE/'HAUT.stl')]
parts += [('accent_claw_'+p.stem,p) for p in sorted(SOURCE.glob('GRIFFE_FACE_*.stl'))]
scene=trimesh.Scene();R=np.array([[1,0,0,0],[0,0,1,0],[0,-1,0,0],[0,0,0,1]],float)
for name,path in parts:
 m=trimesh.load(path,force='mesh');m.merge_vertices(digits_vertex=4);m.update_faces(m.nondegenerate_faces());m.update_faces(m.unique_faces())
 target=30000 if name=='body' else 6000
 if len(m.faces)>target:m=m.simplify_quadric_decimation(face_count=target,aggression=4)
 m.remove_unreferenced_vertices();m.fix_normals();m.apply_translation([0,0,-89]);m.apply_transform(R)
 m.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(name=name,baseColorFactor=[15,17,17,255] if name=='body' else [65,195,209,255],roughnessFactor=.72,metallicFactor=0))
 scene.add_geometry(m,node_name=name,geom_name=name)
 print(name,len(m.faces),m.bounds.round(2).tolist(),flush=True)
p=OUT/'monster-holder.glb';p.write_bytes(scene.export(file_type='glb'));print('Bytes:',p.stat().st_size)
