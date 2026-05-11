import type {
  CreateSystemAuditLogInput,
  SystemAuditLogMetadata,
  SystemAuditSeverity,
  SystemAuditActorRole,
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


export type BuildWorkOrderStatusChangedAuditLogInput = {
  workOrderId: string;
  title?: string | null;
  fromWorkflowState?: string | null;
  toWorkflowState: string;
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: SystemAuditActorRole | null;
  companyId?: string | null;
  managerName?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  source?: "workorder-save" | "state-patch" | "bulk-save";
};

export type BuildWorkOrderDeletedAuditLogInput = {
  workOrderId: string;
  title?: string | null;
  workflowState?: string | null;
  actorId?: string | null;
  companyId?: string | null;
  attachmentCount?: number;
  memoThreadCount?: number;
  requestId?: string | null;
  ipAddress?: string | null;
};

export type BuildAttachmentDeletedAuditLogInput = {
  attachmentId: string;
  workOrderId?: string | null;
  fileName?: string | null;
  actorId?: string | null;
  companyId?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  hasStorageKey?: boolean;
  hasThumbnailKey?: boolean;
  requestId?: string | null;
  ipAddress?: string | null;
};

export type BuildWorkOrderRestoredAuditLogInput = {
  workOrderId: string;
  actorId?: string | null;
  companyId?: string | null;
  affectedCount: number;
  documentCount: number;
  designCount: number;
  memoCount: number;
  requestId?: string | null;
  ipAddress?: string | null;
};

export type BuildAttachmentRestoredAuditLogInput = {
  actorId?: string | null;
  companyId?: string | null;
  requestedCount: number;
  affectedCount: number;
  documentCount: number;
  designCount: number;
  requestId?: string | null;
  ipAddress?: string | null;
};

function normalizeCount(value: number | undefined | null): number {
  return Number.isFinite(Number(value)) ? Math.max(0, Math.trunc(Number(value))) : 0;
}


export function buildWorkOrderStatusChangedAuditLog(
  input: BuildWorkOrderStatusChangedAuditLogInput,
): CreateSystemAuditLogInput | null {
  const previousState = input.fromWorkflowState?.trim() || null;
  const nextState = input.toWorkflowState.trim();

  if (!nextState || previousState === nextState) return null;

  const title = input.title?.trim() || "작업지시서";

  return {
    actorUserId: input.actorId ?? null,
    actorRole: input.actorRole ?? "customer_admin",
    companyId: input.companyId ?? null,
    targetType: "work_order",
    targetId: input.workOrderId,
    eventType: "work_order.status_changed",
    severity: "medium",
    summary: `${title} 상태 변경: ${previousState ?? "unknown"} → ${nextState}`,
    metadata: {
      workOrderId: input.workOrderId,
      title,
      fromWorkflowState: previousState,
      toWorkflowState: nextState,
      actorName: input.actorName ?? null,
      actorRole: input.actorRole ?? null,
      managerName: input.managerName ?? null,
      source: input.source ?? "workorder-save",
    },
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
  };
}

export function buildWorkOrderDeletedAuditLog(
  input: BuildWorkOrderDeletedAuditLogInput,
): CreateSystemAuditLogInput {
  const title = input.title?.trim() || "작업지시서";
  const attachmentCount = normalizeCount(input.attachmentCount);
  const memoThreadCount = normalizeCount(input.memoThreadCount);

  return {
    actorUserId: input.actorId ?? null,
    actorRole: "customer_admin",
    companyId: input.companyId ?? null,
    targetType: "work_order",
    targetId: input.workOrderId,
    eventType: "work_order.deleted",
    severity: "high",
    summary: `${title} 삭제`,
    metadata: {
      workOrderId: input.workOrderId,
      title,
      workflowState: input.workflowState ?? null,
      attachmentCount,
      memoThreadCount,
      deleteMode: "soft-delete",
      bundleTrash: true,
    },
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
  };
}

export function buildAttachmentDeletedAuditLog(
  input: BuildAttachmentDeletedAuditLogInput,
): CreateSystemAuditLogInput {
  const fileName = input.fileName?.trim() || input.attachmentId;

  return {
    actorUserId: input.actorId ?? null,
    actorRole: "customer_admin",
    companyId: input.companyId ?? null,
    targetType: "file",
    targetId: input.attachmentId,
    eventType: "file.deleted",
    severity: "medium",
    summary: `${fileName} 삭제`,
    metadata: {
      attachmentId: input.attachmentId,
      workOrderId: input.workOrderId ?? null,
      fileName,
      mimeType: input.mimeType ?? null,
      sizeBytes: input.sizeBytes ?? null,
      hasStorageKey: Boolean(input.hasStorageKey),
      hasThumbnailKey: Boolean(input.hasThumbnailKey),
      deleteMode: "soft-delete",
    },
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
  };
}

export function buildWorkOrderRestoredAuditLog(
  input: BuildWorkOrderRestoredAuditLogInput,
): CreateSystemAuditLogInput {
  return {
    actorUserId: input.actorId ?? null,
    actorRole: "customer_admin",
    companyId: input.companyId ?? null,
    targetType: "work_order",
    targetId: input.workOrderId,
    eventType: "work_order.restored",
    severity: "medium",
    summary: `작업지시서 복원: 문서 ${input.documentCount}개, 디자인 ${input.designCount}개, 메모 ${input.memoCount}개`,
    metadata: {
      workOrderId: input.workOrderId,
      affectedCount: normalizeCount(input.affectedCount),
      documentCount: normalizeCount(input.documentCount),
      designCount: normalizeCount(input.designCount),
      memoCount: normalizeCount(input.memoCount),
    },
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
  };
}

export function buildAttachmentRestoredAuditLog(
  input: BuildAttachmentRestoredAuditLogInput,
): CreateSystemAuditLogInput {
  return {
    actorUserId: input.actorId ?? null,
    actorRole: "customer_admin",
    companyId: input.companyId ?? null,
    targetType: "file",
    targetId: null,
    eventType: "file.restored",
    severity: "medium",
    summary: `첨부파일 복원: 문서 ${input.documentCount}개, 디자인 ${input.designCount}개`,
    metadata: {
      requestedCount: normalizeCount(input.requestedCount),
      affectedCount: normalizeCount(input.affectedCount),
      documentCount: normalizeCount(input.documentCount),
      designCount: normalizeCount(input.designCount),
    },
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
  };
}
