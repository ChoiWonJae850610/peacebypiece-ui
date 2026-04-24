const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PUT, OPTIONS",
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

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function verifySignature({ secret, key, contentType, expires, signature }) {
  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || Math.floor(Date.now() / 1000) > expiresAt) {
    return false;
  }

  const payload = [key, contentType, String(expiresAt)].join("\n");
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  return crypto.subtle.verify("HMAC", cryptoKey, hexToBytes(signature), new TextEncoder().encode(payload));
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "PUT") {
      return json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }

    if (!env.R2_BUCKET || !env.R2_WORKER_UPLOAD_SECRET) {
      return json({ error: "WORKER_NOT_CONFIGURED" }, { status: 503 });
    }

    const url = new URL(request.url);
    const key = url.searchParams.get("key") || "";
    const contentType = url.searchParams.get("contentType") || "application/octet-stream";
    const expires = url.searchParams.get("expires") || "";
    const signature = url.searchParams.get("signature") || "";

    if (!key || !signature) {
      return json({ error: "INVALID_UPLOAD_REQUEST" }, { status: 400 });
    }

    const valid = await verifySignature({ secret: env.R2_WORKER_UPLOAD_SECRET, key, contentType, expires, signature });
    if (!valid) {
      return json({ error: "INVALID_UPLOAD_SIGNATURE" }, { status: 403 });
    }

    await env.R2_BUCKET.put(key, request.body, {
      httpMetadata: { contentType },
    });

    return json({ ok: true, key });
  },
};
