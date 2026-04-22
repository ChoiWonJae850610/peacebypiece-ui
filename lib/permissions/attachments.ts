import { ROLE, hasRole } from "@/lib/constants/roles";
import { getI18n } from "@/lib/i18n";
import type { Attachment, AttachmentScope, AttachmentType, UserProfile } from "@/types/workorder";

const i18n = getI18n();

export function getAttachmentScope(attachment: Attachment | null | undefined): AttachmentScope {
  return (attachment?.scope ?? "official") as AttachmentScope;
}

export function isDesignAttachment(attachment: Attachment | null | undefined): boolean {
  return getAttachmentScope(attachment) === "design";
}

export function isOfficialAttachment(attachment: Attachment | null | undefined): boolean {
  return getAttachmentScope(attachment) === "official";
}

export function isMemoAttachment(attachment: Attachment | null | undefined): boolean {
  return getAttachmentScope(attachment) === "memo";
}

export const ATTACHMENT_INPUT_ACCEPT = "image/*,.pdf,application/pdf,*/*";

export function getAttachmentType(file: File | { type?: string | null; name?: string | null }): AttachmentType {
  const mimeType = String(file.type ?? "").toLowerCase();
  const fileName = String(file.name ?? "").toLowerCase();
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("pdf") || fileName.endsWith(".pdf")) return "pdf";
  return "file";
}

export function createAttachmentId(name: string): string {
  return `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function getAttachmentOwnerLabel(attachment: Attachment | null | undefined): string {
  return attachment?.ownerName?.trim() || i18n.workorder.ui.attachmentPanel.legacyOwnerFallback;
}

export function getAttachmentPreviewLabel(attachment: Attachment | null | undefined): string {
  if (!attachment) return i18n.workorder.ui.attachmentPanel.previewFallback;
  return getAttachmentTypeBadgeLabel(attachment);
}


export function getAttachmentTypeBadgeLabel(attachment: Attachment | File | { type?: string | null; name?: string | null } | null | undefined): string {
  const type = attachment && "type" in attachment ? getAttachmentType(attachment as File | { type?: string | null; name?: string | null }) : "file";
  if (type === "pdf") return i18n.workorder.ui.attachmentPanel.previewPdf;
  if (type === "image") return i18n.workorder.ui.attachmentPanel.previewImage;
  return i18n.workorder.ui.attachmentPanel.previewFile;
}


export function canPreviewAttachment(attachment: Attachment | null | undefined): boolean {
  return Boolean(attachment?.url);
}

export function canDeleteAttachmentByUser(user: UserProfile, attachment: Attachment | null): boolean {
  if (!attachment) return false;
  if (hasRole(user, ROLE.admin)) return true;
  return attachment.ownerId === user.id;
}
