import "server-only";

import { randomUUID } from "crypto";
import { isDatabaseConfigured, queryDb } from "@/lib/db/client";
import { WORKSPACE_COMPANY_ID } from "@/lib/constants/company";
import type { CreateAdminHistoryLogInput } from "@/lib/admin/history/dbTypes";
import type { AdminHistoryEvent } from "@/lib/admin/history/types";

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

function toAdminHistoryCategory(targetType: string | null): AdminHistoryEvent["category"] {
  if (targetType === "file") return "attachment";
  if (targetType === "partner") return "inventory";
  return "work";
}

function toAdminHistoryTone(actionType: string | null): AdminHistoryEvent["tone"] {
  if (actionType === "FILE_DELETED" || actionType === "PARTNER_DELETED") return "rose";
  if (actionType === "FILE_UPLOADED" || actionType === "PARTNER_CREATED") return "emerald";
  if (actionType === "STATUS_CHANGED") return "violet";
  return "stone";
}

function formatAdminHistoryIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return "";
}

function formatAdminHistoryTime(value: unknown): string {
  const isoValue = formatAdminHistoryIso(value);
  return isoValue ? isoValue.slice(0, 16).replace("T", " ") : "";
}

function normalizeDbMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

const HISTORY_DETAIL_LABELS = new Set([
  "status",
  "from",
  "to",
  "actor",
  "user",
  "role",
  "target",
  "fileName",
  "file_name",
  "partnerName",
  "partner_name",
  "source",
  "type",
  "memo",
  "message",
  "name",
  "title",
  "quantity",
  "reason",
]);

function normalizeMetadataLabel(value: string): string {
  return value.trim().replace(/[\s-]+/g, "_").toLowerCase();
}

function isTechnicalMetadataValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return true;
  if (/^(company|partner|workorder|attachment|file|user)[-_][a-z0-9_-]+$/i.test(trimmed)) return true;
  if (trimmed === "[object Object]") return true;
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) return true;
  return false;
}

function formatMetadataValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return isTechnicalMetadataValue(value) ? null : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function selectMetadataLabelValue(metadata: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const formatted = formatMetadataValue(metadata[key]);
    if (formatted) return formatted;
  }
  return null;
}

function buildMetadataDetailLines(metadata: Record<string, unknown>): AdminHistoryEvent["detailLines"] {
  return Object.entries(metadata).flatMap(([label, value]) => {
    const normalizedLabel = normalizeMetadataLabel(label);
    if (!HISTORY_DETAIL_LABELS.has(label) && !HISTORY_DETAIL_LABELS.has(normalizedLabel)) return [];
    const formatted = formatMetadataValue(value);
    if (!formatted) return [];
    return [{ label, value: formatted }];
  });
}

function buildTargetLabel(metadata: Record<string, unknown>, message: string | null): string | null {
  return selectMetadataLabelValue(metadata, ["title", "name", "partnerName", "partner_name", "fileName", "file_name", "message"]) ?? message ?? null;
}

export async function listAdminHistoryEvents(): Promise<AdminHistoryEvent[]> {
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
      user_email: string | null;
    }>(
      `SELECT h.id,
              h.action_type,
              h.target_type,
              h.target_id,
              h.message,
              h.metadata,
              h.created_at,
              COALESCE(u.name, u.email, h.user_id, 'system') AS user_name,
              u.email AS user_email
         FROM history_logs h
         LEFT JOIN users u ON u.id = h.user_id
        WHERE h.company_id = $1
          AND COALESCE(h.target_type, '') <> 'settings'
          AND COALESCE(h.target_type, '') <> 'system'
        ORDER BY h.created_at DESC
        LIMIT 200`,
      [WORKSPACE_COMPANY_ID],
    );

    return result.rows.map((row) => {
      const metadata = normalizeDbMetadata(row.metadata);
      const from = formatMetadataValue(metadata.from);
      const to = formatMetadataValue(metadata.to);
      const targetLabel = buildTargetLabel(metadata, row.message);
      return {
        id: row.id,
        workOrderId: row.target_type === "workorder" ? row.target_id ?? "" : "",
        category: toAdminHistoryCategory(row.target_type),
        action: String(row.action_type ?? "LOG"),
        message: row.message ?? "",
        actorName: row.user_name ?? "system",
        occurredAt: formatAdminHistoryTime(row.created_at),
        tone: toAdminHistoryTone(row.action_type),
        summary: row.message ?? "",
        actor: {
          id: null,
          name: row.user_name ?? "system",
          email: row.user_email ?? null,
        },
        target: {
          type: row.target_type ?? "unknown",
          id: null,
          label: targetLabel,
        },
        timestamp: {
          iso: formatAdminHistoryIso(row.created_at),
          display: formatAdminHistoryTime(row.created_at),
        },
        detailLines: buildMetadataDetailLines(metadata),
        transition: from && to ? { from, to } : null,
      };
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[ADMIN_HISTORY_LIST_FAILED]", getHistoryErrorMessage(error));
    }
    return [];
  }
}
