import { NextRequest, NextResponse } from "next/server";

import { runSystemStoragePurge } from "@/lib/system/storagePurgeCandidates";

export const runtime = "nodejs";

type PurgeRequestPayload = {
  mode?: unknown;
  trashItemIds?: unknown;
  limit?: unknown;
};

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function readLimit(value: unknown): number {
  const parsed = Number(value ?? 100);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 200) : 100;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as PurgeRequestPayload | null;
    const mode = payload?.mode === "all-due" ? "all-due" : "selected";
    const trashItemIds = readStringArray(payload?.trashItemIds);

    if (mode === "selected" && trashItemIds.length === 0) {
      return NextResponse.json({ ok: false, error: "TRASH_ITEM_IDS_REQUIRED" }, { status: 400 });
    }

    const result = await runSystemStoragePurge({
      mode,
      trashItemIds,
      limit: readLimit(payload?.limit),
      actorId: "system-admin",
    });

    return NextResponse.json({ ok: true, storageDeleteMode: "worker-delete", ...result });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[SYSTEM_STORAGE_PURGE_FAILED]", { message, error });
    return NextResponse.json({ ok: false, error: "SYSTEM_STORAGE_PURGE_FAILED", message }, { status: 500 });
  }
}
