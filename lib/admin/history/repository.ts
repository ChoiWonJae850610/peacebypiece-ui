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

function toAdminHistoryCategory(targetType: string | null): import("@/lib/admin/history/types").AdminHistoryCategory {
  if (targetType === "file") return "attachment";
  if (targetType === "partner" || targetType === "settings") return "inventory";
  return "work";
}

function toAdminHistoryTone(actionType: string | null): import("@/lib/admin/history/types").AdminHistoryTone {
  if (actionType === "FILE_DELETED") return "rose";
  if (actionType === "FILE_UPLOADED") return "emerald";
  if (actionType === "STATUS_CHANGED") return "violet";
  if (actionType === "SETTINGS_CHANGED") return "amber";
  return "stone";
}

function formatAdminHistoryTime(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 16).replace("T", " ");
  if (typeof value === "string") return value.slice(0, 16).replace("T", " ");
  return "";
}

function normalizeDbMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

export async function listAdminHistoryEvents(): Promise<import("@/lib/admin/history/types").AdminHistoryEvent[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const result = await queryDb<{
      id: string;
      action_type: string | null;
      target_type: string | null;
      target_id: string | null;
      message: string | null;
      metadata: Record<string, unknown> | null;
      created_at: string | Date | null;
      user_name: string | null;
    }>(
      `SELECT h.id,
              h.action_type,
              h.target_type,
              h.target_id,
              h.message,
              h.metadata,
              h.created_at,
              COALESCE(u.name, u.email, h.user_id, 'system') AS user_name
         FROM history_logs h
         LEFT JOIN users u ON u.id = h.user_id
        WHERE h.company_id = $1
        ORDER BY h.created_at DESC
        LIMIT 200`,
      [WORKSPACE_COMPANY_ID],
    );

    return result.rows.map((row) => {
      const metadata = normalizeDbMetadata(row.metadata);
      return {
        id: row.id,
        workOrderId: row.target_id ?? "",
        category: toAdminHistoryCategory(row.target_type),
        action: String(row.action_type ?? "LOG"),
        message: row.message ?? "",
        actorName: row.user_name ?? "system",
        occurredAt: formatAdminHistoryTime(row.created_at),
        tone: toAdminHistoryTone(row.action_type),
        summary: row.message ?? "",
        detailLines: Object.entries(metadata).map(([label, value]) => ({ label, value: String(value) })),
        transition: typeof metadata.from === "string" && typeof metadata.to === "string" ? { from: metadata.from, to: metadata.to } : null,
      };
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[ADMIN_HISTORY_LIST_FAILED]", getHistoryErrorMessage(error));
    }
    return [];
  }
}
