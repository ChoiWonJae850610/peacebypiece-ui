import { INVENTORY_STATUS } from "@/lib/constants/workorderDomain";
import { applyReorderIdentity, getWorkOrderReorderGroupId, getWorkOrderReorderRound } from "@/lib/workorder/reorder/helpers";
import { applyInventoryAdjustmentToWorkOrder, completeInspectionForWorkOrder } from "@/lib/workorder/actions";
import type { WorkOrder, InventoryChange } from "@/types/workorder";

function compareByRoundDesc(a: WorkOrder, b: WorkOrder) {
  return getWorkOrderReorderRound(b) - getWorkOrderReorderRound(a);
}

export function getReorderGroupWorkOrders(workOrders: WorkOrder[], workOrder: WorkOrder): WorkOrder[] {
  const reorderGroupId = getWorkOrderReorderGroupId(workOrder);
  return workOrders.filter((item) => getWorkOrderReorderGroupId(item) === reorderGroupId);
}

export function getSharedInventorySnapshot(workOrders: WorkOrder[], workOrder: WorkOrder) {
  const groupWorkOrders = getReorderGroupWorkOrders(workOrders, workOrder);
  const source = [...groupWorkOrders].sort(compareByRoundDesc)[0] ?? workOrder;
  const inventoryQuantity = Number(source.inventoryQuantity ?? 0);
  return {
    inventoryQuantity,
    inventoryStatus: source.inventoryStatus ?? (inventoryQuantity > 0 ? INVENTORY_STATUS.normal : INVENTORY_STATUS.shortage),
  };
}

export function syncReorderGroupInventory(workOrders: WorkOrder[], workOrder: WorkOrder, inventory: { inventoryQuantity: number; inventoryStatus: WorkOrder["inventoryStatus"] }) {
  const reorderGroupId = getWorkOrderReorderGroupId(workOrder);
  return workOrders.map((item) => {
    if (getWorkOrderReorderGroupId(item) !== reorderGroupId) return applyReorderIdentity(item);
    return applyReorderIdentity({
      ...item,
      inventoryQuantity: inventory.inventoryQuantity,
      inventoryStatus: inventory.inventoryStatus,
    });
  });
}

export function applySharedInventoryAdjustment(workOrders: WorkOrder[], workOrder: WorkOrder, changes: InventoryChange[]) {
  const snapshot = getSharedInventorySnapshot(workOrders, workOrder);
  const nextWorkOrder = applyInventoryAdjustmentToWorkOrder({
    ...workOrder,
    inventoryQuantity: snapshot.inventoryQuantity,
    inventoryStatus: snapshot.inventoryStatus,
  }, { changes });

  return syncReorderGroupInventory(workOrders, workOrder, {
    inventoryQuantity: nextWorkOrder.inventoryQuantity,
    inventoryStatus: nextWorkOrder.inventoryStatus,
  });
}

export function applySharedInspectionComplete(workOrders: WorkOrder[], workOrder: WorkOrder, payload: { orderEntryId: string; nextInventoryQuantity: number }) {
  const snapshot = getSharedInventorySnapshot(workOrders, workOrder);
  const nextTarget = completeInspectionForWorkOrder({
    ...workOrder,
    inventoryQuantity: snapshot.inventoryQuantity,
    inventoryStatus: snapshot.inventoryStatus,
  }, payload);

  return workOrders.map((item) => {
    const shouldSyncInventory = getWorkOrderReorderGroupId(item) === getWorkOrderReorderGroupId(workOrder);
    const nextItem = item.id === workOrder.id ? nextTarget : item;
    if (!shouldSyncInventory) return applyReorderIdentity(nextItem);
    return applyReorderIdentity({
      ...nextItem,
      inventoryQuantity: nextTarget.inventoryQuantity,
      inventoryStatus: nextTarget.inventoryStatus,
    });
  });
}

export function normalizeSharedInventoryByReorderGroup(workOrders: WorkOrder[]): WorkOrder[] {
  const sourceByGroup = new Map<string, WorkOrder>();

  for (const workOrder of workOrders) {
    const groupId = getWorkOrderReorderGroupId(workOrder);
    const current = sourceByGroup.get(groupId);
    if (!current || compareByRoundDesc(workOrder, current) < 0) {
      sourceByGroup.set(groupId, workOrder);
    }
  }

  return workOrders.map((workOrder) => {
    const source = sourceByGroup.get(getWorkOrderReorderGroupId(workOrder)) ?? workOrder;
    return applyReorderIdentity({
      ...workOrder,
      inventoryQuantity: source.inventoryQuantity,
      inventoryStatus: source.inventoryStatus,
    });
  });
}
