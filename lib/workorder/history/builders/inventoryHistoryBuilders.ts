import { INVENTORY_CHANGE_TYPE } from "@/lib/constants/workorderDomain";
import { HISTORY_CATEGORY, HISTORY_TONE } from "@/lib/constants/workorderHistory";
import { createHistoryLog, defaultHistoryText, formatTemplate, type DetailLine, type HistoryText } from "@/lib/workorder/history/builders/shared";
import type { InventoryChange } from "@/types/workorder";

export function createInventoryHistoryLog(
  user: string,
  workOrderId: string,
  payload: { changes: InventoryChange[]; memo?: string },
  text: HistoryText = defaultHistoryText,
) {
  const activeChanges = payload.changes.filter((item) => item.quantity > 0);
  const detailLines: DetailLine[] = activeChanges.map((item) => ({
    label: item.type,
    value:
      item.type === INVENTORY_CHANGE_TYPE.adjustment
        ? formatTemplate(text.detailLabels.quantityAdjustedFormat, { quantity: item.quantity })
        : formatTemplate(text.detailLabels.quantityAppliedFormat, { quantity: item.quantity }),
  }));

  return createHistoryLog({
    action: text.actions.inventoryChanged,
    message: text.messages.inventoryChanged,
    user,
    workOrderId,
    category: HISTORY_CATEGORY.inventory,
    tone: activeChanges.some((item) => item.type === INVENTORY_CHANGE_TYPE.deduction)
      ? HISTORY_TONE.rose
      : activeChanges.some((item) => item.type === INVENTORY_CHANGE_TYPE.adjustment)
        ? HISTORY_TONE.amber
        : HISTORY_TONE.emerald,
    detailLines: [
      ...detailLines,
      ...(payload.memo?.trim() ? [{ label: text.detailLabels.memo, value: payload.memo.trim() }] : []),
    ],
    text,
  });
}

export function createInspectionCompleteHistoryLog(
  user: string,
  workOrderId: string,
  payload: { inboundQuantity: number; nextInventoryQuantity: number; memo?: string },
  text: HistoryText = defaultHistoryText,
) {
  return createHistoryLog({
    action: text.actions.inspectionCompleted,
    message: text.messages.inspectionCompleted,
    user,
    workOrderId,
    category: HISTORY_CATEGORY.inventory,
    tone: HISTORY_TONE.emerald,
    detailLines: [
      {
        label: INVENTORY_CHANGE_TYPE.inbound,
        value: formatTemplate(text.detailLabels.quantityAppliedFormat, { quantity: payload.inboundQuantity }),
      },
      {
        label: text.detailLabels.finalInventory,
        value: formatTemplate(text.detailLabels.quantityCurrentFormat, { quantity: payload.nextInventoryQuantity }),
      },
      ...(payload.memo?.trim() ? [{ label: text.detailLabels.memo, value: payload.memo.trim() }] : []),
    ],
    text,
  });
}
