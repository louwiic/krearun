import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const R2_ENDPOINT =
  process.env.R2_ENDPOINT ??
  (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "");
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
const R2_BUCKET = process.env.R2_BUCKET ?? "";
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

let client: S3Client | null = null;

function requireR2Config() {
  const missing = [
    ["R2_ENDPOINT ou R2_ACCOUNT_ID", R2_ENDPOINT],
    ["R2_ACCESS_KEY_ID", R2_ACCESS_KEY_ID],
    ["R2_SECRET_ACCESS_KEY", R2_SECRET_ACCESS_KEY],
    ["R2_BUCKET", R2_BUCKET],
    ["R2_PUBLIC_URL", R2_PUBLIC_URL],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Configuration R2 manquante : ${missing.join(", ")}`);
  }
}

function getClient() {
  requireR2Config();
  client ??= new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

function extensionFromContentType(contentType: string) {
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/svg+xml") return "svg";
  if (contentType === "image/gif") return "gif";
  return "bin";
}

function cleanFilename(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function uploadProductImageToR2(productId: string, file: File) {
  const contentType = file.type || "application/octet-stream";
  const baseName = cleanFilename(file.name) || "image";
  const key = `products/${productId}/${Date.now()}-${crypto.randomUUID()}-${baseName}.${extensionFromContentType(
    contentType
  )}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

export async function getObjectFromR2(key: string) {
  const object = await getClient().send(
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
  const body = object.Body as
    | { transformToWebStream: () => ReadableStream<Uint8Array> }
    | undefined;

  if (!body) {
    throw new Error(`Objet R2 introuvable : ${key}`);
  }

  return {
    body: body.transformToWebStream(),
    contentType: object.ContentType ?? "application/octet-stream",
    cacheControl: object.CacheControl ?? "public, max-age=31536000, immutable",
    etag: object.ETag,
    lastModified: object.LastModified,
  };
}

