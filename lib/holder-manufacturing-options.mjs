export function manufacturingOptions(input={}) {
  const result={depth:input.depth??.6,clearance:input.clearance??.2,thickness:input.thickness??1};
  for(const [key,min,max] of [['depth',.2,1],['clearance',.05,.35],['thickness',.8,2]])if(typeof result[key]!=='number'||!Number.isFinite(result[key])||result[key]<min||result[key]>max)throw new Error('Réglages de fabrication invalides.');
  if(result.thickness<result.depth+.19)throw new Error('Le logo doit dépasser le creux d’au moins 0,2 mm.');
  return result;
}
