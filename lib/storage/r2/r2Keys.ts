import "server-only";
import { randomUUID } from "crypto";
import type { AttachmentScope } from "@/types/workorder";

const SAFE_EXTENSION_PATTERN = /^[a-z0-9]{1,12}$/i;

function getFileExtension(filename: string): string {
  const [, extension = ""] = filename.match(/\.([a-z0-9]+)$/i) ?? [];
  return SAFE_EXTENSION_PATTERN.test(extension) ? `.${extension.toLowerCase()}` : "";
}

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9가-힣._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "item";
}

function normalizeAttachmentScope(value: AttachmentScope | null | undefined): AttachmentScope {
  return value === "design" ? "design" : value === "memo" ? "memo" : "attachment";
}

function getAttachmentStorageDirectory(scope: AttachmentScope): "design" | "attachments" | "memos" {
  if (scope === "design") return "design";
  if (scope === "memo") return "memos";
  return "attachments";
}

export function createWorkOrderAttachmentStorageKey(input: {
  workOrderId: string;
  scope: AttachmentScope;
  originalName: string;
}): string {
  const workOrderId = sanitizeSegment(input.workOrderId);
  const scope = normalizeAttachmentScope(input.scope);
  const directory = getAttachmentStorageDirectory(scope);
  const extension = getFileExtension(input.originalName);
  const id = randomUUID();

  return `workorders/${workOrderId}/${directory}/${id}${extension}`;
}

export function isCurrentWorkOrderAttachmentStorageKey(key: string): boolean {
  return /^workorders\/[^/]+\/(design|attachments|memos)\/[^/]+$/i.test(key.trim());
}

export function isSupportedWorkOrderAttachmentStorageKey(key: string): boolean {
  return isCurrentWorkOrderAttachmentStorageKey(key);
}
