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

export type BuildInvitationCreatedAuditLogInput = {
  invitationId: string;
  scope: string;
  companyId?: string | null;
  recipientEmail?: string | null;
  recipientRole?: string | null;
  permissionPreset?: string | null;
  expiresAt?: string | null;
  createdByUserId?: string | null;
  createdBySystemUserId?: string | null;
  inviteUrlPath?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
};

export type BuildJoinRequestCreatedAuditLogInput = {
  joinRequestId: string;
  invitationId?: string | null;
  requestType: string;
  companyId?: string | null;
  applicantEmail?: string | null;
  applicantName?: string | null;
  requestedCompanyName?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
};

export type BuildCompanyCreatedAuditLogInput = {
  companyId: string;
  companyName?: string | null;
  businessName?: string | null;
  planCode?: string | null;
  storageLimitBytes?: number | null;
  actorId?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
};

export type BuildMemberApprovedAuditLogInput = {
  companyMemberId: string;
  companyId?: string | null;
  userId?: string | null;
  memberEmail?: string | null;
  memberName?: string | null;
  permissionCodes?: string[] | null;
  approvedBy?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
};

export type BuildMemberRejectedAuditLogInput = {
  joinRequestId: string;
  companyId?: string | null;
  userId?: string | null;
  applicantEmail?: string | null;
  applicantName?: string | null;
  rejectedBy?: string | null;
  reasonCode?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
};

export type BuildMemberPermissionUpdatedAuditLogInput = {
  companyMemberId: string;
  companyId?: string | null;
  userId?: string | null;
  memberEmail?: string | null;
  memberName?: string | null;
  previousPermissionCodes?: string[] | null;
  nextPermissionCodes?: string[] | null;
  updatedBy?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
};

export type BuildPlanChangedAuditLogInput = {
  companyId: string;
  companyName?: string | null;
  previousPlanCode?: string | null;
  nextPlanCode?: string | null;
  previousStorageLimitBytes?: number | null;
  nextStorageLimitBytes?: number | null;
  previousMemberLimit?: number | null;
  nextMemberLimit?: number | null;
  previousPriceKrw?: number | null;
  nextPriceKrw?: number | null;
  changedBy?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
};

function normalizePermissionCodes(value: string[] | null | undefined): string[] {
  return Array.from(
    new Set(
      (value || [])
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).sort();
}

function countChangedPermissions(previousCodes: string[], nextCodes: string[]) {
  const previousSet = new Set(previousCodes);
  const nextSet = new Set(nextCodes);

  return {
    added: nextCodes.filter((code) => !previousSet.has(code)),
    removed: previousCodes.filter((code) => !nextSet.has(code)),
  };
}

export function buildInvitationCreatedAuditLog(
  input: BuildInvitationCreatedAuditLogInput,
): CreateSystemAuditLogInput {
  const isSystemInvite = input.scope === "system_to_company_admin";

  return {
    actorUserId: input.createdBySystemUserId ?? input.createdByUserId ?? null,
    actorRole: isSystemInvite ? "system_admin" : "customer_admin",
    companyId: input.companyId ?? null,
    targetType: "invitation",
    targetId: input.invitationId,
    eventType: "invitation.created",
    severity: isSystemInvite ? "high" : "medium",
    summary: isSystemInvite ? "시스템관리자 고객사 초대 생성" : "고객관리자 멤버 초대 생성",
    metadata: {
      invitationId: input.invitationId,
      scope: input.scope,
      recipientEmail: input.recipientEmail ?? null,
      recipientRole: input.recipientRole ?? null,
      permissionPreset: input.permissionPreset ?? null,
      expiresAt: input.expiresAt ?? null,
      inviteUrlPath: input.inviteUrlPath ?? null,
      tokenStoredPolicy: "token_hash_only",
    },
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
  };
}

export function buildJoinRequestCreatedAuditLog(
  input: BuildJoinRequestCreatedAuditLogInput,
): CreateSystemAuditLogInput {
  const isCompanyRequest = input.requestType === "company";

  return {
    actorUserId: null,
    actorRole: "unknown",
    companyId: input.companyId ?? null,
    targetType: "invitation",
    targetId: input.joinRequestId,
    eventType: "join_request.created",
    severity: isCompanyRequest ? "high" : "medium",
    summary: isCompanyRequest ? "고객사 가입 신청 저장" : "멤버 가입 신청 저장",
    metadata: {
      joinRequestId: input.joinRequestId,
      invitationId: input.invitationId ?? null,
      requestType: input.requestType,
      applicantEmail: input.applicantEmail ?? null,
      applicantName: input.applicantName ?? null,
      requestedCompanyName: input.requestedCompanyName ?? null,
      tokenStoredPolicy: "token_hash_only",
    },
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
  };
}

export function buildCompanyCreatedAuditLog(
  input: BuildCompanyCreatedAuditLogInput,
): CreateSystemAuditLogInput {
  const companyName = input.companyName?.trim() || input.companyId;

  return {
    actorUserId: input.actorId ?? null,
    actorRole: "system_admin",
    companyId: input.companyId,
    targetType: "company",
    targetId: input.companyId,
    eventType: "company.created",
    severity: "high",
    summary: `고객사 생성: ${companyName}`,
    metadata: {
      companyId: input.companyId,
      companyName,
      businessName: input.businessName ?? null,
      planCode: input.planCode ?? null,
      storageLimitBytes: input.storageLimitBytes ?? null,
      source: "system-company-approval",
    },
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
  };
}

export function buildMemberApprovedAuditLog(
  input: BuildMemberApprovedAuditLogInput,
): CreateSystemAuditLogInput {
  const permissionCodes = normalizePermissionCodes(input.permissionCodes);
  const memberLabel = input.memberName?.trim() || input.memberEmail?.trim() || input.companyMemberId;

  return {
    actorUserId: input.approvedBy ?? null,
    actorRole: "customer_admin",
    companyId: input.companyId ?? null,
    targetType: "member",
    targetId: input.companyMemberId,
    eventType: "member.approved",
    severity: "high",
    summary: `멤버 승인: ${memberLabel}`,
    metadata: {
      companyMemberId: input.companyMemberId,
      userId: input.userId ?? null,
      memberEmail: input.memberEmail ?? null,
      memberName: input.memberName ?? null,
      permissionCount: permissionCodes.length,
      permissionCodes,
    },
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
  };
}

export function buildMemberRejectedAuditLog(
  input: BuildMemberRejectedAuditLogInput,
): CreateSystemAuditLogInput {
  const applicantLabel = input.applicantName?.trim() || input.applicantEmail?.trim() || input.joinRequestId;

  return {
    actorUserId: input.rejectedBy ?? null,
    actorRole: "customer_admin",
    companyId: input.companyId ?? null,
    targetType: "member",
    targetId: input.joinRequestId,
    eventType: "member.rejected",
    severity: "medium",
    summary: `가입 신청 거절: ${applicantLabel}`,
    metadata: {
      joinRequestId: input.joinRequestId,
      userId: input.userId ?? null,
      applicantEmail: input.applicantEmail ?? null,
      applicantName: input.applicantName ?? null,
      reasonCode: input.reasonCode ?? null,
    },
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
  };
}

export function buildMemberPermissionUpdatedAuditLog(
  input: BuildMemberPermissionUpdatedAuditLogInput,
): CreateSystemAuditLogInput {
  const previousPermissionCodes = normalizePermissionCodes(input.previousPermissionCodes);
  const nextPermissionCodes = normalizePermissionCodes(input.nextPermissionCodes);
  const changedPermissions = countChangedPermissions(previousPermissionCodes, nextPermissionCodes);
  const memberLabel = input.memberName?.trim() || input.memberEmail?.trim() || input.companyMemberId;

  return {
    actorUserId: input.updatedBy ?? null,
    actorRole: "customer_admin",
    companyId: input.companyId ?? null,
    targetType: "member",
    targetId: input.companyMemberId,
    eventType: "member.permission_updated",
    severity: "critical",
    summary: `멤버 권한 변경: ${memberLabel}`,
    metadata: {
      companyMemberId: input.companyMemberId,
      userId: input.userId ?? null,
      memberEmail: input.memberEmail ?? null,
      memberName: input.memberName ?? null,
      previousPermissionCount: previousPermissionCodes.length,
      nextPermissionCount: nextPermissionCodes.length,
      addedPermissionCodes: changedPermissions.added,
      removedPermissionCodes: changedPermissions.removed,
    },
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
  };
}

export function buildPlanChangedAuditLog(
  input: BuildPlanChangedAuditLogInput,
): CreateSystemAuditLogInput {
  const companyName = input.companyName?.trim() || input.companyId;

  return {
    actorUserId: input.changedBy ?? null,
    actorRole: "system_admin",
    companyId: input.companyId,
    targetType: "plan",
    targetId: input.companyId,
    eventType: "plan.changed",
    severity: "critical",
    summary: `고객사 요금제·용량 변경: ${companyName}`,
    metadata: {
      companyId: input.companyId,
      companyName,
      previousPlanCode: input.previousPlanCode ?? null,
      nextPlanCode: input.nextPlanCode ?? null,
      previousStorageLimitBytes: input.previousStorageLimitBytes ?? null,
      nextStorageLimitBytes: input.nextStorageLimitBytes ?? null,
      previousMemberLimit: input.previousMemberLimit ?? null,
      nextMemberLimit: input.nextMemberLimit ?? null,
      previousPriceKrw: input.previousPriceKrw ?? null,
      nextPriceKrw: input.nextPriceKrw ?? null,
    },
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
  };
}
