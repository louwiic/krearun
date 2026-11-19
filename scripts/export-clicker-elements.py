"""Extract every native keycap and its 2D glyph from the original read-only 3MF."""
from pathlib import Path
import importlib.util,json,hashlib,numpy as np
from shapely.geometry import Polygon,MultiPolygon
from shapely.ops import unary_union
from shapely.geometry.polygon import orient
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('preview',ROOT/'scripts/export-clicker-preview.py');p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
icons={'paw':('🐾','Patte'),'clover':('♣','Trèfle'),'flower':('✿','Fleur'),'cat':('🐱','Chat'),'cloud':('☁','Nuage'),'duck':('🦆','Canard'),'star':('★','Étoile'),'heart':('♥','Cœur'),'moon':('☾','Lune'),'lightning':('⚡','Éclair'),'ribbon':('🎀','Nœud'),'fire':('🔥','Flamme'),'coffee':('☕','Café'),'airplane':('✈','Avion'),'music':('♫','Musique'),'apple':('🍎','Pomme'),'grapes':('🍇','Raisin'),'banana':('🍌','Banane'),'rugby':('🏉','Rugby'),'basketball':('🏀','Basket-ball'),'soccer':('⚽','Football')}
punctuation={'question_mark':'?','exclamation_mark':'!','ampersand':'&','at':'@','dollar':'$'}
accents=dict(zip(['a_ring_above','ae_ligature','o_stroke','o_ligature','c_cedilla','a_diaeresis','n_tilde','u_ring_above','y_diaeresis','a_acute_accent','a_grave_accent','a_circumflex','a_tilde','e_acute_accent','e_circumflex','e_diaeresis','e_grave_accent','i_acute_accent','i_circumflex','i_diaeresis','i_grave_accent','o_acute_accent','o_circumflex','o_diaeresis','o_grave_accent','o_tilde','u_acute_accent','u_circumflex','u_diaeresis','u_grave_accent'],list('ÅÆØŒÇÄÑŮŸÁÀÂÃÉÊËÈÍÎÏÌÓÔÖÒÕÚÛÜÙ')))
source=p.SOURCE/'Chunky+Keycaps+-+Alphabets,+Numbers,+Icons,+and+Blank.3mf';manifest=json.loads((p.OUT/'manifest.json').read_text());elements=[];caps={}
for entry in p.extract(source):
 name=entry['name']
 if name=='keycap':key='blank';value='□';label='Touche vierge';group='Vierge'
 elif name.startswith('keycap - '):key=name[9:];value,label=icons[key];group='Symboles'
 elif name.startswith('keycap-char-'):
  raw=name[12:];key=raw;value=punctuation.get(raw,raw);label=value;group='Ponctuation' if raw in punctuation else 'Chiffres' if value.isdigit() else 'Alphabet'
 else:key=name;value=accents[name];label=value;group='Lettres accentuées'
 cap=next(part['mesh'] for part in entry['parts'] if part['role']=='cap');low=cap.bounds[0,2];center=cap.bounds.mean(0)
 for part in entry['parts']:part['mesh'].apply_translation([-center[0],-center[1],-low])
 glyphs=[part['mesh'] for part in entry['parts'] if part['role']=='glyph'] or [cap]
 polygons=[]
 for mesh in glyphs:
  for tri in mesh.triangles:
   poly=Polygon(tri[:,:2])
   if poly.area>1e-8:polygons.append(poly)
 shape=unary_union(polygons).buffer(0).simplify(.012,preserve_topology=True)
 contours=[]
 for poly in [shape] if shape.geom_type=='Polygon' else shape.geoms:
  poly=orient(poly,sign=1)
  for ring in [poly.exterior,*poly.interiors]:contours.append([[round(float(x),5),round(float(y),5)] for x,y in list(ring.coords)[:-1]])
 assert contours,(name,'no glyph');bounds=shape.bounds
 item={'id':key,'value':value,'label':label,'group':group,'sourceName':name,'contours':contours,'boundsMm':list(bounds)};elements.append(item)
 caps[key]={**p.export(f'cap-{key}',entry['parts']),'sourceName':name,'sizeMm':cap.extents.tolist()}
assert len(elements)==len({e['value'] for e in elements})==len({e['id'] for e in elements})
manifest['caps']=caps;(p.OUT/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False))
order={'Symboles':0,'Alphabet':1,'Chiffres':2,'Lettres accentuées':3,'Ponctuation':4,'Vierge':5}
elements.sort(key=lambda e:(order[e['group']],e['label']))
(p.OUT/'elements.json').write_text(json.dumps({'source':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'toleranceMm':.012,'elements':elements},ensure_ascii=False,separators=(',',':')))
print('Exported',len(elements),'native keycaps and glyph contours')
