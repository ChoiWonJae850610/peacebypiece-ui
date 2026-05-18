import "server-only";
import { randomUUID } from "crypto";
import type { AttachmentScope } from "@/types/workorder";

const SAFE_EXTENSION_PATTERN = /^[a-z0-9]{1,12}$/i;
const CURRENT_WORK_ORDER_ATTACHMENT_KEY_PATTERN = /^companies\/[^/]+\/workorders\/[^/]+\/(design|attachments|memos)\/[^/]+$/i;
const LEGACY_WORK_ORDER_ATTACHMENT_KEY_PATTERN = /^workorders\/[^/]+\/(design|attachments|memos)\/[^/]+$/i;
const CURRENT_WORK_ORDER_ATTACHMENT_THUMBNAIL_KEY_PATTERN = /^companies\/[^/]+\/workorders\/[^/]+\/thumbnails\/(design|attachments|memos)\/[^/]+\.webp$/i;
const LEGACY_WORK_ORDER_ATTACHMENT_THUMBNAIL_KEY_PATTERN = /^workorders\/[^/]+\/thumbnails\/(design|attachments|memos)\/[^/]+\.webp$/i;
const LEGACY_FLAT_WORK_ORDER_ATTACHMENT_THUMBNAIL_KEY_PATTERN = /^workorders\/[^/]+\/thumbnails\/[^/]+\.webp$/i;

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

function normalizeStorageKey(value: string): string {
  return value.replace(/^\/+/, "").trim();
}

export function normalizeAttachmentScopeForStorage(value: AttachmentScope | null | undefined): AttachmentScope {
  return value === "design" ? "design" : value === "memo" ? "memo" : "attachment";
}

export function getAttachmentStorageDirectory(scope: AttachmentScope): "design" | "attachments" | "memos" {
  if (scope === "design") return "design";
  if (scope === "memo") return "memos";
  return "attachments";
}

export function createWorkOrderAttachmentStorageKey(input: {
  companyId: string;
  workOrderId: string;
  scope: AttachmentScope;
  originalName: string;
}): string {
  const companyId = sanitizeSegment(input.companyId);
  const workOrderId = sanitizeSegment(input.workOrderId);
  const scope = normalizeAttachmentScopeForStorage(input.scope);
  const directory = getAttachmentStorageDirectory(scope);
  const extension = getFileExtension(input.originalName);
  const id = randomUUID();

  return `companies/${companyId}/workorders/${workOrderId}/${directory}/${id}${extension}`;
}

export function isCurrentWorkOrderAttachmentStorageKey(key: string): boolean {
  return CURRENT_WORK_ORDER_ATTACHMENT_KEY_PATTERN.test(normalizeStorageKey(key));
}

export function isLegacyWorkOrderAttachmentStorageKey(key: string): boolean {
  return LEGACY_WORK_ORDER_ATTACHMENT_KEY_PATTERN.test(normalizeStorageKey(key));
}

export function isWorkOrderAttachmentStorageKeyForScope(input: {
  key: string;
  companyId?: string | null;
  workOrderId: string;
  scope: AttachmentScope;
}): boolean {
  const companyId = input.companyId ? sanitizeSegment(input.companyId) : null;
  const workOrderId = sanitizeSegment(input.workOrderId);
  const scope = normalizeAttachmentScopeForStorage(input.scope);
  const directory = getAttachmentStorageDirectory(scope);
  const segments = normalizeStorageKey(input.key).split("/");

  const isCurrentKey = (
    segments.length === 6 &&
    segments[0] === "companies" &&
    (!companyId || segments[1] === companyId) &&
    segments[2] === "workorders" &&
    segments[3] === workOrderId &&
    segments[4] === directory &&
    segments[5].length > 0
  );

  if (isCurrentKey) return true;

  return (
    segments.length === 4 &&
    segments[0] === "workorders" &&
    segments[1] === workOrderId &&
    segments[2] === directory &&
    segments[3].length > 0
  );
}

export function isSupportedWorkOrderAttachmentStorageKey(key: string): boolean {
  const normalized = normalizeStorageKey(key);
  return (
    CURRENT_WORK_ORDER_ATTACHMENT_KEY_PATTERN.test(normalized) ||
    LEGACY_WORK_ORDER_ATTACHMENT_KEY_PATTERN.test(normalized) ||
    CURRENT_WORK_ORDER_ATTACHMENT_THUMBNAIL_KEY_PATTERN.test(normalized) ||
    LEGACY_WORK_ORDER_ATTACHMENT_THUMBNAIL_KEY_PATTERN.test(normalized) ||
    LEGACY_FLAT_WORK_ORDER_ATTACHMENT_THUMBNAIL_KEY_PATTERN.test(normalized)
  );
}
