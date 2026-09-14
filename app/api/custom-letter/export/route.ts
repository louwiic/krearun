import { isAdmin } from "@/lib/auth";
import { validatedLetter } from "@/lib/custom-letter-server";
import { buildCustomLetter, arrangeCustomLetter } from "@/lib/custom-letter";
import { serializeNameplate, serializeNameplate3mf } from "@/lib/nameplate-3d";
import { zipSync, strToU8 } from "fflate";
import { CUSTOM_LETTER_PRICE_CENTS } from "@/lib/custom-letter-settings";

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Connexion administrateur requise." }, { status: 401 });
  try {
    const body = await request.json();
    if (body.format !== "stl" && body.format !== "3mf") return Response.json({ error: "Format invalide." }, { status: 400 });
    const { configuration, fonts, options } = await validatedLetter(body.configuration);
    const model = buildCustomLetter(options, ...fonts);
    let file: Uint8Array;
    if (body.format === "3mf") file = serializeNameplate3mf(arrangeCustomLetter(model), { base: configuration.baseColor, letters: configuration.nameColor });
    else {
      const [base, name] = await Promise.all([model.base, model.letters].map(async (solid) => new Uint8Array(await new Blob(serializeNameplate(solid)).arrayBuffer())));
      file = zipSync({ "base.stl": base, "prenom.stl": name,
        "parametres.json": strToU8(JSON.stringify({ ...options, priceCents: CUSTOM_LETTER_PRICE_CENTS }, null, 2)),
        "assemblage.txt": strToU8("Deux objets separes en millimetres. Disposer dos a plat sur le plateau. Base 10 mm, empreinte 2 mm, jeu lateral 0.25 mm. Tester l'emboitement avant fabrication finale."),
      });
    }
    return new Response(new Uint8Array(file), { headers: {
      "Content-Type": body.format === "3mf" ? "model/3mf" : "application/zip",
      "Content-Disposition": `attachment; filename="lettre.${body.format === "3mf" ? "3mf" : "zip"}"`,
      "Cache-Control": "private, no-store",
    } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Export impossible." }, { status: 400 }); }
}
