export const MATERIAL_ORDER_EMPTY_STATE_COPY = {
  selectOrder: {
    title: "발주서를 선택해 주세요",
    description: "왼쪽 발주서 목록에서 발주서를 만들거나 선택하면 상세 입력 영역이 열립니다.",
  },
  selectTarget: {
    title: "발주 대상을 선택해 주세요",
    description: "발주서를 선택하면 이 영역에서 작업지시서별 자재를 발주 품목으로 추가할 수 있습니다.",
  },
  selectMaterialType: {
    title: "자재 종류를 선택해 주세요",
    description: "발주 기본정보에서 원단 또는 부자재를 선택하면 발주 가능한 작업지시서 자재가 표시됩니다.",
  },
  noAvailableMaterial: {
    title: "발주 가능한 자재가 없습니다.",
    description: "현재 자재 종류에서 발주할 작업지시서가 없습니다.",
  },
  noOrderLines: {
    title: "발주 품목이 없습니다.",
    description: "발주 대상 패널에서 이번 발주서에 담을 자재를 선택해 주세요.",
  },
  noOrderLineSummary: {
    title: "추가된 발주 품목이 없습니다.",
  },
  noOrders: {
    title: "등록된 발주서가 없습니다.",
    description: "발주서 생성 버튼으로 공급처별 발주서를 시작합니다.",
  },
  noSearchResults: {
    title: "검색 결과가 없습니다.",
  },
} as const;
