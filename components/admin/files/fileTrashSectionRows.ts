import type {
  AdminStorageWorkOrderItem,
  AdminTrashFileItem,
} from "@/lib/admin/files/types";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import {
  ADMIN_FILE_TRASH_PURGE_STATUSES,
  ADMIN_TRASH_RESTORE_POLICIES,
  selectAdminWorkOrderBundleTrashItems,
} from "@/lib/admin/files/trashPolicy";

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

export type TrashSortKey = "target" | "deletedAt" | "workorder" | "type" | "size";
export type TrashSortDirection = "asc" | "desc";

export type TrashSortState = {
  key: TrashSortKey;
  direction: TrashSortDirection;
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
  { key: "draft", keys: ["draft", "working", "작성중", "작업중"], label: "작성중" },
  { key: "review", keys: ["review_requested", "검토요청", "검토"], label: "검토" },
  { key: "order", keys: ["request_order", "order_requested", "발주요청", "발주"], label: "발주" },
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

function getTrashRowSortText(row: UnifiedTrashRow, key: TrashSortKey): string {
  if (key === "target") return row.targetLabel;
  if (key === "deletedAt") return row.deletedAt;
  if (key === "workorder") return row.workorderTitle;
  if (key === "type") return row.typeLabel;
  return row.sizeLabel;
}

function getTrashRowSortNumber(row: UnifiedTrashRow, key: TrashSortKey): number | null {
  if (key !== "size") return null;
  if (row.kind === "attachment") return row.sourceItem.fileSizeBytes;
  return -1;
}

function compareTrashRowsBySortState(
  a: UnifiedTrashRow,
  b: UnifiedTrashRow,
  sortState: TrashSortState,
): number {
  const direction = sortState.direction === "asc" ? 1 : -1;
  const aNumber = getTrashRowSortNumber(a, sortState.key);
  const bNumber = getTrashRowSortNumber(b, sortState.key);

  if (aNumber !== null || bNumber !== null) {
    const numberCompare = (aNumber ?? -1) - (bNumber ?? -1);
    if (numberCompare !== 0) return numberCompare * direction;
  }

  const textCompare = getTrashRowSortText(a, sortState.key).localeCompare(
    getTrashRowSortText(b, sortState.key),
    "ko",
    { numeric: true, sensitivity: "base" },
  );
  if (textCompare !== 0) return textCompare * direction;

  return a.rowId.localeCompare(b.rowId, "ko");
}

type TrashRowGroup = {
  head: UnifiedTrashRow;
  children: UnifiedTrashRow[];
};

export function sortUnifiedTrashRows(
  rows: UnifiedTrashRow[],
  sortState: TrashSortState | null,
): UnifiedTrashRow[] {
  if (!sortState) return rows;

  const groups: TrashRowGroup[] = [];
  rows.forEach((row) => {
    if (row.isGroupedAttachment && groups.length > 0) {
      groups[groups.length - 1].children.push(row);
      return;
    }

    groups.push({ head: row, children: [] });
  });

  return groups
    .sort((a, b) => compareTrashRowsBySortState(a.head, b.head, sortState))
    .flatMap((group) => [
      group.head,
      ...group.children.sort((a, b) =>
        compareTrashRowsBySortState(a, b, sortState),
      ),
    ]);
}

function getTrashRestoreDisabledReason(
  item: AdminTrashFileItem,
  t: ReturnType<typeof useAdminTranslation>,
): string | null {
  if (item.restorePolicy === ADMIN_TRASH_RESTORE_POLICIES.bundleRequired) {
    return t(
      "filesList.disabledReasons.bundleRestoreRequired",
      "작업지시서와 문서/디자인/메모를 함께 복원해야 합니다.",
    );
  }
  if (
    item.restorePolicy ===
    ADMIN_TRASH_RESTORE_POLICIES.parentDeletedRestoreBlocked
  ) {
    return t(
      "filesList.disabledReasons.parentWorkOrderMissing",
      "해당 작업지시서를 찾을 수 없습니다.",
    );
  }
  if (item.lastPurgeError) {
    return t(
      "filesList.disabledReasons.purgeFailedNeedsSystemReview",
      "삭제 실패 상태는 시스템관리자 확인 후 처리해야 합니다.",
    );
  }
  if (item.purgeStatus !== ADMIN_FILE_TRASH_PURGE_STATUSES.pending) {
    return t(
      "filesList.disabledReasons.restoreUnavailable",
      "복원 가능 상태가 아닙니다.",
    );
  }
  return item.canRestore ? null : item.restoreDisabledReason;
}

function getTrashPurgeDisabledReason(
  item: AdminTrashFileItem,
  t: ReturnType<typeof useAdminTranslation>,
): string | null {
  if (item.restorePolicy === ADMIN_TRASH_RESTORE_POLICIES.bundleRequired) {
    return t(
      "filesList.disabledReasons.bundlePurgeRequired",
      "작업지시서와 문서/디자인/메모를 함께 삭제 요청해야 합니다.",
    );
  }
  if (item.lastPurgeError) {
    return t(
      "filesList.disabledReasons.purgeFailedNeedsSystemReview",
      "삭제 실패 상태는 시스템관리자 확인 후 처리해야 합니다.",
    );
  }
  if (item.purgeStatus !== ADMIN_FILE_TRASH_PURGE_STATUSES.pending) {
    return t(
      "filesList.disabledReasons.purgeUnavailable",
      "선택 삭제 요청 가능 상태가 아닙니다.",
    );
  }
  return item.canPurge ? null : item.purgeDisabledReason;
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
    typeLabel: t("terms.workOrder.singular", "작업지시서"),
    sizeLabel: "-",
    visualLabel: t("terms.workOrder.short", "작업"),
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
      "filesList.disabledReasons.workorderRestorePreparing",
      "작업지시서와 문서/디자인/메모가 함께 복원됩니다.",
    ),
    purgeDisabledReason: t(
      "filesList.disabledReasons.workorderPurgePreparing",
      "작업지시서는 삭제 요청 상태로 전환하고 고객관리자 휴지통 기본 목록에서 제외합니다.",
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
      restoreDisabledReason: getTrashRestoreDisabledReason(item, t),
      purgeDisabledReason: getTrashPurgeDisabledReason(item, t),
      isSelected: selectedItemIds.includes(item.id),
      isGroupedAttachment,
      sourceItem: item,
    };
  };

  const rows: UnifiedTrashRow[] = [];
  const groupedAttachmentIds = new Set<string>();

  [...workOrderItems].sort(sortByDeletedAtDesc).forEach((workOrder) => {
    rows.push(createWorkOrderRow(workOrder));

    selectAdminWorkOrderBundleTrashItems({ items, workOrderId: workOrder.id })
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
