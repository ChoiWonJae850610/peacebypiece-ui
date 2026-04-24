import { createMemoReplyDraft, createMemoThreadDraft } from "@/lib/workorder/memo/memoDrafts";
import type { UserProfile } from "@/types/workorder";

export function buildMemoThreadDraftInput(payload: {
  content: string;
  currentUser: UserProfile;
}) {
  const trimmed = payload.content.trim();
  if (!trimmed) return null;

  const nextThread = createMemoThreadDraft(trimmed, payload.currentUser);
  return { trimmed, nextThread };
}

export function buildMemoReplyDraftInput(payload: {
  threadId: string;
  content: string;
  currentUser: UserProfile;
}) {
  const trimmed = payload.content.trim();
  if (!trimmed) return null;

  const nextReply = createMemoReplyDraft(trimmed, payload.currentUser);
  return { trimmed, nextReply };
}
