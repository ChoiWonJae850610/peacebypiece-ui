import { selectSystemAuditLogsByFilter } from "@/lib/system/audit/selectors";
import type {
  SystemAuditLogFilter,
  SystemAuditLogMetadata,
  SystemAuditLogRecord,
  SystemAuditLogViewModel,
} from "@/lib/system/audit/types";

export type SystemAuditLogFilterActionInput = {
  records: SystemAuditLogRecord[];
  filter?: SystemAuditLogFilter;
};

function formatAuditDate(value: string): string {
  return value ? value.slice(0, 16).replace("T", " ") : "";
}

function formatMetadataValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function buildMetadataItems(metadata: SystemAuditLogMetadata): SystemAuditLogViewModel["metadataItems"] {
  return Object.entries(metadata)
    .flatMap(([label, value]) => {
      const formatted = formatMetadataValue(value);
      return formatted ? [{ label, value: formatted }] : [];
    })
    .slice(0, 8);
}

export function toSystemAuditLogViewModel(record: SystemAuditLogRecord): SystemAuditLogViewModel {
  return {
    id: record.id,
    occurredAt: formatAuditDate(record.createdAt),
    actorLabel: record.actorUserId || record.actorRole,
    targetLabel: record.targetId ? `${record.targetType}:${record.targetId}` : record.targetType,
    eventType: record.eventType,
    severity: record.severity,
    summary: record.summary,
    metadataItems: buildMetadataItems(record.metadata),
  };
}

export function applySystemAuditLogFilterAction(input: SystemAuditLogFilterActionInput): SystemAuditLogRecord[] {
  return selectSystemAuditLogsByFilter(input.records, input.filter || {});
}

export function buildSystemAuditLogViewModels(records: SystemAuditLogRecord[]): SystemAuditLogViewModel[] {
  return records.map(toSystemAuditLogViewModel);
}
