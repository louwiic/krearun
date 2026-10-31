// Preview: node --experimental-strip-types scripts/configure-noel-kit-bundles.mjs
// Apply: append --apply after reviewing the generated cost/weight report.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import env from "@next/env";
import { noelKitCount, noelKitPriceCents, extraDecorationDiscount } from "../lib/noel-kits.ts";
env.loadEnvConfig(process.cwd());
const apply = process.argv.includes("--apply");
const base = process.env.POCKETBASE_URL?.replace(/\/$/, "");
if (!base) throw new Error("Missing PocketBase URL");
let token;
function api(p, method = "GET", body) {
  const config = [`url = ${JSON.stringify(`${base}/api${p}`)}`, `request = "${method}"`, 'header = "Content-Type: application/json"'];
  if (token) config.push(`header = ${JSON.stringify(`Authorization: ${token}`)}`);
  if (body) config.push(`data = ${JSON.stringify(JSON.stringify(body))}`);
  return JSON.parse(execFileSync("curl", ["--fail-with-body", "--silent", "--show-error", "--retry", "2", "--config", "-"], {input:config.join("\n"), encoding:"utf8"}));
}
token = api("/collections/_superusers/auth-with-password", "POST", {identity:process.env.POCKETBASE_ADMIN_EMAIL, password:process.env.POCKETBASE_ADMIN_PASSWORD}).token;
const costFile = "outputs/thermoformed-noel-2026-10-30/costed-products.json";
const costs = JSON.parse(fs.readFileSync(costFile,"utf8"));
const products = api("/collections/products/records?perPage=500").items;
const output = "outputs/noel-kit-bundles-2026-10-31";
fs.mkdirSync(output,{recursive:true});
const plans = [];
for (const cost of costs.products) {
  const product = products.find(p=>p.slug===cost.slug);
  if (!product || product.category !== "noel") throw new Error(`Missing Christmas product ${cost.sourceId}`);
  const kit = product.variants.find(v=>noelKitCount(product.slug,v.id)===1);
  if (!kit) throw new Error(`Missing original kit ${cost.sourceId}`);
  // Printing costs retain the original 120 W / EDF assumptions. Machine cost
  // already includes electricity. Add one minute of handling and one cord.
  const extraCostEur = (cost.productPrintGrams*costs.assumptions.filamentEurKg/1000 + cost.productPrintHours*costs.assumptions.machineEurHourIncludingElectricity)*1.1 + costs.assumptions.laborEurHour/60 + costs.assumptions.cordEur;
  const extraRetailCents = Math.max(190,Math.ceil((extraCostEur/.27*100+10)/100)*100-10);
  const extraGrams = Math.ceil(cost.productPrintGrams)+2;
  const bundles = Array.from({length:10},(_,i)=>{
    const count=i+1;
    const priceCents=noelKitPriceCents(kit.priceCents,extraRetailCents,count);
    const expectedCostEur=cost.kitCostBeforePaymentEur+(count-1)*extraCostEur;
    const margin=(priceCents/100*.97-.25-expectedCostEur)/(priceCents/100);
    if (margin < .60) throw new Error(`Kit margin under 60% before overhead/tax: ${cost.sourceId}, ${count}`);
    const old=product.variants.find(v=>noelKitCount(product.slug,v.id)===count);
    const variant={...kit,...old,id:count===1?kit.id:`noel-${cost.sourceId}-kit-${count}`,name:`Kit complet · ${count} décoration${count>1?"s":""} + 1 jeu de moules`,priceCents:count===1?kit.priceCents:priceCents,weightGrams:count===1?kit.weightGrams:Math.ceil((kit.weightGrams+(count-1)*extraGrams)/50)*50};
    return {count,variant,extraPieceDiscountPercent:extraDecorationDiscount(count),estimatedCostBeforePaymentEur:Number(expectedCostEur.toFixed(3)),estimatedMarginBeforeOverheadAndTaxPercent:Number((margin*100).toFixed(1))};
  });
  for (let i=1;i<bundles.length;i++) {
    const previous=bundles[i-1],current=bundles[i];
    if(current.variant.priceCents<=previous.variant.priceCents || current.variant.priceCents/current.count>=previous.variant.priceCents/previous.count || current.variant.weightGrams<previous.variant.weightGrams)throw new Error(`Non-monotonic kit price/weight: ${cost.sourceId}`);
  }
  const variants=[...product.variants.filter(v=>noelKitCount(product.slug,v.id)===null),...bundles.map(b=>b.variant)];
  const description=product.description.replace(/• Kit complet[^\n]*/,'• Kit complet : choisissez de 1 à 10 décorations du même motif. Pièces plates imprimées pour chaque décoration, connecteurs nécessaires, cordons et un seul jeu de moules réutilisables adapté au motif. Prix dégressif selon le nombre de décorations ; sèche-cheveux non fourni.');
  const plan={sourceId:cost.sourceId,productId:product.id,name:product.name,slug:product.slug,active:product.active,extraCostEur:Number(extraCostEur.toFixed(3)),extraRetailCents,extraGrams,bundles,variants,description};
  plans.push(plan);
  if (apply) {
    const backup=path.join(output,`${product.id}-before.json`);
    if(!fs.existsSync(backup))fs.writeFileSync(backup,JSON.stringify(product,null,2),{mode:0o600});
    // Only change bundle definitions and their description; leave publication,
    // the ready-made variant, images, base prices and original kit price intact.
    const updated=api(`/collections/products/records/${product.id}`,"PATCH",{variants,description});
    for(const key of ["active","priceCents","stock","images","colors"])if(JSON.stringify(updated[key])!==JSON.stringify(product[key]))throw new Error(`Unexpected change to ${key}`);
    if (updated.variants.length!==variants.length) throw new Error("Incomplete variant update");
  }
  console.log(`${apply?"Saved":"Preview"} ${cost.sourceId}: 1=${(bundles[0].variant.priceCents/100).toFixed(2)}€, 3=${(bundles[2].variant.priceCents/100).toFixed(2)}€, 5=${(bundles[4].variant.priceCents/100).toFixed(2)}€, 10=${(bundles[9].variant.priceCents/100).toFixed(2)}€; min margin ${Math.min(...bundles.map(b=>b.estimatedMarginBeforeOverheadAndTaxPercent))}%`);
}
fs.writeFileSync(path.join(output,"bundle-plan.json"),JSON.stringify({applied:apply,at:new Date().toISOString(),costFile,assumptions:{...costs.assumptions,extraHandlingMinutes:1,discountAppliesTo:"Additional decorations only; original kit includes one mould set and the first decoration"},products:plans},null,2));
fs.writeFileSync(path.join(output,"prix-kits.csv"),"Motif;Décorations;Jeux de moules;Prix total EUR;Prix moyen EUR;Poids emballé g;Coût estimé hors paiement EUR\n"+plans.flatMap(p=>p.bundles.map(b=>[p.name,b.count,1,(b.variant.priceCents/100).toFixed(2),(b.variant.priceCents/100/b.count).toFixed(2),b.variant.weightGrams,b.estimatedCostBeforePaymentEur.toFixed(3)].join(";"))).join("\n")+"\n");
