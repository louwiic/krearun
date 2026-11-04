import { assistantList, assistantInsert, assistantPatch } from "./store";
import { assistantConfig, whatsappAdmins, type AssistantRun } from "./assistant";
import { processAssistantRun } from "./assistant-server";

export async function processWhatsAppQueue() {
  if (!assistantConfig().enabled || !assistantConfig().openaiReady || !assistantConfig().whatsappReady) return;
  const cutoff = new Date(Date.now() - 23 * 3600000).toISOString();
  const rows = await assistantList<AssistantRun>("assistant_runs", `channel='whatsapp' && created>='${cutoff}' && (state='queued' || state='done' || state='failed')`, 1, "created");
  for (const row of rows.items) {
    const to = row.actor.replace(/^whatsapp:/, "");
    if (!whatsappAdmins().includes(to)) { await assistantPatch("assistant_runs", row.id, { state: "blocked" }); continue; }
    let result;
    try { result = row.result || await processAssistantRun(row); }
    catch { continue; }
    // Persist a unique send receipt BEFORE contacting Meta. Ambiguous sends are not retried.
    try { await assistantInsert("assistant_locks", { key: `whatsapp-send:${row.id}` }); }
    catch { continue; }
    const body = [result.message.slice(0, 1100), ...result.proposals.slice(0, 3).map(p => `\nÀ valider :\n${p.summary.slice(0, 600)}\n\nCONFIRMER ${p.id}\nANNULER ${p.id}`)].join("\n").slice(0, 3900);
    try {
      const version = process.env.WHATSAPP_GRAPH_VERSION || "";
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
      if (!/^v\d+\.\d+$/.test(version) || !/^\d+$/.test(phoneId)) throw new Error("Invalid WhatsApp configuration");
      const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
        method: "POST", headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { preview_url: false, body } }),
        signal: AbortSignal.timeout(15000), cache: "no-store",
      });
      if (!response.ok) throw new Error("WhatsApp send failed");
      await assistantPatch("assistant_runs", row.id, { state: "sent" });
    } catch { await assistantPatch("assistant_runs", row.id, { state: "delivery_uncertain" }); }
  }
}
