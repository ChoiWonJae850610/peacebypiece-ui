import type { Attachment, HistoryFilter, HistoryLog, InventoryLog, WorkOrder, WorkflowState } from "@/types/workorder";
import type { PersistedWorkOrderState } from "@/lib/data/mock/types";
import { getPermissionSummary, hasRole } from "@/lib/constants/roles";
import { LEGACY_STORAGE_KEYS, STORAGE_KEY } from "@/lib/constants/app";
import { INVENTORY_CHANGE_TYPE } from "@/lib/constants/workorderDomain";
import { DEFAULT_CURRENT_USER_ID as DEFAULT_CURRENT_USER_ID_VALUE, DEFAULT_PERMISSION_TARGET_ID as DEFAULT_PERMISSION_TARGET_ID_VALUE, MOCK_USERS } from "@/lib/data/mock/users";
import { DEFAULT_SELECTED_WORK_ORDER_ID, MOCK_HISTORY_LOGS, MOCK_WORK_ORDERS } from "@/lib/data/mock/workorders";
import { nowLabel } from "@/lib/workorder/history/builders";

export function getCurrentTimeLabel() {
  return nowLabel();
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

export const INITIAL_HISTORY_LOGS: Record<string, HistoryLog[]> = MOCK_HISTORY_LOGS.reduce<Record<string, HistoryLog[]>>((acc, log) => {
  if (!acc[log.workOrderId]) acc[log.workOrderId] = [];
  acc[log.workOrderId].push(log);
  return acc;
}, {});

export function getDefaultHistoryFilterByRole(user: Parameters<typeof getPermissionSummary>[0]): HistoryFilter {
  if (hasRole(user, "관리자")) return "all";
  if (hasRole(user, "입고/검수")) return "inventory";
  return "work";
}

export function filterHistoryLogs(logs: HistoryLog[], user: Parameters<typeof getPermissionSummary>[0], filter: HistoryFilter) {
  const roleFiltered = logs.filter((log) => {
    if (hasRole(user, "관리자")) return true;
    if (hasRole(user, "입고/검수")) return log.category === "inventory";
    return log.category === "work";
  });
  if (!hasRole(user, "관리자")) return roleFiltered;
  if (filter === "all") return roleFiltered;
  return roleFiltered.filter((log) => log.category === filter);
}

function extractDeltaFromMessage(message: string) {
  const matched = message.match(/([+-]?\d+)/);
  if (!matched) return 0;
  return Number(matched[1]);
}

export function mapHistoryToInventoryLogs(logs: HistoryLog[]): InventoryLog[] {
  return logs
    .filter((log) => log.category === "inventory")
    .map((log) => {
      const type = log.action.includes(INVENTORY_CHANGE_TYPE.inbound)
        ? INVENTORY_CHANGE_TYPE.inbound
        : log.action.includes(INVENTORY_CHANGE_TYPE.adjustment)
        ? INVENTORY_CHANGE_TYPE.adjustment
        : INVENTORY_CHANGE_TYPE.deduction;

      const delta = extractDeltaFromMessage(log.message);

      return {
        id: log.id,
        type,
        delta,
        memo: log.message,
        user: log.user,
        time: log.time,
        summary: `${type} ${delta}`,
        changes: [
          {
            type,
            quantity: delta,
            memo: log.message,
          },
        ],
      };
    });
}

function buildSvgDataUrl(label: string, bg: string, fg: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="${bg}"/><text x="400" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="${fg}">${label}</text><text x="400" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="${fg}" opacity="0.8">PeacebyPiece Attachment Preview</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function createSampleAttachments(workOrderId: string, count: number): Attachment[] {
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

export const INITIAL_WORK_ORDERS: WorkOrder[] = MOCK_WORK_ORDERS;

export function buildPersistedState(payload: PersistedWorkOrderState) {
  return JSON.stringify(payload);
}

export const DEFAULT_SELECTED_ID = DEFAULT_SELECTED_WORK_ORDER_ID;
export const DEFAULT_CURRENT_USER_ID = DEFAULT_CURRENT_USER_ID_VALUE;
export const DEFAULT_PERMISSION_TARGET_ID = DEFAULT_PERMISSION_TARGET_ID_VALUE;
export { MOCK_USERS as INITIAL_USERS };
