import "server-only";

import { randomUUID } from "crypto";
import { isDatabaseConfigured, queryDb } from "@/lib/db/client";
import { WORKSPACE_COMPANY_ID } from "@/lib/constants/company";
import type { CreateAdminHistoryLogInput } from "@/lib/admin/history/dbTypes";

function normalizeHistoryMetadata(value: CreateAdminHistoryLogInput["metadata"]): Record<string, unknown> {
  return value && typeof value === "object" ? value : {};
}

function getHistoryErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_HISTORY_LOG_ERROR");
}

export async function createAdminHistoryLog(input: CreateAdminHistoryLogInput): Promise<void> {
  if (!isDatabaseConfigured()) return;

  await queryDb(
    `INSERT INTO history_logs (
       id,
       company_id,
       user_id,
       action_type,
       target_type,
       target_id,
       message,
       metadata,
       created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, now())`,
    [
      randomUUID(),
      input.company_id || WORKSPACE_COMPANY_ID,
      input.user_id ?? null,
      input.action_type,
      input.target_type,
      input.target_id ?? null,
      input.message,
      JSON.stringify(normalizeHistoryMetadata(input.metadata)),
    ],
  );
}

export async function createAdminHistoryLogSafe(input: CreateAdminHistoryLogInput): Promise<void> {
  try {
    await createAdminHistoryLog(input);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[ADMIN_HISTORY_LOG_SKIPPED]", getHistoryErrorMessage(error));
    }
  }
}
