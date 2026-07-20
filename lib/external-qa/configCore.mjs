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

export function validateTailscaleServeOrigin(rawOrigin, options = {}) {
  const origin = validateQaOrigin(rawOrigin, { externalQa: true, production: options.production });
  const hostname = new URL(origin).hostname.toLowerCase();
  if (!hostname.endsWith(".ts.net") || hostname.endsWith(".trycloudflare.com")) {
    throw new ExternalQaConfigError("TAILSCALE_SERVE_ORIGIN_INVALID");
  }
  if (options.production) throw new ExternalQaConfigError("PRODUCTION_DEVELOPER_ORIGIN_FORBIDDEN");
  return origin;
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
  const developerAutoConnectEnabled = normalized(env.WAFL_TAILSCALE_DEVELOPER_AUTO_CONNECT_ENABLED) === "true";
  let tailscaleServe = null;
  if (developerAutoConnectEnabled) {
    const serveOrigin = validateTailscaleServeOrigin(env.WAFL_TAILSCALE_SERVE_ORIGIN, { production });
    const serveHostname = new URL(serveOrigin).hostname.toLowerCase();
    const serveHostAllowlist = parseHostAllowlist(env.WAFL_TAILSCALE_SERVE_HOST_ALLOWLIST);
    if (serveHostAllowlist.size !== 1 || !serveHostAllowlist.has(serveHostname)) {
      throw new ExternalQaConfigError("TAILSCALE_SERVE_HOST_NOT_EXACT");
    }
    const developerLoginSha256 = String(env.WAFL_TAILSCALE_DEVELOPER_LOGIN_SHA256 ?? "").trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(developerLoginSha256)) {
      throw new ExternalQaConfigError("TAILSCALE_DEVELOPER_LOGIN_HASH_INVALID");
    }
    const developerSystemAdminEmailSha256 = String(env.WAFL_DEVELOPER_SYSTEM_ADMIN_EMAIL_SHA256 ?? "").trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(developerSystemAdminEmailSha256)) {
      throw new ExternalQaConfigError("WAFL_DEVELOPER_SYSTEM_ADMIN_HASH_INVALID");
    }
    tailscaleServe = {
      origin: serveOrigin,
      hostname: serveHostname,
      hostAllowlist: serveHostAllowlist,
      developerLoginSha256,
      developerSystemAdminEmailSha256,
    };
  }
  return { enabled: true, origin, hostname, hostAllowlist, production, runToken, developerAutoConnectEnabled, tailscaleServe };
}

export function readMobileQaConfig(env = process.env, options = {}) {
  const externalQa = options.requireExternalQa || normalized(env.EXPO_PUBLIC_WAFL_EXTERNAL_QA) === "true";
  if (options.requireExternalQa && normalized(env.EXPO_PUBLIC_WAFL_EXTERNAL_QA) !== "true") {
    throw new ExternalQaConfigError("MOBILE_EXTERNAL_QA_FLAG_REQUIRED");
  }
  const rawWebOrigin = String(env.EXPO_PUBLIC_WAFL_WEB_BASE_URL ?? "").trim();
  if (!rawWebOrigin) {
    if (externalQa) throw new ExternalQaConfigError("MOBILE_WEB_BASE_URL_REQUIRED");
    return { externalQa: false, origin: null, apiOrigin: null, webOrigin: null, developerAutoConnect: false };
  }
  const webOrigin = validateQaOrigin(rawWebOrigin, {
    externalQa,
    production: isProductionEnvironment(env),
  });
  const developerAutoConnect = normalized(env.EXPO_PUBLIC_WAFL_DEVELOPER_AUTO_CONNECT) === "true";
  const rawApiOrigin = String(env.EXPO_PUBLIC_WAFL_API_BASE_URL ?? "").trim();
  let apiOrigin = webOrigin;
  if (developerAutoConnect) {
    if (!rawApiOrigin) throw new ExternalQaConfigError("MOBILE_API_BASE_URL_REQUIRED");
    apiOrigin = validateTailscaleServeOrigin(rawApiOrigin, { production: isProductionEnvironment(env) });
  } else if (rawApiOrigin) {
    apiOrigin = validateQaOrigin(rawApiOrigin, { externalQa, production: isProductionEnvironment(env) });
  }
  return { externalQa, origin: webOrigin, apiOrigin, webOrigin, developerAutoConnect };
}

export function isTailscaleServePathAllowed(pathname, method = "GET", env = process.env) {
  const verb = String(method).toUpperCase();
  if (pathname === "/api/dev/mobile-connect/auto") return verb === "POST";
  if (pathname === "/api/dev/mobile-connect/exchange") return verb === "POST";
  if (pathname === "/api/dev/mobile-connect/disconnect") return verb === "POST";
  if (pathname === "/api/auth/me") return verb === "GET";
  if (pathname === "/api/v2/work-orders") return verb === "GET";
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/materials$/i.test(pathname)) {
    if (verb === "GET") return true;
    return verb === "POST"
      && normalized(env.WAFL_EXTERNAL_QA_ALPHA50_MATERIAL_DRAFT_MUTATION_ENABLED) === "true"
      && normalized(env.WAFL_V2_COMMAND_API_ENABLED) === "1"
      && String(env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "").trim() === "2.0.0-alpha.50-dev-test-mobile-material-draft-runtime"
      && !isProductionEnvironment(env);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/materials\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname)) {
    return verb === "PATCH"
      && normalized(env.WAFL_EXTERNAL_QA_ALPHA50_MATERIAL_DRAFT_MUTATION_ENABLED) === "true"
      && normalized(env.WAFL_V2_COMMAND_API_ENABLED) === "1"
      && String(env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "").trim() === "2.0.0-alpha.50-dev-test-mobile-material-draft-runtime"
      && !isProductionEnvironment(env);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname)) {
    if (verb === "GET") return true;
    return verb === "PATCH"
      && normalized(env.WAFL_EXTERNAL_QA_ALPHA46_BASIC_INFO_MUTATION_ENABLED) === "true"
      && normalized(env.WAFL_V2_COMMAND_API_ENABLED) === "1"
      && String(env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "").trim() === "2.0.0-alpha.46-dev-test-mobile-basic-info-runtime"
      && !isProductionEnvironment(env);
  }
  return false;
}

export function isExternalQaPathAllowed(pathname, method = "GET", env = process.env) {
  const verb = String(method).toUpperCase();
  if (/^\/_next(?:\/|$)/.test(pathname)) return verb === "GET" || verb === "HEAD";
  if (pathname === "/favicon.ico") return verb === "GET" || verb === "HEAD";
  if (pathname === "/v") return verb === "GET" || verb === "HEAD";
  if (pathname === "/api/dev/mobile-connect/exchange") return verb === "POST";
  if (pathname === "/api/dev/mobile-connect/disconnect") return verb === "POST";
  if (pathname === "/api/auth/me") return verb === "GET";
  if (pathname === "/api/v2/work-orders") return verb === "GET";
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname)) {
    if (verb === "GET") return true;
    return verb === "PATCH"
      && normalized(env.WAFL_EXTERNAL_QA_ALPHA46_BASIC_INFO_MUTATION_ENABLED) === "true"
      && normalized(env.WAFL_V2_COMMAND_API_ENABLED) === "1"
      && String(env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "").trim() === "2.0.0-alpha.46-dev-test-mobile-basic-info-runtime"
      && !isProductionEnvironment(env);
  }
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
