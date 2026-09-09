// Exercise the actual server actions against an isolated in-memory store, never production.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as management from "../lib/order-management.ts";

function fixture() {
  const records = new Map();
  let authorized = true,
    mutations = 0;
  const store = {
    ensureOrderManagementSchema: async () => {},
    getOrderById: async (id) => records.get(id) || null,
    getOrderBySourceId: async (source, sourceId) =>
      [...records.values()].find(
        (order) => order.source === source && order.sourceId === sourceId,
      ) || null,
    createOrder: async (input) => {
      const id = `test${String(records.size + 1).padStart(11, "0")}`;
      const order = {
        ...input,
        id,
        number: 1001 + records.size,
        updatedAt: "2026-09-09T01:00:00.000Z",
      };
      records.set(id, order);
      mutations++;
      return order;
    },
    updateManagedOrder: async (id, input) => {
      const order = { ...records.get(id), ...input };
      records.set(id, order);
      mutations++;
      return order;
    },
  };
  const mocks = {
    "@/lib/auth": { isAdmin: async () => authorized },
    "@/lib/store": store,
    "@/lib/order-management": management,
    "next/cache": { revalidatePath() {} },
    "next/navigation": {
      redirect(path) {
        throw new Error(`NEXT_REDIRECT:${path}`);
      },
    },
  };
  const source = ts.transpileModule(
    readFileSync(
      new URL("../app/admin/order-actions.ts", import.meta.url),
      "utf8",
    ),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  const compiledModule = { exports: {} };
  const wrapper = vm.runInNewContext(
    `(function(require,module,exports){${source}\n})`,
    { FormData, File, console, Error },
  );
  wrapper(
    (name) => {
      if (mocks[name]) return mocks[name];
      if (name === "node:crypto") return { createHash: fakeHash };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    compiledModule,
    compiledModule.exports,
  );
  function fakeHash() {
    return {
      update() {
        return this;
      },
      digest() {
        return "stable-test-hash";
      },
    };
  }
  return {
    actions: compiledModule.exports,
    records,
    store,
    setAuthorized(value) {
      authorized = value;
    },
    mutations: () => mutations,
  };
}
function upload(text, confirm = false) {
  const data = new FormData();
  data.set("file", new File([text], "orders.csv", { type: "text/csv" }));
  if (confirm) data.set("confirm", "on");
  return data;
}
const csv =
  "id,client,production,statutPaiement,total,acompte,createdAt\na1,Test,prêt,acompte,45,10,2026-09-08\na2,Second,terminé,payé,17,0,2026-09-07";

test("all new server actions require admin before reading or writing", async () => {
  const f = fixture();
  f.setAuthorized(false);
  await assert.rejects(
    () => f.actions.importCrmOrdersAction(upload(csv), true),
    /NEXT_REDIRECT/,
  );
  await assert.rejects(
    () => f.actions.quickOrderAction(new FormData()),
    /NEXT_REDIRECT/,
  );
  await assert.rejects(
    () => f.actions.bulkProductionAction([], "ready"),
    /NEXT_REDIRECT/,
  );
  await assert.rejects(
    () => f.actions.saveManualOrderAction({}, new FormData()),
    /NEXT_REDIRECT/,
  );
  assert.equal(f.mutations(), 0);
});
test("preview is read-only and repeated import is idempotent", async () => {
  const f = fixture();
  const preview = await f.actions.importCrmOrdersAction(upload(csv), true);
  assert.equal(preview.created, 2);
  assert.equal(preview.totalCents, 6200);
  assert.equal(f.mutations(), 0);
  assert.match(
    (await f.actions.importCrmOrdersAction(upload(csv), false)).error,
    /Confirme/,
  );
  const result = await f.actions.importCrmOrdersAction(
    upload(csv, true),
    false,
  );
  assert.equal(result.created, 2);
  assert.equal(result.error, undefined);
  const again = await f.actions.importCrmOrdersAction(upload(csv, true), false);
  assert.equal(again.created, 0);
  assert.equal(again.skipped, 2);
  assert.equal(f.mutations(), 2);
  const imported = [...f.records.values()];
  assert.equal(imported[0].amountPaidCents, 1000);
  assert.equal(imported[0].status, "ready");
  assert.equal(imported[1].amountPaidCents, 1700);
  assert.equal(imported[0].legacyData.id, "a1");
});
test("invalid rows are validated before the first import write", async () => {
  const f = fixture();
  const result = await f.actions.importCrmOrdersAction(
    upload(csv + "\na3,Third,inconnu,payé,17,0,2026-09-07", true),
    false,
  );
  assert.match(result.error, /Ligne 3/);
  assert.equal(f.mutations(), 0);
});
test("quick production edits preserve payment and stale edits are rejected", async () => {
  const f = fixture();
  await f.actions.importCrmOrdersAction(upload(csv, true), false);
  const order = [...f.records.values()][0];
  const data = new FormData();
  Object.entries({
    id: order.id,
    updatedAt: order.updatedAt,
    kind: "production",
    value: "preparing",
  }).forEach(([k, v]) => data.set(k, v));
  const result = await f.actions.quickOrderAction(data);
  assert.equal(result.error, undefined);
  assert.equal(f.records.get(order.id).amountPaidCents, 1000);
  assert.equal(f.records.get(order.id).paymentStatus, "deposit");
  data.set("updatedAt", "outdated");
  assert.match((await f.actions.quickOrderAction(data)).error, /Actualise/);
  f.records.set(order.id, { ...order, source: "web" });
  data.set("updatedAt", order.updatedAt);
  data.set("kind", "payment");
  data.set("value", "unpaid");
  assert.match((await f.actions.quickOrderAction(data)).error, /Stripe/);
});
test("bulk update validates IDs before writes and retains amounts", async () => {
  const f = fixture();
  await f.actions.importCrmOrdersAction(upload(csv, true), false);
  const ids = [...f.records.keys()];
  const before = f.mutations();
  assert.match(
    (await f.actions.bulkProductionAction([...ids, "invalid"], "ready")).error,
    /invalide/,
  );
  assert.equal(f.mutations(), before);
  assert.equal(
    (await f.actions.bulkProductionAction(ids, "ready")).error,
    undefined,
  );
  assert.ok([...f.records.values()].every((order) => order.status === "ready"));
  assert.equal([...f.records.values()][0].amountPaidCents, 1000);
});
