// Wrangler 배포용 PDF Generator Worker입니다. Cloudflare Dashboard 코드 편집기에 단일 파일로 붙여넣지 말고, 이 폴더에서 npm install 후 npx wrangler deploy로 배포하세요.
import puppeteer from "@cloudflare/puppeteer";

const WORKER_VERSION = "0.16.1.1";
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "3600",
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Waflow-Pdf-Generator-Version": WORKER_VERSION,
      ...CORS_HEADERS,
      ...(init.headers || {}),
    },
  });
}

function readBearerToken(request) {
  const value = request.headers.get("Authorization") || "";
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function isAuthorized(request, env) {
  const requiredToken = String(env.WAFLOW_PDF_GENERATOR_TOKEN || env.PDF_GENERATOR_TOKEN || "").trim();
  if (!requiredToken) return true;
  return readBearerToken(request) === requiredToken;
}

function readTimeoutMs(env) {
  const value = Number(env.WAFLOW_PDF_GENERATOR_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(value, 5000), 60000);
}

function sanitizeFileName(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.replace(/[\\/\r\n\0"]/g, "_") || "order-request.pdf";
}

function createContentDisposition(fileName) {
  const safeName = sanitizeFileName(fileName);
  const fallback = safeName.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(safeName)}`;
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { ok: false, status: 400, error: "INVALID_JSON_PAYLOAD" };
  }

  const html = typeof payload.html === "string" ? payload.html : "";
  if (!html.trim()) {
    return { ok: false, status: 400, error: "HTML_REQUIRED" };
  }

  const htmlBytes = new TextEncoder().encode(html).byteLength;
  if (htmlBytes > MAX_HTML_BYTES) {
    return { ok: false, status: 413, error: "HTML_TOO_LARGE" };
  }

  return {
    ok: true,
    html,
    fileName: sanitizeFileName(payload.fileName),
    format: payload.format === "A4" ? "A4" : "A4",
    orientation: payload.orientation === "landscape" ? "landscape" : "portrait",
  };
}

async function renderPdf(payload, env) {
  if (!env.BROWSER) {
    throw new Error("BROWSER_BINDING_REQUIRED");
  }

  const browser = await puppeteer.launch(env.BROWSER);
  try {
    const page = await browser.newPage();
    await page.setContent(payload.html, {
      waitUntil: "networkidle0",
      timeout: readTimeoutMs(env),
    });

    const pdf = await page.pdf({
      format: payload.format,
      landscape: payload.orientation === "landscape",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
      timeout: readTimeoutMs(env),
    });

    return pdf;
  } finally {
    await browser.close();
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({ ok: true, service: "waflow-pdf-generator", version: WORKER_VERSION });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }

    if (!isAuthorized(request, env)) {
      return json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ ok: false, error: "INVALID_JSON_PAYLOAD" }, { status: 400 });
    }

    const validated = validatePayload(payload);
    if (!validated.ok) {
      return json({ ok: false, error: validated.error }, { status: validated.status });
    }

    try {
      const pdf = await renderPdf(validated, env);
      return new Response(pdf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": createContentDisposition(validated.fileName),
          "Cache-Control": "no-store",
          "X-Waflow-Pdf-Generator-Version": WORKER_VERSION,
          ...CORS_HEADERS,
        },
      });
    } catch (error) {
      console.error("[WAFLOW_PDF_GENERATOR:RENDER_FAILED]", error);
      return json(
        {
          ok: false,
          error: "PDF_RENDER_FAILED",
          message: error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR"),
        },
        { status: 500 },
      );
    }
  },
};
