import type { WorkOrderAttachmentAsset } from "@/domain/mobileContract";

const UNITS = ["B", "KB", "MB", "GB"] as const;

export function formatAttachmentBytes(sizeBytes: number): string {
  const safeBytes = Number.isFinite(sizeBytes) && sizeBytes > 0 ? Math.floor(sizeBytes) : 0;
  if (safeBytes === 0) return "0B";
  const unitIndex = Math.min(Math.floor(Math.log(safeBytes) / Math.log(1024)), UNITS.length - 1);
  const value = safeBytes / (1024 ** unitIndex);
  const digits = unitIndex === 0 || value >= 100 ? 0 : 1;
  return `${value.toFixed(digits)}${UNITS[unitIndex]}`;
}

export function attachmentListSummary(attachments: readonly WorkOrderAttachmentAsset[]): string {
  const totalBytes = attachments.reduce((total, attachment) => total + Math.max(0, attachment.sizeBytes), 0);
  return `총 ${attachments.length}개 · ${formatAttachmentBytes(totalBytes)}`;
}
