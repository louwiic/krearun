// Node 22: node --env-file=.env --experimental-strip-types scripts/import-crm-orders.mjs --file /private/export.json
// Add --apply --backup-dir /private/backup only after reviewing the dry-run.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import { legacyOrder, parseCrmExport } from "../lib/order-management.ts";
import { client, backup, option } from "./crm-pocketbase.mjs";

const path = option("--file");
if (!path)
  throw new Error("--file requis (CSV CRM STD ou export JSON orders).");
const content = readFileSync(path, "utf8");
const rows = parseCrmExport(content, path);
if (!Array.isArray(rows) || !rows.length)
  throw new Error("Aucune commande dans le fichier.");
const hash = createHash("sha256").update(content).digest("hex");
const importedAt = new Date().toISOString();
const mapped = rows.map((raw, i) => {
  try {
    return legacyOrder(
      raw,
      String(raw.id || `csv:${hash}:${i + 1}`),
      importedAt,
    );
  } catch (error) {
    throw new Error(`Ligne ${i + 1} : ${error.message}`);
  }
});
if (new Set(mapped.map((row) => row.input.sourceId)).size !== mapped.length)
  throw new Error("Identifiants source répétés dans le fichier.");
const db = await client();
const schema = await db.request("/collections/orders");
if (
  !["sourceId", "legacyData", "paymentStatus", "orderedAt"].every((name) =>
    schema.fields.some((field) => field.name === name),
  )
)
  throw new Error("Appliquer setup-order-management.mjs d'abord.");
const before = await db.orders();
const existing = new Set(
  before
    .filter((order) => order.source === "crm_std")
    .map((order) => order.sourceId),
);
const pending = mapped.filter((row) => !existing.has(row.input.sourceId));
console.log(
  JSON.stringify(
    {
      mode: process.argv.includes("--apply") ? "apply" : "dry-run",
      sourceRows: rows.length,
      toCreate: pending.length,
      alreadyImported: mapped.length - pending.length,
      totalCents: mapped.reduce((n, row) => n + row.input.totalCents, 0),
      amountPaidCents: mapped.reduce(
        (n, row) => n + row.input.amountPaidCents,
        0,
      ),
      warnings: mapped.flatMap((row, i) =>
        row.warnings.map((message) => ({ row: i + 1, message })),
      ),
    },
    null,
    2,
  ),
);
if (process.argv.includes("--apply")) {
  backup(option("--backup-dir"), "before-crm-import", {
    schema,
    orders: before,
    source: rows,
    sourceHash: hash,
  });
  let created = 0;
  for (const row of pending) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const latest = await db.request(
        "/collections/orders/records?perPage=1&sort=-number",
      );
      const number = (latest.items[0]?.number ?? 1000) + 1;
      try {
        await db.request("/collections/orders/records", "POST", {
          ...row.input,
          number,
        });
        created++;
        if (created % 25 === 0 || created === pending.length)
          console.log(
            `Progression : ${created}/${pending.length} commandes importées.`,
          );
        break;
      } catch (error) {
        if (
          attempt === 4 ||
          !error.message.includes("number:validation_not_unique")
        )
          throw error;
      }
    }
  }
  const after = await db.orders();
  for (const original of before)
    assert.ok(
      isDeepStrictEqual(
        after.find((order) => order.id === original.id),
        original,
      ),
      "Une commande préexistante a changé pendant l'import ; vérifier la sauvegarde.",
    );
  for (const { input } of mapped) {
    const matches = after.filter(
      (order) =>
        order.source === "crm_std" && order.sourceId === input.sourceId,
    );
    assert.equal(matches.length, 1, "Source manquante ou doublonnée.");
    // Previously imported records may have been intentionally edited in the backoffice.
    if (!existing.has(input.sourceId)) {
      for (const key of [
        "name",
        "phone",
        "city",
        "totalCents",
        "amountPaidCents",
        "paymentStatus",
        "status",
        "description",
        "internalNote",
        "legacyData",
      ])
        assert.ok(
          isDeepStrictEqual(matches[0][key], input[key]),
          `Écart d'import : ${key}`,
        );
    }
  }
  backup(option("--backup-dir"), "after-crm-import", {
    orders: after,
    sourceHash: hash,
    created,
  });
  console.log(
    `Import vérifié : ${created} créations, ${mapped.length - pending.length} déjà présentes. Aucun envoi d'e-mail.`,
  );
}
