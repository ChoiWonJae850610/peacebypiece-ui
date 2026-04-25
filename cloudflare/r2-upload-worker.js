const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "3600",
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
      ...(init.headers || {}),
    },
  });
}
function isSafeStorageKey(key) {
  return /^workorders\/[^/]+\/(design|attachments|memos)\/[^/]+$/i.test(key) && !key.includes("..") && !key.startsWith("/");
}

function createFileHeaders(object) {
  const headers = new Headers(CORS_HEADERS);
  const contentType = object.httpMetadata?.contentType || object.httpMetadata?.contentTypeHeader || "application/octet-stream";
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "private, max-age=300");
  if (object.size) headers.set("Content-Length", String(object.size));
  if (object.etag) headers.set("ETag", object.etag);
  return headers;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "PUT" && request.method !== "GET") {
      return json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }

    const bucket = env.R2_BUCKET || env.BUCKET;
    if (!bucket) {
      return json({ error: "WORKER_BUCKET_NOT_CONFIGURED" }, { status: 503 });
    }

    const url = new URL(request.url);
    const key = url.searchParams.get("key") || "";
    const contentType = url.searchParams.get("contentType") || "application/octet-stream";

    if (!key || !isSafeStorageKey(key)) {
      return json({ error: "INVALID_WORKER_FILE_REQUEST" }, { status: 400 });
    }

    if (request.method === "PUT") {
      await bucket.put(key, request.body, {
        httpMetadata: { contentType },
      });

      return json({ ok: true, key });
    }

    const object = await bucket.get(key);
    if (!object) {
      return json({ error: "WORKER_FILE_NOT_FOUND" }, { status: 404 });
    }

    return new Response(object.body, { status: 200, headers: createFileHeaders(object) });
  },
};
