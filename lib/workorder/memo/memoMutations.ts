import { createMemoAttachments } from "@/lib/workorder/attachments/attachmentBuilders";
import { getMemoPayloadInfo } from "@/lib/workorder/memo/memoHistory";
import { createMemoReplyDraft, createMemoThreadDraft } from "@/lib/workorder/memo/memoDrafts";
import { addMemoReply, addMemoThread, appendMemoAttachmentsToReply, appendMemoAttachmentsToThread } from "@/lib/workorder/actions";
import type { MemoAttachmentPayload, UserProfile, WorkOrder } from "@/types/workorder";

export function appendMemoThreadToWorkOrder(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  content: string;
  attachmentPayload?: MemoAttachmentPayload;
}) {
  const trimmed = payload.content.trim();
  const { selectedAttachmentIds, files } = getMemoPayloadInfo(payload.attachmentPayload);
  if (!trimmed) return null;

  const nextThread = createMemoThreadDraft(trimmed, payload.currentUser, selectedAttachmentIds);
  const memoAttachments = createMemoAttachments(files, payload.currentUser, { threadId: nextThread.id });

  const withThread = addMemoThread([payload.workOrder], payload.workOrder.id, nextThread)[0] ?? payload.workOrder;
  const nextWorkOrder = memoAttachments.length === 0
    ? withThread
    : appendMemoAttachmentsToThread([withThread], payload.workOrder.id, nextThread.id, {
        attachmentIds: memoAttachments.map((item) => item.id),
        attachments: memoAttachments,
      })[0] ?? withThread;

  const attachmentNames = [
    ...selectedAttachmentIds
      .map((attachmentId) => payload.workOrder.attachments.find((item) => item.id === attachmentId)?.name)
      .filter((name): name is string => Boolean(name)),
    ...memoAttachments.map((attachment) => attachment.name),
  ];

  return { nextWorkOrder, trimmed, attachmentNames };
}

export function appendMemoReplyToWorkOrder(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  threadId: string;
  content: string;
  attachmentPayload?: MemoAttachmentPayload;
}) {
  const trimmed = payload.content.trim();
  const { selectedAttachmentIds, files } = getMemoPayloadInfo(payload.attachmentPayload);
  if (!trimmed) return null;

  const nextReply = createMemoReplyDraft(trimmed, payload.currentUser, selectedAttachmentIds);
  const memoAttachments = createMemoAttachments(files, payload.currentUser, { threadId: payload.threadId, replyId: nextReply.id });

  const withReply = addMemoReply([payload.workOrder], payload.workOrder.id, payload.threadId, nextReply)[0] ?? payload.workOrder;
  const nextWorkOrder = memoAttachments.length === 0
    ? withReply
    : appendMemoAttachmentsToReply([withReply], payload.workOrder.id, payload.threadId, nextReply.id, {
        attachmentIds: memoAttachments.map((item) => item.id),
        attachments: memoAttachments,
      })[0] ?? withReply;

  const attachmentNames = [
    ...selectedAttachmentIds
      .map((attachmentId) => payload.workOrder.attachments.find((item) => item.id === attachmentId)?.name)
      .filter((name): name is string => Boolean(name)),
    ...memoAttachments.map((attachment) => attachment.name),
  ];

  return { nextWorkOrder, trimmed, attachmentNames };
}
