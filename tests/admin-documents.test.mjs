import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const loaded = { exports: {} };
  new Function("require", "module", "exports", outputText)((id) => mocks[id] ?? require(id), loaded, loaded.exports);
  return loaded.exports;
}
const documents = load("../lib/admin-documents.ts");
function route(admin, fs) {
  return load("../app/api/admin/doc/[id]/route.ts", {
    "@/lib/auth": { isAdmin: async () => admin },
    "@/lib/admin-documents": documents,
    ...(fs ? { "node:fs/promises": fs } : {}),
  }).GET;
}
const request = (id, query = "") => new Request(`http://localhost/api/admin/doc/${id}${query}`);
const context = (id) => ({ params: Promise.resolve({ id }) });

test("anonymous users cannot read any document or access the filesystem", async () => {
  const get = route(false, { readFile: () => assert.fail("File read before authentication") });
  const response = await get(request(documents.ADMIN_DOCUMENTS[0].id), context(documents.ADMIN_DOCUMENTS[0].id));
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});
test("unknown IDs and path traversal never reach the filesystem", async () => {
  const get = route(true, { readFile: () => assert.fail("Unlisted path read") });
  for (const id of ["missing", "../.env", "__proto__"]) {
    assert.equal((await get(request(id), context(id))).status, 404);
  }
});
test("admins can preview and download original JPEGs and the PDF without modifying them", async () => {
  const get = route(true);
  for (const document of documents.ADMIN_DOCUMENTS) {
    for (const query of ["", "?download=1"]) {
      const response = await get(request(document.id, query), context(document.id));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), document.contentType);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.match(response.headers.get("content-disposition"), query ? /^attachment;/ : /^inline;/);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), readFileSync(new URL(`../assets/admin-docs/${document.filename}`, import.meta.url)));
    }
  }
});

test("the brand guide has a protected image preview while download keeps the original PDF", async () => {
  const get = route(true);
  const document = documents.ADMIN_DOCUMENTS.find(item => item.id === "charte-krearun");
  const preview = await get(request(document.id, "?preview=1"), context(document.id));
  assert.equal(preview.headers.get("content-type"), "image/jpeg");
  assert.deepEqual(Buffer.from(await preview.arrayBuffer()), readFileSync(new URL(`../assets/admin-docs/${document.previewFilename}`, import.meta.url)));
  const download = await get(request(document.id, "?preview=1&download=1"), context(document.id));
  assert.equal(download.headers.get("content-type"), "application/pdf");
  assert.match(download.headers.get("content-disposition"), /^attachment;/);
  const anonymous = route(false, { readFile: () => assert.fail("Private preview read") });
  assert.equal((await anonymous(request(document.id, "?preview=1"), context(document.id))).status, 401);
});
