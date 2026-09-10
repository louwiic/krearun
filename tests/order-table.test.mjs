import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import {
  createTable,
  getCoreRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as management from "../lib/order-management.ts";
import * as details from "../lib/order-details.ts";
import * as format from "../lib/format.ts";
import * as style from "../lib/order-status-style.ts";
import { paginateRows, togglePageSelection } from "../lib/order-list.ts";

const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    (name) => mocks[name] ?? require(name),
    compiledModule,
    compiledModule.exports,
  );
  return compiledModule.exports;
}
const { ORDER_TABLE_COLUMNS, DEFAULT_ORDER_COLUMNS } = load(
  "../lib/order-table.ts",
  { "./order-management": management, "./order-details": details },
);
const item = {
  productId: "test-product",
  name: "Porte-canette",
  quantity: 2,
  priceCents: 1700,
  color: "Orange mangue",
  variantId: "test-variant",
  variantName: "Grand modèle",
  customName: "Élodie",
  keychainChoice: "Griffe",
  image: "",
  weightGrams: 120,
};
function order(id, extra = {}) {
  return {
    id,
    number: 1000 + Number(id.replace(/\D/g, "") || 0),
    name: "Client test",
    email: "test@example.invalid",
    phone: "0000000000",
    addressLine1: "Adresse de test",
    addressLine2: "Complément de test",
    postalCode: "97400",
    city: "Saint-Denis",
    country: "FR",
    items: [item],
    description: "Description manuelle",
    quantityText: "2",
    note: "Note client exemple",
    internalNote: "Note privée exemple",
    tags: ["Test"],
    status: "pending",
    paymentStatus: "unpaid",
    amountPaidCents: 0,
    subtotalCents: 3400,
    shippingCents: 500,
    totalCents: 3900,
    source: "manual",
    sourceId: "source-test",
    orderedAt: "2026-09-10T00:00:00Z",
    dueDate: "",
    updatedAt: "2026-09-10T02:00:00Z",
    createdAt: "2026-09-09T00:00:00Z",
    urgent: false,
    trackingNumber: "COLIS-TEST",
    customerProfileUrl: "https://example.invalid/profil",
    productUrl: "https://example.invalid/produit",
    ...extra,
  };
}
function makeTable(data, sorting = [{ id: "orderedAt", desc: true }]) {
  let state;
  const table = createTable({
    data,
    columns: ORDER_TABLE_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    renderFallbackValue: null,
    state: {},
    onStateChange: (updater) => {
      state = typeof updater === "function" ? updater(state) : updater;
      table.setOptions((old) => ({ ...old, state }));
    },
  });
  state = {
    ...table.initialState,
    sorting,
    columnVisibility: { ...DEFAULT_ORDER_COLUMNS },
  };
  table.setOptions((old) => ({ ...old, state }));
  return table;
}
const rows = (table) => table.getRowModel().rows.map((row) => row.original);

test("TanStack sorts amounts numerically ASC/DESC across all pages, keeping stable record IDs", () => {
  const data = Array.from({ length: 37 }, (_, i) =>
    order(`id${i}`, { totalCents: (37 - i) * 100 }),
  );
  const table = makeTable(data, [{ id: "totalCents", desc: false }]);
  assert.deepEqual(
    paginateRows(rows(table), 1, 10).items.map((row) => row.totalCents),
    [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
  );
  table.setSorting([{ id: "totalCents", desc: true }]);
  assert.deepEqual(
    rows(table).map((row) => row.id),
    data.map((row) => row.id),
  );
  const selected = togglePageSelection(
    [],
    paginateRows(rows(table), 1, 10).items.map((row) => row.id),
    true,
  );
  table.setSorting([{ id: "totalCents", desc: false }]);
  assert.deepEqual(
    rows(table)
      .filter((row) => selected.includes(row.id))
      .map((row) => row.id),
    data
      .slice(0, 10)
      .reverse()
      .map((row) => row.id),
  );
});

test("date sorting uses real instants, and empty deadlines stay last in either direction", () => {
  const data = [
    order("id1", { orderedAt: "2026-09-10T01:00:00+04:00", dueDate: "" }),
    order("id2", {
      orderedAt: "2026-09-09T23:00:00Z",
      dueDate: "2026-09-12T00:00:00Z",
    }),
    order("id3", {
      orderedAt: "2026-08-01T00:00:00Z",
      dueDate: "2026-09-11T00:00:00Z",
    }),
  ];
  const table = makeTable(data);
  assert.deepEqual(
    rows(table).map((row) => row.id),
    ["id2", "id1", "id3"],
  );
  table.setSorting([{ id: "dueDate", desc: false }]);
  assert.deepEqual(
    rows(table).map((row) => row.id),
    ["id3", "id2", "id1"],
  );
  table.setSorting([{ id: "dueDate", desc: true }]);
  assert.deepEqual(
    rows(table).map((row) => row.id),
    ["id2", "id3", "id1"],
  );
});

test("French text, natural numbers and secondary sorting are supported", () => {
  const data = [
    order("id1", { name: "Équipe 10", totalCents: 100 }),
    order("id2", { name: "équipe 2", totalCents: 300 }),
    order("id3", { name: "Équipe 2", totalCents: 200 }),
  ];
  const table = makeTable(data, [
    { id: "client", desc: false },
    { id: "totalCents", desc: false },
  ]);
  assert.deepEqual(
    rows(table).map((row) => row.id),
    ["id3", "id2", "id1"],
  );
});

test("visible cells follow column settings while full details and selection cannot be hidden", () => {
  const table = makeTable([order("id1")]);
  assert.equal(table.getColumn("phone").getIsVisible(), false);
  table.getColumn("phone").toggleVisibility(true);
  assert.ok(
    table
      .getRow("id1")
      .getVisibleCells()
      .some((cell) => cell.column.id === "phone"),
  );
  assert.equal(table.getColumn("details").getCanHide(), false);
  assert.equal(table.getColumn("selection").getCanHide(), false);
  table.toggleAllColumnsVisible(true);
  assert.equal(
    table.getVisibleLeafColumns().length,
    ORDER_TABLE_COLUMNS.length,
  );
});

test("description, search and export text retain product options even with a manual description", () => {
  const record = order("id1");
  const text = details.orderDescriptionText(record);
  for (const value of [
    "Description manuelle",
    "2 × Porte-canette",
    "Grand modèle",
    "Orange mangue",
    "Élodie",
    "Griffe",
  ])
    assert.ok(text.includes(value), value);
  const search = details.orderSearchText(record);
  for (const value of [
    "Élodie",
    "Orange mangue",
    "97400",
    "Complément de test",
    "Note client exemple",
    "Note privée exemple",
    "COLIS-TEST",
  ])
    assert.ok(search.includes(value), value);
});

const sharedMocks = {
  "@/lib/order-details": details,
  "@/lib/format": format,
  "@/lib/order-management": management,
  "@/lib/order-status-style": style,
  "next/link": ({ children, ...props }) => createElement("a", props, children),
};
const itemsModule = load("../components/admin/OrderItems.tsx", sharedMocks);
const dialogMocks = { ...sharedMocks, "./OrderItems": itemsModule };

function renderOrdersTable(records, extra = {}) {
  const View = load("../components/admin/OrdersTableView.tsx", {
    ...sharedMocks,
    "@/lib/order-table": { DEFAULT_ORDER_COLUMNS },
    "./OrderItems": itemsModule,
  }).default;
  return renderToStaticMarkup(
    createElement(View, {
      table: makeTable(records),
      orders: records,
      selected: [],
      allChecked: false,
      pending: false,
      onSelect() {},
      onSelectPage() {},
      onOpen() {},
      save() {
        assert.fail("Rendering tracking must not update an order");
      },
      renderPayment: () => null,
      ...extra,
    }),
  );
}

test("shipped orders show a safe La Poste tracking link directly below their status", () => {
  const markup = renderOrdersTable([
    order("id1", { status: "shipped", trackingNumber: "  TEST123456FR  " }),
  ]);
  assert.match(
    markup,
    /<select aria-label="Production de la commande 1001"[^>]*>[\s\S]*?<\/select><a href="https:\/\/www\.laposte\.fr\/outils\/suivre-vos-envois\?code=TEST123456FR"/,
  );
  assert.match(markup, /target="_blank" rel="noopener noreferrer"/);
  assert.ok(markup.includes("Suivi : TEST123456FR ↗"));
  assert.ok(markup.includes("sur La Poste (nouvel onglet)"));
  assert.equal(markup.match(/href="https:\/\/www\.laposte\.fr/g)?.length, 1);
});

test("tracking is absent for unshipped orders and missing or blank numbers", () => {
  for (const extra of [
    { status: "shipped", trackingNumber: "" },
    { status: "shipped", trackingNumber: " \n " },
    { status: "shipped", trackingNumber: undefined },
    ...management.PRODUCTION_STATUSES.filter(({ value }) => value !== "shipped")
      .map(({ value }) => ({ status: value, trackingNumber: "TEST123456FR" })),
  ]) {
    const markup = renderOrdersTable([order("id1", extra)]);
    assert.equal(markup.includes("www.laposte.fr"), false);
    assert.equal(markup.includes("Suivi :"), false);
  }
});

test("tracking remains clickable while saving and encodes the number without injecting markup or URL parameters", () => {
  const number = 'TEST&code=OTHER#<script>"';
  const markup = renderOrdersTable(
    [order("id1", { status: "shipped", trackingNumber: number })],
    { pending: true },
  );
  const href = markup.match(/<a href="(https:\/\/www\.laposte\.fr[^\"]+)"/)?.[1];
  assert.ok(href);
  const url = new URL(href);
  assert.equal(url.origin, "https://www.laposte.fr");
  assert.deepEqual([...url.searchParams], [["code", number]]);
  assert.equal(url.hash, "");
  assert.equal(markup.includes("<script>"), false);
  assert.ok(markup.includes("&lt;script&gt;"));
  assert.match(markup, /Production de la commande 1001" disabled=""/);
  assert.match(markup, /<a href="https:\/\/www\.laposte\.fr[^>]+target="_blank"/);
});

test("full order dialog renders all options, private notes, dates, address and amounts safely", () => {
  const Dialog = load(
    "../components/admin/OrderDetailsDialog.tsx",
    dialogMocks,
  ).default;
  let closed = false;
  const markup = renderToStaticMarkup(
    createElement(Dialog, {
      order: order("id1", { note: "<script>not executable</script>" }),
      onClose: () => {
        closed = true;
      },
    }),
  );
  for (const value of [
    "Orange mangue",
    "Grand modèle",
    "Élodie",
    "Griffe",
    "Prix unitaire",
    "Poids unitaire",
    "test-product",
    "test-variant",
    "Note privée exemple",
    "Complément de test",
    "97400",
    "COLIS-TEST",
    "Sous-total",
    "Reste à payer",
    "Dernière modification",
    "source-test",
    "crm-modal",
    "order-details-title",
  ])
    assert.ok(markup.includes(value), value);
  assert.ok(markup.includes("&lt;script&gt;not executable&lt;/script&gt;"));
  assert.equal(markup.includes("<script>not executable"), false);
  assert.equal(closed, false);
});

test("dialog opens modally and closes when its selected order is cleared", () => {
  const element = {
    open: false,
    showModal() {
      this.open = true;
    },
    close() {
      this.open = false;
    },
  };
  const Dialog = load("../components/admin/OrderDetailsDialog.tsx", {
    ...dialogMocks,
    react: {
      useRef: () => ({ current: element }),
      useEffect: (effect) => effect(),
    },
  }).default;
  Dialog({ order: order("id1"), onClose() {} });
  assert.equal(element.open, true);
  Dialog({ order: null, onClose() {} });
  assert.equal(element.open, false);
});

test("DaisyUI is prefixed and limited to the table and modal, with no global theme replacement", () => {
  const css = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /themes:\s*false/);
  assert.match(css, /include:\s*table,\s*modal/);
  assert.match(css, /prefix:\s*"crm-"/);
  assert.match(css, /root:\s*"\.crm-surface"/);
});
