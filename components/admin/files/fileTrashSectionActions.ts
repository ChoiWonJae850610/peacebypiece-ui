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
