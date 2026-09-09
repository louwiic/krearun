// Shared migration client. Credentials stay in the server environment; never logged.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

export async function client() {
  const url = process.env.POCKETBASE_URL?.replace(/\/$/, "");
  const identity = process.env.POCKETBASE_ADMIN_EMAIL;
  const password = process.env.POCKETBASE_ADMIN_PASSWORD;
  if (!url || !identity || !password)
    throw new Error("Configuration PocketBase manquante.");
  const response = await fetch(
    `${url}/api/collections/_superusers/auth-with-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity, password }),
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!response.ok)
    throw new Error(`Authentification PocketBase : HTTP ${response.status}`);
  const { token } = await response.json();
  async function request(path, method = "GET", body) {
    const response = await fetch(`${url}/api${path}`, {
      method,
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) {
      const fields = Object.entries(data?.data ?? {})
        .map(([key, value]) => `${key}:${value.code}`)
        .join(", ");
      throw new Error(
        `PocketBase ${method} : HTTP ${response.status}${fields ? ` (${fields})` : ""}`,
      );
    }
    return data;
  }
  async function orders() {
    const all = [];
    for (let page = 1; ; page++) {
      const result = await request(
        `/collections/orders/records?perPage=500&page=${page}&sort=number,id`,
      );
      all.push(...result.items);
      if (page >= result.totalPages) return all;
    }
  }
  return { request, orders };
}

export function backup(directory, name, data) {
  if (!directory) throw new Error("--backup-dir requis avant toute écriture.");
  const target = resolve(directory);
  mkdirSync(target, { recursive: true, mode: 0o700 });
  const path = join(
    target,
    `${name}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  writeFileSync(path, JSON.stringify(data, null, 2), {
    flag: "wx",
    mode: 0o600,
  });
  return path;
}

export function option(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? "" : (process.argv[index + 1] ?? "");
}
