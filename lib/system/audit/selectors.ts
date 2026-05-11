import type { SystemAuditLogFilter, SystemAuditLogRecord } from "@/lib/system/audit/types";

function normalizeSearchText(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

function includesAuditQuery(record: SystemAuditLogRecord, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const searchableText = [
    record.summary,
    record.eventType,
    record.targetType,
    record.targetId,
    record.actorRole,
    record.actorUserId,
    record.companyId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

export function selectSystemAuditLogsByFilter(
  records: SystemAuditLogRecord[],
  filter: SystemAuditLogFilter = {},
): SystemAuditLogRecord[] {
  return records.filter((record) => {
    if (filter.companyId && record.companyId !== filter.companyId) return false;
    if (filter.targetType && filter.targetType !== "all" && record.targetType !== filter.targetType) return false;
    if (filter.severity && filter.severity !== "all" && record.severity !== filter.severity) return false;
    return includesAuditQuery(record, filter.query || "");
  });
}
