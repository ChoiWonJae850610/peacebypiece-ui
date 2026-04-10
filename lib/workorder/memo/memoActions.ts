import { addMemoReply, addMemoThread, appendMemoAttachmentsToReply, appendMemoAttachmentsToThread } from "@/lib/workorder/actions";
import { createMemoAttachments } from "@/lib/workorder/attachments/attachmentBuilders";
import { createMemoReplyDraft, createMemoThreadDraft } from "@/lib/workorder/memo/memoDrafts";
import { getMemoPayloadInfo } from "@/lib/workorder/memo/memoHistory";
import type { HistoryLog, MemoAttachmentPayload, UserProfile, WorkOrder } from "@/types/workorder";
import type { Dispatch, SetStateAction } from "react";

export function createMemoThread(payload: {
  content: string;
  currentUser: UserProfile;
  selectedWorkOrder: WorkOrder;
  attachmentPayload?: MemoAttachmentPayload;
  setWorkOrders: Dispatch<SetStateAction<WorkOrder[]>>;
  setSaveStatus: Dispatch<SetStateAction<"saved" | "dirty" | "saving">>;
  setHistoryLogs?: Dispatch<SetStateAction<HistoryLog[]>>;
}) {
  const trimmed = payload.content.trim();
  const { selectedAttachmentIds, files } = getMemoPayloadInfo(payload.attachmentPayload);
  if (!trimmed) {
    return { trimmed: "", selectedAttachmentIds, memoAttachments: [] as ReturnType<typeof createMemoAttachments> };
  }

  const nextThread = createMemoThreadDraft(trimmed, payload.currentUser, selectedAttachmentIds);
  const memoAttachments = createMemoAttachments(files, payload.currentUser, { threadId: nextThread.id });

  payload.setWorkOrders((prev) => {
    const withThread = addMemoThread(prev, payload.selectedWorkOrder.id, nextThread);
    if (memoAttachments.length === 0) return withThread;
    return appendMemoAttachmentsToThread(withThread, payload.selectedWorkOrder.id, nextThread.id, {
      attachmentIds: memoAttachments.map((item) => item.id),
      attachments: memoAttachments,
    });
  });
  payload.setSaveStatus("dirty");

  return { trimmed, selectedAttachmentIds, memoAttachments };
}

export function createMemoReply(payload: {
  threadId: string;
  content: string;
  currentUser: UserProfile;
  selectedWorkOrder: WorkOrder;
  attachmentPayload?: MemoAttachmentPayload;
  setWorkOrders: Dispatch<SetStateAction<WorkOrder[]>>;
  setSaveStatus: Dispatch<SetStateAction<"saved" | "dirty" | "saving">>;
  setHistoryLogs?: Dispatch<SetStateAction<HistoryLog[]>>;
}) {
  const trimmed = payload.content.trim();
  const { selectedAttachmentIds, files } = getMemoPayloadInfo(payload.attachmentPayload);
  if (!trimmed) {
    return { trimmed: "", selectedAttachmentIds, memoAttachments: [] as ReturnType<typeof createMemoAttachments> };
  }

  const nextReply = createMemoReplyDraft(trimmed, payload.currentUser, selectedAttachmentIds);
  const memoAttachments = createMemoAttachments(files, payload.currentUser, { threadId: payload.threadId, replyId: nextReply.id });

  payload.setWorkOrders((prev) => {
    const withReply = addMemoReply(prev, payload.selectedWorkOrder.id, payload.threadId, nextReply);
    if (memoAttachments.length === 0) return withReply;
    return appendMemoAttachmentsToReply(withReply, payload.selectedWorkOrder.id, payload.threadId, nextReply.id, {
      attachmentIds: memoAttachments.map((item) => item.id),
      attachments: memoAttachments,
    });
  });
  payload.setSaveStatus("dirty");

  return { trimmed, selectedAttachmentIds, memoAttachments };
}
