export const SEMANTIC_THEME_TOKEN_GROUPS = {
  surface: ["page", "card", "cardMuted", "selected", "selectedSoft", "emptyState"],
  text: ["primary", "secondary", "muted", "subtle", "inverse", "selectedMuted"],
  action: ["primary", "secondary", "add", "danger", "dangerSoft"],
  status: ["draft", "reviewRequested", "reviewCompleted", "requestOrder", "inspection", "completed", "rejected", "success", "warning", "danger", "pending", "neutral"],
  field: ["editable", "selectable", "calculated", "readonly", "disabled"],
  border: ["default", "strong", "selected", "focus"],
  feedback: ["focusRing", "hover", "pressed"],
} as const;

export type SemanticThemeTokenGroup = keyof typeof SEMANTIC_THEME_TOKEN_GROUPS;
export type SemanticThemeTokenName<TGroup extends SemanticThemeTokenGroup> = (typeof SEMANTIC_THEME_TOKEN_GROUPS)[TGroup][number];

export const WORKORDER_FIELD_SEMANTICS = {
  editable: {
    description: "사용자가 직접 값을 입력하거나 수정하는 필드",
    examples: ["생산구성 수량", "생산구성 단가", "작업 메모 입력"],
  },
  selectable: {
    description: "사용자가 후보 중 하나를 선택하는 필드",
    examples: ["자재 구분", "거래처", "단위", "공정", "외주처", "단가 기준"],
  },
  calculated: {
    description: "입력값으로 계산되어 사용자가 직접 수정하지 않는 필드",
    examples: ["자재 금액", "외주공정 금액", "총 금액"],
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
