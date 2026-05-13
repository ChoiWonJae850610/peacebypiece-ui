import type { SystemStoragePurgeCandidateKind } from "@/lib/system/storagePurgeCandidates";

export type SystemStoragePurgeResultTone = "success" | "warning" | "error" | null;

export type SystemStoragePurgeResponse = {
  ok: boolean;
  candidateCount?: number;
  purgedCount?: number;
  failedCount?: number;
  message?: string;
  error?: string;
};

type SystemStoragePurgeTranslateParams = Record<string, string | number>;

export type SystemStoragePurgeTranslator = (
  path: string,
  fallback?: string,
  params?: SystemStoragePurgeTranslateParams,
) => string;

function fallbackTranslate(path: string, fallback = path, params?: SystemStoragePurgeTranslateParams) {
  if (!params) return fallback;
  return Object.entries(params).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, String(value)), fallback);
}

export function buildSystemStoragePurgeCopy(t: SystemStoragePurgeTranslator = fallbackTranslate) {
  return {
    pageEyebrow: t("storageUsage.pageEyebrow", "SYSTEM STORAGE PURGE"),
    pageTitle: t("storageUsage.pageTitle", "R2 실제 삭제 후보"),
    pageDescription: t(
      "storageUsage.pageDescription",
      "전 고객 공통 휴지통 정책에 따라 파일과 작업지시서 삭제 후보를 확인합니다. 작업지시서 후보는 대표 row로 표시하고, 실제 삭제 시 문서, 디자인, 메모를 같은 흐름에서 함께 처리합니다. 화면에서는 정상 삭제 흐름을 확인하고, R2 파일 없음·Worker 실패 같은 예외는 코드 처리 기준으로 점검합니다.",
    ),
    consoleLink: t("storageUsage.consoleLink", "시스템 콘솔"),
    summary: {
      candidateTitle: t("storageUsage.summary.candidateTitle", "삭제 후보"),
      retryTitle: t("storageUsage.summary.retryTitle", "재시도 필요"),
      originalSizeTitle: t("storageUsage.summary.originalSizeTitle", "원본 용량"),
      thumbnailTitle: t("storageUsage.summary.thumbnailTitle", "썸네일 객체"),
      quotaTitle: t("storageUsage.summary.quotaTitle", "기본 용량 기준"),
      fileUnit: t("storageUsage.summary.fileUnit", "파일"),
      workOrderUnit: t("storageUsage.summary.workOrderUnit", "작업지시서"),
      retryDescriptionPrefix: t("storageUsage.summary.retryDescriptionPrefix", "Worker/권한/네트워크 실패로 다시 처리할 후보"),
      sizeDescriptionPrefix: t("storageUsage.summary.sizeDescriptionPrefix", "파일 후보와 작업지시서 묶음 첨부 기준 · 고객사"),
      thumbnailDescription: t("storageUsage.summary.thumbnailDescription", "R2 삭제 시 원본과 함께 처리 대상"),
      quotaDescription: t("storageUsage.summary.quotaDescription", "admin/files와 system/storage-usage가 같은 중앙 quota 정책을 참조합니다."),
    },
    list: {
      title: t("storageUsage.list.title", "삭제 후보 목록"),
      description: t(
        "storageUsage.list.description",
        "파일 후보는 Worker로 R2에서 실제 삭제합니다. 작업지시서 후보는 대표 row로 표시하고, 실제 삭제 시 문서, 디자인, 메모를 함께 처리합니다. R2 파일 없음은 삭제 완료로 보고, Worker/권한/네트워크 실패만 재시도 후보로 남깁니다.",
      ),
      empty: t("storageUsage.list.empty", "현재 R2 실제 삭제 후보가 없습니다."),
      emptyDescription: t("storageUsage.list.emptyDescription", "고객관리자가 영구삭제를 요청했거나 30일 보관 기간이 지난 파일이 생기면 이 목록에 표시됩니다."),
      refresh: t("storageUsage.list.refresh", "새로고침"),
      pending: t("storageUsage.list.pending", "처리 중"),
      selectDelete: t("storageUsage.list.selectDelete", "선택 삭제"),
      deleteAll: t("storageUsage.list.deleteAll", "전체삭제"),
      currentSort: t("storageUsage.list.currentSort", "현재 정렬"),
      workOrderBundleMeta: t("storageUsage.list.workOrderBundleMeta", "작업지시서 묶음"),
      attachmentCount: t("storageUsage.list.attachmentCount", "첨부"),
      memoCount: t("storageUsage.list.memoCount", "메모"),
      sourceKeyTitle: t("storageUsage.list.sourceKeyTitle", "원본"),
      thumbnailKeyTitle: t("storageUsage.list.thumbnailKeyTitle", "썸네일"),
      keyHeader: t("storageUsage.list.keyHeader", "R2 key"),
      companyWorkOrderHeader: t("storageUsage.list.companyWorkOrderHeader", "고객사 / 작업지시서"),
      deletedAtLabel: t("storageUsage.list.deletedAtLabel", "삭제일"),
      purgeDueAtLabel: t("storageUsage.list.purgeDueAtLabel", "예정일"),
      overdueLabel: t("storageUsage.list.overdueLabel", "경과"),
      selectCandidateLabelSuffix: t("storageUsage.list.selectCandidateLabelSuffix", "삭제 후보 선택"),
      previewAltSuffix: t("storageUsage.list.previewAltSuffix", "미리보기"),
      workOrderSourceHint: t("storageUsage.list.workOrderSourceHint", "작업지시서 묶음 후보"),
      workOrderRetryHint: t("storageUsage.list.workOrderRetryHint", "실패 항목만 재시도"),
    },
    confirm: {
      selectedPrefix: t("storageUsage.confirm.selectedPrefix", "선택한"),
      selectedSuffix: t(
        "storageUsage.confirm.selectedSuffix",
        "개 삭제 후보를 처리합니다. 작업지시서 후보는 문서, 디자인, 메모를 함께 처리합니다. R2 파일 없음은 삭제 완료로 보고, Worker/권한/네트워크 실패만 재시도 후보로 남깁니다. 이 작업은 되돌릴 수 없습니다. 계속할까요?",
      ),
      allDue: t(
        "storageUsage.confirm.allDue",
        "삭제 예정일이 도래했거나 삭제 요청된 후보를 전체 처리합니다. 작업지시서 후보는 문서, 디자인, 메모를 함께 처리합니다. R2 파일 없음은 삭제 완료로 보고, Worker/권한/네트워크 실패만 재시도 후보로 남깁니다. 계속할까요?",
      ),
    },
    result: {
      selectedLabel: t("storageUsage.result.selectedLabel", "선택 삭제 결과"),
      allDueLabel: t("storageUsage.result.allDueLabel", "전체 삭제 결과"),
      failedSuffix: t("storageUsage.result.failedSuffix", "실패. 실패한 R2 항목은 목록에 남아 재시도할 수 있습니다."),
      successSuffix: t("storageUsage.result.successSuffix", "후보 목록과 요약이 갱신됩니다."),
      selectedError: t("storageUsage.result.selectedError", "선택 삭제 요청에 실패했습니다."),
      allDueError: t("storageUsage.result.allDueError", "전체 삭제 요청에 실패했습니다."),
      deletedResult: t("storageUsage.result.deletedResult", "{label}: {purgedCount}개 삭제 완료."),
      failedResult: t("storageUsage.result.failedResult", "{label}: {purgedCount}개 삭제 완료, {failedCount}개 {failedSuffix}"),
    },
    sort: buildSystemStoragePurgeSortLabels(t),
  } as const;
}

export const SYSTEM_STORAGE_PURGE_COPY = buildSystemStoragePurgeCopy();

export function buildSystemStoragePurgeSortLabels(t: SystemStoragePurgeTranslator = fallbackTranslate) {
  return {
    kind: t("storageUsage.sort.kind", "구분"),
    company: t("storageUsage.sort.company", "고객사"),
    target: t("storageUsage.sort.target", "대상"),
    deletedAt: t("storageUsage.sort.deletedAt", "삭제일"),
    purgeDueAt: t("storageUsage.sort.purgeDueAt", "예정일"),
    size: t("storageUsage.sort.size", "용량"),
    attachmentCount: t("storageUsage.sort.attachmentCount", "첨부"),
    memoCount: t("storageUsage.sort.memoCount", "메모"),
    status: t("storageUsage.sort.status", "상태"),
  } as const;
}

export const SYSTEM_STORAGE_PURGE_SORT_LABELS = buildSystemStoragePurgeSortLabels();

export type SystemStoragePurgeCopy = ReturnType<typeof buildSystemStoragePurgeCopy>;

export function buildSystemStorageSelectedPurgeConfirmMessage(selectedCount: number, copy: SystemStoragePurgeCopy = SYSTEM_STORAGE_PURGE_COPY): string {
  return `${copy.confirm.selectedPrefix} ${selectedCount}${copy.confirm.selectedSuffix}`;
}

export function buildSystemStoragePurgeResultMessage(label: string, result: SystemStoragePurgeResponse, copy: SystemStoragePurgeCopy = SYSTEM_STORAGE_PURGE_COPY): string {
  const purgedCount = result.purgedCount ?? 0;
  const failedCount = result.failedCount ?? 0;
  if (failedCount > 0) {
    return copy.result.failedResult
      .replace("{label}", label)
      .replace("{purgedCount}", String(purgedCount))
      .replace("{failedCount}", String(failedCount))
      .replace("{failedSuffix}", copy.result.failedSuffix);
  }
  return `${copy.result.deletedResult.replace("{label}", label).replace("{purgedCount}", String(purgedCount))} ${copy.result.successSuffix}`;
}

export function getSystemStoragePurgeResultTone(result: SystemStoragePurgeResponse): "success" | "warning" {
  return (result.failedCount ?? 0) > 0 ? "warning" : "success";
}

export function getSystemStoragePurgeResultMessageClass(tone: SystemStoragePurgeResultTone): string {
  if (tone === "error") return "bg-red-50 text-red-700 ring-1 ring-red-100";
  if (tone === "warning") return "bg-amber-50 text-amber-800 ring-1 ring-amber-100";
  return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
}

export function getSystemStorageSortDirectionLabel(direction: "asc" | "desc", t: SystemStoragePurgeTranslator = fallbackTranslate): string {
  return direction === "asc" ? t("storageUsage.sort.asc", "오름차순") : t("storageUsage.sort.desc", "내림차순");
}

export function buildSystemStorageWorkOrderBundleMetaLabel(
  input: { documentCount: number; designCount: number; memoCount: number },
  copy: SystemStoragePurgeCopy = SYSTEM_STORAGE_PURGE_COPY,
): string {
  return `${copy.list.workOrderBundleMeta} · 문서 ${input.documentCount}개 · 디자인 ${input.designCount}개 · ${copy.list.memoCount} ${input.memoCount}개`;
}

export function getSystemStorageCandidateKindLabel(kind: SystemStoragePurgeCandidateKind, copy: SystemStoragePurgeCopy = SYSTEM_STORAGE_PURGE_COPY): string {
  return kind === "workorder" ? copy.summary.workOrderUnit : copy.summary.fileUnit;
}
