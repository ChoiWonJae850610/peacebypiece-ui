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
};

export const PRODUCTION_TABS: ProductionTab[] = [
  { id: "overview", label: "개요", shortLabel: "개요" },
  { id: "images", label: "이미지·첨부", shortLabel: "이미지" },
  { id: "sizes", label: "사이즈·색상", shortLabel: "사이즈" },
  { id: "fabric", label: "원단", shortLabel: "원단" },
  { id: "accessories", label: "부자재", shortLabel: "부자재" },
  { id: "flow", label: "제작 플로우", shortLabel: "플로우" },
  { id: "output", label: "출력·공유", shortLabel: "출력" }
];

export const productionCardMock = {
  title: "린넨 셔츠 원피스",
  subtitle: "2026 여름 1차 생산",
  statusLabel: "발주 준비",
  quantity: "360벌",
  dueDate: "26/08/20",
  unitCost: "34,850원",
  totalEstimate: "12,546,000원",
  fabricTotal: "6,482,000원",
  accessoryTotal: "1,164,000원",
  processTotal: "4,900,000원"
};

export const imageMocks = [
  { name: "대표 이미지", kind: "제품컷", selected: true },
  { name: "앞판 디테일", kind: "사진", selected: false },
  { name: "소매 스케치", kind: "스케치", selected: false }
];

export const sizeRows = [
  { size: "XS", chest: "45.0 cm", length: "112.0 cm", color: "아이보리 80" },
  { size: "S", chest: "47.5 cm", length: "113.0 cm", color: "네이비 120" },
  { size: "M", chest: "50.0 cm", length: "114.5 cm", color: "블랙 160" }
];

export const fabricRows = [
  {
    name: "린넨 코튼 20수",
    supplier: "서울패브릭",
    status: "발주 가능",
    quantity: "420 yd",
    stock: "80 yd",
    order: "340 yd",
    unitPrice: "12,800원",
    amount: "4,352,000원"
  },
  {
    name: "안감 레이온",
    supplier: "거래처 필요",
    status: "거래처 확인",
    quantity: "190 yd",
    stock: "0 yd",
    order: "190 yd",
    unitPrice: "8,600원",
    amount: "1,634,000원"
  }
];

export const accessoryRows = [
  {
    name: "천연 자개 단추",
    category: "단추",
    supplier: "버튼하우스",
    status: "발주 가능",
    order: "2,520개",
    amount: "604,800원"
  },
  {
    name: "케어 라벨",
    category: "라벨",
    supplier: "라벨팩토리",
    status: "발주 요청",
    order: "420장",
    amount: "176,400원"
  }
];

export const processRows = [
  {
    process: "제작 공장",
    partner: "한강 봉제",
    quantity: "360벌",
    unitPrice: "9,800원",
    amount: "3,528,000원",
    memo: "대표 생산 공장"
  },
  {
    process: "워싱",
    partner: "성수 워싱",
    quantity: "360벌",
    unitPrice: "2,200원",
    amount: "792,000원",
    memo: "롱프레스 전 진행"
  },
  {
    process: "검품",
    partner: "내부 검품",
    quantity: "360벌",
    unitPrice: "1,600원",
    amount: "576,000원",
    memo: "롱프레스 또는 길게 눌러 순서 조정 예정"
  }
];

export const outputRows = [
  { title: "작업지시서", detail: "대표 이미지, 사이즈·색상, 원단, 부자재 포함" },
  { title: "공장 전달 작업지시서", detail: "내부 단가 제외, 제작 공장 전달용" },
  { title: "배송요청서 만들기", detail: "출발지, 도착지, 품목, 메모 입력 예정" },
  { title: "배송요청 추가하기", detail: "거래처별 요청을 mock 행으로 추가하는 자리" }
];
