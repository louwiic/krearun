"""Export the supplied hoodie 3MF as a lightweight, engraved web preview.
Run with outputs/holder-models/.venv/bin/python scripts/export-sweat-preview.py.
The source manufacturing project is never changed.
"""
from pathlib import Path
import zipfile, re, json, subprocess, tempfile
import xml.etree.ElementTree as ET
import numpy as np
import trimesh
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path('/Users/loic/Downloads/FELPAMONSTERENERGY.3mf')
OUT=ROOT/'public/models/sweat';OUT.mkdir(parents=True,exist_ok=True)
NS={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
def transform(raw):
 a=np.array([float(v) for v in raw.split()]);m=np.eye(4);m[:3,:3]=a[:9].reshape(3,3).T;m[:3,3]=a[9:12];return m
with zipfile.ZipFile(SOURCE) as z:
 main=ET.fromstring(z.read('3D/3dmodel.model'))
 data=z.read('3D/Objects/object_39.model')
 parts={}
 for match in re.finditer(rb'<object\b[^>]*id="(\d+)"[^>]*>(.*?)</object>',data,re.S):
  identifier=match.group(1).decode();blob=match.group(2)
  vertices=np.fromiter((float(v) for row in re.finditer(rb'<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"',blob) for v in row.groups()),dtype=np.float64).reshape(-1,3)
  faces=np.fromiter((int(v) for row in re.finditer(rb'<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"',blob) for v in row.groups()),dtype=np.int64).reshape(-1,3)
  mesh=trimesh.Trimesh(vertices,faces,process=True)
  component=next(c for c in main.findall('.//m:component',NS) if c.get('objectid')==identifier)
  mesh.apply_transform(transform(component.get('transform')))
  print(identifier,len(mesh.faces),mesh.is_watertight,flush=True)
  parts[identifier]=mesh
 body=parts['1'];negative=parts['2']
 negative.merge_vertices(digits_vertex=5)
 negative.update_faces(negative.nondegenerate_faces())
 negative.update_faces(negative.unique_faces())
 negative.remove_unreferenced_vertices()
 negative.fix_normals()
 trimesh.repair.fill_holes(negative)
 if not negative.is_volume:
  # Bambu surface-conforming negative volumes can contain open intersections.
  # Voxelize only the engraving cutter, keeping the source hoodie unchanged.
  with tempfile.TemporaryDirectory(prefix='krearun-sweat-') as temp:
   source=Path(temp)/'negative.ply';solid=Path(temp)/'solid.ply'
   negative.export(source)
   code=f"import bpy; bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False); bpy.ops.wm.ply_import(filepath={str(source)!r}); bpy.context.object.data.remesh_voxel_size=.18; bpy.context.object.data.remesh_voxel_adaptivity=0; bpy.ops.object.voxel_remesh(); bpy.ops.wm.ply_export(filepath={str(solid)!r},export_selected_objects=True)"
   subprocess.run(['/Applications/Blender.app/Contents/MacOS/Blender','--background','--python-expr',code],check=True)
   negative=trimesh.load(solid)
   if not negative.is_volume:raise ValueError('Engraving cutter is not a closed solid')
 body=trimesh.boolean.difference([body,negative],engine='manifold')
 if len(body.faces)>100000:body=body.simplify_quadric_decimation(face_count=100000,aggression=3)
 body.merge_vertices(digits_vertex=4)
 body.update_faces(body.nondegenerate_faces());body.update_faces(body.unique_faces());body.remove_unreferenced_vertices()
 if len(body.faces)>100000:body=body.simplify_quadric_decimation(face_count=100000,aggression=5)
 body.remove_unreferenced_vertices();body.fix_normals()
 # Source is Z-up, with zipper and engraved lettering facing -Y.
 body.apply_translation(-body.bounds.mean(axis=0))
 body.apply_transform(np.array([[1,0,0,0],[0,0,1,0],[0,-1,0,0],[0,0,0,1]],dtype=float))
 body.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(name='sweat',baseColorFactor=[80,190,35,255],roughnessFactor=.85,metallicFactor=0))
 scene=trimesh.Scene();scene.add_geometry(body,node_name='sweat',geom_name='sweat')
 path=OUT/'sweat-monster.glb';path.write_bytes(scene.export(file_type='glb'))
 print(json.dumps({'file':str(path),'triangles':len(body.faces),'bytes':path.stat().st_size,'bounds':body.bounds.tolist()}))
