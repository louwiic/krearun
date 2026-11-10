import { readFile } from "node:fs/promises";
import path from "node:path";
import opentype from "opentype.js";
import { KEYCHAIN_FONTS, parseKeychainConfiguration, type KeychainConfiguration } from "./name-keychain";
import { buildKeychainModel, keychainShapes } from "./name-keychain-3d";
import { serializeNameplate3mf, serializeNameplate } from "./nameplate-3d";
import { zipSync, strToU8 } from "fflate";
const fonts = new Map<string, Promise<opentype.Font>>();
export function keychainFont(id: string) {
  const definition=KEYCHAIN_FONTS.find(font=>font.id===id);
  if(!definition)throw new Error("Police invalide.");
  if(!fonts.has(id))fonts.set(id,readFile(path.join(process.cwd(),"public","fonts",definition.file)).then(buffer=>opentype.parse(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength))).catch(error=>{fonts.delete(id);throw error;}));
  return fonts.get(id)!;
}
export async function validateKeychainGeometry(value: unknown) {
  const configuration=parseKeychainConfiguration(value), font=await keychainFont(configuration.font);
  const shapes=keychainShapes(configuration,font);
  if(shapes.width>95 || shapes.height>32)throw new Error("Ce prénom dépasse le gabarit du porte-clés.");
  return {configuration,font,shapes};
}
export async function generateKeychain(value: KeychainConfiguration, format: "3mf" | "stl" = "3mf") {
  const {configuration,font}=await validateKeychainGeometry(value);
  const model=buildKeychainModel(configuration,font);
  if(format==="3mf")return serializeNameplate3mf(model,{base:configuration.baseColor,letters:configuration.textColor});
  const [base,letters]=await Promise.all([model.base,model.letters].map(async solid=>new Uint8Array(await new Blob(serializeNameplate(solid)).arrayBuffer())));
  return zipSync({"fond-avec-oeillet.stl":base,"prenom.stl":letters,"configuration.json":strToU8(JSON.stringify(configuration,null,2)),"LISEZ-MOI.txt":strToU8("STL en millimètres, déjà alignés. Importer ensemble comme un objet à plusieurs pièces. Fond 2,4 mm, relief 1,2 mm. Trou d’anneau 4 mm. Assigner les couleurs du fichier configuration.json. Contrôler dans le trancheur avant fabrication.")});
}
