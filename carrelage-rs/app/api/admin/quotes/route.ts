import { isAdmin } from "@/lib/admin";
import { validQuote } from "@/lib/quotes";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
const directory = path.resolve(process.env.QUOTES_DATA_DIR || ".data/quotes");
export async function GET() {
  if (!(await isAdmin())) return new Response(null, { status: 401 });
  await mkdir(directory, { recursive: true });
  const files = (await readdir(directory)).filter((f) => f.endsWith(".json"));
  const quotes = await Promise.all(
    files.map(async (file) =>
      JSON.parse(await readFile(path.join(directory, file), "utf8")),
    ),
  );
  return Response.json(quotes, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
export async function POST(request: Request) {
  if (!(await isAdmin())) return new Response(null, { status: 401 });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return new Response(null, { status: 403 });
  if (Number(request.headers.get("content-length")) > 9_000_000)
    return new Response(null, { status: 413 });
  try {
    const raw = await request.text();
    if (raw.length > 9_000_000) return new Response(null, { status: 413 });
    const quote: unknown = JSON.parse(raw);
    if (!validQuote(quote))
      return Response.json(
        {
          error:
            "Dossier invalide. Vérifie les valeurs et l’épaisseur de chape (5 cm maximum).",
        },
        { status: 400 },
      );
    quote.updated = new Date().toISOString();
    await mkdir(directory, { recursive: true });
    const temporary = path.join(directory, `${randomUUID()}.tmp`);
    await writeFile(temporary, JSON.stringify(quote), { mode: 0o600 });
    await rename(temporary, path.join(directory, `${quote.id}.json`));
    return Response.json(quote);
  } catch {
    return Response.json(
      { error: "Impossible de sauvegarder le dossier." },
      { status: 500 },
    );
  }
}
