import {strFromU8,strToU8,unzipSync,zipSync} from "fflate";
import {serializeNameplate3mf,type NameplateModel} from "./nameplate-3d";
import settings from "./keychain-print-settings.json";
export function serializeElementKeychain3mf(model:NameplateModel,colors:{base:string;letters:string},configuration:unknown) {
  const files=unzipSync(serializeNameplate3mf(model,colors));
  let xml=strFromU8(files['3D/3dmodel.model']);
  xml=xml.replace('<resources>','<metadata name="Application">BambuStudio-02.08.02.61</metadata><metadata name="BambuStudio:3mfVersion">1</metadata><resources>');
  xml=xml.replace('</resources>','<object id="4" type="model" name="Porte-cles avec oeillet"><components><component objectid="2"/><component objectid="3"/></components></object></resources>');
  // One multipart object keeps the relief at Z=2.4 instead of letting the slicer drop it onto the bed.
  xml=xml.replace(/<build>[\s\S]*?<\/build>/,`<build><item objectid="4" transform="1 0 0 0 1 0 0 0 1 ${90-model.width/2} ${90-model.height/2} 0"/></build>`);
  const meta=(key:string,value:string|number)=>`<metadata key="${key}" value="${value}"/>`;
  const identity='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1';
  const config=`<config><object id="4">${meta('name','Porte-cles avec oeillet')}${meta('extruder',1)}<part id="2" subtype="normal_part">${meta('name','Fond avec oeillet')}${meta('extruder',1)}${meta('matrix',identity)}</part><part id="3" subtype="normal_part">${meta('name','Motifs en relief')}${meta('extruder',2)}${meta('matrix',identity)}</part></object><plate>${meta('plater_id',1)}${meta('plater_name','PORTE-CLES ELEMENTS')}${meta('enable_prime_tower',1)}<model_instance>${meta('object_id',4)}${meta('instance_id',0)}${meta('identify_id',1004)}</model_instance></plate></config>`;
  const project={...settings,filament_colour:[colors.base,colors.letters],default_filament_colour:[colors.base,colors.letters]};
  return zipSync({...files,'3D/3dmodel.model':strToU8(xml),'Metadata/model_settings.config':strToU8(config),'Metadata/project_settings.config':strToU8(JSON.stringify(project)),'Metadata/krearun-elements.json':strToU8(JSON.stringify(configuration,null,2))});
}
