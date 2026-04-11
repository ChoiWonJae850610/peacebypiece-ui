import { INVENTORY_CHANGE_TYPE, isInventoryChangeType } from "@/lib/constants/workorderDomain";
import type { HistoryLog, InventoryChange, InventoryLog } from "@/types/workorder";

function parseInventoryChanges(log: HistoryLog): InventoryChange[] {
  const changes: InventoryChange[] = [];
  for (const detail of log.detailLines ?? []) {
    if (!isInventoryChangeType(detail.label)) continue;
    const matched = detail.value.match(/(\d+)장/);
    const quantity = matched ? Number(matched[1]) : 0;
    if (quantity > 0) changes.push({ type: detail.label, quantity });
  }
  return changes;
}

function summarizeInventoryChanges(changes: InventoryChange[]) {
  if (changes.length === 0) return "재고 변경";
  return changes.map((item) => `${item.type} ${item.quantity}장`).join(" / ");
}

function extractDelta(changes: InventoryChange[]) {
  return changes.reduce((acc, item) => {
    if (item.type === INVENTORY_CHANGE_TYPE.inbound) return acc + item.quantity;
    if (item.type === INVENTORY_CHANGE_TYPE.deduction) return acc - item.quantity;
    return acc;
  }, 0);
}

export function toInventoryLogs(scopedHistoryLogs: HistoryLog[]): InventoryLog[] {
  return scopedHistoryLogs
    .filter((item) => item.category === "inventory")
    .map((item) => {
      const changes = parseInventoryChanges(item);
      return {
        id: item.id,
        summary: summarizeInventoryChanges(changes),
        delta: extractDelta(changes),
        memo: item.detailLines?.map((detail) => `${detail.label ? `${detail.label}: ` : ""}${detail.value}`).join(" / ") ?? item.message,
        user: item.user,
        time: item.time,
        changes,
      };
    });
}
