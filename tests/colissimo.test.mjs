import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as colissimo from "../lib/colissimo.ts";
import * as responses from "../lib/colissimo-response.ts";
import * as dates from "../lib/order-list.ts";

const order = { id: "test00000000001", number: 1001, status: "ready", trackingNumber: "", name: "Client Test", addressLine1: "1 rue du Test", addressLine2: "", country: "FR", city: "Saint-Denis", postalCode: "97400", email: "client@example.com", phone: "", updatedAt: "version1" };
const sender = { companyName: "Krearun", line2: "2 rue du Test", city: "Saint-Pierre", zipCode: "97410", countryCode: "RE" };
const input = { productCode: "COM", weight: 0.5, depositDate: "2099-01-01", format: "PDF_A4_300dpi", customs: false, articles: [], postage: 0, invoiceNumber: "" };
const info = { messages: [{ id: "0", type: "INFOS" }], parcelNumber: "8Q12345678901" };
const pdf = Buffer.from("%PDF-1.7\nfixture\0\xff", "latin1");
function multipart() {
  const chunks = [];
  for (const [id, type, content] of [["jsonInfos", "application/json", Buffer.from(JSON.stringify(info))], ["label", "application/octet-stream", pdf], ["cn23", "application/octet-stream", pdf]]) {
    chunks.push(Buffer.from(`--test-boundary\r\nContent-Type: ${type}\r\nContent-ID: <${id}>\r\nContent-Transfer-Encoding: binary\r\n\r\n`), content, Buffer.from("\r\n"));
  }
  chunks.push(Buffer.from("--test-boundary--\r\n"));
  return { body: Buffer.concat(chunks), contentType: 'multipart/mixed; boundary="test-boundary"', ok: true };
}
test("local Reunion shipment uses RE and kg without invented customs", () => {
  const result = colissimo.buildColissimoRequest(order, sender, input, "2026-09-19");
  assert.equal(result.letter.addressee.address.countryCode, "RE");
  assert.equal(result.letter.parcel.weight, 0.5);
  assert.equal(result.letter.customsDeclarations, undefined);
  assert.equal(result.letter.service.orderNumber, "KR-1001");
});
test("Reunion to mainland requires complete commercial customs and correct units", () => {
  const mainland = { ...order, postalCode: "75001", city: "Paris" };
  assert.throws(() => colissimo.buildColissimoRequest(mainland, sender, input, "2026-09-19"), /douanière/);
  const data = { ...input, invoiceNumber: "FACT-1001", postage: 12.5, articles: [{ description: "Plastic ornament", quantity: 2, weight: 0.1, value: 5, hsCode: "392640", originCountry: "FR" }] };
  const result = colissimo.buildColissimoRequest(mainland, sender, data, "2026-09-19");
  assert.equal(result.letter.customsDeclarations.contents.category.value, 3);
  assert.equal(result.letter.service.totalAmount, 1250);
  assert.equal(result.letter.customsDeclarations.contents.article[0].value, 5);
  assert.throws(() => colissimo.buildColissimoRequest(mainland, sender, { ...data, weight: 0.1 }, "2026-09-19"), /poids des articles/);
});
test("invalid dates, weights, addresses, service and already shipped orders are rejected", () => {
  for (const patch of [{ weight: NaN }, { weight: 0 }, { weight: 31 }, { depositDate: "2027-02-30" }, { depositDate: "2020-01-01" }, { productCode: "CORE" }, { format: "ZPL" }]) {
    assert.throws(() => colissimo.buildColissimoRequest(order, sender, { ...input, ...patch }, "2026-09-19"), colissimo.ColissimoValidationError);
  }
  for (const patch of [{ addressLine1: "" }, { status: "shipped" }, { trackingNumber: "EXISTING" }]) {
    assert.throws(() => colissimo.buildColissimoRequest({ ...order, ...patch }, sender, input, "2026-09-19"), colissimo.ColissimoValidationError);
  }
});
test("MIME parser preserves PDF bytes and separates label and CN23", async () => {
  const fixture = multipart();
  const result = await responses.parseColissimoResponse(fixture.body, fixture.contentType);
  assert.equal(result.parcelNumber, info.parcelNumber);
  assert.deepEqual(Buffer.from(result.documents.label, "base64"), pdf);
  assert.deepEqual(Buffer.from(result.documents.cn23, "base64"), pdf);
});
test("validation succeeds without a label; malformed or rejected results never succeed", async () => {
  assert.equal((await responses.parseColissimoResponse(Buffer.from(JSON.stringify(info)), "application/json", true)).parcelNumber, info.parcelNumber);
  await assert.rejects(responses.parseColissimoResponse(Buffer.from(JSON.stringify(info)), "application/json"), /absent/);
  await assert.rejects(responses.parseColissimoResponse(Buffer.from('{"messages":[{"id":"30000","type":"ERROR","messageContent":"Adresse invalide"}]}'), "application/json"), responses.ColissimoRejectedError);
  await assert.rejects(responses.parseColissimoResponse(Buffer.from("not-json"), "text/plain"), /illisible/);
});

function fixture({ live = true, authorized = true, timeout = false, reject = false, saveFails = false, trackingFails = false } = {}) {
  let record = null;
  let purchases = 0;
  let mutations = 0;
  let validations = 0;
  const currentOrder = { ...order };
  const store = {
    getOrderById: async () => currentOrder,
    getColissimoShipment: async () => record,
    reserveColissimoShipment: async () => {
      if (record) throw new Error("unique constraint");
      record = { id: "shipment0000001", state: "generating" };
      return record;
    },
    saveColissimoShipment: async (_id, patch) => { if (saveFails) throw new Error("DB down"); record = { ...record, ...patch }; return record; },
    releaseRejectedColissimoShipment: async () => { record = null; },
    updateManagedOrder: async (_id, patch) => { if (trackingFails) throw new Error("DB down"); Object.assign(currentOrder, patch); mutations++; },
  };
  const mocks = {
    "@/lib/auth": { isAdmin: async () => authorized }, "@/lib/store": store,
    "@/lib/colissimo": colissimo, "@/lib/colissimo-response": responses, "@/lib/order-list": dates,
    "next/cache": { revalidatePath() {} },
    "@/lib/colissimo-server": {
      colissimoConfig: () => ({ sender, missing: [], live }),
      callColissimo: async (_payload, validation) => {
        if (validation) { validations++; return { body: Buffer.from(JSON.stringify(info)), contentType: "application/json", ok: true }; }
        purchases++;
        if (timeout) throw new Error("timeout");
        if (reject) return { body: Buffer.from('{"messages":[{"id":"30000","type":"ERROR"}]}'), contentType: "application/json", ok: false };
        return multipart();
      },
    },
  };
  const compiled = ts.transpileModule(readFileSync(new URL("../app/admin/colissimo-actions.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(`(function(require,module,exports){${compiled}\n})`, { FormData, Buffer, Error, console })((name) => { if (!mocks[name]) throw new Error(name); return mocks[name]; }, compiledModule, compiledModule.exports);
  const data = new FormData();
  for (const [key, value] of Object.entries({ ...input, id: order.id, updatedAt: order.updatedAt, confirm: "on", articles: "[]" })) data.set(key, String(value));
  return { action: () => compiledModule.exports.createColissimoLabelAction({}, data), data, get record() { return record; }, get purchases() { return purchases; }, get mutations() { return mutations; }, get validations() { return validations; } };
}
test("server action requires authentication and test mode never purchases or changes an order", async () => {
  const denied = fixture({ authorized: false });
  assert.match((await denied.action()).error, /Connectez/);
  assert.equal(denied.validations, 0);
  const testMode = fixture({ live: false });
  assert.match((await testMode.action()).message, /Mode test/);
  assert.equal(testMode.purchases, 0);
  assert.equal(testMode.mutations, 0);
  assert.equal(testMode.record, null);
});
test("production requires explicit confirmation and ignores stale order details", async () => {
  const app = fixture(); app.data.delete("confirm");
  assert.match((await app.action()).error, /Confirmez/);
  assert.equal(app.purchases, 0);
  app.data.set("updatedAt", "stale");
  assert.match((await app.action()).error, /changé/);
});
test("concurrent and repeated submits purchase one label and retain documents", async () => {
  const app = fixture();
  await Promise.all([app.action(), app.action()]);
  assert.equal(app.purchases, 1);
  assert.equal(app.record.state, "ready");
  assert.equal(app.record.parcelNumber, info.parcelNumber);
  assert.ok(app.record.documents.label);
  await app.action();
  assert.equal(app.purchases, 1);
});
test("timeouts and persistence failures keep a lock and never repurchase", async () => {
  for (const options of [{ timeout: true }, { saveFails: true }, { trackingFails: true }]) {
    const app = fixture(options);
    assert.ok((await app.action()).error);
    assert.ok(app.record);
    await app.action();
    assert.equal(app.purchases, 1);
  }
});
test("definitive provider rejection releases the reservation for correction", async () => {
  const app = fixture({ reject: true });
  assert.match((await app.action()).error, /30000/);
  assert.equal(app.record, null);
});

test("label downloads require admin, reject arbitrary document keys and disable caching", async () => {
  let authorized = false;
  let reads = 0;
  const mocks = {
    "@/lib/auth": { isAdmin: async () => authorized },
    "@/lib/store": { getColissimoShipment: async () => { reads++; return { documents: { label: pdf.toString("base64") } }; } },
  };
  const source = ts.transpileModule(readFileSync(new URL("../app/api/admin/colissimo/[id]/[document]/route.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(`(function(require,module,exports){${source}\n})`, { Buffer, Response })((name) => mocks[name], compiledModule, compiledModule.exports);
  const get = (document = "label") => compiledModule.exports.GET(null, { params: Promise.resolve({ id: order.id, document }) });
  assert.equal((await get()).status, 401);
  assert.equal(reads, 0);
  authorized = true;
  assert.equal((await get("rawResponse")).status, 404);
  assert.equal(reads, 0);
  const response = await get();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), pdf);
});
