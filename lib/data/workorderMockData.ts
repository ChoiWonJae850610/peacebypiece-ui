import type { Attachment, HistoryFilter, HistoryLog, InventoryLog, UserProfile, WorkOrder, WorkflowState } from "@/types/workorder";
import { INITIAL_USERS, ROLE_PRESETS, getPermissionSummary } from "@/lib/constants/roles";
import { LEGACY_STORAGE_KEYS, STORAGE_KEY } from "@/lib/constants/app";

export function getCurrentTimeLabel() {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function loadPersistedPayload() {
  const storageKeys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
  for (const key of storageKeys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  }
  return null;
}

export const INITIAL_HISTORY_LOGS: Record<string, HistoryLog[]> = {
  "WO-2026-0014": [
    { id: "h-14-1", workOrderId: "WO-2026-0014", category: "work", action: "작업지시서 생성", message: "작업지시서가 생성되었습니다.", user: "김디자이너", time: "03-21 09:00", tone: "blue" },
    { id: "h-14-2", workOrderId: "WO-2026-0014", category: "work", action: "검토 요청", message: "검토 요청을 진행했습니다.", user: "김디자이너", time: "03-21 13:20", tone: "violet" },
    { id: "h-14-3", workOrderId: "WO-2026-0014", category: "work", action: "발주 요청", message: "발주 요청 상태로 변경했습니다.", user: "박관리", time: "03-22 09:18", tone: "blue" },
    { id: "h-14-4", workOrderId: "WO-2026-0014", category: "inventory", action: "입고", message: "입고 +5 · 샘플 1차 입고", user: "박관리", time: "03-22 11:40", tone: "emerald" },
    { id: "h-14-5", workOrderId: "WO-2026-0014", category: "inventory", action: "차감", message: "차감 -2 · 검수 불량 차감", user: "이검수", time: "03-22 16:20", tone: "rose" },
  ],
  "WO-2026-0015": [
    { id: "h-15-1", workOrderId: "WO-2026-0015", category: "work", action: "작업지시서 생성", message: "작업지시서가 생성되었습니다.", user: "김디자이너", time: "03-20 10:00", tone: "blue" },
    { id: "h-15-2", workOrderId: "WO-2026-0015", category: "work", action: "메모 수정", message: "워싱 샘플 확인 메모를 수정했습니다.", user: "이담당", time: "03-22 10:05", tone: "stone" },
  ],
  "WO-2026-0016": [
    { id: "h-16-1", workOrderId: "WO-2026-0016", category: "work", action: "작업지시서 생성", message: "작업지시서가 생성되었습니다.", user: "박관리", time: "03-17 15:10", tone: "blue" },
    { id: "h-16-2", workOrderId: "WO-2026-0016", category: "work", action: "완료 처리", message: "검수 완료 후 작업을 완료 처리했습니다.", user: "박관리", time: "03-18 11:10", tone: "violet" },
  ],
};

export function getDefaultHistoryFilterByRole(role: ReturnType<typeof getPermissionSummary>): HistoryFilter {
  if (role === "관리자") return "all";
  if (role === "입고/검수") return "inventory";
  return "work";
}

export function filterHistoryLogs(logs: HistoryLog[], role: ReturnType<typeof getPermissionSummary>, filter: HistoryFilter) {
  const roleFiltered = logs.filter((log) => {
    if (role === "관리자") return true;
    if (role === "입고/검수") return log.category === "inventory";
    return log.category === "work";
  });
  if (role !== "관리자") return roleFiltered;
  if (filter === "all") return roleFiltered;
  return roleFiltered.filter((log) => log.category === filter);
}

function extractDeltaFromMessage(message: string) {
  const matched = message.match(/([+-]?\d+)/);
  if (!matched) return 0;
  return Number(matched[1]);
}

export function mapHistoryToInventoryLogs(logs: HistoryLog[]): InventoryLog[] {
  return logs.filter((log) => log.category === "inventory").map((log) => ({ id: log.id, workOrderId: log.workOrderId, type: log.action as InventoryLog["type"], delta: extractDeltaFromMessage(log.message), memo: log.message, user: log.user, time: log.time }));
}

function buildSvgDataUrl(label: string, bg: string, fg: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="${bg}"/><text x="400" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="${fg}">${label}</text><text x="400" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="${fg}" opacity="0.8">PeacebyPiece Attachment Preview</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createSampleAttachments(workOrderId: string, count: number): Attachment[] {
  const base: Attachment[] = [
    { id: `${workOrderId}-att-image-1`, type: "image", name: "front-sample.jpg", url: buildSvgDataUrl("FRONT SAMPLE", "#E7EEF8", "#26415F"), ownerId: "user-designer", ownerName: "김디자이너" },
    { id: `${workOrderId}-att-pdf-1`, type: "pdf", name: "workorder-sheet.pdf", url: buildSvgDataUrl("PDF", "#FDECEC", "#991B1B"), ownerId: "user-admin", ownerName: "박관리" },
    { id: `${workOrderId}-att-image-2`, type: "image", name: "detail-note.jpg", url: buildSvgDataUrl("DETAIL NOTE", "#EEF7E9", "#31572C"), ownerId: "user-designer", ownerName: "김디자이너" },
    { id: `${workOrderId}-att-image-3`, type: "image", name: "color-chip.jpg", url: buildSvgDataUrl("COLOR CHIP", "#FFF4DF", "#9A6700"), ownerId: "user-inspection", ownerName: "이검수" },
    { id: `${workOrderId}-att-pdf-2`, type: "pdf", name: "spec-sheet.pdf", url: buildSvgDataUrl("SPEC PDF", "#F4EAFE", "#6D28D9"), ownerId: "user-admin", ownerName: "박관리" },
    { id: `${workOrderId}-att-image-4`, type: "image", name: "back-view.jpg", url: buildSvgDataUrl("BACK VIEW", "#E9F8F8", "#155E75"), ownerId: "user-inspection", ownerName: "이검수" },
  ];
  return base.slice(0, count);
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function createWorkflowStateMap(orders: WorkOrder[]): Record<string, WorkflowState> {
  return Object.fromEntries(orders.map((item) => [item.id, item.workflowState])) as Record<string, WorkflowState>;
}

export function createInventoryQuantityMap(orders: WorkOrder[]): Record<string, number> {
  return Object.fromEntries(orders.map((item) => [item.id, item.inventoryQuantity])) as Record<string, number>;
}

type WorkOrderSeed = WorkOrder & {
  status?: string;
  historyItems?: Array<{ time: string; user: string; action: string }>;
  internalCode?: string;
};

const INITIAL_WORK_ORDER_SEEDS: WorkOrderSeed[] = [
  {
    id: "WO-2026-0014", title: "코튼 레이어드 반팔", vendor: "A공장", dueDate: "03/29", inventoryStatus: "부족",
    attachments: createSampleAttachments("WO-2026-0014", 4), status: "발주요청", workflowState: "발주요청", category1: "의류", category2: "상의", category3: "반팔", season: "SS", manager: "김담당", priority: "높음", quantity: 20, inventoryQuantity: 8, memo: "샘플 1차 진행. 넥라인 시보리 톤 다운 요청.", lastSavedAt: "03-22 16:20",
    historyItems: [{ time: "09:14", user: "Kty", action: "수량 30 → 50 변경" }, { time: "09:18", user: "김담당", action: "검토 완료 후 발주 요청 상태로 변경" }, { time: "09:23", user: "staff1", action: "샘플사진 2장 업로드" }, { time: "09:40", user: "Kty", action: "외주공정 나염 추가" }],
    materials: [
      { id: "m-14-1", type: "원단", name: "30수 코튼", vendor: "A텍스타일", quantity: 12, unit: "yd", unitCost: 3500, totalCost: 42000, status: "발주완료" },
      { id: "m-14-2", type: "원단", name: "폴리 안감", vendor: "B원단", quantity: 8, unit: "yd", unitCost: 2200, totalCost: 17600, status: "입고완료" },
      { id: "m-14-3", type: "부자재", name: "단추 18mm", vendor: "C부자재", quantity: 40, unit: "개", unitCost: 120, totalCost: 4800, status: "발주완료" },
      { id: "m-14-4", type: "부자재", name: "케어라벨", vendor: "D라벨", quantity: 20, unit: "개", unitCost: 150, totalCost: 3000, status: "요청전" },
    ],
    outsourcing: [
      { id: "o-14-1", process: "재단", vendor: "A공장", quantity: 20, unitType: "장당", unitCost: 1500, totalCost: 30000, status: "완료" },
      { id: "o-14-2", process: "봉제", vendor: "B공장", quantity: 20, unitType: "장당", unitCost: 8000, totalCost: 160000, status: "진행중" },
      { id: "o-14-3", process: "나염", vendor: "C프린트", quantity: 1, unitType: "건당", unitCost: 50000, totalCost: 50000, status: "요청전" },
      { id: "o-14-4", process: "라벨봉제", vendor: "D업체", quantity: 20, unitType: "장당", unitCost: 300, totalCost: 6000, status: "완료" },
    ],
  },
  {
    id: "WO-2026-0015", title: "워싱 데님 팬츠", vendor: "B공장", dueDate: "04/02", inventoryStatus: "정상",
    attachments: createSampleAttachments("WO-2026-0015", 6), status: "생산중", workflowState: "생산중", category1: "의류", category2: "하의", category3: "데님", season: "SS", manager: "이담당", priority: "중간", quantity: 30, inventoryQuantity: 18, memo: "워싱 강도 샘플 확인 후 본생산 진행 예정.", lastSavedAt: "03-22 10:20",
    historyItems: [{ time: "10:05", user: "이담당", action: "워싱 샘플 확인 요청" }, { time: "10:20", user: "Kty", action: "봉제 수량 재확인" }],
    materials: [
      { id: "m-15-1", type: "원단", name: "데님 10oz", vendor: "청원단", quantity: 20, unit: "yd", unitCost: 5200, totalCost: 104000, status: "입고완료" },
      { id: "m-15-2", type: "부자재", name: "지퍼", vendor: "YKK", quantity: 30, unit: "개", unitCost: 600, totalCost: 18000, status: "발주완료" },
      { id: "m-15-3", type: "부자재", name: "리벳", vendor: "금속부자재", quantity: 60, unit: "개", unitCost: 120, totalCost: 7200, status: "입고완료" },
    ],
    outsourcing: [
      { id: "o-15-1", process: "재단", vendor: "B공장", quantity: 30, unitType: "장당", unitCost: 1800, totalCost: 54000, status: "완료" },
      { id: "o-15-2", process: "봉제", vendor: "B공장", quantity: 30, unitType: "장당", unitCost: 9000, totalCost: 270000, status: "진행중" },
      { id: "o-15-3", process: "워싱", vendor: "세탁공정", quantity: 30, unitType: "장당", unitCost: 2500, totalCost: 75000, status: "요청전" },
    ],
  },
  {
    id: "WO-2026-0016", title: "미니 숄더백", vendor: "C업체", dueDate: "03/18", inventoryStatus: "정상",
    attachments: createSampleAttachments("WO-2026-0016", 3), status: "완료", workflowState: "완료", category1: "가방", category2: "숄더백", category3: "미니백", season: "FW", manager: "박담당", priority: "낮음", quantity: 15, inventoryQuantity: 15, memo: "완료된 샘플. 사진 아카이브만 추가 정리 예정.", lastSavedAt: "03-18 11:10",
    historyItems: [{ time: "11:10", user: "박담당", action: "완료 처리" }],
    materials: [
      { id: "m-16-1", type: "원단", name: "합성피혁", vendor: "가방원단", quantity: 10, unit: "yd", unitCost: 6800, totalCost: 68000, status: "입고완료" },
      { id: "m-16-2", type: "부자재", name: "체인 스트랩", vendor: "금속부자재", quantity: 15, unit: "개", unitCost: 2200, totalCost: 33000, status: "입고완료" },
    ],
    outsourcing: [
      { id: "o-16-1", process: "재단", vendor: "C업체", quantity: 15, unitType: "개당", unitCost: 2000, totalCost: 30000, status: "완료" },
      { id: "o-16-2", process: "봉제", vendor: "C업체", quantity: 15, unitType: "개당", unitCost: 7500, totalCost: 112500, status: "완료" },
    ],
  },
];

export const INITIAL_WORK_ORDERS: WorkOrder[] = INITIAL_WORK_ORDER_SEEDS.map(({ status, historyItems, internalCode, ...item }) => item);

export function buildPersistedState(payload: { workOrders: WorkOrder[]; selectedId: string; users: UserProfile[]; currentUserId: string; rolePermissionTemplates: typeof ROLE_PRESETS; workflowStateById: Record<string, WorkflowState>; inventoryQuantityById: Record<string, number>; historyLogsById: Record<string, HistoryLog[]>; }) {
  return JSON.stringify(payload);
}

export const DEFAULT_SELECTED_ID = "WO-2026-0014";
export const DEFAULT_CURRENT_USER_ID = "user-admin";
export const DEFAULT_PERMISSION_TARGET_ID = "user-designer";
export { INITIAL_USERS, ROLE_PRESETS };
