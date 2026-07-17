export const TEMPORARY_EXTERNAL_QA_ONLY = "TEMPORARY_EXTERNAL_QA_ONLY";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function assertPdfViewerOriginPolicy(input) {
  const url = new URL(input.origin);
  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) throw new Error("PDF_VIEWER_ORIGIN_INVALID");
  const isLocal = LOCAL_HOSTS.has(url.hostname.toLowerCase());
  const isQuickTunnel = url.hostname.toLowerCase().endsWith(".trycloudflare.com");

  if (input.persistence === "temporary-qa") {
    if (input.marker !== TEMPORARY_EXTERNAL_QA_ONLY) throw new Error("TEMPORARY_QA_MARKER_REQUIRED");
    if (input.runtime === "production" || input.runtime === "staging") throw new Error("TEMPORARY_QA_RUNTIME_FORBIDDEN");
    if (url.protocol !== "https:" || isLocal) throw new Error("TEMPORARY_QA_HTTPS_REQUIRED");
    return url.origin;
  }

  if (isQuickTunnel) throw new Error("PERMANENT_PDF_TEMPORARY_ORIGIN_FORBIDDEN");
  if (isLocal) {
    if (!input.developmentOnly || !new Set(["development", "test"]).has(input.runtime)) throw new Error("PERMANENT_PDF_LOCALHOST_FORBIDDEN");
    return url.origin;
  }
  if (url.protocol !== "https:") throw new Error("PERMANENT_PDF_HTTPS_REQUIRED");
  return url.origin;
}
