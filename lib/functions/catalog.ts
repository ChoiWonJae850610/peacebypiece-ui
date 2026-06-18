export type WaflFunctionCategory =
  | "normal"
  | "exception"
  | "permission"
  | "database"
  | "tenant"
  | "responsive"
  | "performance"
  | "pdf";

export type WaflAutomationStatus = "planned" | "partial" | "automated" | "manual" | "decision-required";

export type WaflFunctionItem = {
  id: string;
  order: string;
  area: string;
  route: string;
  title: string;
  description: string;
  category: WaflFunctionCategory;
  roles: string[];
  automationStatus: WaflAutomationStatus;
  releaseBlocking: boolean;
  preconditions: string[];
  expectedUi: string[];
  expectedApi: string[];
  expectedDbChanges: string[];
  expectedDbUnchanged: string[];
};

export const WAFL_FUNCTION_CATEGORY_LABELS: Record<WaflFunctionCategory, string> = {
  normal: "정상 흐름",
  exception: "예외 흐름",
  permission: "권한",
  database: "DB 무결성",
  tenant: "회사 격리",
  responsive: "반응형",
  performance: "성능",
  pdf: "PDF",
};

export const WAFL_AUTOMATION_STATUS_LABELS: Record<WaflAutomationStatus, string> = {
  planned: "자동화 예정",
  partial: "부분 자동화",
  automated: "자동화 완료",
  manual: "수동 확인",
  "decision-required": "정책 결정 필요",
};

const item = (value: WaflFunctionItem): WaflFunctionItem => value;

export const WAFL_FUNCTION_CATALOG: WaflFunctionItem[] = [
  item({
    id: "WKR-001-N01", order: "1-1", area: "작업지시서", route: "/worker", title: "작업지시서 목록 정상 조회",
    description: "현재 회사의 작업지시서 목록을 조회하고 첫 화면 상태를 표시한다.", category: "normal", roles: ["admin", "member"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["현재 회사에 작업지시서가 존재함"], expectedUi: ["목록 카드 표시", "선택 문서 상세 표시"], expectedApi: ["목록 API 200"], expectedDbChanges: [], expectedDbUnchanged: ["전체 작업지시서 데이터"],
  }),
  item({
    id: "WKR-002-D01", order: "1-2", area: "작업지시서", route: "/worker", title: "납기일만 변경",
    description: "납기일 PATCH 후 허용된 감사 필드 외 다른 필드가 변경되지 않는지 확인한다.", category: "database", roles: ["admin", "member"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["수정 가능한 작업지시서 존재"], expectedUi: ["변경 납기일 표시", "저장 완료 표시"], expectedApi: ["PATCH 200"], expectedDbChanges: ["due_date", "updated_at", "updated_by"], expectedDbUnchanged: ["name", "status", "company_id", "inventory"],
  }),
  item({
    id: "WKR-003-E01", order: "1-3", area: "작업지시서", route: "/worker", title: "저장 실패 rollback",
    description: "저장 실패 시 변경 범위만 이전 값으로 복구하고 오류를 표시한다.", category: "exception", roles: ["admin", "member"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["API 실패 응답 주입"], expectedUi: ["오류 토스트", "입력값 rollback"], expectedApi: ["PATCH 오류"], expectedDbChanges: [], expectedDbUnchanged: ["작업지시서 전체 row"],
  }),
  item({
    id: "WKR-004-R01", order: "1-4", area: "작업지시서", route: "/worker", title: "기기별 workspace 구조",
    description: "PC·태블릿·모바일에서 고정된 패널 및 드로어 정책을 확인한다.", category: "responsive", roles: ["admin", "member"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["작업지시서 존재"], expectedUi: ["PC 3패널", "태블릿 세로 목록 드로어", "모바일 단일 패널", "가로 overflow 없음"], expectedApi: [], expectedDbChanges: [], expectedDbUnchanged: ["전체 DB"],
  }),
  item({
    id: "MAT-001-N01", order: "2-1", area: "자재 발주", route: "/material-orders", title: "발주서 생성 및 품목 할당",
    description: "발주서를 생성하고 원단·부자재 품목을 할당한다.", category: "normal", roles: ["admin", "member"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["할당 가능한 자재 존재"], expectedUi: ["발주서 목록 추가", "할당 진행률 갱신"], expectedApi: ["생성 및 collection mutation 성공"], expectedDbChanges: ["material_orders", "material_order_items"], expectedDbUnchanged: ["다른 회사 발주 데이터"],
  }),
  item({
    id: "MAT-002-D01", order: "2-2", area: "자재 발주", route: "/material-orders", title: "품목 수량·단가 부분 저장",
    description: "수량 또는 단가 변경 시 해당 필드와 감사 필드만 변경한다.", category: "database", roles: ["admin", "member"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["발주 품목 존재"], expectedUi: ["금액 요약 갱신"], expectedApi: ["PATCH 200"], expectedDbChanges: ["quantity 또는 unit_price", "updated_at"], expectedDbUnchanged: ["supplier_id", "company_id", "다른 품목"],
  }),
  item({
    id: "ADM-001-N01", order: "3-1", area: "고객사 관리자", route: "/admin/members", title: "멤버 초대",
    description: "고객사 관리자가 새 멤버 초대 링크를 생성한다.", category: "normal", roles: ["admin"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["관리자 로그인", "초대 가능한 이메일"], expectedUi: ["초대 링크 표시", "초대 목록 갱신"], expectedApi: ["invite API 200"], expectedDbChanges: ["company_invites"], expectedDbUnchanged: ["기존 멤버 권한"],
  }),
  item({
    id: "ADM-002-P01", order: "3-2", area: "고객사 관리자", route: "/admin/members", title: "일반 멤버 관리자 기능 차단",
    description: "일반 멤버가 관리자 전용 기능에 접근하지 못하는지 확인한다.", category: "permission", roles: ["member"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["일반 멤버 로그인"], expectedUi: ["관리자 메뉴 미노출 또는 접근 제한"], expectedApi: ["직접 요청 403 또는 404"], expectedDbChanges: [], expectedDbUnchanged: ["멤버·초대 데이터"],
  }),
  item({
    id: "ADM-003-E01", order: "3-3", area: "고객사 관리자", route: "/admin/members", title: "마지막 관리자 탈퇴 보호",
    description: "회사에 관리자 한 명만 남은 경우 탈퇴·권한 제거 정책을 검증한다.", category: "exception", roles: ["admin"], automationStatus: "decision-required", releaseBlocking: true,
    preconditions: ["관리자 1명만 존재"], expectedUi: ["차단 안내"], expectedApi: ["정책에 따른 409 또는 422"], expectedDbChanges: [], expectedDbUnchanged: ["관리자 역할", "회사 상태"],
  }),
  item({
    id: "SYS-001-N01", order: "4-1", area: "시스템관리자", route: "/system", title: "고객사 가입 승인",
    description: "가입 대기 고객사를 승인하고 관리자 계정 흐름을 진행한다.", category: "normal", roles: ["system-admin"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["가입 대기 고객사 존재"], expectedUi: ["승인 상태 반영", "목록 재조회"], expectedApi: ["approval API 200"], expectedDbChanges: ["companies.status", "approval audit"], expectedDbUnchanged: ["다른 회사 상태"],
  }),
  item({
    id: "SYS-002-P01", order: "4-2", area: "시스템관리자", route: "/system", title: "비시스템관리자 접근 차단",
    description: "고객사 관리자와 일반 멤버의 /system 접근을 차단한다.", category: "permission", roles: ["admin", "member"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["비시스템관리자 로그인"], expectedUi: ["404 또는 접근 제한"], expectedApi: ["시스템 API 403 또는 404"], expectedDbChanges: [], expectedDbUnchanged: ["전체 시스템 데이터"],
  }),
  item({
    id: "TEN-001-T01", order: "5-1", area: "회사 격리", route: "/worker", title: "다른 회사 작업지시서 조회 차단",
    description: "A 회사 사용자가 B 회사 작업지시서를 URL 또는 API로 조회하지 못하는지 확인한다.", category: "tenant", roles: ["admin", "member"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["A·B 회사와 각각 작업지시서 존재"], expectedUi: ["B 회사 데이터 미노출"], expectedApi: ["403 또는 404"], expectedDbChanges: [], expectedDbUnchanged: ["A·B 회사 전체 데이터"],
  }),
  item({
    id: "TEN-002-T01", order: "5-2", area: "회사 격리", route: "/worker", title: "한 회사 PATCH가 다른 회사에 미치는 영향 차단",
    description: "A 회사 row 변경 후 B 회사 동일 유형 row가 완전히 유지되는지 확인한다.", category: "tenant", roles: ["admin", "member"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["A·B 회사에 유사 데이터 존재"], expectedUi: ["A 회사 변경만 반영"], expectedApi: ["A 회사 PATCH 200"], expectedDbChanges: ["A 회사 대상 row"], expectedDbUnchanged: ["B 회사 모든 row"],
  }),
  item({
    id: "USR-001-N01", order: "6-1", area: "개인 설정", route: "/settings", title: "프로필 저장",
    description: "개인 프로필 저장 후 사용자 정보와 헤더가 갱신되는지 확인한다.", category: "normal", roles: ["admin", "member"], automationStatus: "planned", releaseBlocking: false,
    preconditions: ["로그인 상태"], expectedUi: ["저장 완료", "헤더 정보 갱신"], expectedApi: ["profile PATCH 200"], expectedDbChanges: ["user profile fields"], expectedDbUnchanged: ["역할", "회사 소속"],
  }),
  item({
    id: "PDF-WO-001", order: "7-1", area: "PDF", route: "/worker", title: "작업지시서 PDF 생성 조건",
    description: "필수 자재·외주·납기 조건에 따른 생성 허용 시점을 검증한다.", category: "pdf", roles: ["admin", "member"], automationStatus: "decision-required", releaseBlocking: false,
    preconditions: ["정책 확정 필요"], expectedUi: ["조건 충족 시 생성 가능", "누락 시 차단 안내"], expectedApi: ["PDF 생성 API 정책 검증"], expectedDbChanges: ["PDF 생성 이력(정책에 따라)"], expectedDbUnchanged: ["업무 원본 데이터"],
  }),
  item({
    id: "PERF-001-F01", order: "8-1", area: "성능", route: "/worker", title: "작업지시서 1,000건 목록 기준선",
    description: "대량 fixture에서 초기 표시·검색·필터·스크롤 측정 형식을 검증한다.", category: "performance", roles: ["admin"], automationStatus: "planned", releaseBlocking: false,
    preconditions: ["test runtime", "대량 fixture"], expectedUi: ["화면 멈춤 없음", "측정 결과 표시"], expectedApi: ["목록 API 측정"], expectedDbChanges: [], expectedDbUnchanged: ["전체 DB"],
  }),
];

export const WAFL_FUNCTION_AREAS = Array.from(new Set(WAFL_FUNCTION_CATALOG.map((entry) => entry.area)));
