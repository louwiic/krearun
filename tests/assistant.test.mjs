import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as helpers from '../lib/assistant.ts';
const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const out = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const mod = { exports: {} }; new Function('require', 'module', 'exports', out)(name => mocks[name] ?? require(name), mod, mod.exports); return mod.exports;
}
const productId = 'product00000001', colorId = 'color0000000001', orderId = 'order0000000001';
function harness() {
  const tables = { assistant_runs: [], assistant_actions: [], assistant_locks: [] };
  let writes = 0, counter = 0;
  const product = { id: productId, name: 'NOS', slug: 'nos', description: 'Porte-boisson', priceCents: 2290, stock: 10, weightGrams: 185, active: true, category: 'porte-boisson', colors: [], variants: [], images: ['/nos.webp'] };
  const color = { id: colorId, name: 'Cuivre rouge', stockGrams: 1000, active: true };
  const order = { id: orderId, number: 1210, name: 'Client', city: 'Le Tampon', totalCents: 2290, amountPaidCents: 2290, paymentStatus: 'paid', status: 'preparing', trackingNumber: '', items: [], note: '' };
  const api = {
    assistantList: async (table, filter = '', perPage = 50) => {
      const conditions = [...filter.matchAll(/\b(id|actor|requestKey|key)='([^']*)'/g)];
      let rows = tables[table].filter(r => conditions.every(([, key, value]) => r[key] === value));
      const prefix = filter.match(/key~'([^']*)'/)?.[1]; if (prefix) rows = rows.filter(r => r.key.includes(prefix));
      if (filter.includes("state='done'")) rows = rows.filter(r => ['done', 'sent'].includes(r.state));
      return { items: rows.slice(-perPage).reverse(), totalItems: rows.length, totalPages: Math.ceil(rows.length / perPage) };
    },
    assistantInsert: async (table, body) => {
      if ((table === 'assistant_locks' && tables[table].some(r => r.key === body.key)) || (table === 'assistant_runs' && tables[table].some(r => r.requestKey === body.requestKey))) throw new Error('unique');
      const row = { id: String(++counter).padStart(15, '0'), created: new Date().toISOString(), ...body }; tables[table].push(row); return row;
    },
    assistantPatch: async (table, id, patch) => { const r = tables[table].find(r => r.id === id); Object.assign(r, patch); return r; },
    assistantDelete: async () => {},
    getProducts: async () => [product], getProductById: async id => id === product.id ? product : null,
    getInventoryColors: async () => [color], getInventoryColorById: async id => id === color.id ? color : null,
    assistantFindOrders: async () => [order], getOrderById: async id => id === order.id ? order : null,
    createProduct: async patch => { writes++; return { ...patch, id: productId }; },
    updateProduct: async (id, patch) => { writes++; Object.assign(product, patch); return product; },
    updateInventoryColor: async (id, patch) => { writes++; Object.assign(color, patch); return color; },
    updateOrderStatus: async (id, status, patch) => { writes++; Object.assign(order, patch, { status }); return order; },
  };
  const server = load('../lib/assistant-server.ts', { './store': api, './assistant': helpers, './types': { CATEGORIES: [{ value: 'porte-boisson' }, { value: 'deco' }] }, './format': { slugify: s => s.toLowerCase().replace(/\s+/g, '-') } });
  return { server, tables, product, color, order, get writes() { return writes; } };
}
function modelCall(name, args) { return { output: [{ type: 'function_call', name, arguments: JSON.stringify(args), call_id: crypto.randomUUID() }], usage: { input_tokens: 5000, output_tokens: 100 } }; }
const final = { output: [{ type: 'message', content: [{ type: 'output_text', text: 'Proposition prête à vérifier.' }] }], usage: { input_tokens: 5000, output_tokens: 200 } };
function mockOpenAI(responses) {
  const original = globalThis.fetch; let calls = 0;
  globalThis.fetch = async (url, init) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    const body = JSON.parse(init.body); assert.equal(body.store, false); assert.equal(body.model, 'gpt-5.4-mini'); assert.equal(body.parallel_tool_calls, false); assert.ok(body.max_output_tokens <= 1200);
    for (const t of body.tools) { assert.equal(t.parameters.additionalProperties, false); assert.deepEqual(t.parameters.required, Object.keys(t.parameters.properties)); }
    const data = responses[calls++] || final; return Response.json(data);
  };
  return { restore: () => { globalThis.fetch = original; }, calls: () => calls };
}
async function runWith(h, responses, text = 'Mets le NOS à 25 euros') {
  const f = mockOpenAI(responses);
  try { const run = await h.server.enqueueAssistant('admin:one', 'admin', crypto.randomUUID(), text); return await h.server.processAssistantRun(run); }
  finally { f.restore(); }
}
test('webhook signatures authenticate the raw body, not a reserialized payload', () => {
  const raw = '{ "entry": [] }', secret = 'not-a-real-secret'; const signature = 'sha256=' + createHmac('sha256', secret).update(raw).digest('hex');
  assert.equal(helpers.verifyWhatsAppSignature(raw, signature, secret), true);
  for (const [text, sig, key] of [[raw.trim() + ' ', signature, secret], [raw, signature, 'wrong'], [raw, null, secret], [raw, 'sha256=aa', secret], [raw, signature, '']]) assert.equal(helpers.verifyWhatsAppSignature(text, sig, key), false);
});
test('WhatsApp accepts only recent text from the exact admin and destination phone ID', () => {
  const now = Date.now(), msg = { id: 'wamid.test', from: '262692123456', type: 'text', timestamp: String(Math.floor(now / 1000)), text: { body: 'Mes commandes' } };
  const payload = m => ({ entry: [{ changes: [{ value: { metadata: { phone_number_id: '123' }, messages: [m] } }] }] });
  assert.equal(helpers.extractWhatsAppMessages(payload(msg), '123', [msg.from], now).length, 1);
  for (const m of [{ ...msg, from: '33600000000' }, { ...msg, type: 'image' }, { ...msg, timestamp: '1' }, { ...msg, text: { body: 'x'.repeat(3001) } }]) assert.equal(helpers.extractWhatsAppMessages(payload(m), '123', [msg.from], now).length, 0);
  assert.equal(helpers.extractWhatsAppMessages(payload(msg), 'wrong', [msg.from], now).length, 0);
});
test('body size is enforced without trusting content-length', async () => {
  const r = new Request('https://krearun.re', { method: 'POST', body: '123456' });
  await assert.rejects(helpers.boundedBody(r, 5), /volumineuse/);
});
test('tool proposals never write business data before confirmation, and a second confirmation cannot repeat a write', async () => {
  process.env.ASSISTANT_ENABLED = 'true'; process.env.OPENAI_API_KEY = 'test-only';
  const h = harness();
  const result = await runWith(h, [modelCall('prepare_product', { productId, priceCents: 2500 }), final]);
  assert.equal(h.writes, 0); assert.equal(result.proposals.length, 1); assert.match(result.proposals[0].summary, /25,00/);
  await assert.rejects(h.server.confirmAssistantAction('admin:other', result.proposals[0].id), /introuvable/);
  await h.server.confirmAssistantAction('admin:one', result.proposals[0].id); assert.equal(h.writes, 1); assert.equal(h.product.priceCents, 2500);
  await h.server.confirmAssistantAction('admin:one', result.proposals[0].id); assert.equal(h.writes, 1);
});
test('stale or expired proposals and cancellations cannot mutate products', async () => {
  for (const mode of ['changed', 'expired', 'cancelled']) {
    const h = harness(); const result = await runWith(h, [modelCall('prepare_product', { productId, priceCents: 2500 }), final]); const p = h.tables.assistant_actions[0];
    if (mode === 'changed') h.product.stock = 9;
    if (mode === 'expired') p.expiresAt = '2000-01-01T00:00:00Z';
    if (mode === 'expired') await assert.rejects(h.server.confirmAssistantAction('admin:one', p.id), /expiré/);
    else await h.server.confirmAssistantAction('admin:one', result.proposals[0].id, mode === 'cancelled');
    assert.equal(h.writes, 0);
  }
});
test('a new product remains a draft and a product without photos cannot be published', async () => {
  const h = harness();
  const result = await runWith(h, [modelCall('prepare_product', { productId: null, name: 'Nouveau porte-boisson', priceCents: 2290, stock: 10, weightGrams: 185, category: 'porte-boisson', active: true }), final]);
  assert.equal(h.writes, 0); assert.equal(h.tables.assistant_actions[0].patch.active, false);
  await h.server.confirmAssistantAction('admin:one', result.proposals[0].id); assert.equal(h.writes, 1);
  const h2 = harness(); h2.product.images = [];
  const denied = await runWith(h2, [modelCall('prepare_product', { productId, active: true }), final]); assert.equal(denied.proposals.length, 0); assert.equal(h2.writes, 0);
});
test('variant prices, negative stock and payment operations cannot be changed by a tool', async () => {
  const h = harness(); h.product.variants = [{ id: 'one' }];
  for (const call of [modelCall('prepare_product', { productId, priceCents: 1 }), modelCall('prepare_inventory', { id: colorId, stockGrams: -1 }), modelCall('refund_order', { id: orderId })]) {
    const result = await runWith(h, [call, final]); assert.equal(result.proposals.length, 0); assert.equal(h.writes, 0);
  }
});
test('shipping requires a tracking number and leaves payment unchanged', async () => {
  const h = harness(); let result = await runWith(h, [modelCall('prepare_order_status', { id: orderId, status: 'shipped', trackingNumber: null }), final]);
  assert.equal(result.proposals.length, 0);
  result = await runWith(h, [modelCall('prepare_order_status', { id: orderId, status: 'shipped', trackingNumber: '8Q12345678901' }), final]);
  assert.equal(h.writes, 0); await h.server.confirmAssistantAction('admin:one', result.proposals[0].id);
  assert.equal(h.order.status, 'shipped'); assert.equal(h.order.paymentStatus, 'paid'); assert.equal(h.writes, 1);
});
test('duplicate webhook IDs and parallel confirmations cannot duplicate runs or business writes', async () => {
  const h = harness(); const runs = await Promise.all([h.server.enqueueAssistant('admin:one', 'admin', 'same-id', 'Bonjour'), h.server.enqueueAssistant('admin:one', 'admin', 'same-id', 'Bonjour')]);
  assert.equal(runs[0].id, runs[1].id); assert.equal(h.tables.assistant_runs.length, 1);
  const result = await runWith(h, [modelCall('prepare_product', { productId, stock: 5 }), final]);
  await Promise.all([h.server.confirmAssistantAction('admin:one', result.proposals[0].id), h.server.confirmAssistantAction('admin:one', result.proposals[0].id)]); assert.equal(h.writes, 1);
});
test('monthly quota is durable across requests, confirmation uses no IA and model usage is accounted', async () => {
  process.env.ASSISTANT_MONTHLY_REQUEST_LIMIT = '1';
  try {
    const h = harness(); const f = mockOpenAI([final]);
    try {
      const a = await h.server.enqueueAssistant('admin:one', 'admin', 'first', 'Bonjour'); await h.server.processAssistantRun(a);
      const b = await h.server.enqueueAssistant('admin:one', 'admin', 'second', 'Bonjour'); const result = await h.server.processAssistantRun(b);
      assert.match(result.message, /Limite mensuelle/); assert.equal(f.calls(), 1); assert.equal(a.inputTokens, 5000); assert.equal(a.estimatedUsd, helpers.estimateAssistantUsd(5000, 200));
    } finally { f.restore(); }
  } finally { delete process.env.ASSISTANT_MONTHLY_REQUEST_LIMIT; }
});
test('admin endpoint refuses anonymous, cross-origin and disabled requests before invoking the model', async () => {
  let admin = false, calls = 0;
  const route = load('../app/api/admin/assistant/route.ts', { '@/lib/auth': { isAdmin: async () => admin }, '@/lib/custom-holder-http': { holderSiteUrl: () => 'https://krearun.re' }, '@/lib/assistant': { ...helpers, assistantConfig: () => ({ enabled: false }) }, '@/lib/assistant-server': { AssistantError: Error, enqueueAssistant: async () => { calls++; } }, 'next/cache': { revalidatePath: () => {} } });
  const req = origin => new Request('https://krearun.re/api/admin/assistant', { method: 'POST', headers: { origin }, body: JSON.stringify({ conversationId: crypto.randomUUID(), requestId: crypto.randomUUID(), message: 'Bonjour' }) });
  assert.equal((await route.POST(req('https://krearun.re'))).status, 401); admin = true;
  assert.equal((await route.POST(req('https://evil.test'))).status, 403);
  assert.equal((await route.POST(req('https://krearun.re'))).status, 400); assert.equal(calls, 0);
});
test('webhook verifies the signature before accepting messages and acknowledges only after durable enqueue', async () => {
  const secret = 'test-secret', afters = [], queued = [];
  process.env.WHATSAPP_APP_SECRET = secret; process.env.WHATSAPP_PHONE_NUMBER_ID = '123';
  const webhook = load('../app/api/whatsapp/webhook/route.ts', { 'next/server': { after: fn => afters.push(fn) }, '@/lib/assistant': { ...helpers, assistantConfig: () => ({ enabled: true, whatsappReady: true, openaiReady: true }), whatsappAdmins: () => ['262692123456'] }, '@/lib/assistant-server': { enqueueAssistant: async (...args) => queued.push(args) }, '@/lib/assistant-whatsapp': { processWhatsAppQueue: async () => {} } });
  const payload = { entry: [{ changes: [{ value: { metadata: { phone_number_id: '123' }, messages: [{ id: 'wamid.unique', from: '262692123456', type: 'text', timestamp: String(Math.floor(Date.now() / 1000)), text: { body: 'Dernières commandes' } }] } }] }] };
  const raw = JSON.stringify(payload), sig = 'sha256=' + createHmac('sha256', secret).update(raw).digest('hex');
  const request = signature => new Request('https://krearun.re/api/whatsapp/webhook', { method: 'POST', headers: { 'x-hub-signature-256': signature }, body: raw });
  assert.equal((await webhook.POST(request('invalid'))).status, 403); assert.equal(queued.length, 0);
  assert.equal((await webhook.POST(request(sig))).status, 200); assert.equal(queued.length, 1); assert.equal(afters.length, 1); assert.equal(queued[0][0], 'whatsapp:262692123456');
  process.env.WHATSAPP_VERIFY_TOKEN = 'verify-test';
  const check = await webhook.GET(new Request('https://krearun.re/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-test&hub.challenge=12345'));
  assert.equal(await check.text(), '12345');
  assert.equal((await webhook.GET(new Request('https://krearun.re/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong'))).status, 403);
});
test('WhatsApp delivery is bound to the admin and is not repeated after an ambiguous send', async () => {
  process.env.WHATSAPP_GRAPH_VERSION = 'v24.0'; process.env.WHATSAPP_PHONE_NUMBER_ID = '123'; process.env.WHATSAPP_ACCESS_TOKEN = 'test';
  const rows = [{ id: 'run000000000001', actor: 'whatsapp:262692123456', channel: 'whatsapp', state: 'done', result: { message: 'Commande en préparation', proposals: [] } }];
  const receipts = new Set(); let sends = 0;
  const whatsapp = load('../lib/assistant-whatsapp.ts', { './assistant': { ...helpers, assistantConfig: () => ({ enabled: true, openaiReady: true, whatsappReady: true }), whatsappAdmins: () => ['262692123456'] }, './assistant-server': { processAssistantRun: async () => { throw new Error('should not call'); } }, './store': { assistantList: async () => ({ items: rows }), assistantInsert: async (_, body) => { if (receipts.has(body.key)) throw new Error('unique'); receipts.add(body.key); }, assistantPatch: async (_, id, patch) => Object.assign(rows.find(r => r.id === id), patch) } });
  const old = globalThis.fetch;
  globalThis.fetch = async (url, init) => { sends++; const body = JSON.parse(init.body); assert.equal(body.to, '262692123456'); assert.equal(body.messaging_product, 'whatsapp'); throw new Error('network timeout after possible acceptance'); };
  try { await whatsapp.processWhatsAppQueue(); assert.equal(rows[0].state, 'delivery_uncertain'); await whatsapp.processWhatsAppQueue(); assert.equal(sends, 1); }
  finally { globalThis.fetch = old; }
});
test('worker rejects absent and malformed authorization before processing its queue', async () => {
  let calls = 0; process.env.ASSISTANT_WORKER_SECRET = 'worker-test-secret';
  const route = load('../app/api/assistant/worker/route.ts', { '@/lib/assistant-server': { assistantPrune: async () => {} }, '@/lib/assistant-whatsapp': { processWhatsAppQueue: async () => { calls++; } } });
  for (const authorization of ['', 'Bearer wrong', 'Bearer ééééééééé']) assert.equal((await route.POST(new Request('https://krearun.re/api/assistant/worker', { method: 'POST', headers: { authorization } }))).status, 403);
  assert.equal(calls, 0);
  assert.equal((await route.POST(new Request('https://krearun.re/api/assistant/worker', { method: 'POST', headers: { authorization: 'Bearer worker-test-secret' } }))).status, 200); assert.equal(calls, 1);
});
