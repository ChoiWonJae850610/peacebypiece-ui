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

const SYSTEM_AUDIT_ACTOR_ROLE_LABELS: Record<string, string> = {
  system_admin: "시스템관리자",
  customer_admin: "관리자",
  designer: "디자이너",
  inspector: "검수담당자",
  factory: "공장",
  system: "시스템",
  unknown: "알 수 없음",
};

const KNOWN_SAMPLE_ACTOR_NAMES: Record<string, string> = {
  "user-sample-admin": "샘플 관리자",
  "user-sample-designer": "샘플 디자이너",
  "user-sample-inspector": "샘플 검수담당자",
  "system-user-sample-admin": "샘플 시스템관리자",
};

const KNOWN_SAMPLE_ACTOR_ROLES: Record<string, string> = {
  "user-sample-admin": "customer_admin",
  "user-sample-designer": "designer",
  "user-sample-inspector": "inspector",
  "system-user-sample-admin": "system_admin",
};

function readMetadataText(metadata: SystemAuditLogMetadata, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function buildActorLabel(record: SystemAuditLogRecord): string {
  const actorName = readMetadataText(record.metadata, "actorName") ?? (record.actorUserId ? KNOWN_SAMPLE_ACTOR_NAMES[record.actorUserId] : null);
  const actorRole = record.actorUserId ? (KNOWN_SAMPLE_ACTOR_ROLES[record.actorUserId] ?? record.actorRole) : record.actorRole;
  const roleLabel = SYSTEM_AUDIT_ACTOR_ROLE_LABELS[actorRole] ?? actorRole;

  if (actorName) return `${actorName} (${roleLabel})`;
  if (record.actorUserId) return `${roleLabel} · ${record.actorUserId}`;
  return roleLabel;
}

export function toSystemAuditLogViewModel(record: SystemAuditLogRecord): SystemAuditLogViewModel {
  return {
    id: record.id,
    occurredAt: formatAuditDate(record.createdAt),
    actorLabel: buildActorLabel(record),
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
