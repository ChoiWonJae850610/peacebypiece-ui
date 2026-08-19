import {
  isMakerQaCapabilityEnabled,
  MAKER_QA_CAPABILITY,
} from "./makerQaCapabilities.mjs";

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

function alpha64MakerDocumentR0Enabled(env) {
  return isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.DOCUMENT_R0);
}

function makerAuthoringAssetMutationEnabled(env) {
  return isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.ASSET_AUTHORING);
}

export function isTailscaleServePathAllowed(pathname, method = "GET", env = process.env) {
  const verb = String(method).toUpperCase();
  if (pathname === "/v") return verb === "GET" || verb === "HEAD";
  if (pathname === "/api/v2/address-search") return verb === "GET" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.ADDRESS_SEARCH);
  if (pathname === "/api/public/document-viewer/session") return verb === "POST" && alpha64MakerDocumentR0Enabled(env);
  if (/^\/api\/public\/document-viewer\/(file|download|attachment)$/.test(pathname)) return (verb === "GET" || verb === "HEAD") && alpha64MakerDocumentR0Enabled(env);
  if (pathname === "/api/dev/mobile-connect/auto") return verb === "POST";
  if (pathname === "/api/dev/mobile-connect/exchange") return verb === "POST";
  if (pathname === "/api/dev/mobile-connect/disconnect") return verb === "POST";
  if (pathname === "/api/auth/me") return verb === "GET";
  if (pathname === "/api/v2/address-search") return verb === "GET" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.ADDRESS_SEARCH);
  if (pathname === "/api/v2/work-orders") return verb === "GET" || (verb === "POST" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.WORK_ORDER_CREATE));
  if (/^\/api\/v2\/work-orders\/[0-9a-f-]{36}\/documents$/i.test(pathname)) return verb === "GET";
  if (/^\/api\/v2\/work-orders\/[0-9a-f-]{36}\/documents\/generate$/i.test(pathname)) return verb === "POST" && alpha64MakerDocumentR0Enabled(env);
  if (/^\/api\/v2\/work-orders\/[0-9a-f-]{36}\/revisions\/issue$/i.test(pathname)) return verb === "POST" && alpha64MakerDocumentR0Enabled(env);
  if (/^\/api\/v2\/work-orders\/[0-9a-f-]{36}\/attachments\/[0-9a-f-]{36}\/output-include$/i.test(pathname)) return verb === "PATCH" && alpha64MakerDocumentR0Enabled(env);
  if (/^\/api\/v2\/work-orders\/documents\/[0-9a-f-]{36}\/access-tokens$/i.test(pathname)) return (verb === "GET" || verb === "POST") && alpha64MakerDocumentR0Enabled(env);
  if (/^\/api\/v2\/work-orders\/documents\/[0-9a-f-]{36}\/access-tokens\/[0-9a-f-]{36}\/revoke$/i.test(pathname)) return verb === "POST" && alpha64MakerDocumentR0Enabled(env);
  if (/^\/api\/v2\/work-orders\/documents\/[0-9a-f-]{36}\/file$/i.test(pathname)) return verb === "GET" || verb === "HEAD";
  if (pathname === "/api/v2/work-orders/images/file") return verb === "GET";
  if (pathname === "/api/v2/work-orders/files/upload") {
    return verb === "PUT" && makerAuthoringAssetMutationEnabled(env);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/assets$/i.test(pathname)) {
    return verb === "GET";
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(size-color|size-spec)$/i.test(pathname)) {
    return verb === "GET";
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/processes$/i.test(pathname)) {
    return verb === "GET" || (verb === "POST" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.PRODUCTION_AUTHORING));
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/processes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname)) return (verb === "PATCH" || verb === "DELETE") && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.PRODUCTION_AUTHORING);
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/processes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/order-(request|cancel|complete)$/i.test(pathname)) return verb === "POST" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.PRODUCTION_AUTHORING);
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/production-options$/i.test(pathname)) return verb === "GET";
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/material-partners$/i.test(pathname)) {
    return verb === "GET";
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/size-spec\/commands$/i.test(pathname)) {
    return verb === "POST" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.MEASUREMENT);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/size-spec\/templates$/i.test(pathname)) {
    return verb === "GET";
  }
  if (/^\/api\/v2\/size-spec-templates\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname)) {
    return verb === "PATCH" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.COMPANY_TEMPLATE);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/size-color\/(sizes|colors)$/i.test(pathname)) {
    return verb === "POST" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.SIZE_COLOR_STRUCTURE);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/size-color\/selection-batch$/i.test(pathname)) {
    return verb === "POST" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.SIZE_COLOR_BATCH);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/size-color\/(sizes|colors)\/reorder$/i.test(pathname)) {
    return verb === "POST" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.SIZE_COLOR_STRUCTURE);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/size-color\/(sizes|colors)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname)) {
    if (verb === "DELETE") return isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.SIZE_COLOR_HARD_DELETE);
    return verb === "PATCH" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.SIZE_COLOR_STRUCTURE);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/size-color\/quantities\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname)) {
    return verb === "PATCH" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.SIZE_COLOR_STRUCTURE);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/size-color\/options$/i.test(pathname)) {
    return verb === "GET" || (verb === "POST" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.CUSTOM_OPTIONS));
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/size-color\/options\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname)) {
    return (verb === "PATCH" || verb === "DELETE") && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.CUSTOM_OPTIONS);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/images\/upload(?:\/complete)?$/i.test(pathname)) {
    return verb === "POST" && makerAuthoringAssetMutationEnabled(env);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(representative|delete)$/i.test(pathname)) {
    return verb === "POST" && makerAuthoringAssetMutationEnabled(env);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/attachments\/upload(?:\/complete)?$/i.test(pathname)) {
    return verb === "POST" && makerAuthoringAssetMutationEnabled(env);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/attachments\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/delete$/i.test(pathname)) {
    return verb === "POST" && makerAuthoringAssetMutationEnabled(env);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/materials$/i.test(pathname)) {
    if (verb === "GET") return true;
    return verb === "POST" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.MATERIAL_DRAFT);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/materials\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname)) {
    if (verb === "DELETE") return isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.MATERIAL_HARD_DELETE);
    return verb === "PATCH" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.MATERIAL_DRAFT);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/materials\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(archive|restore)$/i.test(pathname)) {
    return verb === "POST" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.LEGACY_MATERIAL_ARCHIVE);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/materials\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/order-(request|cancel|complete)$/i.test(pathname)) {
    return verb === "POST" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.MATERIAL_ORDER);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname)) {
    if (verb === "GET") return true;
    return verb === "PATCH" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.BASIC_INFO);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/attachments\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/preview$/i.test(pathname)) {
    return verb === "POST";
  }
  if (pathname === "/api/v2/work-orders/attachments/preview") {
    return verb === "GET";
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
  if (pathname === "/api/v2/address-search") return verb === "GET" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.ADDRESS_SEARCH);
  if (pathname === "/api/v2/work-orders") return verb === "GET" || (verb === "POST" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.WORK_ORDER_CREATE));
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname)) {
    if (verb === "GET") return true;
    return verb === "PATCH" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.BASIC_INFO);
  }
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/processes$/i.test(pathname)) return verb === "GET" || (verb === "POST" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.PRODUCTION_AUTHORING));
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/processes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname)) return (verb === "PATCH" || verb === "DELETE") && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.PRODUCTION_AUTHORING);
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/processes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/order-(request|cancel|complete)$/i.test(pathname)) return verb === "POST" && isMakerQaCapabilityEnabled(env, MAKER_QA_CAPABILITY.PRODUCTION_AUTHORING);
  if (/^\/api\/v2\/work-orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/production-options$/i.test(pathname)) return verb === "GET";
  if (pathname === "/api/public/document-viewer/session") return verb === "POST";
  if (/^\/api\/public\/document-viewer\/(file|download|attachment)$/.test(pathname)) return verb === "GET" || verb === "HEAD";
  if (/^\/workspace\/documents\/[^/]+\/preview$/.test(pathname)) return verb === "GET" || verb === "HEAD";
  if (/^\/workspace\/workorders\/[^/]+\/revisions\/[^/]+\/preview$/.test(pathname)) return verb === "GET" || verb === "HEAD";
  if (/^\/api\/v2\/work-orders\/documents\/[^/]+\/preview-target$/.test(pathname)) return verb === "GET" || verb === "HEAD";
  if (/^\/api\/v2\/work-orders\/[^/]+\/revisions\/[^/]+\/preview$/.test(pathname)) return verb === "GET" || verb === "HEAD";
  if (/^\/api\/v2\/work-orders\/[^/]+\/documents$/.test(pathname)) return verb === "GET" || verb === "HEAD";
  if (/^\/api\/v2\/work-orders\/[^/]+\/documents\/generate$/.test(pathname)) return verb === "POST" && alpha64MakerDocumentR0Enabled(env);
  if (/^\/api\/v2\/work-orders\/[^/]+\/revisions\/issue$/.test(pathname)) return verb === "POST" && alpha64MakerDocumentR0Enabled(env);
  if (/^\/api\/v2\/work-orders\/[^/]+\/attachments\/[^/]+\/output-include$/.test(pathname)) return verb === "PATCH" && alpha64MakerDocumentR0Enabled(env);
  if (/^\/api\/v2\/work-orders\/documents\/[^/]+\/access-tokens$/.test(pathname)) return (verb === "GET" || verb === "POST") && alpha64MakerDocumentR0Enabled(env);
  if (/^\/api\/v2\/work-orders\/documents\/[^/]+\/access-tokens\/[^/]+\/revoke$/.test(pathname)) return verb === "POST" && alpha64MakerDocumentR0Enabled(env);
  if (/^\/api\/v2\/work-orders\/documents\/[^/]+\/file$/.test(pathname)) return verb === "GET" || verb === "HEAD";
  return false;
}
