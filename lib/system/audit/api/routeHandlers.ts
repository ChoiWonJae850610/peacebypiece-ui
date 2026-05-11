import { NextResponse } from "next/server";

import { getSystemAuditLogPageData } from "@/lib/system/audit/pageData";
import type {
  ListSystemAuditLogsInput,
  SystemAuditLogEventType,
  SystemAuditLogFilter,
  SystemAuditSeverity,
  SystemAuditTargetType,
} from "@/lib/system/audit/types";

const SYSTEM_AUDIT_LOG_TARGET_TYPES = new Set<SystemAuditTargetType>([
  "company",
  "member",
  "invitation",
  "plan",
  "storage",
  "work_order",
  "file",
  "memo",
  "settings",
  "auth",
  "system",
]);

const SYSTEM_AUDIT_LOG_SEVERITIES = new Set<SystemAuditSeverity>([
  "low",
  "medium",
  "high",
  "critical",
]);

function getOptionalSearchParam(url: URL, key: string): string | null {
  const value = url.searchParams.get(key);
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

function getLimitParam(url: URL): number {
  const value = Number(url.searchParams.get("limit") || 200);
  if (!Number.isFinite(value)) return 200;
  return Math.min(Math.max(Math.trunc(value), 1), 500);
}

function getTargetTypeParam(url: URL): SystemAuditTargetType | null {
  const value = getOptionalSearchParam(url, "targetType");
  if (!value || value === "all") return null;
  return SYSTEM_AUDIT_LOG_TARGET_TYPES.has(value as SystemAuditTargetType)
    ? (value as SystemAuditTargetType)
    : null;
}

function getSeverityParam(url: URL): SystemAuditSeverity | null {
  const value = getOptionalSearchParam(url, "severity");
  if (!value || value === "all") return null;
  return SYSTEM_AUDIT_LOG_SEVERITIES.has(value as SystemAuditSeverity)
    ? (value as SystemAuditSeverity)
    : null;
}

function getEventTypeParam(url: URL): SystemAuditLogEventType | null {
  const value = getOptionalSearchParam(url, "eventType");
  return value ? (value as SystemAuditLogEventType) : null;
}

function toAuditListInput(url: URL): ListSystemAuditLogsInput {
  return {
    companyId: getOptionalSearchParam(url, "companyId"),
    targetType: getTargetTypeParam(url),
    eventType: getEventTypeParam(url),
    severity: getSeverityParam(url),
    limit: getLimitParam(url),
  };
}

function toAuditUiFilter(url: URL): SystemAuditLogFilter {
  return {
    query: getOptionalSearchParam(url, "query") || undefined,
    companyId: getOptionalSearchParam(url, "companyId") || undefined,
    targetType: getTargetTypeParam(url) || "all",
    severity: getSeverityParam(url) || "all",
  };
}

function toErrorResponse(error: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: "SYSTEM_AUDIT_LOG_ROUTE_ERROR",
      message: error instanceof Error ? error.message : "Unknown system audit log route error",
    },
    { status: 500 },
  );
}

export async function handleGetSystemAuditLogs(request: Request) {
  try {
    const url = new URL(request.url);
    const pageData = await getSystemAuditLogPageData({
      listInput: toAuditListInput(url),
      filter: toAuditUiFilter(url),
    });

    return NextResponse.json({
      ok: true,
      records: pageData.records,
      viewModels: pageData.viewModels,
      count: pageData.records.length,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
