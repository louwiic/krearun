import { readFile } from "node:fs/promises";
import path from "node:path";
import opentype from "opentype.js";
import { DEFAULT_LETTER, layoutCustomLetter } from "./custom-letter";
import { parseLetterConfiguration } from "./custom-letter-settings";

let fontPromise: Promise<[opentype.Font, opentype.Font]> | undefined;
export function letterFonts() {
  fontPromise ??= Promise.all(["LibreBaskerville.ttf", "Lobster-Regular.ttf"].map(async (file) => {
    const buffer = await readFile(path.join(process.cwd(), "public", "fonts", file));
    return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  })).then(([initial, name]): [opentype.Font, opentype.Font] => [initial, name]).catch((error) => { fontPromise = undefined; throw error; });
  return fontPromise;
}

export async function validatedLetter(value: unknown) {
  const configuration = parseLetterConfiguration(value);
  if (!configuration) throw new Error("Configuration de lettre invalide.");
  const fonts = await letterFonts();
  const options = { ...DEFAULT_LETTER, ...configuration };
  layoutCustomLetter(options, ...fonts);
  return { configuration, fonts, options };
}
