import type {
  AdminStorageWorkOrderItem,
  AdminTrashFileItem,
} from "@/lib/admin/files/types";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

export type UnifiedTrashRow =
  | {
      kind: "workorder";
      id: string;
      rowId: string;
      targetLabel: string;
      deletedAt: string;
      workorderTitle: string;
      typeLabel: string;
      sizeLabel: string;
      visualLabel: string;
      visualTone: "workorder" | "image" | "pdf" | "file";
      thumbnailUrl: string | null;
      previewUrl: string | null;
      restorePolicyLabel: string;
      restorePolicy: "workorder_bundle";
      canRestore: true;
      canPurge: true;
      restoreDisabledReason: string;
      purgeDisabledReason: string;
      isSelected: boolean;
      isGroupedAttachment: false;
      sourceItem: AdminStorageWorkOrderItem;
    }
  | {
      kind: "attachment";
      id: string;
      rowId: string;
      targetLabel: string;
      deletedAt: string;
      workorderTitle: string;
      typeLabel: string;
      sizeLabel: string;
      visualLabel: string;
      visualTone: "workorder" | "image" | "pdf" | "file";
      thumbnailUrl: string | null;
      previewUrl: string | null;
      restorePolicyLabel: string;
      restorePolicy: AdminTrashFileItem["restorePolicy"];
      canRestore: boolean;
      canPurge: boolean;
      restoreDisabledReason: string | null;
      purgeDisabledReason: string | null;
      isSelected: boolean;
      isGroupedAttachment: boolean;
      sourceItem: AdminTrashFileItem;
    };

export const TRASH_TABLE_GRID =
  "56px minmax(260px,1fr) 136px minmax(160px,0.75fr) 96px 96px";
export const TRASH_HEADER_CENTER_CLASS = "text-center";
export const TRASH_HEADER_LEFT_CLASS = "text-left";
export const TRASH_CELL_CENTER_CLASS =
  "flex h-full min-h-[40px] w-full items-center justify-center text-center";
export const TRASH_CELL_TARGET_CLASS =
  "flex h-full min-h-[40px] w-full items-center justify-start text-left";
export const TRASH_CELL_SELECT_CLASS =
  "flex h-full min-h-[40px] w-full items-center justify-center text-center";

export const WORKORDER_STAGE_STEPS = [
  { keys: ["draft", "작성중"], label: "작성중" },
  { keys: ["review_requested", "검토요청", "검토"], label: "검토" },
  { keys: ["request_order", "order_requested", "발주요청", "발주"], label: "발주" },
  {
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
  { keys: ["completed", "완료"], label: "완료" },
];

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
  if (item.fileIcon === "PDF") return t("filesList.fileTypes.document", "문서");
  if (item.fileIcon === "IMG") return t("filesList.fileTypes.design", "디자인");
  return t("filesList.fileTypes.other", "기타");
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
  if (input.kind === "workorder") return { label: "작지", tone: "workorder" };
  const icon = (input.fileIcon || "").trim().toUpperCase();
  const typeLabel = (input.typeLabel || "").trim();
  if (icon === "IMG" || typeLabel === "디자인")
    return { label: "IMG", tone: "image" };
  if (icon === "PDF" || typeLabel === "문서")
    return { label: "PDF", tone: "pdf" };
  return { label: "FILE", tone: "file" };
}

function sortByDeletedAtDesc<
  T extends {
    deletedAt: string | null;
    targetLabel?: string;
    fileName?: string;
  },
>(a: T, b: T): number {
  const deletedAtCompare = (b.deletedAt || "").localeCompare(a.deletedAt || "");
  if (deletedAtCompare !== 0) return deletedAtCompare;
  return (a.targetLabel || a.fileName || "").localeCompare(
    b.targetLabel || b.fileName || "",
    "ko",
  );
}

export function createUnifiedRows(input: {
  items: AdminTrashFileItem[];
  workOrderItems: AdminStorageWorkOrderItem[];
  selectedItemIds: string[];
  selectedWorkOrderIds: string[];
  t: ReturnType<typeof useAdminTranslation>;
}): UnifiedTrashRow[] {
  const { items, workOrderItems, selectedItemIds, selectedWorkOrderIds, t } =
    input;
  const workOrderIdSet = new Set(workOrderItems.map((item) => item.id));

  const createWorkOrderRow = (
    item: AdminStorageWorkOrderItem,
  ): UnifiedTrashRow => ({
    kind: "workorder",
    id: item.id,
    rowId: `workorder:${item.id}`,
    targetLabel: item.title,
    deletedAt: item.deletedAt || "-",
    workorderTitle: item.title,
    typeLabel: t("filesList.types.workorder", "작업지시서"),
    sizeLabel: "-",
    visualLabel: getTrashVisualInfo({ kind: "workorder" }).label,
    visualTone: getTrashVisualInfo({ kind: "workorder" }).tone,
    thumbnailUrl: null,
    previewUrl: null,
    restorePolicyLabel: t(
      "filesList.restorePolicies.workorderBundle",
      "작업지시서 단위 처리",
    ),
    restorePolicy: "workorder_bundle",
    canRestore: true,
    canPurge: true,
    restoreDisabledReason: t(
      "filesList.workorderRestorePreparing",
      "작업지시서와 첨부된 파일/메모가 함께 복원됩니다.",
    ),
    purgeDisabledReason: t(
      "filesList.workorderPurgePreparing",
      "작업지시서는 영구삭제 완료 상태로 전환하고 휴지통에서 제외합니다.",
    ),
    isSelected: selectedWorkOrderIds.includes(item.id),
    isGroupedAttachment: false,
    sourceItem: item,
  });

  const createAttachmentRow = (
    item: AdminTrashFileItem,
    isGroupedAttachment: boolean,
  ): UnifiedTrashRow => {
    const typeLabel = getTrashFileType(item, t);
    const visualInfo = getTrashVisualInfo({
      kind: "attachment",
      fileIcon: item.fileIcon,
      typeLabel,
    });

    return {
      kind: "attachment",
      id: item.id,
      rowId: `attachment:${item.id}`,
      targetLabel: item.fileName,
      deletedAt: item.deletedAt,
      workorderTitle: item.workorderTitle,
      typeLabel,
      sizeLabel: item.fileSizeLabel,
      visualLabel: visualInfo.label,
      visualTone: visualInfo.tone,
      thumbnailUrl: item.thumbnailUrl,
      previewUrl: item.previewUrl,
      restorePolicyLabel: item.restorePolicyLabel,
      restorePolicy: item.restorePolicy,
      canRestore: item.canRestore,
      canPurge: item.canPurge,
      restoreDisabledReason: item.restoreDisabledReason,
      purgeDisabledReason: item.purgeDisabledReason,
      isSelected: selectedItemIds.includes(item.id),
      isGroupedAttachment,
      sourceItem: item,
    };
  };

  const rows: UnifiedTrashRow[] = [];
  const groupedAttachmentIds = new Set<string>();

  [...workOrderItems].sort(sortByDeletedAtDesc).forEach((workOrder) => {
    rows.push(createWorkOrderRow(workOrder));

    items
      .filter(
        (item) =>
          item.workorderId === workOrder.id && item.parentWorkOrderDeleted,
      )
      .sort(sortByDeletedAtDesc)
      .forEach((item) => {
        groupedAttachmentIds.add(item.id);
        rows.push(createAttachmentRow(item, true));
      });
  });

  items
    .filter((item) => !groupedAttachmentIds.has(item.id))
    .sort((a, b) => {
      if (
        workOrderIdSet.has(a.workorderId) !== workOrderIdSet.has(b.workorderId)
      ) {
        return workOrderIdSet.has(a.workorderId) ? -1 : 1;
      }
      return sortByDeletedAtDesc(a, b);
    })
    .forEach((item) => rows.push(createAttachmentRow(item, false)));

  return rows;
}
