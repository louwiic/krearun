export const NOS_COLOR_EVENT = "krearun:nos-color";
export const NOS_MODEL_URL = "/models/nos/nos-500ml.glb";

export function nosPartAppearance(name: string, bodyColor: string) {
  if (/^0[12]_/.test(name)) return { color: bodyColor, metalness: 0, roughness: 0.58 };
  if (/^0[34]_/.test(name)) return { color: "#b89547", metalness: 0.65, roughness: 0.3 };
  if (/^07_/.test(name)) return { color: "#92372b", metalness: 0, roughness: 0.65 };
  if (/^0[89]_/.test(name)) return { color: "#ffffff", metalness: 0, roughness: 0.65 };
  if (/^11_/.test(name)) return { color: "#e9d927", metalness: 0, roughness: 0.65 };
  return { color: "#151515", metalness: 0, roughness: 0.65 };
}
