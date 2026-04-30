import "server-only";

import { randomUUID } from "crypto";
import type { AttachmentScope } from "@/types/workorder";
import { getAttachmentStorageDirectory, normalizeAttachmentScopeForStorage } from "@/lib/storage/r2/r2Keys";

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
  workOrderId: string;
  scope: AttachmentScope;
}): string {
  const workOrderId = sanitizeSegment(input.workOrderId);
  const scope = normalizeAttachmentScopeForStorage(input.scope);
  const directory = getAttachmentStorageDirectory(scope);
  const id = randomUUID();

  return `workorders/${workOrderId}/thumbnails/${directory}/${id}.webp`;
}

export function isCurrentWorkOrderAttachmentThumbnailKey(key: string): boolean {
  return /^workorders\/[^/]+\/thumbnails\/(design|attachments|memos)\/[^/]+\.webp$/i.test(normalizeStorageKey(key));
}

export function isWorkOrderAttachmentThumbnailKeyForScope(input: {
  key: string;
  workOrderId: string;
  scope: AttachmentScope;
}): boolean {
  const workOrderId = sanitizeSegment(input.workOrderId);
  const scope = normalizeAttachmentScopeForStorage(input.scope);
  const directory = getAttachmentStorageDirectory(scope);
  const segments = normalizeStorageKey(input.key).split("/");

  return (
    segments.length === 5 &&
    segments[0] === "workorders" &&
    segments[1] === workOrderId &&
    segments[2] === "thumbnails" &&
    segments[3] === directory &&
    segments[4].toLowerCase().endsWith(".webp")
  );
}
