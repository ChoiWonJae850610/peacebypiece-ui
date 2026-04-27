import { NextRequest, NextResponse } from "next/server";
import { runAdminFilePurgeWorker } from "@/lib/admin/adminFiles.purgeWorker";

export const runtime = "nodejs";

function readLimit(request: NextRequest): number {
  const value = request.nextUrl.searchParams.get("limit");
  const parsed = Number(value ?? 50);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 200) : 50;
}

function readDryRun(request: NextRequest): boolean {
  const value = request.nextUrl.searchParams.get("dryRun");
  return value !== "false";
}

function getExpectedSecret(): string | null {
  return process.env.ADMIN_FILE_PURGE_SECRET || process.env.CRON_SECRET || null;
}

function isAuthorized(request: NextRequest): boolean {
  const expectedSecret = getExpectedSecret();
  if (!expectedSecret && process.env.NODE_ENV !== "production") return true;
  if (!expectedSecret) return false;

  const authHeader = request.headers.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : null;
  const cronSecret = request.headers.get("x-cron-secret");

  return bearerToken === expectedSecret || cronSecret === expectedSecret;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED_PURGE_WORKER" }, { status: 401 });
  }

  try {
    const result = await runAdminFilePurgeWorker({
      limit: readLimit(request),
      dryRun: readDryRun(request),
    });

    return NextResponse.json({ ok: true, storageDeleteMode: "worker-delete", ...result });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_FILE_PURGE_WORKER_FAILED]", { message, error });
    return NextResponse.json({ ok: false, error: "ADMIN_FILE_PURGE_WORKER_FAILED", message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
