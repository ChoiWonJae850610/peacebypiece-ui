import "server-only";

import { randomUUID } from "crypto";
import { isDatabaseConfigured, queryDb } from "@/lib/db/client";
import type {
  CreateSystemAuditLogInput,
  ListSystemAuditLogsInput,
  SystemAuditActorRole,
  SystemAuditLogMetadata,
  SystemAuditLogRecord,
  SystemAuditSeverity,
  SystemAuditTargetType,
} from "@/lib/system/audit/types";

const SYSTEM_AUDIT_LOG_EVENT_TYPE_PATTERN = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

function normalizeAuditMetadata(value: CreateSystemAuditLogInput["metadata"]): SystemAuditLogMetadata {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getAuditLogErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_SYSTEM_AUDIT_LOG_ERROR");
}

function normalizeAuditLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) return 200;
  return Math.min(Math.max(Math.trunc(value || 200), 1), 500);
}

function assertSystemAuditEventType(eventType: string): void {
  if (!SYSTEM_AUDIT_LOG_EVENT_TYPE_PATTERN.test(eventType)) {
    throw new Error(`Invalid system audit event_type: ${eventType}`);
  }
}

type SystemAuditLogDbRow = {
  id: string;
  created_at: string | Date;
  actor_user_id: string | null;
  actor_role: SystemAuditActorRole;
  company_id: string | null;
  target_type: SystemAuditTargetType;
  target_id: string | null;
  event_type: SystemAuditLogRecord["eventType"];
  severity: SystemAuditSeverity;
  summary: string;
  metadata: SystemAuditLogMetadata | null;
  request_id: string | null;
  ip_address: string | null;
};

function formatAuditIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function toSystemAuditLogRecord(row: SystemAuditLogDbRow): SystemAuditLogRecord {
  return {
    id: row.id,
    createdAt: formatAuditIso(row.created_at),
    actorUserId: row.actor_user_id,
    actorRole: row.actor_role,
    companyId: row.company_id,
    targetType: row.target_type,
    targetId: row.target_id,
    eventType: row.event_type,
    severity: row.severity,
    summary: row.summary,
    metadata: row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? row.metadata : {},
    requestId: row.request_id,
    ipAddress: row.ip_address,
  };
}

export async function createSystemAuditLog(input: CreateSystemAuditLogInput): Promise<void> {
  if (!isDatabaseConfigured()) return;

  assertSystemAuditEventType(input.eventType);

  await queryDb(
    `INSERT INTO audit_logs (
       id,
       actor_user_id,
       actor_role,
       company_id,
       target_type,
       target_id,
       event_type,
       severity,
       summary,
       metadata,
       request_id,
       ip_address,
       created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12::inet, now())`,
    [
      randomUUID(),
      input.actorUserId ?? null,
      input.actorRole ?? "system",
      input.companyId ?? null,
      input.targetType,
      input.targetId ?? null,
      input.eventType,
      input.severity ?? "medium",
      input.summary,
      JSON.stringify(normalizeAuditMetadata(input.metadata)),
      input.requestId ?? null,
      input.ipAddress ?? null,
    ],
  );
}

export async function createSystemAuditLogSafe(input: CreateSystemAuditLogInput): Promise<void> {
  try {
    await createSystemAuditLog(input);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[SYSTEM_AUDIT_LOG_SKIPPED]", getAuditLogErrorMessage(error));
    }
  }
}

export async function listSystemAuditLogs(input: ListSystemAuditLogsInput = {}): Promise<SystemAuditLogRecord[]> {
  if (!isDatabaseConfigured()) return [];

  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (input.companyId) {
    params.push(input.companyId);
    whereClauses.push(`company_id = $${params.length}`);
  }

  if (input.targetType) {
    params.push(input.targetType);
    whereClauses.push(`target_type = $${params.length}`);
  }

  if (input.eventType) {
    assertSystemAuditEventType(input.eventType);
    params.push(input.eventType);
    whereClauses.push(`event_type = $${params.length}`);
  }

  if (input.severity) {
    params.push(input.severity);
    whereClauses.push(`severity = $${params.length}`);
  }

  params.push(normalizeAuditLimit(input.limit));
  const limitPlaceholder = `$${params.length}`;
  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  try {
    const result = await queryDb<SystemAuditLogDbRow>(
      `SELECT id,
              created_at,
              actor_user_id,
              actor_role,
              company_id,
              target_type,
              target_id,
              event_type,
              severity,
              summary,
              metadata,
              request_id,
              ip_address::text AS ip_address
         FROM audit_logs
         ${whereSql}
        ORDER BY created_at DESC
        LIMIT ${limitPlaceholder}`,
      params,
    );

    return result.rows.map(toSystemAuditLogRecord);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[SYSTEM_AUDIT_LOG_LIST_FAILED]", getAuditLogErrorMessage(error));
    }
    return [];
  }
}
