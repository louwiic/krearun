import { mkdir, writeFile, rename, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { summarizeUsage, type UsageEvent } from "./ai-usage";
const directory = () =>
  path.resolve(
    process.env.AI_USAGE_DATA_DIR ||
      path.join(
        process.env.QUOTES_DATA_DIR || ".data/quotes",
        "..",
        "ai-usage",
      ),
  );
export async function saveUsage(event: UsageEvent) {
  const dir = directory();
  await mkdir(dir, { recursive: true });
  const temp = path.join(dir, `${randomUUID()}.tmp`);
  await writeFile(temp, JSON.stringify(event), { mode: 0o600 });
  await rename(temp, path.join(dir, `${event.id}.json`));
}
export async function readUsage() {
  const dir = directory();
  await mkdir(dir, { recursive: true });
  const events = await Promise.all(
    (await readdir(dir))
      .filter((f) => f.endsWith(".json"))
      .map(
        async (file) =>
          JSON.parse(
            await readFile(path.join(dir, file), "utf8"),
          ) as UsageEvent,
      ),
  );
  return summarizeUsage(events);
}
