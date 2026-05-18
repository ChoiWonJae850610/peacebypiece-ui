import "server-only";

import { randomUUID } from "crypto";
import type { AttachmentScope } from "@/types/workorder";
import { getAttachmentStorageDirectory, normalizeAttachmentScopeForStorage } from "@/lib/storage/r2/r2Keys";

const WORK_ORDER_ATTACHMENT_THUMBNAIL_KEY_PATTERN = /^companies\/[^/]+\/workorders\/[^/]+\/thumbnails\/(design|attachments|memos)\/[^/]+\.webp$/i;

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9가-힣._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "item";
}

function normalizeStorageKey(value: string): string {
  return value.replace(/^\/+/, "").trim();
}

export function isImageContentType(value: string | null | undefined): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(String(value ?? "").toLowerCase());
}

export function createWorkOrderAttachmentThumbnailKey(input: {
  companyId: string;
  workOrderId: string;
  scope: AttachmentScope;
}): string {
  const companyId = sanitizeSegment(input.companyId);
  const workOrderId = sanitizeSegment(input.workOrderId);
  const scope = normalizeAttachmentScopeForStorage(input.scope);
  const directory = getAttachmentStorageDirectory(scope);
  const id = randomUUID();

  return `companies/${companyId}/workorders/${workOrderId}/thumbnails/${directory}/${id}.webp`;
}

export function isCurrentWorkOrderAttachmentThumbnailKey(key: string): boolean {
  return WORK_ORDER_ATTACHMENT_THUMBNAIL_KEY_PATTERN.test(normalizeStorageKey(key));
}

export function isWorkOrderAttachmentThumbnailKeyForScope(input: {
  key: string;
  companyId: string;
  workOrderId: string;
  scope: AttachmentScope;
}): boolean {
  const companyId = sanitizeSegment(input.companyId);
  const workOrderId = sanitizeSegment(input.workOrderId);
  const scope = normalizeAttachmentScopeForStorage(input.scope);
  const directory = getAttachmentStorageDirectory(scope);
  const segments = normalizeStorageKey(input.key).split("/");

  return (
    segments.length === 7 &&
    segments[0] === "companies" &&
    segments[1] === companyId &&
    segments[2] === "workorders" &&
    segments[3] === workOrderId &&
    segments[4] === "thumbnails" &&
    segments[5] === directory &&
    segments[6].toLowerCase().endsWith(".webp")
  );
}
