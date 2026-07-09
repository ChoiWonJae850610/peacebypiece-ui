export type ProductionTabId =
  | "overview"
  | "images"
  | "sizes"
  | "fabric"
  | "accessories"
  | "flow"
  | "output";

export type ProductionTab = {
  id: ProductionTabId;
  label: string;
  shortLabel: string;
  alertCount?: number;
};

export type ProductionCardListItem = {
  id: string;
  title: string;
  sheetNo: string;
  quantity: string;
  dueDate: string;
  status: string;
  thumbnail: string;
  totalEstimate: string;
  issue?: string;
};

export type SummaryMetric = {
  label: string;
  value: string;
  note: string;
};

export type InfoItem = {
  label: string;
  value: string;
};

export type ImageMock = {
  id: string;
  title: string;
  kind: string;
  selected: boolean;
  note: string;
};

export type AttachmentMock = {
  title: string;
  detail: string;
  included: boolean;
};

export type SizeTemplate = {
  productType: string;
  fields: string[];
  selected?: boolean;
};

export type SizeRow = {
  group: string;
  size: string;
  chestCm: string;
  lengthCm: string;
  shoulderCm: string;
  chestIn: string;
  lengthIn: string;
  shoulderIn: string;
};

export type ColorRow = {
  color: string;
  quantity: string;
  note: string;
};

export type MaterialStatus = "입력중" | "발주 가능" | "발주 요청" | "발주 완료" | "주의/잠김";

export type MaterialRow = {
  name: string;
  supplier: string;
  category?: string;
  colorOrOption: string;
  required: string;
  allowance: string;
  stockUse: string;
  orderQuantity: string;
  leftover: string;
  unit: string;
  unitPrice: string;
  amount: string;
  status: MaterialStatus;
  warning: string;
  locked: boolean;
  primaryAction: "발주 요청" | "발주 완료" | "정보 확인" | null;
};

export type ProcessRow = {
  process: string;
  partner: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  amount: string;
  dueDate: string;
  status: string;
  memo: string;
};

export type ProgressStep = {
  id: string;
  label: string;
  shortLabel: string;
  partner: string;
  handoffDate: string;
  status: "준비" | "작업중" | "완료";
  memo: string;
  removable?: boolean;
};

export type DocumentRow = {
  title: string;
  detail: string;
  state: string;
  includes: string[];
};

export type DeliveryRow = {
  title: string;
  origin: string;
  destination: string;
  items: string;
  contact: string;
  memo: string;
};

export type NextCheckItem = {
  title: string;
  detail: string;
  tone: "neutral" | "warning" | "ready";
};

export const PRODUCTION_TABS: ProductionTab[] = [
  { id: "overview", label: "개요", shortLabel: "개요" },
  { id: "images", label: "이미지·첨부", shortLabel: "이미지" },
  { id: "sizes", label: "사이즈·색상", shortLabel: "사이즈" },
  { id: "fabric", label: "원단", shortLabel: "원단", alertCount: 1 },
  { id: "accessories", label: "부자재", shortLabel: "부자재", alertCount: 1 },
  { id: "flow", label: "제작 플로우", shortLabel: "플로우" },
  { id: "output", label: "출력·공유", shortLabel: "문서" }
];

export const productionCards: ProductionCardListItem[] = [
  {
    id: "sheet-2408-119",
    title: "리넨 셔츠 원피스",
    sheetNo: "WAFL-2408-119",
    quantity: "360벌",
    dueDate: "08/20",
    status: "발주 준비",
    thumbnail: "정면",
    totalEstimate: "12,546,000원",
    issue: "원단 1건 확인"
  },
  {
    id: "sheet-2408-121",
    title: "세미 와이드 팬츠",
    sheetNo: "WAFL-2408-121",
    quantity: "240벌",
    dueDate: "08/24",
    status: "입력중",
    thumbnail: "스와치",
    totalEstimate: "7,980,000원"
  },
  {
    id: "sheet-2408-124",
    title: "울 블렌드 자켓",
    sheetNo: "WAFL-2408-124",
    quantity: "120벌",
    dueDate: "09/02",
    status: "발주 요청",
    thumbnail: "도식",
    totalEstimate: "18,240,000원",
    issue: "납기 확인"
  }
];

export const productionCardMock = {
  title: "리넨 셔츠 원피스",
  sheetNo: "WAFL-2408-119",
  productType: "여성 원피스 / 여름 1차 생산",
  statusLabel: "발주 준비",
  quantity: "360벌",
  dueDate: "2026.08.20",
  unitCost: "34,850원",
  totalEstimate: "12,546,000원",
  representativeImage: "정면 착장",
  nextAction: "공장 전달 전 안감 거래처, 색상별 수량, 포함 첨부를 확인합니다.",
  outputState: "제작 문서 검토 가능",
  tradingSummary: "서울패브릭 / 버튼하우스 / 한강 봉제",
  memo: "허리끈 위치와 단추 간격을 검품 때 우선 확인합니다."
};

export const summaryMetrics: SummaryMetric[] = [
  { label: "수량", value: productionCardMock.quantity, note: "색상 3종 합계" },
  { label: "납기", value: productionCardMock.dueDate, note: "공장 전달 전 재확인" },
  { label: "상태", value: productionCardMock.statusLabel, note: "발주 전 확인 단계" },
  { label: "한벌 단가", value: productionCardMock.unitCost, note: "내부 검토용" },
  { label: "총 예상", value: productionCardMock.totalEstimate, note: "원단+부자재+공정" }
];

export const costMetrics: SummaryMetric[] = [
  { label: "원단 총액", value: "6,482,000원", note: "로스/여유 포함 발주수량 기준" },
  { label: "부자재 총액", value: "1,164,000원", note: "주요 부자재 합산" },
  { label: "공정 총액", value: "4,900,000원", note: "대표 공장+추가 공정" }
];

export const overviewInfo: InfoItem[] = [
  { label: "제품 타입", value: productionCardMock.productType },
  { label: "거래/제작", value: productionCardMock.tradingSummary },
  { label: "짧은 메모", value: productionCardMock.memo },
  { label: "다음 확인", value: productionCardMock.nextAction }
];

export const nextCheckByTab: Record<ProductionTabId, NextCheckItem> = {
  overview: {
    title: "납기와 총 예상 금액 확인",
    detail: "공장 전달 전에 기본정보, 색상별 수량, 총 예상 금액을 한 번 더 확인합니다.",
    tone: "ready"
  },
  images: {
    title: "대표 이미지와 첨부 확인",
    detail: "첨부파일 포함 여부는 출력·공유 탭에서 선택합니다.",
    tone: "neutral"
  },
  sizes: {
    title: "사이즈·색상 수량 합계 확인",
    detail: "색상별 수량 합계가 총 수량 360벌과 맞는지 확인합니다.",
    tone: "ready"
  },
  fabric: {
    title: "미발주 원단 2건",
    detail: "발주 요청 전 재고 사용수량과 초과분 처리를 확인합니다.",
    tone: "warning"
  },
  accessories: {
    title: "옵션·색상 미확정 1건",
    detail: "행택 끈 거래처와 단가를 확인하면 부자재 발주 요청이 가능합니다.",
    tone: "warning"
  },
  flow: {
    title: "공장 전달 전 확인",
    detail: "제작 공장, 추가 공정, 공정 메모, 단가, 납기를 확인합니다.",
    tone: "warning"
  },
  output: {
    title: "문서 출력 전 포함 항목 확인",
    detail: "작업지시서 출력 전 원단 수량, 첨부 포함 여부, 배송요청 메모를 확인합니다.",
    tone: "ready"
  }
};

export const imageMocks: ImageMock[] = [
  { id: "front", title: "정면 착장", kind: "대표", selected: true, note: "첫 이미지가 자동 대표가 되는 mock" },
  { id: "detail", title: "앞판 디테일", kind: "사진", selected: false, note: "카라와 버튼 간격 확인" },
  { id: "sketch", title: "허리 라인", kind: "스케치", selected: false, note: "절개선과 허리끈 위치" },
  { id: "reference", title: "소매 참고", kind: "참고", selected: false, note: "소매 통과 커프스 폭 참고" }
];

export const attachmentRows: AttachmentMock[] = [
  { title: "원단 스와치 확인.pdf", detail: "PDF 문서 · 출력 포함", included: true },
  { title: "부자재 참고 이미지.png", detail: "이미지 파일 · 출력 포함", included: true },
  { title: "봉제 라벨 참고.webp", detail: "이미지 파일 · 출력 제외", included: false }
];

export const sizeTemplates: SizeTemplate[] = [
  { productType: "상의", fields: ["가슴", "총장", "어깨", "소매"], selected: true },
  { productType: "하의", fields: ["허리", "밑위", "허벅지", "총장", "밑단"] },
  { productType: "원피스", fields: ["가슴", "허리", "총장", "어깨", "소매"] },
  { productType: "아우터/점퍼", fields: ["가슴", "총장", "어깨", "소매", "암홀"] },
  { productType: "맨투맨/오버롤", fields: ["가슴", "허리", "총장", "어깨", "밑단"] }
];

export const sizeRows: SizeRow[] = [
  { group: "표준", size: "XS", chestCm: "45.0", lengthCm: "112.0", shoulderCm: "36.5", chestIn: "17 3/4", lengthIn: "44 1/8", shoulderIn: "14 3/8" },
  { group: "표준", size: "S", chestCm: "47.5", lengthCm: "113.0", shoulderCm: "37.5", chestIn: "18 3/4", lengthIn: "44 1/2", shoulderIn: "14 3/4" },
  { group: "표준", size: "M", chestCm: "50.0", lengthCm: "114.5", shoulderCm: "39.0", chestIn: "19 5/8", lengthIn: "45 1/8", shoulderIn: "15 3/8" },
  { group: "고객사", size: "55", chestCm: "46.0", lengthCm: "112.5", shoulderCm: "37.0", chestIn: "18 1/8", lengthIn: "44 1/4", shoulderIn: "14 5/8" },
  { group: "자유", size: "FREE", chestCm: "52.0", lengthCm: "116.0", shoulderCm: "40.0", chestIn: "20 1/2", lengthIn: "45 5/8", shoulderIn: "15 3/4" }
];

export const colorRows: ColorRow[] = [
  { color: "아이보리", quantity: "80벌", note: "XS 20 / S 35 / M 25" },
  { color: "네이비", quantity: "120벌", note: "S 45 / M 55 / 66 20" },
  { color: "블랙", quantity: "160벌", note: "S 40 / M 80 / FREE 40" }
];

export const fabricRows: MaterialRow[] = [
  {
    name: "리넨 코튼 20수",
    supplier: "서울패브릭",
    colorOrOption: "내추럴 베이지",
    required: "420 yd",
    allowance: "42 yd",
    stockUse: "80 yd",
    orderQuantity: "382 yd",
    leftover: "공장 로스 포함",
    unit: "yd",
    unitPrice: "12,800원",
    amount: "4,889,600원",
    status: "발주 가능",
    warning: "주문 수량 확인 필요",
    locked: false,
    primaryAction: "발주 요청"
  },
  {
    name: "안감 레이온",
    supplier: "거래처 확인 필요",
    colorOrOption: "아이보리",
    required: "190 yd",
    allowance: "19 yd",
    stockUse: "0 yd",
    orderQuantity: "209 yd",
    leftover: "재고 전환 예정",
    unit: "yd",
    unitPrice: "8,600원",
    amount: "1,797,400원",
    status: "입력중",
    warning: "거래처 없음",
    locked: false,
    primaryAction: "정보 확인"
  },
  {
    name: "허리끈 배색 원단",
    supplier: "남도텍스타일",
    colorOrOption: "딥 네이비",
    required: "68 yd",
    allowance: "7 yd",
    stockUse: "22 yd",
    orderQuantity: "53 yd",
    leftover: "현재 생산에 모두 사용",
    unit: "yd",
    unitPrice: "9,200원",
    amount: "487,600원",
    status: "발주 요청",
    warning: "요청 후 잠금",
    locked: true,
    primaryAction: "발주 완료"
  },
  {
    name: "테이프 보강 원단",
    supplier: "대광텍스",
    colorOrOption: "오프화이트",
    required: "45 yd",
    allowance: "5 yd",
    stockUse: "50 yd",
    orderQuantity: "0 yd",
    leftover: "기존 재고 사용",
    unit: "yd",
    unitPrice: "6,200원",
    amount: "0원",
    status: "발주 완료",
    warning: "보기만 가능",
    locked: true,
    primaryAction: null
  }
];

export const accessoryRows: MaterialRow[] = [
  {
    name: "천연 자개 버튼",
    supplier: "버튼하우스",
    category: "단추",
    colorOrOption: "18mm / 아이보리",
    required: "2,160개",
    allowance: "216개",
    stockUse: "300개",
    orderQuantity: "2,076개",
    leftover: "여유분 공장 전달",
    unit: "개",
    unitPrice: "240원",
    amount: "498,240원",
    status: "발주 가능",
    warning: "수량 확인",
    locked: false,
    primaryAction: "발주 요청"
  },
  {
    name: "케어 라벨",
    supplier: "라벨팩토리",
    category: "라벨",
    colorOrOption: "화이트 / 한글 세탁표기",
    required: "420장",
    allowance: "30장",
    stockUse: "80장",
    orderQuantity: "370장",
    leftover: "재고 전환",
    unit: "장",
    unitPrice: "420원",
    amount: "155,400원",
    status: "발주 요청",
    warning: "요청 후 잠금",
    locked: true,
    primaryAction: "발주 완료"
  },
  {
    name: "행택 끈",
    supplier: "거래처 확인 필요",
    category: "포장",
    colorOrOption: "면끈 / 네이비",
    required: "360개",
    allowance: "36개",
    stockUse: "0개",
    orderQuantity: "396개",
    leftover: "로스 포함",
    unit: "개",
    unitPrice: "단가 없음",
    amount: "확인 필요",
    status: "입력중",
    warning: "단가 없음",
    locked: false,
    primaryAction: "정보 확인"
  },
  {
    name: "폴리백",
    supplier: "팩토리팩",
    category: "포장",
    colorOrOption: "투명 / M",
    required: "360장",
    allowance: "40장",
    stockUse: "0장",
    orderQuantity: "400장",
    leftover: "출고 포장 포함",
    unit: "장",
    unitPrice: "130원",
    amount: "52,000원",
    status: "발주 완료",
    warning: "보기만 가능",
    locked: true,
    primaryAction: null
  }
];

export const processRows: ProcessRow[] = [
  {
    process: "제작 공장",
    partner: "한강 봉제",
    quantity: "360벌",
    unit: "벌",
    unitPrice: "9,800원",
    amount: "3,528,000원",
    dueDate: "08/12",
    status: "준비",
    memo: "대표 제작 공장입니다. 봉제와 마감 지시서를 전달하기 전 원단/부자재 준비 상태를 확인합니다."
  },
  {
    process: "워싱",
    partner: "성수 워싱",
    quantity: "360벌",
    unit: "벌",
    unitPrice: "2,200원",
    amount: "792,000원",
    dueDate: "08/15",
    status: "작업중",
    memo: "워싱 강도와 촉감 기준을 공장 전달 작업지시서에 남겨야 합니다."
  },
  {
    process: "검품",
    partner: "동대문 검품",
    quantity: "360벌",
    unit: "벌",
    unitPrice: "1,600원",
    amount: "576,000원",
    dueDate: "08/18",
    status: "준비",
    memo: "검품 기준은 단추 간격과 허리끈 길이입니다. 검품 납기와 단가를 다시 확인합니다."
  }
];

export const progressSteps: ProgressStep[] = [
  {
    id: "order-request",
    label: "발주",
    shortLabel: "발주",
    partner: "서울패브릭 / 버튼하우스",
    handoffDate: "2026.08.06",
    status: "완료",
    memo: "원단 1건과 부자재 1건은 요청 완료, 남은 입력중 항목은 별도 확인"
  },
  {
    id: "material-ready",
    label: "자재 준비",
    shortLabel: "자재",
    partner: "서울패브릭 / 라벨팩토리",
    handoffDate: "2026.08.09",
    status: "작업중",
    memo: "공장 전달 전 원단 여유분과 라벨 공급처를 확인"
  },
  {
    id: "cutting",
    label: "재단",
    shortLabel: "재단",
    partner: "한강 봉제",
    handoffDate: "2026.08.10",
    status: "준비",
    memo: "재단은 기본 단계지만 봉제 공장에서 함께 처리하면 삭제 가능한 단계로 표시",
    removable: true
  },
  {
    id: "sewing-process",
    label: "공정",
    shortLabel: "공정",
    partner: "한강 봉제 / 성수 워싱",
    handoffDate: "2026.08.12",
    status: "작업중",
    memo: "공정 안에 봉제, 나염, 단추 작업, 라벨 부착 같은 내부 공정을 붙이는 구조"
  },
  {
    id: "inspection-package",
    label: "검수",
    shortLabel: "검수",
    partner: "동대문 검품 / 패키지팩",
    handoffDate: "2026.08.18",
    status: "준비",
    memo: "검수 기준과 포장 입고 시간을 출고 전 다시 확인"
  },
  {
    id: "shipping-ready",
    label: "출고",
    shortLabel: "출고",
    partner: "한강 봉제",
    handoffDate: "2026.08.20",
    status: "준비",
    memo: "완성 수량, 불량 수량, 배송요청 메모를 출고 전에 확정"
  }
];

export const outputRows: DocumentRow[] = [
  {
    title: "작업지시서",
    detail: "제작 카드 전체 기준 문서",
    state: "보기 가능",
    includes: ["대표 이미지", "사이즈·색상", "원단", "부자재", "제작 공장"]
  },
  {
    title: "공장 전달 작업지시서",
    detail: "공장에 전달할 제작 정보 중심",
    state: "공장 전달 전 확인",
    includes: ["대표 이미지", "사이즈·색상", "원단 사용", "공정 메모", "첨부 2건"]
  },
  {
    title: "배송요청서 만들기",
    detail: "출발지 1곳, 도착지 1곳, 여러 품목, 전달 메모를 묶는 흐름",
    state: "작성 대기",
    includes: ["출발지", "도착지", "여러 품목", "전달 메모"]
  },
  {
    title: "배송요청 추가하기",
    detail: "거래처별 배송요청서를 추가하는 mock 진입점",
    state: "추가 가능",
    includes: ["거래처", "품목", "도착지", "메모"]
  }
];

export const deliveryRows: DeliveryRow[] = [
  {
    title: "공장 전달 1차",
    origin: "서울패브릭",
    destination: "한강 봉제",
    items: "원단 2종 / 부자재 1종",
    contact: "공장 담당자 확인",
    memo: "8월 7일 오전 입고 요청"
  },
  {
    title: "검품 전달",
    origin: "한강 봉제",
    destination: "동대문 검품",
    items: "완성품 360벌",
    contact: "검품실 담당자 확인",
    memo: "블랙 컬러 단추 간격 우선 확인"
  }
];
