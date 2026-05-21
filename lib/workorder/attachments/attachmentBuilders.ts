import { createAttachmentId, getAttachmentType } from "@/lib/permissions/attachments";
import { ATTACHMENT_SCOPE, type UploadableAttachmentScopeValue } from "@/lib/constants/workorderIdentity";
import type { Attachment, UserProfile } from "@/types/workorder";

function createScopedAttachments(
  files: File[],
  currentUser: Pick<UserProfile, "id" | "name">,
  scope: UploadableAttachmentScopeValue,
): Attachment[] {
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

export function createDesignAttachments(files: File[], currentUser: Pick<UserProfile, "id" | "name">): Attachment[] {
  return createScopedAttachments(files, currentUser, ATTACHMENT_SCOPE.design);
}

export function createOfficialAttachments(files: File[], currentUser: Pick<UserProfile, "id" | "name">): Attachment[] {
  return createScopedAttachments(files, currentUser, ATTACHMENT_SCOPE.attachment);
}

