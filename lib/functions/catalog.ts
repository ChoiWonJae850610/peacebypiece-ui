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
export type WaflScenarioDecisionState = "not-required" | "resolved" | "pending";
export type WaflAutomationType = "unit" | "api-db" | "playwright" | "playwright-db" | "visual" | "performance" | "manual";

export type WaflScenarioStep = {
  id: string;
  action: string;
  expected: string[];
};

export type WaflDbScenarioContract = {
  snapshotBefore: boolean;
  snapshotAfter: boolean;
  allowedChanges: string[];
  unchanged: string[];
};

export type WaflTenantScenarioContract = {
  actorCompany: string;
  targetCompany: string;
  assertions: string[];
};

export type WaflResponsiveScenarioContract = {
  viewports: string[];
  assertions: string[];
};

export type WaflPerformanceScenarioContract = {
  dataSet: string;
  metrics: string[];
  thresholds: string[];
};

export type WaflPdfScenarioContract = {
  generationRule: string;
  assertions: string[];
  decisionItems: string[];
};

export type WaflAutomationLink = {
  type: WaflAutomationType;
  filePath: string | null;
  testDataSet: string | null;
  lastResult: "not-run" | "passed" | "failed" | "blocked";
};

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
  decisionState: WaflScenarioDecisionState;
  preconditions: string[];
  steps: WaflScenarioStep[];
  exceptionCases: string[];
  permissionRules: string[];
  expectedUi: string[];
  expectedApi: string[];
  expectedDbChanges: string[];
  expectedDbUnchanged: string[];
  dbContract: WaflDbScenarioContract;
  tenantContract: WaflTenantScenarioContract | null;
  responsiveContract: WaflResponsiveScenarioContract | null;
  performanceContract: WaflPerformanceScenarioContract | null;
  pdfContract: WaflPdfScenarioContract | null;
  automation: WaflAutomationLink;
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

export const WAFL_SCENARIO_DECISION_LABELS: Record<WaflScenarioDecisionState, string> = {
  "not-required": "결정 불필요",
  resolved: "정책 확정",
  pending: "정책 결정 대기",
};

type WaflFunctionDefinition = Omit<
  WaflFunctionItem,
  | "decisionState"
  | "steps"
  | "exceptionCases"
  | "permissionRules"
  | "dbContract"
  | "tenantContract"
  | "responsiveContract"
  | "performanceContract"
  | "pdfContract"
  | "automation"
> & Partial<Pick<
  WaflFunctionItem,
  | "decisionState"
  | "steps"
  | "exceptionCases"
  | "permissionRules"
  | "tenantContract"
  | "responsiveContract"
  | "performanceContract"
  | "pdfContract"
  | "automation"
>>;

function defaultAutomationType(category: WaflFunctionCategory): WaflAutomationType {
  if (category === "database" || category === "tenant") return "playwright-db";
  if (category === "responsive") return "visual";
  if (category === "performance") return "performance";
  if (category === "pdf") return "playwright";
  if (category === "permission") return "api-db";
  return "playwright";
}

const item = (value: WaflFunctionDefinition): WaflFunctionItem => ({
  ...value,
  decisionState: value.decisionState ?? (value.automationStatus === "decision-required" ? "pending" : "not-required"),
  steps: value.steps ?? [
    { id: "prepare", action: "전제 조건과 테스트 데이터를 준비한다.", expected: value.preconditions },
    { id: "execute", action: value.title, expected: [...value.expectedUi, ...value.expectedApi] },
    { id: "verify", action: "UI·API·DB 결과와 불변조건을 검증한다.", expected: [...value.expectedDbChanges, ...value.expectedDbUnchanged] },
  ],
  exceptionCases: value.exceptionCases ?? (value.category === "exception" ? [value.description] : []),
  permissionRules: value.permissionRules ?? (value.category === "permission" ? [value.description] : []),
  dbContract: {
    snapshotBefore: value.expectedDbChanges.length > 0 || value.expectedDbUnchanged.length > 0,
    snapshotAfter: value.expectedDbChanges.length > 0 || value.expectedDbUnchanged.length > 0,
    allowedChanges: value.expectedDbChanges,
    unchanged: value.expectedDbUnchanged,
  },
  tenantContract: value.tenantContract ?? (value.category === "tenant" ? {
    actorCompany: "회사 A",
    targetCompany: "회사 B",
    assertions: [...value.expectedUi, ...value.expectedApi, ...value.expectedDbUnchanged],
  } : null),
  responsiveContract: value.responsiveContract ?? (value.category === "responsive" ? {
    viewports: ["Desktop 1440×900", "Desktop 1280×800", "iPad Mini landscape", "iPad Mini portrait", "Galaxy Tab landscape", "Galaxy Tab portrait", "iPhone portrait", "Galaxy S portrait"],
    assertions: value.expectedUi,
  } : null),
  performanceContract: value.performanceContract ?? (value.category === "performance" ? {
    dataSet: value.preconditions.join(" / ") || "대량 fixture",
    metrics: ["초기 표시 시간", "검색·필터 응답", "스크롤 안정성", "API p50/p95"],
    thresholds: ["0.23.68에서 환경별 기준선 확정"],
  } : null),
  pdfContract: value.pdfContract ?? (value.category === "pdf" ? {
    generationRule: value.preconditions.join(" / ") || "정책 확정 필요",
    assertions: [...value.expectedUi, ...value.expectedApi],
    decisionItems: value.automationStatus === "decision-required" ? ["생성 가능 단계", "금액 노출", "문서 분리", "로고·서명"] : [],
  } : null),
  automation: {
    type: value.automation?.type ?? defaultAutomationType(value.category),
    filePath: value.automation?.filePath ?? null,
    testDataSet: value.automation?.testDataSet ?? null,
    lastResult: value.automation?.lastResult ?? "not-run",
  },
});

export const WAFL_FUNCTION_CATALOG: WaflFunctionItem[] = [
  item({
    id: "WKR-001-N01", order: "1-1", area: "작업지시서", route: "/worker", title: "작업지시서 목록 정상 조회",
    description: "현재 회사의 작업지시서 목록을 조회하고 첫 화면 상태를 표시한다.", category: "normal", roles: ["admin", "member"], automationStatus: "partial", releaseBlocking: true,
    preconditions: ["현재 회사에 작업지시서가 존재함"], expectedUi: ["목록 카드 표시", "선택 문서 상세 표시"], expectedApi: ["목록 API 200"], expectedDbChanges: [], expectedDbUnchanged: ["전체 작업지시서 데이터"],

    automation: { type: "playwright", filePath: "tests/e2e/functions-core.spec.mjs", testDataSet: "company-a/workorders", lastResult: "not-run" },
  }),
  item({
    id: "WKR-002-D01", order: "1-2", area: "작업지시서", route: "/worker", title: "납기일만 변경",
    description: "납기일 PATCH 후 허용된 감사 필드 외 다른 필드가 변경되지 않는지 확인한다.", category: "database", roles: ["admin", "member"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["수정 가능한 작업지시서 존재", "변경 전 row snapshot 확보"], expectedUi: ["변경 납기일 표시", "저장 완료 표시"], expectedApi: ["PATCH 200"], expectedDbChanges: ["due_date", "updated_at", "updated_by"], expectedDbUnchanged: ["name", "status", "company_id", "inventory"],
    steps: [
      { id: "snapshot", action: "대상 작업지시서의 변경 전 DB row를 저장한다.", expected: ["due_date와 불변 필드 snapshot 확보"] },
      { id: "patch", action: "납기일만 임시 날짜로 변경하고 저장 완료를 기다린다.", expected: ["PATCH 200", "화면 납기일 갱신"] },
      { id: "assert", action: "변경 후 row를 재조회해 허용 필드와 불변 필드를 비교한다.", expected: ["due_date·updated_at·updated_by만 변경", "다른 필드 유지"] },
    ],
    automation: { type: "api-db", filePath: "tests/functions-db-contract.mjs", testDataSet: "company-a/workorder-editable", lastResult: "passed" },
  }),
  item({
    id: "WKR-003-E01", order: "1-3", area: "작업지시서", route: "/worker", title: "저장 실패 rollback",
    description: "저장 실패 시 변경 범위만 이전 값으로 복구하고 오류를 표시한다.", category: "exception", roles: ["admin", "member"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["API 실패 응답 주입"], expectedUi: ["오류 토스트", "입력값 rollback"], expectedApi: ["PATCH 오류"], expectedDbChanges: [], expectedDbUnchanged: ["작업지시서 전체 row"],
  }),
  item({
    id: "WKR-004-R01", order: "1-4", area: "작업지시서", route: "/worker", title: "기기별 workspace 구조",
    description: "PC·태블릿·모바일에서 고정된 패널 및 드로어 정책을 확인한다.", category: "responsive", roles: ["admin", "member"], automationStatus: "partial", releaseBlocking: true,
    preconditions: ["작업지시서 존재"], expectedUi: ["PC 3패널", "태블릿 세로 목록 드로어", "모바일 단일 패널", "가로 overflow 없음"], expectedApi: [], expectedDbChanges: [], expectedDbUnchanged: ["전체 DB"],
    responsiveContract: {
      viewports: ["Desktop 1440×900", "Desktop 1280×800", "iPad Mini landscape", "iPad Mini portrait", "Galaxy Tab landscape", "Galaxy Tab portrait", "iPhone portrait", "Galaxy S portrait"],
      assertions: ["기기 정책에 맞는 패널 개수", "목록 드로어 열림·닫힘", "본문과 독립 패널 스크롤", "가로 overflow 없음", "주요 버튼 viewport 이탈 없음", "모달 footer 접근 가능"],
    },
    automation: { type: "playwright", filePath: "tests/e2e/functions-responsive.spec.mjs", testDataSet: "company-a/responsive-workspace", lastResult: "not-run" },
  }),
  item({
    id: "MAT-001-N01", order: "2-1", area: "자재 발주", route: "/workspace/material-orders", title: "발주서 생성 및 품목 할당",
    description: "발주서를 생성하고 원단·부자재 품목을 할당한다.", category: "normal", roles: ["admin", "member"], automationStatus: "partial", releaseBlocking: true,
    preconditions: ["할당 가능한 자재 존재"], expectedUi: ["발주서 목록 추가", "할당 진행률 갱신"], expectedApi: ["생성 및 collection mutation 성공"], expectedDbChanges: ["material_orders", "material_order_items"], expectedDbUnchanged: ["다른 회사 발주 데이터"],

    automation: { type: "playwright", filePath: "tests/e2e/functions-core.spec.mjs", testDataSet: "company-a/material-orders", lastResult: "not-run" },
  }),
  item({
    id: "MAT-003-R01", order: "2-3", area: "자재 발주", route: "/workspace/material-orders", title: "기기별 발주 workspace 구조",
    description: "PC·태블릿·모바일에서 발주 목록·상세·할당 패널과 드로어 정책을 확인한다.", category: "responsive", roles: ["admin", "member"], automationStatus: "partial", releaseBlocking: true,
    preconditions: ["발주서와 할당 가능한 자재 존재"], expectedUi: ["PC 3패널", "iPad Mini 가로 2패널", "태블릿 세로 목록 드로어", "모바일 단일 패널", "가로 overflow 없음"], expectedApi: [], expectedDbChanges: [], expectedDbUnchanged: ["전체 DB"],
    responsiveContract: {
      viewports: ["Desktop 1440×900", "Desktop 1280×800", "iPad Mini landscape", "iPad Mini portrait", "Galaxy Tab landscape", "Galaxy Tab portrait", "iPhone portrait", "Galaxy S portrait"],
      assertions: ["기기 정책에 맞는 패널 개수", "목록 드로어 열림·닫힘", "독립 패널 스크롤", "가로 overflow 없음", "주요 버튼 viewport 이탈 없음"],
    },
    automation: { type: "playwright", filePath: "tests/e2e/functions-responsive.spec.mjs", testDataSet: "company-a/responsive-material-orders", lastResult: "not-run" },
  }),
  item({
    id: "MAT-002-D01", order: "2-2", area: "자재 발주", route: "/workspace/material-orders", title: "품목 수량·단가 부분 저장",
    description: "수량 또는 단가 변경 시 해당 필드와 감사 필드만 변경한다.", category: "database", roles: ["admin", "member"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["발주 품목 존재"], expectedUi: ["금액 요약 갱신"], expectedApi: ["PATCH 200"], expectedDbChanges: ["quantity 또는 unit_price", "updated_at"], expectedDbUnchanged: ["supplier_id", "company_id", "다른 품목"],
  }),
  item({
    id: "ADM-001-N01", order: "3-1", area: "고객사 관리자", route: "/workspace/settings", title: "멤버 초대",
    description: "고객사 관리자가 새 멤버 초대 링크를 생성한다.", category: "normal", roles: ["admin"], automationStatus: "partial", releaseBlocking: true,
    preconditions: ["관리자 로그인", "초대 가능한 이메일"], expectedUi: ["초대 링크 표시", "초대 목록 갱신"], expectedApi: ["invite API 200"], expectedDbChanges: ["company_invites"], expectedDbUnchanged: ["기존 멤버 권한"],

    automation: { type: "playwright", filePath: "tests/e2e/functions-core.spec.mjs", testDataSet: "company-a/admin-members", lastResult: "not-run" },
  }),
  item({
    id: "ADM-002-P01", order: "3-2", area: "고객사 관리자", route: "/workspace/settings", title: "일반 멤버 관리자 기능 차단",
    description: "일반 멤버가 관리자 전용 기능에 접근하지 못하는지 확인한다.", category: "permission", roles: ["member"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["일반 멤버 로그인"], expectedUi: ["관리자 메뉴 미노출 또는 접근 제한"], expectedApi: ["직접 요청 403 또는 404"], expectedDbChanges: [], expectedDbUnchanged: ["멤버·초대 데이터"],
    permissionRules: ["member 역할은 관리자 메뉴를 볼 수 없음", "URL 직접 접근도 차단", "관리자 API 직접 호출도 403 또는 404"],
    automation: { type: "api-db", filePath: null, testDataSet: "company-a/member-basic", lastResult: "not-run" },
  }),
  item({
    id: "ADM-003-E01", order: "3-3", area: "고객사 관리자", route: "/workspace/settings", title: "마지막 관리자 탈퇴 보호",
    description: "회사에 관리자 한 명만 남은 경우 탈퇴·권한 제거 정책을 검증한다.", category: "exception", roles: ["admin"], automationStatus: "decision-required", releaseBlocking: true,
    preconditions: ["관리자 1명만 존재"], expectedUi: ["차단 안내"], expectedApi: ["정책에 따른 409 또는 422"], expectedDbChanges: [], expectedDbUnchanged: ["관리자 역할", "회사 상태"],
  }),
  item({
    id: "SYS-001-N01", order: "4-1", area: "시스템관리자", route: "/system/companies", title: "고객사 가입 승인",
    description: "가입 대기 고객사를 승인하고 관리자 계정 흐름을 진행한다.", category: "normal", roles: ["system-admin"], automationStatus: "partial", releaseBlocking: true,
    preconditions: ["가입 대기 고객사 존재"], expectedUi: ["승인 상태 반영", "목록 재조회"], expectedApi: ["approval API 200"], expectedDbChanges: ["companies.status", "approval audit"], expectedDbUnchanged: ["다른 회사 상태"],

    automation: { type: "playwright", filePath: "tests/e2e/functions-core.spec.mjs", testDataSet: "company-c/company-approval", lastResult: "not-run" },
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
    tenantContract: { actorCompany: "회사 A 로그인 사용자", targetCompany: "회사 B 작업지시서", assertions: ["목록 미노출", "URL 직접 접근 차단", "API 403 또는 404", "A·B 회사 DB 불변"] },
    automation: { type: "playwright-db", filePath: null, testDataSet: "tenant-a-b-isolation", lastResult: "not-run" },
  }),
  item({
    id: "TEN-002-T01", order: "5-2", area: "회사 격리", route: "/worker", title: "한 회사 PATCH가 다른 회사에 미치는 영향 차단",
    description: "A 회사 row 변경 후 B 회사 동일 유형 row가 완전히 유지되는지 확인한다.", category: "tenant", roles: ["admin", "member"], automationStatus: "planned", releaseBlocking: true,
    preconditions: ["A·B 회사에 유사 데이터 존재"], expectedUi: ["A 회사 변경만 반영"], expectedApi: ["A 회사 PATCH 200"], expectedDbChanges: ["A 회사 대상 row"], expectedDbUnchanged: ["B 회사 모든 row"],
  }),
  item({
    id: "USR-001-N01", order: "6-1", area: "개인 설정", route: "/me/settings", title: "프로필 저장",
    description: "개인 프로필 저장 후 사용자 정보와 헤더가 갱신되는지 확인한다.", category: "normal", roles: ["admin", "member"], automationStatus: "partial", releaseBlocking: false,
    preconditions: ["로그인 상태"], expectedUi: ["저장 완료", "헤더 정보 갱신"], expectedApi: ["profile PATCH 200"], expectedDbChanges: ["user profile fields"], expectedDbUnchanged: ["역할", "회사 소속"],

    automation: { type: "playwright", filePath: "tests/e2e/functions-core.spec.mjs", testDataSet: "company-a/personal-settings", lastResult: "not-run" },
  }),
  item({
    id: "PDF-WO-001", order: "7-1", area: "PDF", route: "/worker", title: "작업지시서 PDF 생성 조건",
    description: "필수 자재·외주·납기 조건에 따른 생성 허용 시점을 검증한다.", category: "pdf", roles: ["admin", "member"], automationStatus: "decision-required", releaseBlocking: false,
    preconditions: ["정책 확정 필요"], expectedUi: ["조건 충족 시 생성 가능", "누락 시 차단 안내"], expectedApi: ["PDF 생성 API 정책 검증"], expectedDbChanges: ["PDF 생성 이력(정책에 따라)"], expectedDbUnchanged: ["업무 원본 데이터"],
    decisionState: "pending",
    pdfContract: { generationRule: "필수 자재·외주·납기 조건은 사용자 확정 대기", assertions: ["누락값 생성 차단", "회사 로고·데이터 격리", "최신 데이터 재생성"], decisionItems: ["생성 가능 단계", "금액 노출", "공급처별 문서 분리", "회사 로고", "직인·서명란"] },
  }),
  item({
    id: "PERF-001-F01", order: "8-1", area: "성능", route: "/worker", title: "작업지시서 1,000건 목록 기준선",
    description: "대량 fixture에서 초기 표시·검색·필터·스크롤 측정 형식을 검증한다.", category: "performance", roles: ["admin"], automationStatus: "planned", releaseBlocking: false,
    preconditions: ["test runtime", "대량 fixture"], expectedUi: ["화면 멈춤 없음", "측정 결과 표시"], expectedApi: ["목록 API 측정"], expectedDbChanges: [], expectedDbUnchanged: ["전체 DB"],
  }),
];

export const WAFL_FUNCTION_AREAS = Array.from(new Set(WAFL_FUNCTION_CATALOG.map((entry) => entry.area)));
