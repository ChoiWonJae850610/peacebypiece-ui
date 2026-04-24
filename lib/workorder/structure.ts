import type { Material } from "@/types/material";
import type { Attachment, MemoReply, MemoThread, OrderEntry, Outsourcing, WorkOrder } from "@/types/workorder";
import { ORDER_ENTRY_TARGET_TYPE, toOrderEntryTargetType } from "@/lib/constants/workorderDomain";

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
  return (materials ?? []).map((material, index) => ({
    ...material,
    id: String(material.id ?? "").trim() || buildChildEntityId(workOrderId, "mat", index),
  }));
}

export function normalizeOutsourcingForStorage(workOrderId: string, rows: Outsourcing[] | undefined): Outsourcing[] {
  return (rows ?? []).map((row, index) => ({
    ...row,
    id: String(row.id ?? "").trim() || buildChildEntityId(workOrderId, "out", index),
  }));
}

export function normalizeAttachmentsForStorage(workOrderId: string, attachments: Attachment[] | undefined): Attachment[] {
  return (attachments ?? [])
    .filter((attachment) => String(attachment.scope ?? "official") !== "memo")
    .map((attachment, index) => ({
      ...attachment,
      id: String(attachment.id ?? "").trim() || buildChildEntityId(workOrderId, "att", index),
      scope: attachment.scope === "design" ? "design" : "official",
      linkedThreadId: null,
      linkedReplyId: null,
      ownerId: attachment.ownerId ?? null,
      ownerName: attachment.ownerName ?? null,
    }));
}

export function normalizeMemoRepliesForStorage(
  workOrderId: string,
  threadId: string,
  replies: MemoReply[] | undefined,
): MemoReply[] {
  return (replies ?? []).map((reply, index) => ({
    ...reply,
    id: String(reply.id ?? "").trim() || buildChildEntityId(`${workOrderId}-${threadId}`, "reply", index),
    attachmentIds: [],
  }));
}

export function normalizeMemoThreadsForStorage(
  workOrderId: string,
  memoThreads: MemoThread[] | undefined,
): MemoThread[] {
  return (memoThreads ?? []).map((thread, index) => {
    const threadId = String(thread.id ?? "").trim() || buildChildEntityId(workOrderId, "memo", index);
    return {
      ...thread,
      id: threadId,
      attachmentIds: [],
      replies: normalizeMemoRepliesForStorage(workOrderId, threadId, thread.replies),
    };
  });
}

export function normalizeWorkOrderCollectionsForStorage(workOrder: WorkOrder): WorkOrder {
  const attachments = normalizeAttachmentsForStorage(workOrder.id, workOrder.attachments);

  return {
    ...workOrder,
    orderEntries: normalizeOrderEntriesForStorage(workOrder.id, workOrder.orderEntries),
    materials: normalizeMaterialsForStorage(workOrder.id, workOrder.materials),
    outsourcing: normalizeOutsourcingForStorage(workOrder.id, workOrder.outsourcing),
    attachments,
    memoThreads: normalizeMemoThreadsForStorage(workOrder.id, workOrder.memoThreads),
  };
}

export function normalizeWorkOrderCollectionsListForStorage(workOrders: WorkOrder[]): WorkOrder[] {
  return workOrders.map(normalizeWorkOrderCollectionsForStorage);
}
