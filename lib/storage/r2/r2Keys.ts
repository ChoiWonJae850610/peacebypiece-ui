import "server-only";
import { randomUUID } from "crypto";
import { ATTACHMENT_SCOPE, isDesignAttachmentScope } from "@/lib/constants/workorderIdentity";
import type { AttachmentScope } from "@/types/workorder";

const SAFE_EXTENSION_PATTERN = /^[a-z0-9]{1,12}$/i;
const WORK_ORDER_ATTACHMENT_KEY_PATTERN = /^companies\/[^/]+\/workorders\/[^/]+\/(design|attachments)\/[^/]+$/i;
const WORK_ORDER_PDF_KEY_PATTERN = /^companies\/[^/]+\/workorders\/[^/]+\/pdf\/[^/]+\.pdf$/i;
const WORK_ORDER_GENERATED_DOCUMENT_KEY_PATTERN = /^companies\/[^/]+\/workorders\/[^/]+\/generated\/order-request\/[^/]+\.pdf$/i;
const WORK_ORDER_ATTACHMENT_THUMBNAIL_KEY_PATTERN = /^companies\/[^/]+\/workorders\/[^/]+\/thumbnails\/(design|attachments)\/[^/]+\.webp$/i;

function getFileExtension(filename: string): string {
  const [, extension = ""] = filename.match(/\.([a-z0-9]+)$/i) ?? [];
  return SAFE_EXTENSION_PATTERN.test(extension) ? `.${extension.toLowerCase()}` : "";
}

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "item";
}

function normalizeStorageKey(value: string): string {
  return value.replace(/^\/+/, "").trim();
}

export function normalizeAttachmentScopeForStorage(value: AttachmentScope | null | undefined): AttachmentScope {
  return isDesignAttachmentScope(value) ? ATTACHMENT_SCOPE.design : ATTACHMENT_SCOPE.attachment;
}

export function getAttachmentStorageDirectory(scope: AttachmentScope): "design" | "attachments" {
  return isDesignAttachmentScope(scope) ? "design" : "attachments";
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
  return WORK_ORDER_ATTACHMENT_KEY_PATTERN.test(normalizeStorageKey(key));
}

export function isWorkOrderAttachmentStorageKeyForScope(input: {
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
    segments.length === 6 &&
    segments[0] === "companies" &&
    segments[1] === companyId &&
    segments[2] === "workorders" &&
    segments[3] === workOrderId &&
    segments[4] === directory &&
    segments[5].length > 0
  );
}

export function isSupportedWorkOrderAttachmentStorageKey(key: string): boolean {
  const normalized = normalizeStorageKey(key);
  return (
    WORK_ORDER_ATTACHMENT_KEY_PATTERN.test(normalized) ||
    WORK_ORDER_PDF_KEY_PATTERN.test(normalized) ||
    WORK_ORDER_GENERATED_DOCUMENT_KEY_PATTERN.test(normalized) ||
    WORK_ORDER_ATTACHMENT_THUMBNAIL_KEY_PATTERN.test(normalized)
  );
}

export type ParsedWorkOrderAttachmentStorageKey = {
  companyId: string;
  workOrderId: string;
  directory: "design" | "attachments" | "pdf" | "generated/order-request";
  fileName: string;
  isThumbnail: boolean;
};

export function parseWorkOrderAttachmentStorageKey(key: string): ParsedWorkOrderAttachmentStorageKey | null {
  const normalized = normalizeStorageKey(key);
  const segments = normalized.split("/");

  if (segments.length === 7) {
    const [root, companyId, workorders, workOrderId, generated, documentType, fileName] = segments;
    if (
      root === "companies" &&
      workorders === "workorders" &&
      generated === "generated" &&
      documentType === "order-request" &&
      companyId &&
      workOrderId &&
      fileName &&
      fileName.toLowerCase().endsWith(".pdf")
    ) {
      return {
        companyId,
        workOrderId,
        directory: "generated/order-request",
        fileName,
        isThumbnail: false,
      };
    }
  }

  if (segments.length === 6) {
    const [root, companyId, workorders, workOrderId, directory, fileName] = segments;
    if (
      root === "companies" &&
      workorders === "workorders" &&
      directory === "pdf" &&
      companyId &&
      workOrderId &&
      fileName &&
      fileName.toLowerCase().endsWith(".pdf")
    ) {
      return {
        companyId,
        workOrderId,
        directory,
        fileName,
        isThumbnail: false,
      };
    }

    const isSupportedDirectory = directory === "design" || directory === "attachments";
    if (root !== "companies" || workorders !== "workorders" || !companyId || !workOrderId || !isSupportedDirectory || !fileName) {
      return null;
    }

    return {
      companyId,
      workOrderId,
      directory,
      fileName,
      isThumbnail: false,
    };
  }

  if (segments.length === 7) {
    const [root, companyId, workorders, workOrderId, thumbnails, directory, fileName] = segments;
    const isSupportedDirectory = directory === "design" || directory === "attachments";
    if (
      root !== "companies" ||
      workorders !== "workorders" ||
      thumbnails !== "thumbnails" ||
      !companyId ||
      !workOrderId ||
      !isSupportedDirectory ||
      !fileName ||
      !fileName.toLowerCase().endsWith(".webp")
    ) {
      return null;
    }

    return {
      companyId,
      workOrderId,
      directory,
      fileName,
      isThumbnail: true,
    };
  }

  return null;
}

export function isWorkOrderAttachmentStorageKeyForCompany(input: {
  key: string;
  companyId: string | null | undefined;
}): boolean {
  const companyId = typeof input.companyId === "string" ? sanitizeSegment(input.companyId) : "";
  if (!companyId) return false;

  const parsed = parseWorkOrderAttachmentStorageKey(input.key);
  return Boolean(parsed && parsed.companyId === companyId && isSupportedWorkOrderAttachmentStorageKey(input.key));
}

export function isWorkOrderAttachmentStorageKeyForWorkOrder(input: {
  key: string;
  companyId: string | null | undefined;
  workOrderId: string | null | undefined;
}): boolean {
  const companyId = typeof input.companyId === "string" ? sanitizeSegment(input.companyId) : "";
  const workOrderId = typeof input.workOrderId === "string" ? sanitizeSegment(input.workOrderId) : "";
  if (!companyId || !workOrderId) return false;

  const parsed = parseWorkOrderAttachmentStorageKey(input.key);
  return Boolean(
    parsed &&
      parsed.companyId === companyId &&
      parsed.workOrderId === workOrderId &&
      isSupportedWorkOrderAttachmentStorageKey(input.key),
  );
}

export function getCompanyIdFromWorkOrderAttachmentStorageKey(key: string): string | null {
  const normalized = normalizeStorageKey(key);
  if (!isSupportedWorkOrderAttachmentStorageKey(normalized)) return null;

  const segments = normalized.split("/");
  return segments[0] === "companies" && segments[1] ? segments[1] : null;
}
