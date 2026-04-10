import { createAttachmentId, getAttachmentType } from "@/lib/permissions/attachments";
import type { Attachment, UserProfile } from "@/types/workorder";

export function createOfficialAttachments(files: File[], currentUser: Pick<UserProfile, "id" | "name">): Attachment[] {
  return files.map((file): Attachment => ({
    id: createAttachmentId(file.name),
    name: file.name,
    type: getAttachmentType(file),
    url: URL.createObjectURL(file),
    scope: "official",
    ownerId: currentUser.id,
    ownerName: currentUser.name,
  }));
}

export function createMemoAttachments(
  files: File[],
  currentUser: Pick<UserProfile, "id" | "name">,
  target: { threadId?: string; replyId?: string } = {},
): Attachment[] {
  return files.map((file): Attachment => ({
    id: createAttachmentId(file.name),
    name: file.name,
    type: getAttachmentType(file),
    url: URL.createObjectURL(file),
    scope: "memo",
    ownerId: currentUser.id,
    ownerName: currentUser.name,
    linkedThreadId: target.threadId ?? null,
    linkedReplyId: target.replyId ?? null,
  }));
}
