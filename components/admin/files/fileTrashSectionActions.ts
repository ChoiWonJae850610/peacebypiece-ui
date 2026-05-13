import type {
  AdminStorageWorkOrderItem,
  AdminTrashFileItem,
} from "@/lib/admin/files/types";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { formatStorageSize } from "@/components/admin/files/fileTrashSectionRows";
import {
  ADMIN_TRASH_RESTORE_POLICIES,
  canAdminTrashItemPurge,
  canAdminTrashItemRestore,
  countAdminWorkOrderBundleRestorePolicy,
  selectAdminStandaloneTrashItems,
  selectAdminTrashActionEligibleItems,
  selectAdminTrashItemsByIds,
  selectAdminWorkOrderBundleTrashItems,
  sumAdminTrashItemSizeBytes,
} from "@/lib/admin/files/trashPolicy";

export type WorkOrderActionIntent = "restore" | "purge";

export type WorkOrderActionPreview = {
  intent: WorkOrderActionIntent;
  workOrderId: string;
};

export type TrashSelectionActionState = {
  selectedItems: AdminTrashFileItem[];
  hasSelection: boolean;
  restoreEligibleItemCount: number;
  purgeEligibleItemCount: number;
  canAct: boolean;
  canRestoreSelection: boolean;
  canPurgeSelection: boolean;
  selectedCount: number;
  allPurgeableCount: number;
  canEmptyTrash: boolean;
};

export function getTrashSelectionActionState(input: {
  items: AdminTrashFileItem[];
  workOrderItems: AdminStorageWorkOrderItem[];
  selectedItemIds: string[];
  selectedWorkOrderIds: string[];
  isActionPending: boolean;
  isWorkOrderActionPending: boolean;
}): TrashSelectionActionState {
  const {
    items,
    workOrderItems,
    selectedItemIds,
    selectedWorkOrderIds,
    isActionPending,
    isWorkOrderActionPending,
  } = input;
  const selectedItems = items.filter((item) =>
    selectedItemIds.includes(item.id),
  );
  const standaloneSelectedItems = selectAdminStandaloneTrashItems({
    items: selectedItems,
    selectedWorkOrderIds,
  });
  const hasSelection =
    selectedItemIds.length > 0 || selectedWorkOrderIds.length > 0;
  const restoreEligibleItemCount = standaloneSelectedItems.filter(
    canAdminTrashItemRestore,
  ).length;
  const purgeEligibleItemCount = standaloneSelectedItems.filter(
    canAdminTrashItemPurge,
  ).length;
  const canAct = hasSelection && !isActionPending && !isWorkOrderActionPending;
  const selectedCount = selectedItemIds.length + selectedWorkOrderIds.length;
  const allPurgeableCount =
    selectAdminTrashActionEligibleItems({
      items,
      selectedWorkOrderIds: workOrderItems.map((item) => item.id),
      action: "purge",
    }).length + workOrderItems.length;

  return {
    selectedItems,
    hasSelection,
    restoreEligibleItemCount,
    purgeEligibleItemCount,
    canAct,
    canRestoreSelection:
      canAct && selectedWorkOrderIds.length + restoreEligibleItemCount > 0,
    canPurgeSelection:
      canAct && selectedWorkOrderIds.length + purgeEligibleItemCount > 0,
    selectedCount,
    allPurgeableCount,
    canEmptyTrash:
      allPurgeableCount > 0 && !isActionPending && !isWorkOrderActionPending,
  };
}

export type TrashSelectionConfirmIntent = "restore" | "purge";

export type TrashSelectionConfirmSummary = {
  workOrderCount: number;
  documentCount: number;
  designCount: number;
  memoCount: number;
  skippedCount: number;
  totalActionCount: number;
  summaryLabel: string;
};

function countTrashFileKind(
  items: readonly AdminTrashFileItem[],
  kind: "document" | "design",
): number {
  return items.filter((item) => item.fileKind === kind).length;
}

function formatTrashSelectionSummaryLabel(input: {
  summary: Omit<TrashSelectionConfirmSummary, "summaryLabel">;
  t: ReturnType<typeof useAdminTranslation>;
}): string {
  const { summary, t } = input;
  const parts: string[] = [];
  if (summary.workOrderCount > 0) {
    parts.push(
      t(
        "filesList.selectionConfirm.counts.workorders",
        "작업지시서 {count}건",
      ).replace("{count}", String(summary.workOrderCount)),
    );
  }
  if (summary.documentCount > 0) {
    parts.push(
      t(
        "filesList.selectionConfirm.counts.documents",
        "문서 {count}개",
      ).replace("{count}", String(summary.documentCount)),
    );
  }
  if (summary.designCount > 0) {
    parts.push(
      t(
        "filesList.selectionConfirm.counts.designs",
        "디자인 {count}개",
      ).replace("{count}", String(summary.designCount)),
    );
  }
  if (summary.memoCount > 0) {
    parts.push(
      t("filesList.selectionConfirm.counts.memos", "메모 {count}개").replace(
        "{count}",
        String(summary.memoCount),
      ),
    );
  }
  if (parts.length === 0)
    return t(
      "filesList.selectionConfirm.emptyScope",
      "처리할 항목이 없습니다.",
    );
  return parts.join(", ");
}

export function createTrashSelectionConfirmSummary(input: {
  items: AdminTrashFileItem[];
  workOrderItems: AdminStorageWorkOrderItem[];
  selectedItemIds: string[];
  selectedWorkOrderIds: string[];
  intent: TrashSelectionConfirmIntent;
  t: ReturnType<typeof useAdminTranslation>;
}): TrashSelectionConfirmSummary {
  const {
    items,
    workOrderItems,
    selectedItemIds,
    selectedWorkOrderIds,
    intent,
    t,
  } = input;
  const selectedWorkOrderIdSet = new Set(selectedWorkOrderIds);
  const selectedWorkOrders = workOrderItems.filter((item) =>
    selectedWorkOrderIdSet.has(item.id),
  );
  const selectedItems = selectAdminTrashItemsByIds(items, selectedItemIds);
  const standaloneSelectedItems = selectAdminStandaloneTrashItems({
    items: selectedItems,
    selectedWorkOrderIds,
  });
  const eligibleStandaloneItems = standaloneSelectedItems.filter((item) =>
    intent === "restore"
      ? canAdminTrashItemRestore(item)
      : canAdminTrashItemPurge(item),
  );
  const selectedWorkOrderBundleItems = selectedWorkOrders.flatMap((workOrder) =>
    selectAdminWorkOrderBundleTrashItems({ items, workOrderId: workOrder.id }),
  );
  const skippedStandaloneCount =
    standaloneSelectedItems.length - eligibleStandaloneItems.length;
  const documentCount =
    countTrashFileKind(eligibleStandaloneItems, "document") +
    countTrashFileKind(selectedWorkOrderBundleItems, "document");
  const designCount =
    countTrashFileKind(eligibleStandaloneItems, "design") +
    countTrashFileKind(selectedWorkOrderBundleItems, "design");
  const memoCount = selectedWorkOrders.reduce(
    (sum, workOrder) => sum + Math.max(0, workOrder.trashMemoCount),
    0,
  );
  const summaryBase = {
    workOrderCount: selectedWorkOrders.length,
    documentCount,
    designCount,
    memoCount,
    skippedCount: skippedStandaloneCount,
    totalActionCount:
      selectedWorkOrders.length + documentCount + designCount + memoCount,
  };

  return {
    ...summaryBase,
    summaryLabel: formatTrashSelectionSummaryLabel({ summary: summaryBase, t }),
  };
}

export type WorkOrderActionPreviewState = {
  previewWorkOrder: AdminStorageWorkOrderItem | null;
  previewWorkOrderTrashItems: AdminTrashFileItem[];
  previewWorkOrderBundleCount: number;
  previewWorkOrderBlockedCount: number;
  previewWorkOrderTotalSizeLabel: string;
};

export function getWorkOrderActionPreviewState(input: {
  items: AdminTrashFileItem[];
  workOrderItems: AdminStorageWorkOrderItem[];
  workOrderActionPreview: WorkOrderActionPreview | null;
  t: ReturnType<typeof useAdminTranslation>;
}): WorkOrderActionPreviewState {
  const { items, workOrderItems, workOrderActionPreview, t } = input;
  const previewWorkOrder =
    workOrderItems.find(
      (item) => item.id === workOrderActionPreview?.workOrderId,
    ) ?? null;
  const previewWorkOrderTrashItems = selectAdminWorkOrderBundleTrashItems({
    items,
    workOrderId: workOrderActionPreview?.workOrderId,
  });

  return {
    previewWorkOrder,
    previewWorkOrderTrashItems,
    previewWorkOrderBundleCount: countAdminWorkOrderBundleRestorePolicy(
      previewWorkOrderTrashItems,
      ADMIN_TRASH_RESTORE_POLICIES.bundleRequired,
    ),
    previewWorkOrderBlockedCount: countAdminWorkOrderBundleRestorePolicy(
      previewWorkOrderTrashItems,
      ADMIN_TRASH_RESTORE_POLICIES.parentDeletedRestoreBlocked,
    ),
    previewWorkOrderTotalSizeLabel: formatStorageSize(
      sumAdminTrashItemSizeBytes(previewWorkOrderTrashItems),
      t,
    ),
  };
}
