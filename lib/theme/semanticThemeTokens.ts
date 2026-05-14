export const SEMANTIC_THEME_TOKEN_GROUPS = {
  surface: ["page", "card", "cardMuted", "selected", "selectedSoft", "emptyState"],
  text: ["primary", "secondary", "muted", "subtle", "inverse", "selectedMuted"],
  action: ["primary", "secondary", "add", "reset", "danger", "dangerSoft", "ghost"],
  status: ["draft", "reviewRequested", "reviewCompleted", "requestOrder", "inspection", "completed", "rejected", "success", "warning", "danger", "pending", "neutral"],
  field: ["editable", "selectable", "search", "filter", "calculated", "readonly", "disabled"],
  sidePanel: ["item", "preview", "upload", "uploadActive", "count", "empty"],
  modal: ["overlay", "surface", "chrome", "body", "section", "sectionMuted"],
  border: ["default", "strong", "selected", "focus"],
  feedback: ["focusRing", "hover", "pressed", "toggle"],
} as const;

export type SemanticThemeTokenGroup = keyof typeof SEMANTIC_THEME_TOKEN_GROUPS;
export type SemanticThemeTokenName<TGroup extends SemanticThemeTokenGroup> = (typeof SEMANTIC_THEME_TOKEN_GROUPS)[TGroup][number];

export const WORKORDER_FIELD_SEMANTICS = {
  editable: {
    description: "사용자가 직접 값을 입력하거나 수정하는 필드",
    examples: ["발주정보 수량", "발주정보 공임비", "생산구성 수량", "생산구성 단가", "작업 메모 입력", "작업지시서 검색어"],
  },
  selectable: {
    description: "사용자가 후보 중 하나를 선택하는 필드",
    examples: ["발주 상태", "발주처", "공장", "자재 구분", "거래처", "단위", "공정", "외주처", "단가 기준", "작업지시서 상태 필터", "작업지시서 정렬"],
  },
  calculated: {
    description: "입력값으로 계산되어 사용자가 직접 수정하지 않는 필드",
    examples: ["발주정보 금액", "자재 금액", "외주공정 금액", "총 금액"],
  },
  readonly: {
    description: "현재 화면에서 표시만 하는 정보",
    examples: ["요약 텍스트", "완료된 발주 정보 일부"],
  },
  disabled: {
    description: "상태나 권한 때문에 현재 수정할 수 없는 필드",
    examples: ["잠긴 작업지시서의 생산구성 값"],
  },
} as const;


export const WORKORDER_LIST_SEMANTICS = {
  createAction: {
    description: "작업지시서 목록에서 새 작업지시서를 생성하는 주요 액션",
    token: "action.primary",
  },
  selectedCard: {
    description: "현재 열려 있는 작업지시서 목록 카드",
    token: "surface.selected",
  },
  idleCard: {
    description: "선택되지 않은 작업지시서 목록 카드",
    token: "surface.cardMuted",
  },
  cardStatusBadge: {
    description: "작업지시서 workflow 상태를 나타내는 뱃지",
    token: "status.*",
  },
  emptyList: {
    description: "검색/필터 결과 또는 목록이 비었을 때 표시하는 상태",
    token: "surface.emptyState",
  },
} as const;


export const WORKORDER_CONTROL_SEMANTICS = {
  searchInput: {
    description: "작업지시서 목록을 검색하는 직접 입력 필드",
    token: "field.search",
  },
  statusFilter: {
    description: "작업지시서 workflow 상태를 좁히는 선택 필드",
    token: "field.selectable",
  },
  sortSelect: {
    description: "작업지시서 목록 정렬 기준을 선택하는 필드",
    token: "field.selectable",
  },
  activeFilter: {
    description: "검색어, 상태 필터, 정렬 변경 등 목록 조건이 적용된 상태",
    token: "field.filter",
  },
  resetAction: {
    description: "검색/필터/정렬 조건을 기본값으로 되돌리는 보조 액션",
    token: "action.reset",
  },
} as const;

export const WORKORDER_ORDER_INFO_SEMANTICS = {
  selectableFields: {
    description: "발주정보에서 후보를 선택하는 필드",
    examples: ["발주 상태", "공장"],
    token: "field.selectable",
  },
  editableFields: {
    description: "발주정보에서 사용자가 직접 입력하는 필드",
    examples: ["납기일", "수량", "공임비", "로스비"],
    token: "field.editable",
  },
  calculatedFields: {
    description: "발주정보 입력값으로 계산되는 표시 필드",
    examples: ["합계", "총 금액"],
    token: "field.calculated",
  },
} as const;


export const WORKORDER_MOBILE_COMPOSITION_SEMANTICS = {
  entryCard: {
    description: "모바일 작업지시서 생산구성에서 원단/부자재 또는 외주공정 한 항목을 감싸는 카드",
    token: "surface.cardMuted",
  },
  selectablePanel: {
    description: "모바일 생산구성에서 후보 선택으로 값을 정하는 항목",
    examples: ["자재 구분", "거래처", "단위", "공정", "외주처", "단가 기준"],
    token: "field.selectable",
  },
  editablePanel: {
    description: "모바일 생산구성에서 숫자나 텍스트를 직접 입력하는 항목",
    examples: ["자재명", "수량", "단가"],
    token: "field.editable",
  },
  calculatedPanel: {
    description: "모바일 생산구성에서 입력값으로 계산되는 금액 항목",
    examples: ["자재 금액", "외주공정 금액", "총 금액"],
    token: "field.calculated",
  },
} as const;


export const WORKORDER_SIDE_PANEL_SEMANTICS = {
  attachmentItem: {
    description: "작업지시서 우측 패널에서 등록된 디자인/첨부 파일을 표시하는 항목 카드",
    token: "sidePanel.item",
  },
  attachmentPreview: {
    description: "디자인 이미지 또는 PDF 라벨이 들어가는 미리보기 면",
    token: "sidePanel.preview",
  },
  uploadZone: {
    description: "디자인/첨부 파일을 추가하거나 드래그 앤 드롭하는 입력 가능 영역",
    token: "sidePanel.upload",
  },
  uploadZoneActive: {
    description: "파일 드래그 중인 업로드 영역",
    token: "sidePanel.uploadActive",
  },
  memoItem: {
    description: "작업 메모와 답글을 표시하는 카드",
    token: "sidePanel.item",
  },
  memoCount: {
    description: "메모 개수를 표시하는 보조 뱃지",
    token: "sidePanel.count",
  },
  emptyState: {
    description: "디자인 없음, 첨부 없음, 메모 없음 상태",
    token: "sidePanel.empty",
  },
} as const;

export const WORKORDER_SEMANTIC_TOKEN_COVERAGE_CHECKS = {
  applied: [
    "작업지시서 목록 카드와 선택 상태",
    "작업지시서 workflow 상태 뱃지",
    "작업지시서 검색 입력과 상태 필터, 정렬 select",
    "발주정보 입력 가능, 선택 가능, 계산 필드",
    "생산구성 PC/tablet 입력 가능, 선택 가능, 계산 필드",
    "생산구성 mobile 카드 입력 가능, 선택 가능, 계산 패널",
    "우측 디자인/첨부/메모 패널과 empty state",
    "기본정보 수정 modal field tone",
    "검수/발주 action section workflow button tone",
    "PC/tablet/mobile 비용 요약 카드 tone",
    "작업지시서 header/detail summary card tone",
    "공통 ModalShell/BaseModal overlay, surface, chrome, body tone",
    "AdminModal wrapper, section, field, footer action tone",
  ],
  remaining: [
    "개별 모달 내부에 남아 있는 직접 색상 class 세부 정리",
    "프로젝트 전체 theme file 분리와 개인 설정 연결",
  ],
  regressionChecks: [
    "입력 가능 field가 버튼처럼 과하게 보이지 않는지 확인",
    "선택 가능 field와 직접 입력 field가 구분되지만 같은 계열로 보이는지 확인",
    "계산 field가 읽기 전용 tone으로 보이는지 확인",
    "좌측 선택 카드가 과도한 border나 shadow로 보이지 않는지 확인",
    "모바일 모달 검색 input의 focus가 입력 중 유지되는지 확인",
  ],
} as const;



export const WORKORDER_DETAIL_REMAINING_SEMANTICS = {
  basicInfoModal: {
    description: "작업지시서 기본정보 수정 모달의 선택 필드와 미리보기 요약",
    tokens: ["field.selectable", "field.readonly"],
  },
  workflowActionSection: {
    description: "검토/발주/검수 등 workflow 진행 영역과 주요/보조 액션 버튼",
    tokens: ["surface.cardMuted", "action.primary", "action.secondary", "surface.selected"],
  },
  costSummary: {
    description: "PC/tablet/mobile 비용 요약 카드의 계산 결과와 총액 강조",
    tokens: ["field.calculated", "action.primary", "surface.card"],
  },
  headerSummary: {
    description: "작업지시서 header의 제목, 기본정보 요약, 담당자, 재고 정보",
    tokens: ["surface.card", "field.selectable", "field.readonly"],
  },
} as const;

export const PBP_COMMON_MODAL_THEME_CHECKS = {
  commonShell: {
    description: "프로젝트 공통 ModalShell/BaseModal 계열의 overlay, surface, header, body, footer가 theme 변수 기반으로 적용되는지 확인",
    tokens: ["modal.overlay", "modal.surface", "modal.chrome", "modal.body"],
  },
  adminModal: {
    description: "AdminModal wrapper와 section, input, footer action이 공통 modal/field/action token을 따라가는지 확인",
    tokens: ["modal.surface", "modal.section", "field.search", "field.selectable", "action.primary", "action.secondary", "action.dangerSoft"],
  },
  individualModalContent: {
    description: "개별 모달 내부의 특수 안내 박스, preview, warning, empty state는 공통 컴포넌트 연결 이후 별도 회귀 대상으로 남긴다.",
    tokens: ["field.*", "surface.*", "status.*", "emptyState"],
  },
} as const;

export const PBP_COMMON_UI_SEMANTIC_CHECKS = {
  checkedAtVersion: "0.12.5",
  button: {
    description: "공통 AdminButton/AdminLinkButton variant가 action semantic class를 사용한다.",
    tokens: ["action.primary", "action.secondary", "action.danger", "action.ghost"],
  },
  card: {
    description: "AdminCard, AdminSection, AdminStatCard, AdminActionTile, SummaryCard, WorkOrderPanelCard가 surface/card 계열 semantic class를 사용한다.",
    tokens: ["surface.card", "surface.cardMuted", "border.default", "shadow.card"],
  },
  filterAndField: {
    description: "AdminFilterBar와 공통 modal field class가 field/search/selectable semantic class를 사용한다.",
    tokens: ["field.search", "field.selectable", "field.filter"],
  },
  toggle: {
    description: "StatusToggle track/thumb가 theme variable 기반 token을 사용한다.",
    tokens: ["feedback.toggle", "action.primary", "surface.muted"],
  },
  remaining: [
    "개별 화면 내부에 남은 직접 색상 class 목록화",
    "공통 input/select/card 컴포넌트가 없는 영역의 중복 class 정리",
    "개인 환경설정 theme 선택 UI 연결",
  ],
} as const;


export const PBP_THEME_FILE_STRUCTURE_PLAN = {
  currentThemeId: "default-light",
  themeFolder: "lib/theme/themes",
  cssVariableSource: "lib/theme/themes/defaultLight.ts",
  cssRuntimeMirror: "app/globals.css :root",
  nextExpandableThemeExamples: ["beige-atelier", "cold-winter", "black-and-white"],
  rules: [
    "컴포넌트는 blue/emerald 같은 색상명을 직접 의존하지 않는다.",
    "컴포넌트는 pbp-* semantic class만 사용한다.",
    "실제 색상값은 theme definition의 cssVariables에 둔다.",
    "상태 의미색(success/warning/danger)은 테마 분위기색과 분리한다.",
    "개인 환경설정 연결 전까지 default-light 값을 app/globals.css :root와 동기화한다.",
  ],
} as const;


export const PBP_THEME_VARIABLE_SYNC_CHECKS = {
  sourceOfTruth: "lib/theme/themes/defaultLight.ts",
  runtimeMirror: "app/globals.css :root",
  syncedVariableCount: 117,
  checkedAtVersion: "0.12.5",
  result: "default-light cssVariables와 globals.css :root 변수명/값 동기화 확인",
  runtimeProvider: "lib/theme/PbpThemeProvider.tsx",
  rootAttributeBuilder: "lib/theme/themeDocument.ts",
  remainingBeforePersonalThemeSettings: [
    "개인 설정의 theme id 저장 위치",
    "SSR에서 사용자별 초기 theme id를 결정하는 경로",
    "개인 환경설정 UI와 theme provider 연결",
    "beige/cold/black-white 등 추가 theme file 확장",
  ],
} as const;

export const PBP_THEME_PROVIDER_STRUCTURE_CHECKS = {
  checkedAtVersion: "0.12.3",
  initialThemeId: "default-light",
  rootAttributes: ["data-pbp-theme", "data-pbp-theme-tone", "style cssVariables"],
  provider: "PbpThemeProvider",
  providerScope: "app/layout.tsx에서 I18nProvider와 WorkorderRepositoryProvider 바깥쪽에 배치",
  flickerPrevention: [
    "app/layout.tsx에서 html style에 default-light cssVariables를 서버 렌더링 시점에 주입",
    "app/globals.css :root는 no-JS/static fallback으로 유지",
    "client provider는 hydrate 후 동일 theme를 documentElement에 재적용",
  ],
  notConnectedYet: [
    "개인 환경설정 theme 선택 UI",
    "DB 또는 localStorage 기반 사용자별 theme id",
    "복수 theme file 추가",
  ],
} as const;
