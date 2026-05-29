import type { AdminTrashFileItem } from "@/lib/admin/files/types";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

export const TRASH_TABLE_GRID =
  "50px minmax(280px,1.2fr) 128px minmax(180px,0.85fr) 104px 82px";
export const TRASH_HEADER_CENTER_CLASS = "text-center";
export const TRASH_CELL_CENTER_CLASS =
  "flex min-h-[24px] w-full items-start justify-start text-left min-[1180px]:h-full min-[1180px]:min-h-[38px] min-[1180px]:items-center min-[1180px]:justify-center min-[1180px]:text-center";
export const TRASH_CELL_TARGET_CLASS =
  "flex min-h-[34px] w-full items-center justify-start text-left min-[1180px]:h-full min-[1180px]:min-h-[38px]";
export const TRASH_CELL_SELECT_CLASS =
  "flex h-full min-h-[34px] w-full items-start justify-center pt-1 text-center min-[1180px]:min-h-[38px] min-[1180px]:items-center min-[1180px]:pt-0";

export const WORKORDER_STAGE_STEPS = [
  {
    key: "draft",
    keys: ["draft", "working", "작성중", "작업중"],
    label: "작성중",
  },
  {
    key: "review",
    keys: [
      "review_requested",
      "review_completed",
      "검토요청",
      "검토완료",
      "검토",
    ],
    label: "검토",
  },
  {
    key: "order",
    keys: ["request_order", "order_requested", "발주요청", "발주"],
    label: "발주",
  },
  {
    key: "inspection",
    keys: [
      "inspection",
      "in_inspection",
      "inspection_pending",
      "inspection_in_progress",
      "inspection_completed",
      "검수",
      "검수대기",
      "검수중",
      "검수완료",
    ],
    label: "검수",
  },
  { key: "completed", keys: ["completed", "완료"], label: "완료" },
] as const;

export function getWorkOrderStageIndex(statusLabel: string): number {
  const normalizedStatus = statusLabel.trim().toLowerCase();
  const foundIndex = WORKORDER_STAGE_STEPS.findIndex((step) =>
    step.keys.some((key) => key.toLowerCase() === normalizedStatus),
  );
  return foundIndex >= 0 ? foundIndex : 0;
}

export function getTrashFileType(
  item: AdminTrashFileItem,
  t: ReturnType<typeof useAdminTranslation>,
) {
  if (item.fileIcon === "PDF") return t("terms.files.document", "문서");
  if (item.fileIcon === "IMG") return t("terms.files.design", "디자인");
  return t("terms.files.other", "기타");
}

export function formatStorageSize(
  bytes: number,
  t: ReturnType<typeof useAdminTranslation>,
): string {
  if (!Number.isFinite(bytes) || bytes <= 0)
    return `0${t("filesList.sizeUnit.mb", "MB")}`;
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}${t("filesList.sizeUnit.gb", "GB")}`;
  if (bytes >= 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)}${t("filesList.sizeUnit.mb", "MB")}`;
  if (bytes >= 1024)
    return `${Math.ceil(bytes / 1024)}${t("filesList.sizeUnit.kb", "KB")}`;
  return `${bytes}${t("filesList.sizeUnit.byte", "B")}`;
}

export function getTrashVisualInfo(input: {
  kind: "workorder" | "attachment";
  fileIcon?: string;
  typeLabel?: string;
}): { label: string; tone: "workorder" | "image" | "pdf" | "file" } {
  if (input.kind === "workorder") return { label: "작업", tone: "workorder" };
  const icon = (input.fileIcon || "").trim().toUpperCase();
  const typeLabel = (input.typeLabel || "").trim();
  if (icon === "IMG" || typeLabel === "디자인")
    return { label: "IMG", tone: "image" };
  if (icon === "PDF" || typeLabel === "문서")
    return { label: "PDF", tone: "pdf" };
  return { label: "FILE", tone: "file" };
}
