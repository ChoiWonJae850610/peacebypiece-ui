import "server-only";
import { randomUUID } from "crypto";

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

export function createWorkOrderAttachmentStorageKey(input: {
  workOrderId: string;
  scope: "official" | "design";
  originalName: string;
}): string {
  const workOrderId = sanitizeSegment(input.workOrderId);
  const scope = input.scope === "design" ? "design" : "official";
  const extension = getFileExtension(input.originalName);
  const id = randomUUID();

  return `workorders/${workOrderId}/attachments/${scope}/${id}${extension}`;
}
