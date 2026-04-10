import { createAttachmentId } from "@/lib/permissions/attachments";
import { nowLabel } from "@/lib/workorder/history";
import type { MemoReply, MemoThread, UserProfile } from "@/types/workorder";

export function createMemoThreadDraft(
  content: string,
  currentUser: Pick<UserProfile, "id" | "name" | "role">,
  selectedAttachmentIds: string[] = [],
): MemoThread {
  return {
    id: createAttachmentId("memo"),
    authorId: currentUser.id,
    authorName: currentUser.name,
    authorRole: currentUser.role,
    content,
    createdAt: nowLabel(),
    attachmentIds: selectedAttachmentIds,
    replies: [],
  };
}

export function createMemoReplyDraft(
  content: string,
  currentUser: Pick<UserProfile, "id" | "name" | "role">,
  selectedAttachmentIds: string[] = [],
): MemoReply {
  return {
    id: createAttachmentId("reply"),
    authorId: currentUser.id,
    authorName: currentUser.name,
    authorRole: currentUser.role,
    content,
    createdAt: nowLabel(),
    attachmentIds: selectedAttachmentIds,
  };
}
