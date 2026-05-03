import { ROLE, hasRole } from "@/lib/constants/roles";
import { getI18n } from "@/lib/i18n";
import type { Attachment, AttachmentScope, AttachmentType, UserProfile } from "@/types/workorder";

const i18n = getI18n();

type AttachmentFieldName =
  | "name"
  | "original_name"
  | "url"
  | "storageKey"
  | "storage_key"
  | "thumbnailKey"
  | "thumbnail_key"
  | "thumbnailUrl"
  | "thumbnail_url"
  | "previewUrl"
  | "preview_url";

function readAttachmentStringField(attachment: Attachment | null | undefined, ...fieldNames: AttachmentFieldName[]): string {
  if (!attachment) return "";

  const source = attachment as Attachment & Record<string, unknown>;
  for (const fieldName of fieldNames) {
    const value = source[fieldName];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

export function getAttachmentScope(attachment: Attachment | null | undefined): AttachmentScope {
  return (attachment?.scope ?? "attachment") as AttachmentScope;
}

export function isDesignAttachment(attachment: Attachment | null | undefined): boolean {
  return getAttachmentScope(attachment) === "design";
}

export function isOfficialAttachment(attachment: Attachment | null | undefined): boolean {
  return getAttachmentScope(attachment) === "attachment";
}


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


function normalizeAttachmentUrl(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function isAttachmentFileRouteUrl(value: string): boolean {
  return value.startsWith("/api/workorders/attachments/file?");
}

function isDirectPreviewOrDownloadUrl(value: string): boolean {
  return /^(blob:|data:|https?:\/\/)/i.test(value);
}

function readStorageKeyFromAttachmentRouteUrl(value: string): string {
  if (!isAttachmentFileRouteUrl(value)) return "";

  try {
    const routeUrl = new URL(value, "http://peacebypiece.local");
    return normalizeAttachmentUrl(routeUrl.searchParams.get("key"));
  } catch {
    return "";
  }
}

export function getAttachmentPreviewUrl(attachment: Attachment | null | undefined): string {
  return (
    readAttachmentStringField(attachment, "previewUrl", "preview_url") ||
    readAttachmentStringField(attachment, "url")
  );
}

function createAttachmentFileRouteUrl(input: { key?: string | null; download?: boolean; fileName?: string | null }): string {
  const rawKey = normalizeAttachmentUrl(input.key);
  if (!rawKey) return "";

  const key = readStorageKeyFromAttachmentRouteUrl(rawKey) || rawKey;

  const params = new URLSearchParams({ key });
  if (input.download) params.set("download", "1");
  const fileName = normalizeAttachmentUrl(input.fileName);
  if (fileName) params.set("name", fileName);

  return `/api/workorders/attachments/file?${params.toString()}`;
}

export function getAttachmentThumbnailUrl(attachment: Attachment | null | undefined): string {
  const thumbnailUrl = readAttachmentStringField(attachment, "thumbnailUrl", "thumbnail_url");
  if (thumbnailUrl) return thumbnailUrl;

  const thumbnailKey = readAttachmentStringField(attachment, "thumbnailKey", "thumbnail_key");
  if (thumbnailKey) {
    return createAttachmentFileRouteUrl({ key: thumbnailKey });
  }

  return getAttachmentPreviewUrl(attachment);
}

export function getAttachmentDownloadUrl(attachment: Attachment | null | undefined): string {
  const storageKey = readAttachmentStringField(attachment, "storageKey", "storage_key");
  if (storageKey) {
    return createAttachmentFileRouteUrl({ key: storageKey, download: true, fileName: readAttachmentStringField(attachment, "name", "original_name") });
  }

  const previewOrFileUrl = getAttachmentPreviewUrl(attachment);
  if (!previewOrFileUrl) return "";

  if (isAttachmentFileRouteUrl(previewOrFileUrl)) {
    return createAttachmentFileRouteUrl({ key: previewOrFileUrl, download: true, fileName: readAttachmentStringField(attachment, "name", "original_name") });
  }

  if (isDirectPreviewOrDownloadUrl(previewOrFileUrl)) {
    return previewOrFileUrl;
  }

  return "";
}

export function canDownloadAttachment(attachment: Attachment | null | undefined): boolean {
  return Boolean(getAttachmentDownloadUrl(attachment));
}

export function canPreviewAttachment(attachment: Attachment | null | undefined): boolean {
  return Boolean(getAttachmentPreviewUrl(attachment));
}

export function canDeleteAttachmentByUser(user: UserProfile, attachment: Attachment | null): boolean {
  if (!attachment) return false;
  if (hasRole(user, ROLE.admin)) return true;
  return attachment.ownerId === user.id;
}
