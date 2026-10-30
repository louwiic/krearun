import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function action(send, auth = async () => {}) {
  const source = readFileSync(new URL("../app/admin/actions.ts", import.meta.url), "utf8");
  const ast = ts.createSourceFile("actions.ts", source, ts.ScriptTarget.Latest, true);
  const declaration = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "sendNewsletterAction");
  const js = ts.transpileModule(declaration.getText(ast).replace("export async", "async"), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function("requireAdmin", "sendNewsletterEmail", "getNewsletterRecords", "getOrders", "mailingContacts", "newsletterRecipients", `${js}; return sendNewsletterAction;`)(auth, send, async () => [], async () => [], () => [], () => ["ok@example.invalid", "failed@example.invalid", "ok2@example.invalid"]);
}
function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({ subject: "Newsletter test", html: "<p>Contenu de la newsletter</p>", recipientMode: "all", confirmed: "on" })) data.set(key, value);
  return data;
}
test("partial sending reports exactly the refused recipients for a selective retry", async () => {
  const sent = [];
  const send = action(async email => { sent.push(email); return email !== "failed@example.invalid"; });
  const result = await send({}, form());
  assert.equal(sent.length, 3);
  assert.deepEqual(result.failedEmails, ["failed@example.invalid"]);
  assert.match(result.error, /2 envois acceptés sur 3/);
  assert.equal(result.success, undefined);
});
test("sending remains explicitly confirmed and admin-only", async () => {
  let count = 0;
  const send = action(async () => { count++; return true; });
  const data = form(); data.delete("confirmed");
  assert.match((await send({}, data)).error, /Confirmez/);
  const unauthorized = action(async () => { count++; }, async () => { throw new Error("unauthorized"); });
  await assert.rejects(unauthorized({}, form()), /unauthorized/);
  assert.equal(count, 0);
});
