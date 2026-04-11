import { hasRole } from "@/lib/constants/roles";
import { getI18n } from "@/lib/i18n";
import type { Attachment, AttachmentScope, AttachmentType, UserProfile } from "@/types/workorder";

const i18n = getI18n();

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

export function createAttachmentId(name: string): string {
  return `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function getAttachmentOwnerLabel(attachment: Attachment | null | undefined): string {
  return attachment?.ownerName?.trim() || i18n.common.ui.attachmentPanel.legacyOwnerFallback;
}

export function getAttachmentPreviewLabel(attachment: Attachment | null | undefined): string {
  if (!attachment) return i18n.common.ui.attachmentPanel.previewFallback;
  return attachment.type === "pdf" ? i18n.common.ui.attachmentPanel.previewPdf : i18n.common.ui.attachmentPanel.previewImage;
}

export function canPreviewAttachment(attachment: Attachment | null | undefined): boolean {
  return Boolean(attachment?.url);
}

export function canDeleteAttachmentByUser(user: UserProfile, attachment: Attachment | null): boolean {
  if (!attachment) return false;
  if (hasRole(user, "관리자")) return true;
  return attachment.ownerId === user.id;
}
