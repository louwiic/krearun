// Usage: node --env-file=.env scripts/setup-letter-stats.mjs
import { client } from "./crm-pocketbase.mjs";

const db = await client();
async function ensure(payload) {
  const found = await db.request(`/collections?filter=${encodeURIComponent(`name='${payload.name}'`)}`);
  if (found.items.length) { console.log(`${payload.name}: already exists`); return; }
  await db.request("/collections", "POST", payload);
  console.log(`${payload.name}: created`);
}

await ensure({
  name: "letter_events", type: "base",
  listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
  fields: [
    { name: "eventId", type: "text", required: true, max: 36 },
    { name: "visitorId", type: "text", required: true, max: 36 },
    { name: "kind", type: "select", required: true, maxSelect: 1, values: ["click", "view", "interact", "download"] },
    { name: "format", type: "select", maxSelect: 1, values: ["stl", "3mf"] },
    { name: "created", type: "autodate", onCreate: true, onUpdate: false },
  ],
  indexes: [
    "CREATE UNIQUE INDEX idx_letter_event_id ON letter_events (eventId)",
    "CREATE INDEX idx_letter_kind_visitor ON letter_events (kind, visitorId)",
  ],
});
await ensure({
  name: "letter_stats", type: "view", listRule: null, viewRule: null,
  viewQuery: `SELECT 'letterstat000001' AS id,
    COUNT(DISTINCT CASE WHEN kind='view' THEN visitorId END) AS visitors,
    COUNT(CASE WHEN kind='click' THEN 1 END) AS clicks,
    COUNT(DISTINCT CASE WHEN kind='click' THEN visitorId END) AS clickVisitors,
    COUNT(DISTINCT CASE WHEN kind='interact' THEN visitorId END) AS interactions,
    COUNT(CASE WHEN kind='download' THEN 1 END) AS downloads,
    COUNT(DISTINCT CASE WHEN kind='download' THEN visitorId END) AS downloadVisitors,
    COUNT(CASE WHEN kind='download' AND format='stl' THEN 1 END) AS stl,
    COUNT(CASE WHEN kind='download' AND format='3mf' THEN 1 END) AS threeMf
    FROM letter_events`,
});
