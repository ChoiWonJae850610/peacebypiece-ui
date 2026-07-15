import assert from "node:assert/strict";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

export const LOCAL_VIEWER_HOST = "127.0.0.1";
export const LOCAL_VIEWER_READINESS_PATH = "/v";
export const LOCAL_VIEWER_START_TIMEOUT_MS = 60_000;
export const ALPHA42_VIEWER_ONLY_REMAINING_BUDGET = Object.freeze({
  pdfGet: 2,
  tokenAccessUpdate: 1,
  eventInsert: 1,
  pdfPut: 0,
  finalizeUpdate: 0,
  receiptInsert: 0,
  documentInsert: 0,
  tokenInsert: 0,
  imageRequest: 0,
  r2Delete: 0,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function sanitizeLocalViewerServerOutput(value) {
  return String(value ?? "")
    .replace(/https?:\/\/[^\s"']+/gi, "<redacted-url>")
    .replace(/(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{43}(?![A-Za-z0-9_-])/g, "<redacted-opaque-token>")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "<redacted-uuid>")
    .slice(-4_000);
}

function typedError(code, detail = "") {
  const error = new Error(detail ? `${code}:${detail}` : code);
  error.code = code;
  return error;
}

async function assertViewerBuild(rootDir) {
  const buildIdPath = path.join(rootDir, ".next", "BUILD_ID");
  const appPathsPath = path.join(rootDir, ".next", "server", "app-paths-manifest.json");
  try {
    const [buildId, appPathsText] = await Promise.all([
      fs.readFile(buildIdPath, "utf8"),
      fs.readFile(appPathsPath, "utf8"),
    ]);
    const appPaths = JSON.parse(appPathsText);
    assert.ok(buildId.trim(), "build-id-empty");
    assert.ok(appPaths["/v/page"], "viewer-route-missing");
  } catch (error) {
    throw typedError("VIEWER_BUILD_OR_ROUTE_MANIFEST_MISSING", error instanceof Error ? error.message : "unknown");
  }
}

async function allocatePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => reject(typedError("PORT_ALREADY_IN_USE")));
    server.listen(0, LOCAL_VIEWER_HOST, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(typedError("PORT_ALREADY_IN_USE")));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}

function assertLocalOrigin(origin) {
  const parsed = new URL(origin);
  if (parsed.protocol !== "http:" || parsed.hostname !== LOCAL_VIEWER_HOST || !parsed.port || parsed.pathname !== "/") {
    throw typedError("VIEWER_LOCAL_HOST_GUARD_REJECTED");
  }
  return parsed.origin;
}

export async function startLocalViewerServer(input = {}) {
  const rootDir = path.resolve(input.rootDir ?? process.cwd());
  const timeoutMs = Number(input.timeoutMs ?? LOCAL_VIEWER_START_TIMEOUT_MS);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > LOCAL_VIEWER_START_TIMEOUT_MS) {
    throw typedError("VIEWER_SERVER_START_TIMEOUT", "invalid-timeout");
  }
  await assertViewerBuild(rootDir);

  const port = await allocatePort();
  const origin = assertLocalOrigin(`http://${LOCAL_VIEWER_HOST}:${port}`);
  const readinessUrl = new URL(LOCAL_VIEWER_READINESS_PATH, origin);
  if (readinessUrl.origin !== origin) throw typedError("VIEWER_ORIGIN_MISMATCH");

  const args = ["node_modules/next/dist/bin/next", "start", "-H", LOCAL_VIEWER_HOST, "-p", String(port)];
  const child = spawn(process.execPath, args, {
    cwd: rootDir,
    env: {
      ...process.env,
      ...input.env,
      PORT: String(port),
      WAFL_DOCUMENT_VIEWER_ORIGIN: origin,
      WAFL_V2_DOCUMENT_VIEWER_ENABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  let stdout = "";
  let stderr = "";
  let readySignal = false;
  const startedAt = Date.now();
  const append = (current, chunk) => `${current}${String(chunk)}`.slice(-8_000);
  child.stdout.on("data", (chunk) => {
    stdout = append(stdout, chunk);
    if (/\bReady in\b|\bLocal:\s+http:\/\//i.test(stdout)) readySignal = true;
  });
  child.stderr.on("data", (chunk) => {
    stderr = append(stderr, chunk);
    if (/\bReady in\b|\bLocal:\s+http:\/\//i.test(stderr)) readySignal = true;
  });

  try {
    while (!readySignal) {
      if (child.exitCode !== null || child.signalCode !== null) {
        throw typedError("VIEWER_SERVER_PROCESS_EXITED", `${child.exitCode ?? "signal"}`);
      }
      if (Date.now() - startedAt >= timeoutMs) throw typedError("VIEWER_SERVER_START_TIMEOUT");
      await sleep(50);
    }

    const response = await fetch(readinessUrl, { redirect: "manual" });
    const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
    const location = response.headers.get("location");
    await response.body?.cancel();
    if (response.status >= 300 && response.status < 400) throw typedError("VIEWER_READINESS_REDIRECTED");
    if (response.status === 401 || response.status === 403) throw typedError("VIEWER_READINESS_FORBIDDEN");
    if (response.status === 404) throw typedError("VIEWER_READINESS_ROUTE_NOT_FOUND");
    if (response.status !== 200 || contentType !== "text/html") {
      throw typedError("VIEWER_READINESS_ROUTE_NOT_FOUND", `http-${response.status}`);
    }
    if (location) throw typedError("VIEWER_READINESS_REDIRECTED");

    return {
      child,
      baseUrl: origin,
      port,
      diagnostics: Object.freeze({
        command: "node node_modules/next/dist/bin/next start -H 127.0.0.1 -p <ephemeral>",
        cwd: rootDir,
        nodeVersion: process.version,
        host: LOCAL_VIEWER_HOST,
        port,
        bindAddress: LOCAL_VIEWER_HOST,
        viewerOriginPathname: "/",
        readinessPathname: LOCAL_VIEWER_READINESS_PATH,
        readinessStatus: response.status,
        readinessContentType: contentType,
        redirected: false,
        finalPathname: readinessUrl.pathname,
        readyMs: Date.now() - startedAt,
        timeoutMs,
        processExitCode: child.exitCode,
        processSignal: child.signalCode,
        viewerEnabled: true,
        stdoutTail: sanitizeLocalViewerServerOutput(stdout),
        stderrTail: sanitizeLocalViewerServerOutput(stderr),
      }),
    };
  } catch (error) {
    child.kill();
    await Promise.race([new Promise((resolve) => child.once("exit", resolve)), sleep(3_000)]);
    if (error?.code) throw error;
    throw typedError("VIEWER_SERVER_PROCESS_EXITED", error instanceof Error ? error.message : "unknown");
  }
}

export async function stopLocalViewerServer(server) {
  if (!server?.child || server.child.exitCode !== null) return;
  server.child.kill();
  await Promise.race([new Promise((resolve) => server.child.once("exit", resolve)), sleep(3_000)]);
}
