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

export type SizeRow = {
  group: string;
  size: string;
  chestCm: string;
  lengthCm: string;
  shoulderCm: string;
  chestIn: string;
  lengthIn: string;
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

export type DocumentRow = {
  title: string;
  detail: string;
  state: string;
};

export type DeliveryRow = {
  title: string;
  origin: string;
  destination: string;
  items: string;
  memo: string;
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
  nextAction: "안감 거래처를 확정하면 공장 전달 작업지시서를 검토할 수 있습니다.",
  outputState: "제작 문서 검토 가능",
  tradingSummary: "서울패브릭 / 버튼하우스 / 한강 봉제",
  memo: "허리끈 위치와 단추 간격을 검품 때 우선 확인합니다."
};

export const summaryMetrics: SummaryMetric[] = [
  { label: "수량", value: productionCardMock.quantity, note: "컬러 3종 합계" },
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
  { label: "다음 작업", value: productionCardMock.nextAction }
];

export const imageMocks: ImageMock[] = [
  { id: "front", title: "정면 착장", kind: "대표", selected: true, note: "첫 이미지가 자동 대표가 되는 mock" },
  { id: "detail", title: "앞판 디테일", kind: "사진", selected: false, note: "카라와 버튼 간격 확인" },
  { id: "sketch", title: "허리 라인", kind: "스케치", selected: false, note: "절개선과 허리끈 위치" },
  { id: "reference", title: "소매 참고", kind: "참고", selected: false, note: "소매 통과 커프스 폭 참고" }
];

export const attachmentRows: AttachmentMock[] = [
  { title: "원단 스와치 확인.pdf", detail: "문서 첨부", included: true },
  { title: "공장 전달 메모.txt", detail: "메모 첨부", included: true },
  { title: "내부 단가 검토.xlsx", detail: "내부 검토", included: false }
];

export const sizeRows: SizeRow[] = [
  { group: "표준", size: "XS", chestCm: "45.0", lengthCm: "112.0", shoulderCm: "36.5", chestIn: "17 3/4", lengthIn: "44 1/8" },
  { group: "표준", size: "S", chestCm: "47.5", lengthCm: "113.0", shoulderCm: "37.5", chestIn: "18 3/4", lengthIn: "44 1/2" },
  { group: "표준", size: "M", chestCm: "50.0", lengthCm: "114.5", shoulderCm: "39.0", chestIn: "19 5/8", lengthIn: "45 1/8" },
  { group: "고객사", size: "55", chestCm: "46.0", lengthCm: "112.5", shoulderCm: "37.0", chestIn: "18 1/8", lengthIn: "44 1/4" },
  { group: "자유", size: "FREE", chestCm: "52.0", lengthCm: "116.0", shoulderCm: "40.0", chestIn: "20 1/2", lengthIn: "45 5/8" }
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
    status: "진행 예정",
    memo: "대표 생산 공장, 봉제와 마감 담당"
  },
  {
    process: "워싱",
    partner: "성수 워싱",
    quantity: "360벌",
    unit: "벌",
    unitPrice: "2,200원",
    amount: "792,000원",
    dueDate: "08/15",
    status: "일정 확인",
    memo: "부드러운 촉감 확인 후 다음 공정 진행"
  },
  {
    process: "검품",
    partner: "동대문 검품",
    quantity: "360벌",
    unit: "벌",
    unitPrice: "1,600원",
    amount: "576,000원",
    dueDate: "08/18",
    status: "대기",
    memo: "단추 간격과 허리끈 길이 중점 확인"
  }
];

export const outputRows: DocumentRow[] = [
  { title: "작업지시서", detail: "대표 이미지, 사이즈·색상, 원단, 부자재, 제작 플로우, 메모 포함", state: "보기 가능" },
  { title: "공장 전달 작업지시서", detail: "내부 단가 제외, 공장 작업 정보와 첨부 2건 포함", state: "공장 전달 전 확인" },
  { title: "배송요청서 만들기", detail: "출발지, 도착지, 품목, 연락처, 배송 메모를 묶는 mock 흐름", state: "작성 대기" },
  { title: "배송요청 추가하기", detail: "거래처별 요청서를 추가하는 mock 진입점", state: "추가 가능" }
];

export const deliveryRows: DeliveryRow[] = [
  {
    title: "공장 전달 1차",
    origin: "서울패브릭",
    destination: "한강 봉제",
    items: "원단 2종 / 부자재 1종",
    memo: "8월 7일 오전 입고 요청"
  },
  {
    title: "검품 전달",
    origin: "한강 봉제",
    destination: "동대문 검품",
    items: "완성품 360벌",
    memo: "블랙 컬러 단추 간격 우선 확인"
  }
];
