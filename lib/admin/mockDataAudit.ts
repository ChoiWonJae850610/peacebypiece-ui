export type AdminMockAuditStatus = "remove-ready" | "seed-retained" | "fixture-isolated" | "blocked";

export type AdminMockAuditItem = {
  key: string;
  label: string;
  status: AdminMockAuditStatus;
  summary: string;
  detail: string;
  nextAction: string;
};

export type AdminMockAuditSummary = {
  removeReadyCount: number;
  seedRetainedCount: number;
  fixtureIsolatedCount: number;
  blockedCount: number;
  items: readonly AdminMockAuditItem[];
};

const ADMIN_MOCK_AUDIT_ITEMS: readonly AdminMockAuditItem[] = [
  {
    key: "system-sample-page",
    label: "시스템 관리자 샘플 화면",
    status: "seed-retained",
    summary: "초기값 유지",
    detail: "/system 화면은 고객사 생성/초대 플로우 구현 전까지 샘플 운영 데이터가 필요합니다.",
    nextAction: "시스템 관리자 실제 DB 플로우 도입 후 샘플 데이터를 별도 seed로 분리합니다.",
  },
  {
    key: "settings-user-access-preview",
    label: "환경설정 권한 미리보기",
    status: "fixture-isolated",
    summary: "fixture 격리 유지",
    detail: "권한 버튼과 중앙 policy 결과 확인용 fixture는 실제 고객 화면이 아닌 테스트 경로로 격리합니다.",
    nextAction: "실제 사용자 조회가 안정화되면 fixture 사용 범위를 테스트 전용으로만 유지하거나 제거합니다.",
  },
  {
    key: "partner-master-defaults",
    label: "협력업체 기준 기본값",
    status: "seed-retained",
    summary: "기본값 유지",
    detail: "외주 공정, 단위, 품목 기본값은 신규 회사 초기 설정을 위한 초기값 후보입니다.",
    nextAction: "샘플 명칭 대신 회사 기본 초기값으로 명확히 분리합니다.",
  },
  {
    key: "admin-dashboard-empty-state",
    label: "관리자 운영 통계 대체 표시",
    status: "remove-ready",
    summary: "제거 가능",
    detail: "DB 조회 실패 시 고객사 관리자 화면에는 mock 통계 대신 0건/조회 실패 안내만 표시하는 방향이 맞습니다.",
    nextAction: "운영 통계 화면에서 샘플 수치가 남아 있으면 제거합니다.",
  },
  {
    key: "workorder-fixtures",
    label: "작업지시서 fixture 데이터",
    status: "fixture-isolated",
    summary: "fixture 격리 유지",
    detail: "작업지시서 로컬 개발/회귀 테스트용 fixture는 실제 고객 화면에 연결하지 않고 테스트/초기값 경로로 격리합니다.",
    nextAction: "고객 화면에는 노출하지 않고 테스트/초기값 경로로만 격리합니다.",
  },
];

export function getAdminMockAuditSummary(): AdminMockAuditSummary {
  const items = ADMIN_MOCK_AUDIT_ITEMS;

  return {
    removeReadyCount: items.filter((item) => item.status === "remove-ready").length,
    seedRetainedCount: items.filter((item) => item.status === "seed-retained").length,
    fixtureIsolatedCount: items.filter((item) => item.status === "fixture-isolated").length,
    blockedCount: items.filter((item) => item.status === "blocked").length,
    items,
  };
}

export function formatAdminMockAuditSummary(summary: AdminMockAuditSummary): string {
  return `제거 가능 ${summary.removeReadyCount}개 · 초기값 유지 ${summary.seedRetainedCount}개 · fixture 격리 유지 ${summary.fixtureIsolatedCount}개`;
}
