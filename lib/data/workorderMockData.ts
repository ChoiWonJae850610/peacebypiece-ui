import type { HistoryLog, InventoryLog, WorkOrder, WorkflowState } from "@/types/workorder";
import { INVENTORY_CHANGE_TYPE } from "@/lib/constants/workorderDomain";
import { nowLabel } from "@/lib/workorder/history/builders";

export { createSampleAttachments } from "@/lib/data/sample/attachments";

export function getCurrentTimeLabel() {
  return nowLabel();
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
