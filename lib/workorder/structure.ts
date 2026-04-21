import type { Material } from "@/types/material";
import type { Attachment, MemoReply, MemoThread, OrderEntry, Outsourcing, WorkOrder } from "@/types/workorder";
import { ORDER_ENTRY_TARGET_TYPE, toOrderEntryTargetType } from "@/lib/constants/workorderDomain";

import { buildChildEntityId, dedupeNormalizedStrings } from "@/lib/workorder/normalizeRules";


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
  return (attachments ?? []).map((attachment, index) => {
    const linkedThreadId = String(attachment.linkedThreadId ?? "").trim() || null;
    const linkedReplyId = String(attachment.linkedReplyId ?? "").trim() || null;
    const inferredScope: Attachment["scope"] = attachment.scope ?? (linkedThreadId || linkedReplyId ? "memo" : "official");

    return {
      ...attachment,
      id: String(attachment.id ?? "").trim() || buildChildEntityId(workOrderId, "att", index),
      scope: inferredScope,
      linkedThreadId: inferredScope === "memo" ? linkedThreadId : null,
      linkedReplyId: inferredScope === "memo" ? linkedReplyId : null,
      ownerId: attachment.ownerId ?? null,
      ownerName: attachment.ownerName ?? null,
    };
  });
}

export function normalizeMemoRepliesForStorage(
  workOrderId: string,
  threadId: string,
  replies: MemoReply[] | undefined,
  attachmentIds: Set<string>,
): MemoReply[] {
  return (replies ?? []).map((reply, index) => ({
    ...reply,
    id: String(reply.id ?? "").trim() || buildChildEntityId(`${workOrderId}-${threadId}`, "reply", index),
    attachmentIds: dedupeNormalizedStrings((reply.attachmentIds ?? []).filter((attachmentId) => attachmentIds.has(String(attachmentId ?? "").trim()))),
  }));
}

export function normalizeMemoThreadsForStorage(
  workOrderId: string,
  memoThreads: MemoThread[] | undefined,
  attachments: Attachment[],
): MemoThread[] {
  const attachmentIds = new Set(attachments.map((attachment) => attachment.id));

  return (memoThreads ?? []).map((thread, index) => {
    const threadId = String(thread.id ?? "").trim() || buildChildEntityId(workOrderId, "memo", index);
    return {
      ...thread,
      id: threadId,
      attachmentIds: dedupeNormalizedStrings((thread.attachmentIds ?? []).filter((attachmentId) => attachmentIds.has(String(attachmentId ?? "").trim()))),
      replies: normalizeMemoRepliesForStorage(workOrderId, threadId, thread.replies, attachmentIds),
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
    memoThreads: normalizeMemoThreadsForStorage(workOrder.id, workOrder.memoThreads, attachments),
  };
}

export function normalizeWorkOrderCollectionsListForStorage(workOrders: WorkOrder[]): WorkOrder[] {
  return workOrders.map(normalizeWorkOrderCollectionsForStorage);
}
