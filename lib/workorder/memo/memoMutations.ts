import { addMemoReply, addMemoThread, appendMemoAttachmentsToReply, appendMemoAttachmentsToThread } from "@/lib/workorder/actions";
import { createMemoAttachments } from "@/lib/workorder/attachments/attachmentBuilders";
import { buildMemoReplyDraftInput, buildMemoThreadDraftInput } from "@/lib/workorder/memo/memoActions";
import type { MemoAttachmentPayload, UserProfile, WorkOrder } from "@/types/workorder";

function resolveAttachmentNames(workOrder: WorkOrder, selectedAttachmentIds: string[], createdNames: string[]) {
  return [
    ...selectedAttachmentIds
      .map((attachmentId) => workOrder.attachments.find((item) => item.id === attachmentId)?.name)
      .filter((name): name is string => Boolean(name)),
    ...createdNames,
  ];
}

export function appendMemoThreadToWorkOrder(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  content: string;
  attachmentPayload?: MemoAttachmentPayload;
}) {
  const draftInput = buildMemoThreadDraftInput(payload);
  if (!draftInput) return null;

  const memoAttachments = createMemoAttachments(draftInput.files, payload.currentUser, { threadId: draftInput.nextThread.id });
  const withThread = addMemoThread([payload.workOrder], payload.workOrder.id, draftInput.nextThread)[0] ?? payload.workOrder;
  const nextWorkOrder =
    memoAttachments.length === 0
      ? withThread
      : appendMemoAttachmentsToThread([withThread], payload.workOrder.id, draftInput.nextThread.id, {
          attachmentIds: memoAttachments.map((item) => item.id),
          attachments: memoAttachments,
        })[0] ?? withThread;

  return {
    nextWorkOrder,
    trimmed: draftInput.trimmed,
    attachmentNames: resolveAttachmentNames(
      payload.workOrder,
      draftInput.selectedAttachmentIds,
      memoAttachments.map((attachment) => attachment.name),
    ),
  };
}

export function appendMemoReplyToWorkOrder(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  threadId: string;
  content: string;
  attachmentPayload?: MemoAttachmentPayload;
}) {
  const draftInput = buildMemoReplyDraftInput(payload);
  if (!draftInput) return null;

  const memoAttachments = createMemoAttachments(draftInput.files, payload.currentUser, {
    threadId: payload.threadId,
    replyId: draftInput.nextReply.id,
  });
  const withReply = addMemoReply([payload.workOrder], payload.workOrder.id, payload.threadId, draftInput.nextReply)[0] ?? payload.workOrder;
  const nextWorkOrder =
    memoAttachments.length === 0
      ? withReply
      : appendMemoAttachmentsToReply([withReply], payload.workOrder.id, payload.threadId, draftInput.nextReply.id, {
          attachmentIds: memoAttachments.map((item) => item.id),
          attachments: memoAttachments,
        })[0] ?? withReply;

  return {
    nextWorkOrder,
    trimmed: draftInput.trimmed,
    attachmentNames: resolveAttachmentNames(
      payload.workOrder,
      draftInput.selectedAttachmentIds,
      memoAttachments.map((attachment) => attachment.name),
    ),
  };
}
