import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);

function loadShell() {
  let state = false;
  const source = readFileSync(
    new URL("../components/admin/AdminShell.tsx", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const module = { exports: {} };
  const mockedRequire = (id) =>
    id === "react"
      ? {
          useState: () => [
            state,
            (next) => {
              state = typeof next === "function" ? next(state) : next;
            },
          ],
        }
      : require(id);
  new Function("require", "module", "exports", outputText)(
    mockedRequire,
    module,
    module.exports,
  );
  return module.exports.default;
}

function find(element, predicate) {
  if (!element || typeof element !== "object") return undefined;
  if (predicate(element)) return element;
  const children = [element.props?.children].flat(Infinity);
  for (const child of children) {
    const match = find(child, predicate);
    if (match) return match;
  }
}

test("admin sidebar closes and reopens, releasing the content width without unmounting the page", () => {
  const Shell = loadShell();
  const page = { type: "section", props: { children: "commandes" } };
  const props = {
    sidebar: "navigation",
    mobileNavigation: "navigation mobile",
    children: page,
  };
  let tree = Shell(props);
  let button = find(tree, (node) => node.type === "button");
  assert.equal(button.props["aria-expanded"], true);
  assert.equal(button.props["aria-controls"], "admin-sidebar");
  assert.match(
    find(tree, (node) => node.type === "aside").props.className,
    /md:flex/,
  );
  assert.match(
    find(tree, (node) => node.type === "main").props.className,
    /md:ml-60/,
  );

  button.props.onClick();
  tree = Shell(props);
  button = find(tree, (node) => node.type === "button");
  assert.equal(button.props["aria-expanded"], false);
  assert.ok(button.props.children.includes("Afficher le menu"));
  assert.doesNotMatch(
    find(tree, (node) => node.type === "aside").props.className,
    /md:flex/,
  );
  assert.match(
    find(tree, (node) => node.type === "main").props.className,
    /md:ml-0/,
  );
  assert.equal(
    find(tree, (node) => node.type === "section"),
    page,
  );
  assert.match(
    find(tree, (node) => node.type === "main").props.className,
    /min-w-0/,
  );
  assert.equal(
    find(tree, (node) => node.type === "nav").props.children,
    "navigation mobile",
  );

  // A navigation changes only the slot; the layout state and reopening control remain.
  tree = Shell({ ...props, children: "autre page" });
  button = find(tree, (node) => node.type === "button");
  assert.equal(button.props["aria-expanded"], false);
  button.props.onClick();
  tree = Shell(props);
  assert.equal(
    find(tree, (node) => node.type === "button").props["aria-expanded"],
    true,
  );
  assert.match(
    find(tree, (node) => node.type === "aside").props.className,
    /md:flex/,
  );
});

test("admin authentication remains on the server before rendering the interactive layout", () => {
  const layout = readFileSync(
    new URL("../app/admin/(dashboard)/layout.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(layout, /^["']use client["']/);
  assert.match(
    layout,
    /if \(!\(await isAdmin\(\)\)\) redirect\("\/admin\/login"\)/,
  );
  assert.ok(layout.indexOf("await isAdmin()") < layout.indexOf("<AdminShell"));
  assert.match(layout, /form action=\{logoutAction\}/);
});
