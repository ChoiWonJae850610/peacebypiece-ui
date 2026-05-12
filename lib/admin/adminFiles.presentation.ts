import {
  selectAdminTrashItemsByIds as selectAdminTrashItemsByIdsFromPolicy,
} from "@/lib/admin/files/trashPolicy";
import type {
  AdminFileDataSource,
  AdminFileSortKey,
  AdminStorageFileKind,
  AdminFileTabItem,
  AdminFileUsageCard,
  AdminManagedFileItem,
  AdminStoragePolicyItem,
  AdminStoragePolicySettings,
  AdminStorageUsageSummary,
  AdminStorageWorkOrderItem,
  AdminTrashActionResultSummary,
  AdminTrashActionType,
  AdminTrashFileItem,
} from "@/lib/admin/adminFiles.types";
import { COMPANY_FILE_TRASH_RETENTION_DAYS } from "@/lib/admin/settings/companyDefaults";
import { buildResolvedStorageUsageSummary, getDefaultAdminStorageQuotaPolicy } from "@/lib/billing/storageQuotaPolicy";

export type { AdminFileTabKey } from "@/lib/admin/adminFiles.types";


export function getAdminStorageFileKind(fileType: string | null | undefined): AdminStorageFileKind {
  return fileType === "디자인" ? "design" : "document";
}

function formatTrashActionCount(label: string, count: number, unit: "건" | "개"): string {
  return `${label} ${count}${unit}`;
}

function joinTrashActionCountParts(parts: string[], hasWorkOrder: boolean): string {
  if (parts.length === 0) return "";
  if (!hasWorkOrder || parts.length === 1) return parts.join(", ");
  const [workOrderPart, ...restParts] = parts;
  return `${workOrderPart}과 ${restParts.join(", ")}`;
}


export function createEmptyAdminSelectionMessage(actionLabel: string): string {
  return `${actionLabel}할 항목을 먼저 선택해야 합니다.`;
}

export function createAdminMoveToTrashMessage(
  successCount: number,
  hasPartialFailure: boolean,
): string {
  const baseMessage = `문서/디자인 ${successCount}개를 휴지통으로 이동했습니다.`;
  return hasPartialFailure
    ? `${baseMessage} 일부 항목은 처리하지 못했습니다.`
    : baseMessage;
}

export function createAdminPurgeWorkerResultMessage(input: {
  dryRun: boolean;
  candidateCount: number;
  purgedCount: number;
  failedCount: number;
}): string {
  if (input.dryRun) {
    return `dryRun 결과: 실제 삭제 가능 후보 ${input.candidateCount}개를 확인했습니다.`;
  }
  return `실제 삭제 결과: 후보 ${input.candidateCount}개 중 ${input.purgedCount}개 삭제 완료, ${input.failedCount}개 실패.`;
}

export function createAdminFilePolicyResultMessage(input: {
  ok: boolean;
  detail?: string | null;
}): string {
  if (input.ok) return "파일/용량 정책을 저장했습니다.";
  return input.detail
    ? `파일 정책 저장 실패: ${input.detail}`
    : "파일 정책 저장 실패";
}

export function createEmptyAdminTrashActionSummary(): AdminTrashActionResultSummary {
  return {
    workOrderCount: 0,
    documentCount: 0,
    designCount: 0,
    memoCount: 0,
    skippedCount: 0,
  };
}

export function mergeAdminTrashActionSummaries(
  summaries: AdminTrashActionResultSummary[],
): AdminTrashActionResultSummary {
  return summaries.reduce<AdminTrashActionResultSummary>(
    (merged, summary) => ({
      workOrderCount: merged.workOrderCount + summary.workOrderCount,
      documentCount: merged.documentCount + summary.documentCount,
      designCount: merged.designCount + summary.designCount,
      memoCount: merged.memoCount + summary.memoCount,
      skippedCount: (merged.skippedCount ?? 0) + (summary.skippedCount ?? 0),
    }),
    createEmptyAdminTrashActionSummary(),
  );
}

export function createAdminTrashActionMessage(
  action: AdminTrashActionType,
  summary: AdminTrashActionResultSummary,
): string {
  const actionLabel = action === "restore" ? "복원하였습니다" : "삭제 요청하였습니다";
  const hasWorkOrder = summary.workOrderCount > 0;
  const parts = hasWorkOrder
    ? [
        formatTrashActionCount("작업지시서", summary.workOrderCount, "건"),
        formatTrashActionCount("문서", summary.documentCount, "개"),
        formatTrashActionCount("디자인", summary.designCount, "개"),
        formatTrashActionCount("메모", summary.memoCount, "개"),
      ]
    : [
        summary.documentCount > 0
          ? formatTrashActionCount("문서", summary.documentCount, "개")
          : null,
        summary.designCount > 0
          ? formatTrashActionCount("디자인", summary.designCount, "개")
          : null,
        summary.memoCount > 0
          ? formatTrashActionCount("메모", summary.memoCount, "개")
          : null,
      ].filter((part): part is string => Boolean(part));

  const baseMessage = parts.length > 0
    ? `${joinTrashActionCountParts(parts, hasWorkOrder)}를 ${actionLabel}.`
    : action === "restore"
      ? "복원 가능한 선택 항목이 없습니다."
      : "삭제 요청 가능한 선택 항목이 없습니다.";

  if (!summary.skippedCount || summary.skippedCount <= 0) return baseMessage;
  const skippedLabel = action === "restore"
    ? "복원할 수 없는 항목"
    : "삭제 요청할 수 없는 항목";
  return `${baseMessage} ${skippedLabel} ${summary.skippedCount}개는 제외했습니다.`;
}


export function createAdminWorkOrderTrashActionMessage(input: {
  action: AdminTrashActionType;
  documentCount: number;
  designCount: number;
  memoCount: number;
}): string {
  return createAdminTrashActionMessage(input.action, {
    workOrderCount: 1,
    documentCount: input.documentCount,
    designCount: input.designCount,
    memoCount: input.memoCount,
    skippedCount: 0,
  });
}

export function createAdminWorkOrderTrashIdRequiredMessage(): string {
  return "작업지시서 ID가 없어 작업지시서 단위 처리를 실행할 수 없습니다.";
}

export function createAdminWorkOrderTrashNotConnectedMessage(action: AdminTrashActionType): string {
  return action === "restore"
    ? "작업지시서 복원 API는 아직 실제 DB 복원 로직에 연결되지 않았습니다. 작업지시서와 문서/디자인/메모를 같은 트랜잭션에서 복원해야 합니다."
    : "작업지시서 선택 삭제 API는 아직 실제 DB/R2 처리 로직에 연결되지 않았습니다. R2 삭제는 Worker 기반 purge 흐름만 사용해야 합니다.";
}

export function createAdminWorkOrderTrashNotFoundMessage(action: AdminTrashActionType): string {
  return action === "restore"
    ? "복원할 삭제 상태 작업지시서를 찾지 못했습니다."
    : "선택 삭제할 삭제 상태 작업지시서를 찾지 못했습니다.";
}

export function createAdminTrashFileActionSummary(
  items: AdminTrashFileItem[],
  affectedCount: number,
): AdminTrashActionResultSummary {
  const selectedItems = items.slice(0, Math.max(0, affectedCount));
  return selectedItems.reduce<AdminTrashActionResultSummary>(
    (summary, item) => ({
      ...summary,
      documentCount: summary.documentCount + (item.fileKind === "document" ? 1 : 0),
      designCount: summary.designCount + (item.fileKind === "design" ? 1 : 0),
    }),
    createEmptyAdminTrashActionSummary(),
  );
}

const ADMIN_FILE_FALLBACK_ACTIVE_BYTES = 2 * 1024 ** 3;
const ADMIN_FILE_FALLBACK_USAGE = buildResolvedStorageUsageSummary({
  activeBytes: ADMIN_FILE_FALLBACK_ACTIVE_BYTES,
  trashBytes: 0,
  quotaPolicy: getDefaultAdminStorageQuotaPolicy(true),
});

export const ADMIN_FILE_USAGE_SUMMARY: AdminStorageUsageSummary = {
  usedBytes: ADMIN_FILE_FALLBACK_USAGE.usedBytes,
  limitBytes: ADMIN_FILE_FALLBACK_USAGE.limitBytes,
  usedLabel: ADMIN_FILE_FALLBACK_USAGE.usedLabel,
  limitLabel: ADMIN_FILE_FALLBACK_USAGE.limitLabel,
  usagePercent: ADMIN_FILE_FALLBACK_USAGE.usagePercent,
  statusLabel: ADMIN_FILE_FALLBACK_USAGE.statusLabel,
  statusTone: ADMIN_FILE_FALLBACK_USAGE.statusTone,
};

export const ADMIN_FILE_USAGE_CARDS: AdminFileUsageCard[] = [
  { label: "전체 사용량", value: `${ADMIN_FILE_USAGE_SUMMARY.usedLabel} / ${ADMIN_FILE_USAGE_SUMMARY.limitLabel}`, description: "휴지통 보관 파일 포함" },
  { label: "첨부파일", value: "3개", description: "작업지시서에 연결된 이미지, PDF, 기타 파일" },
  { label: "휴지통", value: "2개", description: "소프트 삭제 후 보관 중인 파일" },
  { label: "삭제 요청", value: "0개", description: "0MB 처리 대기" },
];

export const ADMIN_FILE_TABS: AdminFileTabItem[] = [
  {
    key: "trash",
    label: "휴지통",
    description: "삭제된 작업지시서와 첨부파일을 한 목록에서 복원·삭제 요청 정책에 따라 확인",
  },
];

export const ADMIN_FILE_SORT_OPTIONS: { key: AdminFileSortKey; label: string }[] = [
  { key: "latest", label: "최신순" },
  { key: "size", label: "용량순" },
  { key: "workorder", label: "작업지시서명순" },
];

export const ADMIN_FILE_LIST_PLACEHOLDERS: AdminManagedFileItem[] = [
  {
    id: "sample-attachment-1",
    workorderId: "sample-workorder-1",
    workorderTitle: "샘플 작업지시서 A",
    fileName: "design-reference.png",
    fileType: "디자인",
    fileKind: "design",
    fileIcon: "IMG",
    fileSizeBytes: 7340032,
    fileSizeLabel: "7MB",
    uploadedAt: "2026-04-27",
    uploadedBy: "관리자",
    status: "active",
    statusLabel: "사용중",
    deletedAt: null,
    deletedBy: null,
    purgeAfterAt: null,
  },
  {
    id: "sample-attachment-2",
    workorderId: "sample-workorder-2",
    workorderTitle: "샘플 작업지시서 B",
    fileName: "production-note.pdf",
    fileType: "문서",
    fileKind: "document",
    fileIcon: "PDF",
    fileSizeBytes: 18874368,
    fileSizeLabel: "18MB",
    uploadedAt: "2026-04-26",
    uploadedBy: "디자이너",
    status: "active",
    statusLabel: "사용중",
    deletedAt: null,
    deletedBy: null,
    purgeAfterAt: null,
  },
  {
    id: "sample-attachment-3",
    workorderId: "sample-workorder-3",
    workorderTitle: "샘플 작업지시서 C",
    fileName: "factory-reference.xlsx",
    fileType: "문서",
    fileKind: "document",
    fileIcon: "FILE",
    fileSizeBytes: 2097152,
    fileSizeLabel: "2MB",
    uploadedAt: "2026-04-25",
    uploadedBy: "관리자",
    status: "active",
    statusLabel: "사용중",
    deletedAt: null,
    deletedBy: null,
    purgeAfterAt: null,
  },
];
export const ADMIN_FILE_WORKORDER_PLACEHOLDERS: AdminStorageWorkOrderItem[] = [];

export const ADMIN_FILE_TRASH_PLACEHOLDERS: AdminTrashFileItem[] = [
  {
    id: "sample-trash-1",
    attachmentId: "sample-attachment-4",
    workorderId: "sample-workorder-1",
    workorderTitle: "샘플 작업지시서 A",
    fileName: "removed-reference.pdf",
    fileType: "문서",
    fileKind: "document",
    fileIcon: "PDF",
    fileSizeBytes: 5242880,
    fileSizeLabel: "5MB",
    thumbnailUrl: null,
    previewUrl: null,
    deletedAt: "2026-04-24",
    deletedBy: "관리자",
    purgeAfterAt: "2026-05-24",
    restoreDaysLeft: 27,
    restoreLabel: "D-27",
    purgeStatus: "pending",
    purgeStatusLabel: "복원 가능",
    isPurgeReady: false,
    lastPurgeError: null,
    parentWorkOrderDeleted: false,
    restorePolicy: "file_unit",
    restorePolicyLabel: "파일 단위 처리 가능",
    canRestore: true,
    restoreDisabledReason: null,
    canPurge: true,
    purgeDisabledReason: null,
  },
  {
    id: "sample-trash-2",
    attachmentId: "sample-attachment-5",
    workorderId: "sample-workorder-2",
    workorderTitle: "샘플 작업지시서 B",
    fileName: "old-detail-image.jpg",
    fileType: "디자인",
    fileKind: "design",
    fileIcon: "IMG",
    fileSizeBytes: 9437184,
    fileSizeLabel: "9MB",
    thumbnailUrl: null,
    previewUrl: null,
    deletedAt: "2026-04-20",
    deletedBy: "관리자",
    purgeAfterAt: "2026-05-20",
    restoreDaysLeft: 23,
    restoreLabel: "D-23",
    purgeStatus: "pending",
    purgeStatusLabel: "복원 가능",
    isPurgeReady: false,
    lastPurgeError: null,
    parentWorkOrderDeleted: false,
    restorePolicy: "file_unit",
    restorePolicyLabel: "파일 단위 처리 가능",
    canRestore: true,
    restoreDisabledReason: null,
    canPurge: true,
    purgeDisabledReason: null,
  },
];


export const ADMIN_STORAGE_POLICY_SETTINGS: AdminStoragePolicySettings = {
  softDeleteEnabled: true,
  includeTrashInUsage: true,
  purgeAfterDays: COMPANY_FILE_TRASH_RETENTION_DAYS,
};

export const ADMIN_STORAGE_POLICY_ITEMS: AdminStoragePolicyItem[] = [
  {
    label: "삭제 방식",
    value: "휴지통",
    description: "삭제 시 R2 객체를 즉시 삭제하지 않고 휴지통 상태로 기록",
  },
  {
    label: "용량 계산",
    value: "휴지통 포함",
    description: "R2 원본이 실제 삭제되기 전까지 휴지통 파일도 사용량에 포함",
  },
  {
    label: "보관기간",
    value: `${COMPANY_FILE_TRASH_RETENTION_DAYS}일`,
    description: "전 고객 공통 30일 휴지통 보관 정책",
  },
];

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeAdminFilePolicySettings(filePolicy: { softDeleteEnabled?: unknown; includeTrashInUsage?: unknown; trashRetentionDays?: unknown }): AdminStoragePolicySettings {
  return {
    softDeleteEnabled: true,
    includeTrashInUsage: readBoolean(filePolicy.includeTrashInUsage, true),
    purgeAfterDays: COMPANY_FILE_TRASH_RETENTION_DAYS,
  };
}

export function buildAdminStoragePolicyItems(policySettings: AdminStoragePolicySettings): AdminStoragePolicyItem[] {
  return [
    {
      label: "삭제 방식",
      value: "휴지통",
      description: "삭제된 파일은 30일 동안 복원 가능하며 이후 R2 삭제 후보가 됩니다.",
    },
    {
      label: "용량 계산",
      value: policySettings.includeTrashInUsage ? "휴지통 포함" : "사용중 파일만",
      description: policySettings.includeTrashInUsage ? "R2 원본이 실제 삭제되기 전까지 휴지통 파일도 사용량에 포함합니다." : "휴지통 파일은 사용량 합산에서 제외합니다.",
    },
    {
      label: "보관기간",
      value: `${COMPANY_FILE_TRASH_RETENTION_DAYS}일`,
      description: "전 고객 공통 30일 기준으로 실제 삭제 후보가 되는 시점을 계산합니다.",
    },
  ];
}

export function sortAdminManagedFiles(items: AdminManagedFileItem[], sortKey: AdminFileSortKey): AdminManagedFileItem[] {
  return [...items].sort((a, b) => {
    if (sortKey === "size") {
      return b.fileSizeBytes - a.fileSizeBytes;
    }
    if (sortKey === "workorder") {
      return a.workorderTitle.localeCompare(b.workorderTitle, "ko");
    }
    return b.uploadedAt.localeCompare(a.uploadedAt);
  });
}

export function selectAdminManagedFilesByIds(items: AdminManagedFileItem[], selectedIds: string[]): AdminManagedFileItem[] {
  if (selectedIds.length === 0) return [];
  const selectedIdSet = new Set(selectedIds);
  return items.filter((item) => selectedIdSet.has(item.id));
}

export function selectAdminTrashItemsByIds(items: AdminTrashFileItem[], selectedIds: string[]): AdminTrashFileItem[] {
  return selectAdminTrashItemsByIdsFromPolicy(items, selectedIds);
}

export function toggleAdminSelectedId(currentIds: string[], targetId: string): string[] {
  return currentIds.includes(targetId) ? currentIds.filter((id) => id !== targetId) : [...currentIds, targetId];
}

export function buildAdminSelectAllIds<T extends { id: string }>(items: T[], currentIds: string[]): string[] {
  return currentIds.length === items.length ? [] : items.map((item) => item.id);
}

export function getAdminFilePolicySourceLabel(dataSource: AdminFileDataSource): string {
  return dataSource === "db" ? "company_settings DB" : "샘플 정책";
}

export function buildAdminFilePolicyUpdateInput(policySettings: AdminStoragePolicySettings) {
  return {
    filePolicy: {
      softDeleteEnabled: true,
      includeTrashInUsage: policySettings.includeTrashInUsage,
      trashRetentionDays: COMPANY_FILE_TRASH_RETENTION_DAYS,
    },
  };
}

export function buildAdminStoragePolicyBadges(policySettings: AdminStoragePolicySettings): { label: string; value: string }[] {
  return [
    { label: "삭제 방식", value: "휴지통" },
    { label: "용량 계산", value: policySettings.includeTrashInUsage ? "휴지통 포함" : "사용중 파일만" },
    { label: "파일 보관 기간", value: `${COMPANY_FILE_TRASH_RETENTION_DAYS}일 고정` },
  ];
}
