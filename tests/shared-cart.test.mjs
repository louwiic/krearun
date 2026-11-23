import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "./load-ts.mjs";

const load = (path, mocks) => loadTs(new URL(`../${path}`, import.meta.url), mocks);
const shared = load("lib/shared-cart.ts");
const metadata = load("lib/checkout-item-metadata.ts");
const product = {
  id: "abcdefghijklmno", slug: "porte-canette-monster", name: "Porte-canette Monster", active: true,
  priceCents: 1790, stock: 2, variants: [{ id: "large", name: "Grand", active: true, stock: 2, priceCents: 2100 }],
  quantityDiscounts: [],
};
const catalog = { kind: "catalog", productId: product.id, variantId: "large", quantity: "2", color: "Turquoise" };
const custom = { kind: "custom", label: "Porte-clés sur mesure", price: "8,50", quantity: "1", notes: "Prénom Éloïse" };

test("a shared mixed cart keeps the quoted details through payment and webhook replay", async () => {
  let authorized = false;
  const stripeCalls = [];
  const action = load("app/admin/(dashboard)/paniers-a-partager/actions.ts", {
    "@/lib/auth": { isAdmin: async () => authorized }, "@/lib/checkout-item-metadata": metadata,
    "@/lib/legal": { LEGAL_VERSION: "test" }, "@/lib/seo": { siteOrigin: () => "https://example.invalid" },
    "@/lib/shared-cart": shared, "@/lib/store": { getProducts: async () => [product] },
    "@/lib/stripe": { getStripe: () => ({ checkout: { sessions: { create: async (params, options) => {
      stripeCalls.push([params, options]);
      return { url: "https://checkout.stripe.com/test", status: "open", expires_at: Date.now() / 1000 + 3600 };
    } } } }) },
  });
  const form = new FormData();
  form.set("requestId", "9ee208f3-60a3-45dc-8dec-e646596ef47e");
  form.set("country", "RE");
  form.set("shipping", "5");
  form.set("rows", JSON.stringify([catalog, custom]));
  assert.match((await action.createSharedCart({}, form)).error, /administration/);
  assert.equal(stripeCalls.length, 0);
  authorized = true;
  const result = await action.createSharedCart({}, form);
  assert.equal(result.totalCents, 5550);
  assert.equal(result.url, "https://checkout.stripe.com/test");
  const [[params, options]] = stripeCalls;
  assert.deepEqual(params.line_items.map(line => line.price_data.unit_amount), [2100, 850]);
  assert.match(params.line_items[0].price_data.product_data.name, /Griffe/);
  assert.match(params.line_items[1].price_data.product_data.description, /Éloïse/);
  assert.match(options.idempotencyKey, /^shared-cart-/);

  let order;
  const stock = [];
  const session = { id: "cs_shared", payment_status: "paid", metadata: params.metadata,
    amount_subtotal: 5050, amount_total: 5550, shipping_cost: { amount_total: 500 },
    customer_details: { email: "client@example.invalid", name: "Client", phone: "+262000000000" },
    collected_information: { shipping_details: { name: "Client", address: { line1: "Rue Test", city: "Le Tampon", postal_code: "97430", country: "RE" } } },
  };
  const route = load("app/api/stripe/webhook/route.ts", {
    "@/lib/shared-cart": shared, "@/lib/checkout-item-metadata": metadata,
    "@/lib/public-copy": load("lib/public-copy.ts"), "@/lib/name-keychain": {}, "@/lib/gta-gift": { GTA_GIFT_OFFER: "gta" },
    "@/lib/name-keychain-fulfillment": { fulfillOrderKeychains: async () => {} },
    "@/lib/metropolitan-shipping": { readShippingQuote: () => undefined },
    "@/lib/custom-letter-settings": {}, "@/lib/clicker": {}, "@/lib/custom-holder-fulfillment": {},
    "@/lib/cart-reminder-service": { stopCartReminderAfterPurchase: async () => {} },
    "@/lib/email": { sendOrderConfirmation: async () => {}, sendAdminNewOrder: async () => {} },
    "@/lib/stripe": { getStripe: () => ({ webhooks: { constructEvent: () => ({ type: "checkout.session.completed", data: { object: session } }) } }) },
    "@/lib/store": { getOrderByStripeSession: async () => order, createOrder: async input => (order = input), decrementStock: async lines => stock.push(lines) },
  });
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = "test";
  const req = () => new Request("https://example.invalid/webhook", { method: "POST", body: "event" });
  try {
    assert.equal((await route.POST(req())).status, 200);
    assert.equal(order.addressLine1, "Rue Test");
    assert.equal(order.totalCents, 5550);
    assert.equal(order.items[1].customName, "Prénom Éloïse");
    assert.equal((await route.POST(req())).status, 200);
    assert.deepEqual(stock, [[{ productId: product.id, variantId: "large", quantity: 2 }]]);
  } finally {
    if (secret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = secret;
  }
});

test("shared carts reject aggregate stock overflow and incomplete custom prices", () => {
  assert.throws(() => shared.quoteSharedCart([catalog, catalog], [product], "0"), /stock insuffisant/i);
  assert.throws(() => shared.quoteSharedCart([{ ...custom, price: "" }], [], "0"), /prix valides/i);
  assert.throws(() => shared.quoteSharedCart([catalog], [product], ""), /frais de livraison/i);
});
