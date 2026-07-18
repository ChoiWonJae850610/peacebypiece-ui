const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const SAFE_RUN_TOKEN = /^[A-Za-z0-9_-]{20,128}$/;

export class ExternalQaConfigError extends Error {
  constructor(code) {
    super(code);
    this.name = "ExternalQaConfigError";
    this.code = code;
  }
}

function normalized(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function isProductionEnvironment(env = process.env) {
  const explicit = normalized(env.WAFL_SERVER_RUNTIME_MODE);
  if (explicit) return explicit === "production";
  const vercel = normalized(env.VERCEL_ENV);
  if (vercel) return vercel === "production";
  return normalized(env.NODE_ENV) === "production";
}

export function isLocalHost(hostname) {
  return LOCAL_HOSTS.has(normalized(hostname));
}

export function normalizeRequestHost(rawHost) {
  const candidate = String(rawHost ?? "").trim();
  if (!candidate || candidate.includes(",") || /[\s/@\\]/.test(candidate)) return null;
  try {
    return new URL(`http://${candidate}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function validateQaOrigin(rawOrigin, options = {}) {
  const value = String(rawOrigin ?? "").trim();
  if (!value) throw new ExternalQaConfigError("EXTERNAL_QA_ORIGIN_REQUIRED");
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new ExternalQaConfigError("EXTERNAL_QA_ORIGIN_INVALID");
  }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new ExternalQaConfigError("EXTERNAL_QA_ORIGIN_MUST_BE_ORIGIN_ONLY");
  }
  if (options.externalQa && url.protocol !== "https:") {
    throw new ExternalQaConfigError("EXTERNAL_QA_HTTPS_REQUIRED");
  }
  if (options.externalQa && isLocalHost(url.hostname)) {
    throw new ExternalQaConfigError("EXTERNAL_QA_LOCALHOST_FORBIDDEN");
  }
  if (options.production && (isLocalHost(url.hostname) || url.hostname.endsWith(".trycloudflare.com"))) {
    throw new ExternalQaConfigError("PRODUCTION_TEMPORARY_ORIGIN_FORBIDDEN");
  }
  return url.origin;
}

function parseHostAllowlist(rawValue) {
  const hosts = String(rawValue ?? "")
    .split(",")
    .map((value) => normalizeRequestHost(value))
    .filter(Boolean);
  if (hosts.length === 0) throw new ExternalQaConfigError("EXTERNAL_QA_HOST_ALLOWLIST_REQUIRED");
  return new Set(hosts);
}

export function readExternalQaServerConfig(env = process.env) {
  if (normalized(env.WAFL_EXTERNAL_QA_ENABLED) !== "true") return { enabled: false };
  const production = isProductionEnvironment(env);
  const origin = validateQaOrigin(env.WAFL_EXTERNAL_QA_ORIGIN, { externalQa: true, production });
  const hostname = new URL(origin).hostname.toLowerCase();
  const hostAllowlist = parseHostAllowlist(env.WAFL_EXTERNAL_QA_HOST_ALLOWLIST);
  if (!hostAllowlist.has(hostname)) throw new ExternalQaConfigError("EXTERNAL_QA_ORIGIN_NOT_ALLOWLISTED");
  const runToken = String(env.WAFL_EXTERNAL_QA_RUN_TOKEN ?? "").trim();
  if (!SAFE_RUN_TOKEN.test(runToken)) throw new ExternalQaConfigError("EXTERNAL_QA_RUN_TOKEN_INVALID");
  return { enabled: true, origin, hostname, hostAllowlist, production, runToken };
}

export function readMobileQaConfig(env = process.env, options = {}) {
  const externalQa = options.requireExternalQa || normalized(env.EXPO_PUBLIC_WAFL_EXTERNAL_QA) === "true";
  if (options.requireExternalQa && normalized(env.EXPO_PUBLIC_WAFL_EXTERNAL_QA) !== "true") {
    throw new ExternalQaConfigError("MOBILE_EXTERNAL_QA_FLAG_REQUIRED");
  }
  const rawOrigin = String(env.EXPO_PUBLIC_WAFL_WEB_BASE_URL ?? "").trim();
  if (!rawOrigin) {
    if (externalQa) throw new ExternalQaConfigError("MOBILE_WEB_BASE_URL_REQUIRED");
    return { externalQa: false, origin: null };
  }
  const origin = validateQaOrigin(rawOrigin, {
    externalQa,
    production: isProductionEnvironment(env),
  });
  return { externalQa, origin };
}

export function isExternalQaPathAllowed(pathname, method = "GET") {
  const verb = String(method).toUpperCase();
  if (/^\/_next(?:\/|$)/.test(pathname)) return verb === "GET" || verb === "HEAD";
  if (pathname === "/favicon.ico") return verb === "GET" || verb === "HEAD";
  if (pathname === "/v") return verb === "GET" || verb === "HEAD";
  if (pathname === "/api/dev/mobile-connect/exchange") return verb === "POST";
  if (pathname === "/api/dev/mobile-connect/disconnect") return verb === "POST";
  if (pathname === "/api/auth/me") return verb === "GET";
  if (pathname === "/api/v2/work-orders") return verb === "GET";
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname)) return verb === "GET";
  if (pathname === "/api/public/document-viewer/session") return verb === "POST";
  if (/^\/api\/public\/document-viewer\/(file|download)$/.test(pathname)) return verb === "GET" || verb === "HEAD";
  if (/^\/workspace\/documents\/[^/]+\/preview$/.test(pathname)) return verb === "GET" || verb === "HEAD";
  if (/^\/workspace\/workorders\/[^/]+\/revisions\/[^/]+\/preview$/.test(pathname)) return verb === "GET" || verb === "HEAD";
  if (/^\/api\/v2\/work-orders\/documents\/[^/]+\/preview-target$/.test(pathname)) return verb === "GET" || verb === "HEAD";
  if (/^\/api\/v2\/work-orders\/[^/]+\/revisions\/[^/]+\/preview$/.test(pathname)) return verb === "GET" || verb === "HEAD";
  if (/^\/api\/v2\/work-orders\/[^/]+\/documents$/.test(pathname)) return verb === "GET" || verb === "HEAD";
  if (/^\/api\/v2\/work-orders\/documents\/[^/]+\/file$/.test(pathname)) return verb === "GET" || verb === "HEAD";
  return false;
}
