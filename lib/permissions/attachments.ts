import { hasRole } from "@/lib/constants/roles";
import type { Attachment, AttachmentScope, AttachmentType, UserProfile } from "@/types/workorder";

export function getAttachmentScope(attachment: Attachment | null | undefined): AttachmentScope {
  return (attachment?.scope ?? "official") as AttachmentScope;
}

export function isOfficialAttachment(attachment: Attachment | null | undefined): boolean {
  return getAttachmentScope(attachment) === "official";
}

export function isMemoAttachment(attachment: Attachment | null | undefined): boolean {
  return getAttachmentScope(attachment) === "memo";
}

export function getAttachmentType(file: File | { type?: string | null; name?: string | null }): AttachmentType {
  const mimeType = String(file.type ?? "").toLowerCase();
  const fileName = String(file.name ?? "").toLowerCase();
  if (mimeType.includes("pdf") || fileName.endsWith(".pdf")) return "pdf";
  return "image";
}

export function getAttachmentOwnerLabel(attachment: Attachment | null | undefined): string {
  return attachment?.ownerName?.trim() || "기존 첨부";
}

export function getAttachmentPreviewLabel(attachment: Attachment | null | undefined): string {
  if (!attachment) return "파일";
  return attachment.type === "pdf" ? "PDF" : "IMG";
}

export function canPreviewAttachment(attachment: Attachment | null | undefined): boolean {
  return Boolean(attachment?.url);
}

export function canDeleteAttachmentByUser(user: UserProfile, attachment: Attachment | null): boolean {
  if (!attachment) return false;
  if (hasRole(user, "관리자")) return true;
  return attachment.ownerId === user.id;
}
