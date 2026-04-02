import type { HistoryLog, WorkOrder } from "@/types/workorder";
import type { MockWorkOrderSource } from "@/lib/data/mock/types";

const placeholderImage = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80";
const placeholderPdf = "about:blank";

const workOrders: WorkOrder[] = [
  {
    id: "wo-1",
    title: "코튼 레이어드 반팔",
    category1: "의류",
    category2: "상의",
    category3: "반팔",
    season: "SS 2026",
    priority: "높음",
    vendor: "A공장",
    manager: "김담당",
    dueDate: "03/29",
    quantity: 20,
    inventoryQuantity: 12,
    inventoryStatus: "부족",
    memo: "메인 컬러와 배색 확인 후 생산 요청. 목 시보리 톤은 첨부 이미지를 우선 기준으로 확인합니다.",
    workflowState: "검토요청",
    lastSavedAt: "03-26 21:48",
    materials: [
      { id: "m-1", type: "원단", name: "30수 코튼", vendor: "A텍스타일", quantity: 12, unit: "yd", unitCost: 3500, totalCost: 42000, status: "발주완료" },
      { id: "m-2", type: "원단", name: "폴리 안감", vendor: "B원단", quantity: 8, unit: "yd", unitCost: 2200, totalCost: 17600, status: "입고완료" },
      { id: "m-3", type: "부자재", name: "단추 18mm", vendor: "C부자재", quantity: 40, unit: "개", unitCost: 120, totalCost: 4800, status: "발주완료" },
      { id: "m-4", type: "부자재", name: "케어라벨", vendor: "라벨랩", quantity: 20, unit: "개", unitCost: 150, totalCost: 3000, status: "준비중" },
    ],
    outsourcing: [
      { id: "o-1", process: "재단", vendor: "A공장", quantity: 20, unitType: "장당", unitCost: 1800, totalCost: 36000, status: "진행중" },
      { id: "o-2", process: "봉제", vendor: "B봉제", quantity: 20, unitType: "장당", unitCost: 5200, totalCost: 104000, status: "진행중" },
      { id: "o-3", process: "나염", vendor: "C나염", quantity: 20, unitType: "장당", unitCost: 5300, totalCost: 106000, status: "대기" },
    ],
    attachments: [
      { id: "att-1", name: "메인 샘플.jpg", type: "image", url: placeholderImage, ownerId: "user-designer", ownerName: "김디자이너" },
      { id: "att-2", name: "작업 지시서.pdf", type: "pdf", url: placeholderPdf, ownerId: "user-admin", ownerName: "박관리" },
      { id: "att-3", name: "원단 스와치.jpg", type: "image", url: placeholderImage, ownerId: null, ownerName: "기존 첨부" },
      { id: "att-4", name: "사이즈 표.pdf", type: "pdf", url: placeholderPdf, ownerId: null, ownerName: "기존 첨부" },
    ],
  },
  {
    id: "wo-2",
    title: "워싱 데님 팬츠",
    category1: "의류",
    category2: "하의",
    category3: "데님",
    season: "FW 2026",
    priority: "중간",
    vendor: "B공장",
    manager: "박관리",
    dueDate: "04/02",
    quantity: 30,
    inventoryQuantity: 28,
    inventoryStatus: "정상",
    memo: "워싱 견뢰도 테스트 후 본생산 진행 예정.",
    workflowState: "생산중",
    lastSavedAt: "03-26 18:10",
    materials: [
      { id: "m-21", type: "원단", name: "데님 8oz", vendor: "블루텍스", quantity: 18, unit: "yd", unitCost: 4700, totalCost: 84600, status: "입고완료" },
      { id: "m-22", type: "부자재", name: "리벳 세트", vendor: "금속랩", quantity: 60, unit: "개", unitCost: 300, totalCost: 18000, status: "발주완료" },
    ],
    outsourcing: [
      { id: "o-21", process: "워싱", vendor: "워싱랩", quantity: 30, unitType: "장당", unitCost: 2500, totalCost: 75000, status: "진행중" },
    ],
    attachments: [],
  },
  {
    id: "wo-3",
    title: "미니 숄더백",
    category1: "가방",
    category2: "숄더백",
    category3: "미니백",
    season: "ALL",
    priority: "낮음",
    vendor: "C업체",
    manager: "이검수",
    dueDate: "03/18",
    quantity: 10,
    inventoryQuantity: 10,
    inventoryStatus: "정상",
    memo: "완료 후 샘플 보관용 1개 별도 관리.",
    workflowState: "완료",
    lastSavedAt: "03-26 16:02",
    materials: [
      { id: "m-31", type: "원단", name: "합성피혁", vendor: "가죽랩", quantity: 5, unit: "yd", unitCost: 6800, totalCost: 34000, status: "입고완료" },
    ],
    outsourcing: [
      { id: "o-31", process: "박음질", vendor: "C업체", quantity: 10, unitType: "장당", unitCost: 4000, totalCost: 40000, status: "완료" },
    ],
    attachments: [
      { id: "att-31", name: "완료 이미지.jpg", type: "image", url: placeholderImage, ownerId: "user-qc", ownerName: "이검수" },
      { id: "att-32", name: "출고 체크리스트.pdf", type: "pdf", url: placeholderPdf, ownerId: null, ownerName: "기존 첨부" },
      { id: "att-33", name: "부자재 명세.pdf", type: "pdf", url: placeholderPdf, ownerId: null, ownerName: "기존 첨부" },
    ],
  },
];

const historyLogs: HistoryLog[] = [
  { id: "h-1", workOrderId: "wo-1", category: "work", action: "검토 요청", message: "검토 요청 상태로 변경했습니다.", user: "김디자이너", time: "03-26 21:22", tone: "violet" },
  { id: "h-2", workOrderId: "wo-1", category: "inventory", action: "입고 등록", message: "원단 12yd 입고 수량을 반영했습니다.", user: "박관리", time: "03-26 20:10", tone: "emerald" },
  { id: "h-3", workOrderId: "wo-1", category: "work", action: "저장 완료", message: "작업지시 메모를 저장했습니다.", user: "김디자이너", time: "03-26 19:48", tone: "stone" },
  { id: "h-4", workOrderId: "wo-1", category: "inventory", action: "재고 보정", message: "실재고 기준으로 2장 보정했습니다.", user: "이검수", time: "03-26 18:30", tone: "amber" },
  { id: "h-5", workOrderId: "wo-2", category: "work", action: "생산 시작", message: "워싱 공정을 포함한 생산을 시작했습니다.", user: "박관리", time: "03-25 14:20", tone: "blue" },
  { id: "h-6", workOrderId: "wo-2", category: "inventory", action: "차감", message: "샘플 검토용으로 2장 차감했습니다.", user: "이검수", time: "03-25 11:00", tone: "rose" },
  { id: "h-7", workOrderId: "wo-3", category: "work", action: "완료", message: "최종 검수 후 완료 처리했습니다.", user: "이검수", time: "03-24 17:40", tone: "stone" },
];

export const MOCK_WORK_ORDER_SOURCE: MockWorkOrderSource = {
  workOrders,
  historyLogs,
  defaultSelectedId: workOrders[0]?.id ?? "",
};

export const MOCK_WORK_ORDERS = MOCK_WORK_ORDER_SOURCE.workOrders;
export const MOCK_HISTORY_LOGS = MOCK_WORK_ORDER_SOURCE.historyLogs;
export const DEFAULT_SELECTED_WORK_ORDER_ID = MOCK_WORK_ORDER_SOURCE.defaultSelectedId;
