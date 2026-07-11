import "server-only";

import { createHash } from "crypto";

import { getDatabaseUrl } from "@/lib/db/client";

const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const REQUIRED_TEST_PREFIX = "wafl-fn";

export type WorkOrderV2ReadRuntimeGuard =
  | { readonly ok: true; readonly fingerprint: string }
  | { readonly ok: false; readonly reason: string };

function databaseFingerprint(connectionString: string): string | null {
  try {
    const parsed = new URL(connectionString);
    const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    if (!new Set(["postgres:", "postgresql:"]).has(parsed.protocol) || !parsed.hostname || !databaseName) return null;
    return createHash("sha256").update(`${parsed.hostname}/${databaseName}`).digest("hex").slice(0, 12);
  } catch {
    return null;
  }
}

export function getWorkOrderV2ReadRuntimeGuard(): WorkOrderV2ReadRuntimeGuard {
  if (process.env.WAFL_V2_READ_API_ENABLED !== "1" || process.env.WAFL_V2_READ_APPROVED !== "1") {
    return { ok: false, reason: "read-api-disabled" };
  }

  const runtime = String(process.env.WAFL_V2_RUNTIME ?? "").trim().toLowerCase();
  if (!ALLOWED_RUNTIMES.has(runtime)) return { ok: false, reason: "runtime-not-dev-test" };
  if (String(process.env.WAFL_V2_TEST_PREFIX ?? "").trim() !== REQUIRED_TEST_PREFIX) {
    return { ok: false, reason: "fixture-prefix-mismatch" };
  }

  const connectionString = getDatabaseUrl();
  const actualFingerprint = connectionString ? databaseFingerprint(connectionString) : null;
  const approvedFingerprint = String(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT ?? "").trim().toLowerCase();
  if (!actualFingerprint || !approvedFingerprint || actualFingerprint !== approvedFingerprint) {
    return { ok: false, reason: "db-fingerprint-mismatch" };
  }

  return { ok: true, fingerprint: actualFingerprint };
}
