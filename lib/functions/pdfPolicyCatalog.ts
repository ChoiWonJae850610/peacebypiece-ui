export type WaflPdfDecisionState = "pending" | "resolved";

export type WaflPdfDecisionItem = {
  id: string;
  label: string;
  state: WaflPdfDecisionState;
  options: string[];
  currentObservation: string;
  selectedValue: string | null;
};

export type WaflPdfPolicyContract = {
  id: "workorder" | "supplier-order";
  title: string;
  route: string;
  currentImplementation: string[];
  immutableAssertions: string[];
  decisions: WaflPdfDecisionItem[];
};

export const WAFL_PDF_POLICY_CONTRACTS: WaflPdfPolicyContract[] = [
  {
    id: "workorder",
    title: "작업지시서 PDF",
    route: "/worker",
    currentImplementation: [
      "작업지시서별 생성 API가 존재한다.",
      "외부 PDF generator는 A4 portrait로 호출되고 미설정 시 서버 PDF fallback을 사용한다.",
      "현재 서버 PDF에는 자재·외주 단가와 금액 합계가 포함된다.",
      "생성된 PDF는 attachment와 R2 저장 흐름을 사용한다.",
    ],
    immutableAssertions: [
      "현재 회사 범위의 작업지시서만 생성할 수 있다.",
      "PDF 생성 실패 시 업무 원본 데이터는 변경되지 않는다.",
      "생성 파일은 최신 snapshot을 기준으로 한다.",
      "정책 미확정 항목은 production 출력 계약으로 간주하지 않는다.",
    ],
    decisions: [
      { id: "generation-stage", label: "생성 가능 단계", state: "pending", options: ["작성중", "검토완료", "모든 자재·외주 완료", "완료"], currentObservation: "현재 API는 상태별 생성 차단 계약이 명시되지 않았다.", selectedValue: null },
      { id: "amount-visibility", label: "금액 표시", state: "pending", options: ["완전 제외", "관리자만 포함", "항상 포함"], currentObservation: "현재 서버 PDF에는 단가·공임·금액 합계가 포함된다.", selectedValue: null },
      { id: "due-date", label: "납기일 종류", state: "pending", options: ["최종 납기일", "공정별 납기", "둘 다"], currentObservation: "현재 PDF 상단에는 작업지시서 납기일 1개가 표시된다.", selectedValue: null },
      { id: "branding", label: "회사 로고", state: "pending", options: ["포함", "미포함", "설정 시 포함"], currentObservation: "회사 로고 출력 계약이 명시되지 않았다.", selectedValue: null },
      { id: "signature", label: "직인·서명란", state: "pending", options: ["둘 다", "직인만", "서명만", "없음"], currentObservation: "직인·서명란 출력 계약이 명시되지 않았다.", selectedValue: null },
      { id: "orientation", label: "용지 방향", state: "pending", options: ["A4 세로", "A4 가로"], currentObservation: "현재 외부 generator 호출은 A4 세로다.", selectedValue: null },
      { id: "image-layout", label: "이미지 배치", state: "pending", options: ["대표 이미지 1개", "첨부 이미지 복수", "별도 이미지 페이지"], currentObservation: "현재 대표 이미지 해석기가 연결되어 있다.", selectedValue: null },
      { id: "missing-values", label: "누락값 처리", state: "pending", options: ["생성 차단", "미지정 표시", "항목 숨김"], currentObservation: "일부 값은 미지정 또는 대체문구로 출력된다.", selectedValue: null },
    ],
  },
  {
    id: "supplier-order",
    title: "공급처 발주 PDF",
    route: "/workspace/material-orders",
    currentImplementation: ["최종 공급처 발주 PDF 데이터 계약과 생성 route는 확인되지 않았다."],
    immutableAssertions: [
      "공급처별 문서에는 해당 공급처 품목만 포함한다.",
      "다른 회사·다른 공급처의 단가와 품목은 섞이지 않는다.",
      "정책 확정 전 production PDF 생성 route를 임의로 추가하지 않는다.",
    ],
    decisions: [
      { id: "vendor-split", label: "공급처별 분리", state: "pending", options: ["공급처별 개별 PDF", "한 파일 내 공급처별 페이지"], currentObservation: "최종 분리 정책이 없다.", selectedValue: null },
      { id: "material-split", label: "원단·부자재 구분", state: "pending", options: ["통합", "종류별 분리", "공급처 기준만 분리"], currentObservation: "최종 통합·분리 정책이 없다.", selectedValue: null },
      { id: "price-fields", label: "단가·금액·부가세", state: "pending", options: ["단가·금액·부가세", "단가·금액", "수량만"], currentObservation: "최종 금액 노출 정책이 없다.", selectedValue: null },
      { id: "delivery-date", label: "납기일", state: "pending", options: ["공급처 납기일", "작업지시서 납기일", "둘 다"], currentObservation: "발주 PDF 납기일 계약이 없다.", selectedValue: null },
      { id: "branding", label: "로고·직인·서명", state: "pending", options: ["로고만", "로고·직인", "로고·서명", "모두"], currentObservation: "브랜딩 계약이 없다.", selectedValue: null },
      { id: "orientation", label: "용지 방향", state: "pending", options: ["A4 세로", "A4 가로"], currentObservation: "용지 방향이 정해지지 않았다.", selectedValue: null },
      { id: "missing-values", label: "누락값 처리", state: "pending", options: ["생성 차단", "미지정 표시", "항목 숨김"], currentObservation: "누락값 정책이 없다.", selectedValue: null },
    ],
  },
];

export function getWaflPdfPolicyContract(id: WaflPdfPolicyContract["id"]): WaflPdfPolicyContract {
  const contract = WAFL_PDF_POLICY_CONTRACTS.find((item) => item.id === id);
  if (!contract) throw new Error(`WAFL_PDF_POLICY_NOT_FOUND:${id}`);
  return contract;
}

export function validateWaflPdfPolicyContract(contract: WaflPdfPolicyContract): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const decision of contract.decisions) {
    if (seen.has(decision.id)) errors.push(`DUPLICATE_DECISION_ID:${decision.id}`);
    seen.add(decision.id);
    if (decision.state === "resolved" && !decision.selectedValue) errors.push(`RESOLVED_VALUE_REQUIRED:${decision.id}`);
    if (decision.selectedValue && !decision.options.includes(decision.selectedValue)) errors.push(`INVALID_SELECTED_VALUE:${decision.id}`);
  }
  return errors;
}
