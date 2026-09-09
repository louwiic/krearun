import test from "node:test";
import assert from "node:assert/strict";
import {
  cents,
  paymentAmounts,
  remainingCents,
  parseCsv,
  csvCell,
  normalizeLegacyStatus,
  isoDate,
  publicHttpUrl,
  productionStatus,
  legacyOrder,
} from "../lib/order-management.ts";

test("French amounts retain cents without interpreting unknown text", () => {
  assert.equal(cents("1 234,56 €"), 123456);
  assert.equal(cents("17"), 1700);
  assert.throws(() => cents("17 euros + 5"));
  assert.throws(() => cents(-3));
});

test("CRM source preserves original records, private notes and explicit payment", () => {
  const raw = {
    id: "firebase-1",
    client: "Test",
    production: "prêt",
    statutPaiement: "payé",
    total: "17,50",
    acompte: 0,
    resteAPayer: 17.5,
    telephone: "0693000000",
    produits: ["Porte-canette"],
    quantite: "2 pièces",
    infosRelance: "Rappeler",
    commentaire: "Privé",
    urgent: true,
    createdAt: { seconds: 1700000000 },
    userId: "source-user",
  };
  const { input, warnings } = legacyOrder(
    raw,
    raw.id,
    "2026-09-09T00:00:00.000Z",
  );
  assert.equal(input.status, "ready");
  assert.equal(input.amountPaidCents, 1750);
  assert.equal(input.totalCents, 1750);
  assert.equal(input.phone, "0693000000");
  assert.equal(input.quantityText, "2 pièces");
  assert.equal(input.note, "");
  assert.match(input.internalNote, /Rappeler/);
  assert.equal(input.urgent, true);
  assert.deepEqual(input.legacyData, raw);
  assert.equal(input.sourceId, "firebase-1");
  assert.equal(warnings.length, 1);
  assert.deepEqual(input.items, []);
});
test("invalid imports fail closed, rather than silently changing unknown statuses or deposits", () => {
  assert.throws(() =>
    legacyOrder({ client: "Test", production: "inconnu" }, "id", "2026-09-09"),
  );
  assert.throws(() =>
    legacyOrder(
      { client: "Test", statutPaiement: "acompte", total: 10, acompte: 15 },
      "id",
      "2026-09-09",
    ),
  );
  assert.throws(() => legacyOrder({ total: 10 }, "id", "2026-09-09"));
  const { input, warnings } = legacyOrder(
    {
      Client: "Test",
      Ville: "Le Tampon",
      Total: "45",
      Statut: "en cours",
      "Statut paiement": "acompte",
      Acompte: "10",
    },
    "csv-id",
    "2026-09-09T00:00:00.000Z",
  );
  assert.equal(input.amountPaidCents, 1000);
  assert.equal(input.city, "Le Tampon");
  assert.equal(warnings.length, 1);
});
test("payment and production are independent", () => {
  assert.equal(productionStatus("paid"), "pending");
  assert.equal(normalizeLegacyStatus("prêt"), "ready");
  assert.equal(normalizeLegacyStatus("terminé"), "delivered");
  assert.deepEqual(paymentAmounts(4500, 1000, "deposit"), {
    amountPaidCents: 1000,
    remainingCents: 3500,
  });
  assert.deepEqual(paymentAmounts(4500, 0, "paid"), {
    amountPaidCents: 4500,
    remainingCents: 0,
  });
  assert.equal(
    remainingCents({
      status: "ready",
      paymentStatus: "unpaid",
      totalCents: 1700,
      amountPaidCents: 0,
    }),
    1700,
  );
  assert.throws(() => paymentAmounts(1700, 2000, "deposit"));
});
test("malformed legacy production is quarantined without inventing progress or payment", () => {
  for (const production of ["non payé", "acompte"]) {
    const raw = {
      client: "Test",
      production,
      statutPaiement: "acompte",
      total: 45,
      acompte: 10,
      createdAt: "2026-09-01",
    };
    const { input, warnings } = legacyOrder(raw, "source-id", "2026-09-09");
    assert.equal(input.status, "review");
    assert.equal(input.paymentStatus, "deposit");
    assert.equal(input.amountPaidCents, 1000);
    assert.deepEqual(input.legacyData, raw);
    assert.equal(warnings.length, 1);
    assert.match(input.internalNote, /champ production/);
    assert.ok(input.tags.includes("Import à vérifier"));
  }
});
test("blank legacy clients remain visible as unverified records, with the original amount preserved", () => {
  const raw = {
    client: "",
    production: "à faire",
    statutPaiement: "non payé",
    total: 1733,
    createdAt: "2026-09-01",
  };
  const { input, warnings } = legacyOrder(raw, "source-id", "2026-09-09");
  assert.equal(input.name, "Client à renseigner");
  assert.equal(input.status, "review");
  assert.equal(input.totalCents, 173300);
  assert.equal(input.amountPaidCents, 0);
  assert.equal(input.legacyData.client, "");
  assert.equal(warnings.length, 1);
});
test("CSV quotes, accents, multiline notes and formulas", () => {
  assert.deepEqual(
    parseCsv(
      '\uFEFFclient;total;note\r\n"Test";"17,50";"ligne 1\nligne ""2"""',
    ),
    [{ client: "Test", total: "17,50", note: 'ligne 1\nligne "2"' }],
  );
  assert.throws(() => parseCsv('a,b\n"unfinished'));
  assert.throws(() => parseCsv("a,a\n1,2"));
  assert.equal(csvCell("=1+1"), '"\'=1+1"');
});
test("legacy dates and external links are safely normalized", () => {
  assert.equal(isoDate(0), "1970-01-01T00:00:00.000Z");
  assert.equal(
    isoDate({ seconds: 0, nanoseconds: 123456789 }),
    "1970-01-01T00:00:00.123Z",
  );
  assert.equal(
    isoDate("Timestamp(seconds=0, nanoseconds=987654321)"),
    "1970-01-01T00:00:00.987Z",
  );
  assert.equal(isoDate({ seconds: 0 }), "1970-01-01T00:00:00.000Z");
  assert.equal(
    isoDate("Timestamp(seconds=0, nanoseconds=0)"),
    "1970-01-01T00:00:00.000Z",
  );
  assert.equal(isoDate("invalid", "fallback"), "fallback");
  assert.equal(publicHttpUrl("javascript:alert(1)"), "");
  assert.equal(
    publicHttpUrl("https://example.com/profile"),
    "https://example.com/profile",
  );
});
