export type SystemAuditActorRole =
  | "system_admin"
  | "customer_admin"
  | "designer"
  | "inspector"
  | "factory"
  | "system"
  | "unknown";

export type SystemAuditTargetType =
  | "company"
  | "member"
  | "invitation"
  | "plan"
  | "storage"
  | "work_order"
  | "file"
  | "memo"
  | "settings"
  | "auth"
  | "system";

export type SystemAuditSeverity = "low" | "medium" | "high" | "critical";

export type SystemAuditLogMetadata = Record<string, unknown>;

export type SystemAuditLogEventType = `${string}.${string}`;

export type SystemAuditLogRecord = {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorRole: SystemAuditActorRole;
  companyId: string | null;
  targetType: SystemAuditTargetType;
  targetId: string | null;
  eventType: SystemAuditLogEventType;
  severity: SystemAuditSeverity;
  summary: string;
  metadata: SystemAuditLogMetadata;
  requestId: string | null;
  ipAddress: string | null;
};

export type CreateSystemAuditLogInput = {
  actorUserId?: string | null;
  actorRole?: SystemAuditActorRole;
  companyId?: string | null;
  targetType: SystemAuditTargetType;
  targetId?: string | null;
  eventType: SystemAuditLogEventType;
  severity?: SystemAuditSeverity;
  summary: string;
  metadata?: SystemAuditLogMetadata | null;
  requestId?: string | null;
  ipAddress?: string | null;
};

export type ListSystemAuditLogsInput = {
  companyId?: string | null;
  targetType?: SystemAuditTargetType | null;
  eventType?: SystemAuditLogEventType | null;
  severity?: SystemAuditSeverity | null;
  limit?: number;
};

export type SystemAuditLogFilter = {
  query?: string;
  companyId?: string;
  targetType?: SystemAuditTargetType | "all";
  severity?: SystemAuditSeverity | "all";
};

export type SystemAuditLogViewModel = {
  id: string;
  occurredAt: string;
  actorLabel: string;
  targetLabel: string;
  eventType: SystemAuditLogEventType;
  severity: SystemAuditSeverity;
  summary: string;
  metadataItems: Array<{ label: string; value: string }>;
};
