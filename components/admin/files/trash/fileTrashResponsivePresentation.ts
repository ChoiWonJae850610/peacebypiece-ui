import type { WaflBadgeTone } from "@/components/common/ui";
import type { UnifiedTrashRow } from "@/components/admin/files/fileTrashSectionRows";

export const TRASH_TABLE_MIN_WIDTH = 1080;

export const WIDE_TRASH_GRID =
  "48px minmax(260px,1.45fr) 136px minmax(180px,1fr) 104px 88px";

export function getTrashTypeBadgeTone(row: UnifiedTrashRow): WaflBadgeTone {
  if (row.kind === "workorder") return "workorder";

  const normalizedType = row.typeLabel.trim().toLowerCase();
  if (normalizedType.includes("디자인") || normalizedType.includes("design")) {
    return "design";
  }
  if (
    normalizedType.includes("문서") ||
    normalizedType.includes("pdf") ||
    normalizedType.includes("document")
  ) {
    return "document";
  }
  if (normalizedType.includes("메모") || normalizedType.includes("memo")) {
    return "memo";
  }
  if (row.visualTone === "image") return "design";
  if (row.visualTone === "pdf") return "document";
  return "file";
}
