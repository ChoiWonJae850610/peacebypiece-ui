import type { Material } from "@/types/material";
import type { Attachment, OrderEntry, Outsourcing, WorkOrder } from "@/types/workorder";
import { ORDER_ENTRY_TARGET_TYPE, toOrderEntryTargetType } from "@/lib/constants/workorderDomain";
import { normalizeProductionMaterialRows, normalizeProductionOutsourcingRows } from "@/lib/workorder/productionCompositionSnapshot";

import { buildChildEntityId } from "@/lib/workorder/normalizeRules";


export function normalizeOrderEntriesForStorage(workOrderId: string, orderEntries: OrderEntry[] | undefined): OrderEntry[] {
  return (orderEntries ?? []).map((entry, index) => ({
    ...entry,
    id: String(entry.id ?? "").trim() || buildChildEntityId(workOrderId, "order", index),
    targetType: toOrderEntryTargetType(entry.targetType ?? ORDER_ENTRY_TARGET_TYPE.factory),
    dueDate: String(entry.dueDate ?? ""),
    priority: String(entry.priority ?? ""),
  }));
}

export function normalizeMaterialsForStorage(workOrderId: string, materials: Material[] | undefined): Material[] {
  return normalizeProductionMaterialRows(materials).map((material, index) => ({
    ...material,
    id: String(material.id ?? "").trim() || buildChildEntityId(workOrderId, "mat", index),
  }));
}

export function normalizeOutsourcingForStorage(workOrderId: string, rows: Outsourcing[] | undefined): Outsourcing[] {
  return normalizeProductionOutsourcingRows(rows).map((row, index) => ({
    ...row,
    id: String(row.id ?? "").trim() || buildChildEntityId(workOrderId, "out", index),
  }));
}

export function normalizeAttachmentsForStorage(workOrderId: string, attachments: Attachment[] | undefined): Attachment[] {
  return (attachments ?? []).map((attachment, index) => ({
    ...attachment,
    id: String(attachment.id ?? "").trim() || buildChildEntityId(workOrderId, "att", index),
    name: String(attachment.name ?? ""),
    type: attachment.type ?? "file",
    url: String(attachment.url ?? ""),
    storageKey: attachment.storageKey ?? null,
    thumbnailKey: attachment.thumbnailKey ?? null,
    thumbnailUrl: attachment.thumbnailUrl ?? null,
    previewUrl: attachment.previewUrl ?? String(attachment.url ?? ""),
    scope: attachment.scope ?? "attachment",
  }));
}

export function normalizeWorkOrderCollectionsForStorage(workOrder: WorkOrder): WorkOrder {
  const attachments = normalizeAttachmentsForStorage(workOrder.id, workOrder.attachments);

  return {
    ...workOrder,
    orderEntries: normalizeOrderEntriesForStorage(workOrder.id, workOrder.orderEntries),
    materials: normalizeMaterialsForStorage(workOrder.id, workOrder.materials),
    outsourcing: normalizeOutsourcingForStorage(workOrder.id, workOrder.outsourcing),
    attachments,
  };
}

export function normalizeWorkOrderCollectionsListForStorage(workOrders: WorkOrder[]): WorkOrder[] {
  return workOrders.map(normalizeWorkOrderCollectionsForStorage);
}
