export type MaterialOrderSummaryCard = {
  id: string;
  label: string;
  value: string;
  description: string;
};

export type MaterialOrderTab = {
  id: "requests" | "editor" | "inventory";
  label: string;
  description: string;
  statusLabel: string;
};

export type MaterialOrderProcessStep = {
  id: string;
  label: string;
  description: string;
};

export type MaterialOrderDraftGuideItem = {
  id: string;
  label: string;
  description: string;
};

export type MaterialOrderWorkspaceViewModel = {
  summaryCards: MaterialOrderSummaryCard[];
  tabs: MaterialOrderTab[];
  draftGuideItems: MaterialOrderDraftGuideItem[];
  processSteps: MaterialOrderProcessStep[];
  deliveryDocumentGroups: string[];
};

export function buildMaterialOrderWorkspaceViewModel(): MaterialOrderWorkspaceViewModel {
  return {
    summaryCards: [
      {
        id: "draft-requests",
        label: "작성중 발주 요청",
        value: "0건",
        description: "DB 저장 전 skeleton 단계입니다. 다음 단계에서 발주 요청 데이터를 연결합니다.",
      },
      {
        id: "review-pending",
        label: "검토 대기",
        value: "0건",
        description: "검토요청 상태의 자재 발주 요청을 표시할 예정입니다.",
      },
      {
        id: "ordered",
        label: "발주 완료",
        value: "0건",
        description: "승인/발주확정 이후 발주 완료 상태를 집계할 예정입니다.",
      },
      {
        id: "inventory-items",
        label: "현재 재고 품목 수",
        value: "0개",
        description: "입고 및 배분 후 남은 고객사 재고 lot을 연결할 예정입니다.",
      },
      {
        id: "monthly-purchase",
        label: "이번 달 자재 구매액",
        value: "₩0",
        description: "내부용 발주서 금액 기준으로 월 구매액을 집계할 예정입니다.",
      },
    ],
    tabs: [
      {
        id: "requests",
        label: "발주 요청 목록",
        description: "작성중, 검토요청, 승인/발주확정, 발주완료 상태의 요청을 목록화합니다.",
        statusLabel: "예정",
      },
      {
        id: "editor",
        label: "발주 작성/상세",
        description: "발주 종류, 공급처, 품목명, 단위, 주문수량, 단가를 입력하는 화면입니다.",
        statusLabel: "예정",
      },
      {
        id: "inventory",
        label: "재고 현황",
        description: "주문수량에서 작업지시서 배분 수량을 제외한 남은 수량을 고객사 재고로 표시합니다.",
        statusLabel: "예정",
      },
    ],
    draftGuideItems: [
      {
        id: "supplier",
        label: "공급처 선택",
        description: "원단/부자재 발주 종류를 먼저 선택하고 해당 종류의 공급처만 표시할 예정입니다. 현재는 화면 입력 구조만 먼저 고정합니다.",
      },
      {
        id: "line-items",
        label: "품목 추가",
        description: "품목명, 단위, 주문수량, 단가만 입력하고 금액을 즉시 계산합니다. 색상과 규격은 초기 MVP에서 품목명에 함께 적습니다.",
      },
      {
        id: "workorder-allocation",
        label: "작업지시서 배분",
        description: "다음 단계에서 작업지시서 연결과 배분 수량 입력을 붙입니다. 발주 입력과 배분 입력을 분리합니다.",
      },
    ],
    processSteps: [
      {
        id: "draft",
        label: "작성중",
        description: "디자이너 또는 발주 담당자가 작업지시서 연결과 품목별 수량을 입력합니다.",
      },
      {
        id: "review",
        label: "검토요청",
        description: "발주 권한자 또는 고객사 관리자가 검토할 수 있도록 요청합니다.",
      },
      {
        id: "approved",
        label: "승인/발주확정",
        description: "발주 가능 권한자가 발주 내용을 확정하고 후속 문서 생성을 준비합니다.",
      },
      {
        id: "ordered",
        label: "발주완료",
        description: "실제 발주가 완료된 상태로, 이후 입고와 재고 반영 단계로 확장합니다.",
      },
    ],
    deliveryDocumentGroups: [
      "공급처 + 도착지 기준으로 자재 전달 요청서 PDF를 묶어 생성",
      "내부용 발주서는 단가/총액 포함, 외부 전달용 문서는 단가/총액 제외",
      "문자 복사용 요약문과 퀵 서비스 API 연동을 후속 단계에서 확장",
    ],
  };
}
