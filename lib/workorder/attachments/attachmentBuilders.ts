import { createAttachmentId, getAttachmentType } from "@/lib/permissions/attachments";
import type { Attachment, AttachmentScope, UserProfile } from "@/types/workorder";

function createScopedAttachments(files: File[], currentUser: Pick<UserProfile, "id" | "name">, scope: AttachmentScope): Attachment[] {
  return files.map((file): Attachment => ({
    id: createAttachmentId(file.name),
    name: file.name,
    type: getAttachmentType(file),
    url: URL.createObjectURL(file),
    scope,
    ownerId: currentUser.id,
    ownerName: currentUser.name,
  }));
}

export function createOfficialAttachments(files: File[], currentUser: Pick<UserProfile, "id" | "name">): Attachment[] {
  return createScopedAttachments(files, currentUser, "official");
}

export function createDesignAttachments(files: File[], currentUser: Pick<UserProfile, "id" | "name">): Attachment[] {
  return createScopedAttachments(files, currentUser, "design");
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
