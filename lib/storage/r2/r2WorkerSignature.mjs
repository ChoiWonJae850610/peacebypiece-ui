import { createHmac } from "node:crypto";

export function normalizeWorkerBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

export function createR2WorkerSignature(input) {
  const method = String(input.method || "GET").toUpperCase();
  const key = String(input.key || "");
  const expiresAt = Number(input.expiresAt || 0);
  const secret = String(input.secret || "");
  const contentType = String(input.contentType || "application/octet-stream");
  const payload = method === "PUT"
    ? ["PUT", key, contentType, String(expiresAt)].join("\n")
    : [method, key, String(expiresAt)].join("\n");

  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createR2WorkerSignedUrl(input) {
  const method = String(input.method || "GET").toUpperCase();
  const uploadUrl = normalizeWorkerBaseUrl(input.uploadUrl);
  const key = String(input.key || "");
  const expiresAt = Number(input.expiresAt || 0);
  const contentType = String(input.contentType || "application/octet-stream");
  const signature = createR2WorkerSignature({
    secret: input.secret,
    method,
    key,
    contentType,
    expiresAt,
  });
  const url = new URL(uploadUrl);
  url.searchParams.set("key", key);
  url.searchParams.set("expires", String(expiresAt));
  url.searchParams.set("signature", signature);
  if (method === "PUT") url.searchParams.set("contentType", contentType);
  return url.toString();
}
