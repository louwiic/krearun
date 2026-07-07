import { getObjectFromR2 } from "@/lib/r2";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/r2/[...key]">
) {
  const { key } = await context.params;
  const objectKey = key.join("/");

  if (!objectKey.startsWith("products/")) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const object = await getObjectFromR2(objectKey);
    const headers = new Headers({
      "Content-Type": object.contentType,
      "Cache-Control": object.cacheControl,
    });

    if (object.etag) headers.set("ETag", object.etag);
    if (object.lastModified) {
      headers.set("Last-Modified", object.lastModified.toUTCString());
    }

    return new Response(object.body, { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

