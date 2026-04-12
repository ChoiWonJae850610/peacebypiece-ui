import { createMemoReplyDraft, createMemoThreadDraft } from "@/lib/workorder/memo/memoDrafts";
import { getMemoPayloadInfo } from "@/lib/workorder/memo/memoHistory";
import type { MemoAttachmentPayload, UserProfile } from "@/types/workorder";

export function buildMemoThreadDraftInput(payload: {
  content: string;
  currentUser: UserProfile;
  attachmentPayload?: MemoAttachmentPayload;
}) {
  const trimmed = payload.content.trim();
  const { selectedAttachmentIds, files } = getMemoPayloadInfo(payload.attachmentPayload);
  if (!trimmed) return null;

  const nextThread = createMemoThreadDraft(trimmed, payload.currentUser, selectedAttachmentIds);
  return { trimmed, selectedAttachmentIds, files, nextThread };
}

export function buildMemoReplyDraftInput(payload: {
  threadId: string;
  content: string;
  currentUser: UserProfile;
  attachmentPayload?: MemoAttachmentPayload;
}) {
  const trimmed = payload.content.trim();
  const { selectedAttachmentIds, files } = getMemoPayloadInfo(payload.attachmentPayload);
  if (!trimmed) return null;

  const nextReply = createMemoReplyDraft(trimmed, payload.currentUser, selectedAttachmentIds);
  return { trimmed, selectedAttachmentIds, files, nextReply };
}
