export const SEMANTIC_THEME_TOKEN_GROUPS = {
  surface: ["page", "card", "cardMuted", "selected", "selectedSoft", "emptyState"],
  text: ["primary", "secondary", "muted", "subtle", "inverse", "selectedMuted"],
  action: ["primary", "secondary", "add", "reset", "danger", "dangerSoft"],
  status: ["draft", "reviewRequested", "reviewCompleted", "requestOrder", "inspection", "completed", "rejected", "success", "warning", "danger", "pending", "neutral"],
  field: ["editable", "selectable", "search", "filter", "calculated", "readonly", "disabled"],
  sidePanel: ["item", "preview", "upload", "uploadActive", "count", "empty"],
  border: ["default", "strong", "selected", "focus"],
  feedback: ["focusRing", "hover", "pressed"],
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
