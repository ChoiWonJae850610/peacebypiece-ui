import type {
  CreateSystemAuditLogInput,
  SystemAuditLogMetadata,
  SystemAuditSeverity,
} from "@/lib/system/audit/types";

export type SystemStoragePurgeAuditItem = {
  trashItemId: string;
  attachmentId: string | null;
  storageKey: string | null;
  thumbnailKey: string | null;
  status: "purged" | "failed";
  errorMessage?: string;
};

export type SystemStoragePurgeAuditResult = {
  requestedCount: number;
  candidateCount: number;
  purgedCount: number;
  failedCount: number;
  items: SystemStoragePurgeAuditItem[];
};

export type BuildSystemStoragePurgeAuditLogInput = {
  mode: "selected" | "all-due";
  actorId?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  result: SystemStoragePurgeAuditResult;
};

function getSystemStoragePurgeSeverity(result: SystemStoragePurgeAuditResult): SystemAuditSeverity {
  if (result.failedCount > 0) return "critical";
  if (result.purgedCount > 0) return "critical";
  return "medium";
}

function buildSystemStoragePurgeSummary(result: SystemStoragePurgeAuditResult): string {
  if (result.candidateCount === 0) {
    return "시스템관리자 저장소 실제 삭제 처리 대상 없음";
  }

  return `시스템관리자 저장소 실제 삭제 처리: 완료 ${result.purgedCount}건, 실패 ${result.failedCount}건`;
}

function buildSystemStoragePurgeMetadata(input: BuildSystemStoragePurgeAuditLogInput): SystemAuditLogMetadata {
  return {
    mode: input.mode,
    requestedCount: input.result.requestedCount,
    candidateCount: input.result.candidateCount,
    purgedCount: input.result.purgedCount,
    failedCount: input.result.failedCount,
    itemCount: input.result.items.length,
    items: input.result.items.slice(0, 20).map((item) => ({
      trashItemId: item.trashItemId,
      attachmentId: item.attachmentId,
      status: item.status,
      hasStorageKey: Boolean(item.storageKey),
      hasThumbnailKey: Boolean(item.thumbnailKey),
      errorMessage: item.errorMessage || null,
    })),
  };
}

export function buildSystemStoragePurgeAuditLog(
  input: BuildSystemStoragePurgeAuditLogInput,
): CreateSystemAuditLogInput {
  return {
    actorUserId: input.actorId ?? null,
    actorRole: "system_admin",
    targetType: "storage",
    targetId: null,
    eventType: "storage.purge_run",
    severity: getSystemStoragePurgeSeverity(input.result),
    summary: buildSystemStoragePurgeSummary(input.result),
    metadata: buildSystemStoragePurgeMetadata(input),
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
  };
}
