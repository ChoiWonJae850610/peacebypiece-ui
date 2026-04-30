export type AdminFinalAuditStatus = "passed" | "watch";

export type AdminFinalAuditItem = {
  key: "i18n" | "internalTerms" | "sampleDisplay" | "constants" | "version";
  label: string;
  status: AdminFinalAuditStatus;
  summary: string;
  detail: string;
};

export type AdminFinalAuditSummary = {
  passedCount: number;
  watchCount: number;
  totalCount: number;
  items: readonly AdminFinalAuditItem[];
};

const ADMIN_FINAL_AUDIT_ITEMS: readonly AdminFinalAuditItem[] = [
  { key: "i18n", label: "관리자 문구", status: "watch", summary: "주요 문구 분리 완료 · 세부 문구 회귀 점검 유지", detail: "히스토리, 설정 모달, 저장소 카드의 고객 노출 문구를 계속 admin i18n 기준으로 점검합니다." },
  { key: "internalTerms", label: "내부 상태값 노출", status: "watch", summary: "화면 라벨은 운영 문구로 전환 · 코드 키는 내부값으로만 유지", detail: "draft, pending 같은 내부 키는 presentation/i18n을 거친 한글 라벨로만 표시합니다." },
  { key: "sampleDisplay", label: "샘플/대체 데이터 표시", status: "watch", summary: "고객 화면은 완곡한 운영 문구 사용", detail: "테스트 데이터와 대체 데이터 단어는 고객사 관리자 화면에 직접 노출하지 않고 점검 패널에서도 한글 운영 문구로 표시합니다." },
  { key: "constants", label: "상수/표시 함수", status: "passed", summary: "관리자 표시 기준은 presentation 계층 중심으로 유지", detail: "상태, 권한, 데이터 기준 라벨은 컴포넌트 직접 조합보다 presentation/helper를 우선 사용합니다." },
  { key: "version", label: "버전 동기화", status: "passed", summary: "APP_VERSION 갱신 대상", detail: "작업 결과 버전은 lib/constants/app.ts의 APP_VERSION 값과 commit-meta.md에 함께 기록합니다." },
];

export function getAdminFinalAuditSummary(): AdminFinalAuditSummary {
  const items = ADMIN_FINAL_AUDIT_ITEMS;
  return {
    passedCount: items.filter((item) => item.status === "passed").length,
    watchCount: items.filter((item) => item.status === "watch").length,
    totalCount: items.length,
    items,
  };
}
