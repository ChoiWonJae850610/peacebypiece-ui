const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "3600",
};

const TEXT_ENCODER = new TextEncoder();
const WORKER_VERSION = "0.13.64";
const ATTACHMENT_KEY_PATTERN = /^workorders\/[^/]+\/(design|attachments|memos)\/[^/]+$/i;
const SCOPED_THUMBNAIL_KEY_PATTERN = /^workorders\/[^/]+\/thumbnails\/(design|attachments|memos)\/[^/]+\.webp$/i;
const LEGACY_THUMBNAIL_KEY_PATTERN = /^workorders\/[^/]+\/thumbnails\/[^/]+\.webp$/i;
const COMPANY_ONBOARDING_KEY_PATTERN = /^companies\/[^/]+\/onboarding\/(logo|business-license)\/[^/]+\.(jpg|png|webp|pdf)$/i;

const ATTACHMENT_POLICY = {
  maxFileSizeBytes: 10 * 1024 * 1024,
  allowedMimeTypes: {
    design: ["image/jpeg", "image/png", "image/webp"],
    attachment: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    memos: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  },
};

const COMPANY_ONBOARDING_POLICY = {
  maxFileSizeBytes: {
    logo: 5 * 1024 * 1024,
    businessLicense: 10 * 1024 * 1024,
  },
  allowedMimeTypes: {
    logo: ["image/jpeg", "image/png", "image/webp"],
    businessLicense: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  },
};

function normalizeStorageKey(value) {
  return String(value || "").replace(/^\/+/, "").trim();
}

function getScopeFromKey(key) {
  const normalized = normalizeStorageKey(key);
  if (normalized.includes("/design/") || normalized.includes("/thumbnails/design/")) return "design";
  if (normalized.includes("/memos/") || normalized.includes("/thumbnails/memos/")) return "memos";
  return "attachment";
}

function getCompanyOnboardingFileTypeFromKey(key) {
  const normalized = normalizeStorageKey(key);
  if (normalized.includes("/onboarding/logo/")) return "logo";
  if (normalized.includes("/onboarding/business-license/")) return "businessLicense";
  return null;
}

function isAllowedWorkerFile({ key, contentType, size }) {
  const normalizedContentType = String(contentType || "").toLowerCase();
  const companyOnboardingFileType = getCompanyOnboardingFileTypeFromKey(key);

  if (companyOnboardingFileType) {
    const allowedTypes = COMPANY_ONBOARDING_POLICY.allowedMimeTypes[companyOnboardingFileType] || [];
    const maxFileSizeBytes = COMPANY_ONBOARDING_POLICY.maxFileSizeBytes[companyOnboardingFileType] || 0;
    return allowedTypes.includes(normalizedContentType) && size <= maxFileSizeBytes;
  }

  const scope = getScopeFromKey(key);
  const allowedTypes = ATTACHMENT_POLICY.allowedMimeTypes[scope] || ATTACHMENT_POLICY.allowedMimeTypes.attachment;
  return allowedTypes.includes(normalizedContentType) && size <= ATTACHMENT_POLICY.maxFileSizeBytes;
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-PeaceByPiece-Worker-Version": WORKER_VERSION,
      ...CORS_HEADERS,
      ...(init.headers || {}),
    },
  });
}

function isSafeStorageKey(key) {
  const normalized = normalizeStorageKey(key);
  return (
    ATTACHMENT_KEY_PATTERN.test(normalized) ||
    SCOPED_THUMBNAIL_KEY_PATTERN.test(normalized) ||
    LEGACY_THUMBNAIL_KEY_PATTERN.test(normalized) ||
    COMPANY_ONBOARDING_KEY_PATTERN.test(normalized)
  ) && !normalized.includes("..") && !normalized.startsWith("/");
}

function readSecret(env) {
  return env.R2_WORKER_UPLOAD_SECRET || env.WORKER_UPLOAD_SECRET || env.WORKER_SECRET || "";
}

function readExpires(url) {
  const value = Number(url.searchParams.get("expires") || "0");
  return Number.isFinite(value) ? value : 0;
}

function readContentType(url) {
  return url.searchParams.get("contentType") || "application/octet-stream";
}

function getEffectiveMethod(request, url) {
  const action = (url.searchParams.get("action") || "").toLowerCase();
  if (request.method === "POST" && action === "delete") return "DELETE";
  return request.method;
}

function sanitizeDownloadFileName(value) {
  const normalized = typeof value === "string" ? value.trim() : "";
  const safeName = normalized.replace(/[\\/\r\n\0"]/g, "_");
  return safeName || "attachment";
}

function createContentDisposition(fileName) {
  const fallback = fileName.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

function createSignaturePayload(method, key, contentType, expires) {
  if (method === "PUT") return ["PUT", key, contentType || "application/octet-stream", String(expires)].join("\n");
  if (method === "DELETE") return ["DELETE", key, String(expires)].join("\n");
  return ["GET", key, String(expires)].join("\n");
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;

  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

async function createExpectedSignature({ secret, method, key, contentType, expires }) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    TEXT_ENCODER.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const payload = createSignaturePayload(method, key, contentType, expires);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, TEXT_ENCODER.encode(payload));
  return toHex(signature);
}

async function verifyRequest({ env, url, method, key, contentType }) {
  const secret = readSecret(env);
  if (!secret) return { ok: false, status: 503, error: "WORKER_SECRET_NOT_CONFIGURED" };

  const expires = readExpires(url);
  const signature = url.searchParams.get("signature") || "";

  if (!expires || Math.floor(Date.now() / 1000) > expires) {
    return { ok: false, status: 401, error: "WORKER_URL_EXPIRED" };
  }

  if (!signature) return { ok: false, status: 401, error: "WORKER_SIGNATURE_REQUIRED" };

  const expected = await createExpectedSignature({ secret, method, key, contentType, expires });
  if (!safeEqual(signature, expected)) {
    return { ok: false, status: 401, error: "WORKER_SIGNATURE_INVALID" };
  }

  return { ok: true };
}

function createFileHeaders(object, url) {
  const headers = new Headers(CORS_HEADERS);
  headers.set("X-PeaceByPiece-Worker-Version", WORKER_VERSION);
  const contentType = object.httpMetadata?.contentType || object.httpMetadata?.contentTypeHeader || "application/octet-stream";

  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "private, max-age=300");
  if (object.size) headers.set("Content-Length", String(object.size));
  if (object.etag) headers.set("ETag", object.etag);

  if (url.searchParams.get("download") === "1") {
    const fileName = sanitizeDownloadFileName(url.searchParams.get("name"));
    headers.set("Content-Disposition", createContentDisposition(fileName));
    headers.set("Cache-Control", "no-store");
  }

  return headers;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const effectiveMethod = getEffectiveMethod(request, url);

    if (effectiveMethod !== "PUT" && effectiveMethod !== "GET" && effectiveMethod !== "DELETE") {
      return json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }

    const bucket = env.R2_BUCKET || env.BUCKET;
    if (!bucket) {
      return json({ error: "WORKER_BUCKET_NOT_CONFIGURED" }, { status: 503 });
    }

    const key = normalizeStorageKey(url.searchParams.get("key") || "");
    const contentType = readContentType(url);

    if (!key || !isSafeStorageKey(key)) {
      return json({ error: "INVALID_WORKER_FILE_REQUEST" }, { status: 400 });
    }

    const verification = await verifyRequest({ env, url, method: effectiveMethod, key, contentType });
    if (!verification.ok) {
      return json({ error: verification.error }, { status: verification.status });
    }

    if (effectiveMethod === "PUT") {
      const contentLength = Number(request.headers.get("Content-Length") || "0");
      if (!isAllowedWorkerFile({ key, contentType, size: contentLength })) {
        return json({ error: "WORKER_FILE_POLICY_REJECTED" }, { status: 400 });
      }

      await bucket.put(key, request.body, { httpMetadata: { contentType } });
      return json({ ok: true, key, method: "PUT" });
    }

    if (effectiveMethod === "DELETE") {
      await bucket.delete(key);
      return json({ ok: true, key, method: "DELETE" });
    }

    const object = await bucket.get(key);
    if (!object) {
      return json({ error: "WORKER_FILE_NOT_FOUND" }, { status: 404 });
    }

    return new Response(object.body, { status: 200, headers: createFileHeaders(object, url) });
  },
};
