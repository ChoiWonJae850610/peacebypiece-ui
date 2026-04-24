import { addMemoReply, addMemoThread } from "@/lib/workorder/actions";
import { buildMemoReplyDraftInput, buildMemoThreadDraftInput } from "@/lib/workorder/memo/memoActions";
import type { UserProfile, WorkOrder } from "@/types/workorder";

export function appendMemoThreadToWorkOrder(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  content: string;
}) {
  const draftInput = buildMemoThreadDraftInput(payload);
  if (!draftInput) return null;

  const nextWorkOrder = addMemoThread([payload.workOrder], payload.workOrder.id, draftInput.nextThread)[0] ?? payload.workOrder;

  return {
    nextWorkOrder,
    trimmed: draftInput.trimmed,
  };
}

export function appendMemoReplyToWorkOrder(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  threadId: string;
  content: string;
}) {
  const draftInput = buildMemoReplyDraftInput(payload);
  if (!draftInput) return null;

  const nextWorkOrder = addMemoReply([payload.workOrder], payload.workOrder.id, payload.threadId, draftInput.nextReply)[0] ?? payload.workOrder;

  return {
    nextWorkOrder,
    trimmed: draftInput.trimmed,
  };
}
