import type { WorkOrderStatus } from "@/lib/apiTypes";

const WORK_ORDER_STATUS_LABELS: Readonly<Record<WorkOrderStatus, string>> = {
  draft: "작성 중",
  ready_to_issue: "발행 준비",
  issued: "발행됨",
  revised: "정정 작성 중",
  completed: "완료",
  cancelled: "취소",
};

const PRODUCT_TYPE_LABELS: Readonly<Record<string, string>> = {
  "apparel.top": "상의",
  "apparel.bottom": "하의",
  "apparel.outer": "아우터",
  "apparel.onepiece_set": "원피스·세트",
  "underwear.innerwear": "언더웨어·이너웨어",
  "underwear.sleepwear": "슬립웨어",
};

const REVISION_STATUS_LABELS: Readonly<Record<string, string>> = {
  draft: "작성 중",
  finalized: "확정됨",
  superseded: "이전 확정본",
};

const DOCUMENT_STATUS_LABELS: Readonly<Record<string, string>> = {
  pending: "생성 대기",
  generated: "생성 완료",
  failed: "생성 실패",
  revoked: "공유 취소",
  deleted: "삭제됨",
};

export function formatWorkOrderStatus(status: WorkOrderStatus) {
  return WORK_ORDER_STATUS_LABELS[status];
}

export function formatProductType(alias: string | null, code: string | null) {
  const displayAlias = alias?.trim();
  if (displayAlias) return displayAlias;
  const normalizedCode = code?.trim();
  if (!normalizedCode) return "미지정";
  return PRODUCT_TYPE_LABELS[normalizedCode] ?? "제품 유형 확인 필요";
}

export function formatRevisionStatus(status: string) {
  return REVISION_STATUS_LABELS[status.trim()] ?? "상태 확인 필요";
}

export function formatDocumentStatus(status: string | null) {
  if (!status) return "발행 전";
  return DOCUMENT_STATUS_LABELS[status.trim()] ?? "상태 확인 필요";
}
