import type { Material } from "@/types/material";
import type { Attachment, MemoReply, MemoThread, OrderEntry, Outsourcing, WorkOrder } from "@/types/workorder";

function fallbackChildId(workOrderId: string, prefix: string, index: number) {
  return `${workOrderId}-${prefix}-${index + 1}`;
}

function dedupeStringList(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

export function normalizeOrderEntriesForStorage(workOrderId: string, orderEntries: OrderEntry[] | undefined): OrderEntry[] {
  return (orderEntries ?? []).map((entry, index) => ({
    ...entry,
    id: String(entry.id ?? "").trim() || fallbackChildId(workOrderId, "order", index),
    dueDate: String(entry.dueDate ?? ""),
    priority: String(entry.priority ?? ""),
  }));
}

export function normalizeMaterialsForStorage(workOrderId: string, materials: Material[] | undefined): Material[] {
  return (materials ?? []).map((material, index) => ({
    ...material,
    id: String(material.id ?? "").trim() || fallbackChildId(workOrderId, "mat", index),
  }));
}

export function normalizeOutsourcingForStorage(workOrderId: string, rows: Outsourcing[] | undefined): Outsourcing[] {
  return (rows ?? []).map((row, index) => ({
    ...row,
    id: String(row.id ?? "").trim() || fallbackChildId(workOrderId, "out", index),
  }));
}

export function normalizeAttachmentsForStorage(workOrderId: string, attachments: Attachment[] | undefined): Attachment[] {
  return (attachments ?? []).map((attachment, index) => {
    const linkedThreadId = String(attachment.linkedThreadId ?? "").trim() || null;
    const linkedReplyId = String(attachment.linkedReplyId ?? "").trim() || null;
    const inferredScope: Attachment["scope"] = attachment.scope ?? (linkedThreadId || linkedReplyId ? "memo" : "official");

    return {
      ...attachment,
      id: String(attachment.id ?? "").trim() || fallbackChildId(workOrderId, "att", index),
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
    id: String(reply.id ?? "").trim() || fallbackChildId(`${workOrderId}-${threadId}`, "reply", index),
    attachmentIds: dedupeStringList((reply.attachmentIds ?? []).filter((attachmentId) => attachmentIds.has(String(attachmentId ?? "").trim()))),
  }));
}

export function normalizeMemoThreadsForStorage(
  workOrderId: string,
  memoThreads: MemoThread[] | undefined,
  attachments: Attachment[],
): MemoThread[] {
  const attachmentIds = new Set(attachments.map((attachment) => attachment.id));

  return (memoThreads ?? []).map((thread, index) => {
    const threadId = String(thread.id ?? "").trim() || fallbackChildId(workOrderId, "memo", index);
    return {
      ...thread,
      id: threadId,
      attachmentIds: dedupeStringList((thread.attachmentIds ?? []).filter((attachmentId) => attachmentIds.has(String(attachmentId ?? "").trim()))),
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
