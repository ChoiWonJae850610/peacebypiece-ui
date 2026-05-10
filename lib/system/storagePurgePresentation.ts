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

export const SYSTEM_STORAGE_PURGE_COPY = {
  pageEyebrow: "SYSTEM STORAGE PURGE",
  pageTitle: "R2 실제 삭제 후보",
  pageDescription:
    "전 고객 공통 휴지통 정책에 따라 파일과 작업지시서 삭제 후보를 확인합니다. 작업지시서 후보는 대표 row로 표시하고, 실제 삭제 시 문서, 디자인, 메모를 같은 흐름에서 함께 처리합니다. 화면에서는 정상 삭제 흐름을 확인하고, R2 파일 없음·Worker 실패 같은 예외는 코드 처리 기준으로 점검합니다.",
  consoleLink: "시스템 콘솔",
  summary: {
    candidateTitle: "삭제 후보",
    retryTitle: "재시도 필요",
    originalSizeTitle: "원본 용량",
    thumbnailTitle: "썸네일 객체",
    fileUnit: "파일",
    workOrderUnit: "작업지시서",
    retryDescriptionPrefix: "Worker/권한/네트워크 실패로 다시 처리할 후보",
    sizeDescriptionPrefix: "파일 후보와 작업지시서 묶음 첨부 기준 · 고객사",
    thumbnailDescription: "R2 삭제 시 원본과 함께 처리 대상",
  },
  list: {
    title: "삭제 후보 목록",
    description:
      "파일 후보는 Worker로 R2에서 실제 삭제합니다. 작업지시서 후보는 대표 row로 표시하고, 실제 삭제 시 문서, 디자인, 메모를 함께 처리합니다. R2 파일 없음은 삭제 완료로 보고, Worker/권한/네트워크 실패만 재시도 후보로 남깁니다.",
    empty: "현재 R2 실제 삭제 후보가 없습니다.",
    refresh: "새로고침",
    pending: "처리 중",
    selectDelete: "선택 삭제",
    deleteAll: "전체삭제",
    currentSort: "현재 정렬",
    workOrderBundleMeta: "작업지시서 묶음",
    attachmentCount: "첨부",
    memoCount: "메모",
    sourceKeyTitle: "원본",
    thumbnailKeyTitle: "썸네일",
    keyHeader: "R2 key",
    companyWorkOrderHeader: "고객사 / 작업지시서",
    deletedAtLabel: "삭제일",
    purgeDueAtLabel: "예정일",
    overdueLabel: "경과",
    selectCandidateLabelSuffix: "삭제 후보 선택",
    previewAltSuffix: "미리보기",
    workOrderSourceHint: "작업지시서 묶음 후보",
    workOrderRetryHint: "실패 항목만 재시도",
  },
  confirm: {
    selectedPrefix: "선택한",
    selectedSuffix:
      "개 삭제 후보를 처리합니다. 작업지시서 후보는 문서, 디자인, 메모를 함께 처리합니다. R2 파일 없음은 삭제 완료로 보고, Worker/권한/네트워크 실패만 재시도 후보로 남깁니다. 이 작업은 되돌릴 수 없습니다. 계속할까요?",
    allDue:
      "삭제 예정일이 도래했거나 삭제 요청된 후보를 전체 처리합니다. 작업지시서 후보는 문서, 디자인, 메모를 함께 처리합니다. R2 파일 없음은 삭제 완료로 보고, Worker/권한/네트워크 실패만 재시도 후보로 남깁니다. 계속할까요?",
  },
  result: {
    selectedLabel: "선택 삭제 결과",
    allDueLabel: "전체 삭제 결과",
    failedSuffix: "실패. 실패한 R2 항목은 목록에 남아 재시도할 수 있습니다.",
    successSuffix: "후보 목록과 요약이 갱신됩니다.",
    selectedError: "선택 삭제 요청에 실패했습니다.",
    allDueError: "전체 삭제 요청에 실패했습니다.",
  },
  sort: {
    asc: "오름차순",
    desc: "내림차순",
  },
} as const;

export const SYSTEM_STORAGE_PURGE_SORT_LABELS = {
  kind: "구분",
  company: "고객사",
  target: "대상",
  deletedAt: "삭제일",
  purgeDueAt: "예정일",
  size: "용량",
  attachmentCount: "첨부",
  memoCount: "메모",
  status: "상태",
} as const;

export function buildSystemStorageSelectedPurgeConfirmMessage(selectedCount: number): string {
  return `${SYSTEM_STORAGE_PURGE_COPY.confirm.selectedPrefix} ${selectedCount}${SYSTEM_STORAGE_PURGE_COPY.confirm.selectedSuffix}`;
}

export function buildSystemStoragePurgeResultMessage(label: string, result: SystemStoragePurgeResponse): string {
  const purgedCount = result.purgedCount ?? 0;
  const failedCount = result.failedCount ?? 0;
  if (failedCount > 0) {
    return `${label}: ${purgedCount}개 삭제 완료, ${failedCount}개 ${SYSTEM_STORAGE_PURGE_COPY.result.failedSuffix}`;
  }
  return `${label}: ${purgedCount}개 삭제 완료. ${SYSTEM_STORAGE_PURGE_COPY.result.successSuffix}`;
}

export function getSystemStoragePurgeResultTone(result: SystemStoragePurgeResponse): "success" | "warning" {
  return (result.failedCount ?? 0) > 0 ? "warning" : "success";
}

export function getSystemStoragePurgeResultMessageClass(tone: SystemStoragePurgeResultTone): string {
  if (tone === "error") return "bg-red-50 text-red-700 ring-1 ring-red-100";
  if (tone === "warning") return "bg-amber-50 text-amber-800 ring-1 ring-amber-100";
  return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
}

export function getSystemStorageSortDirectionLabel(direction: "asc" | "desc"): string {
  return direction === "asc" ? SYSTEM_STORAGE_PURGE_COPY.sort.asc : SYSTEM_STORAGE_PURGE_COPY.sort.desc;
}

export function buildSystemStorageWorkOrderBundleMetaLabel(input: { documentCount: number; designCount: number; memoCount: number }): string {
  return `${SYSTEM_STORAGE_PURGE_COPY.list.workOrderBundleMeta} · 문서 ${input.documentCount}개 · 디자인 ${input.designCount}개 · ${SYSTEM_STORAGE_PURGE_COPY.list.memoCount} ${input.memoCount}개`;
}

export function getSystemStorageCandidateKindLabel(kind: SystemStoragePurgeCandidateKind): string {
  return kind === "workorder" ? SYSTEM_STORAGE_PURGE_COPY.summary.workOrderUnit : SYSTEM_STORAGE_PURGE_COPY.summary.fileUnit;
}
