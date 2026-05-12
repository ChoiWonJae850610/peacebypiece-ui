"use client";

import { useMemo, useState } from "react";
import AdminActionBar from "@/components/admin/common/AdminActionBar";
import { AdminButton } from "@/components/admin/common/AdminButton";
import AdminTable from "@/components/admin/common/AdminTable";
import type {
  AdminStorageWorkOrderItem,
  AdminTrashFileItem,
} from "@/lib/admin/files/types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { formatAdminTermCount } from "@/lib/i18n/adminTermFormatters";
import { createFileTrashColumns } from "@/components/admin/files/fileTrashSectionColumns";
import {
  TRASH_TABLE_GRID,
  createUnifiedRows,
  sortUnifiedTrashRows,
  type TrashSortKey,
  type TrashSortState,
  type UnifiedTrashRow,
} from "@/components/admin/files/fileTrashSectionRows";
import {
  getTrashSelectionActionState,
  getWorkOrderActionPreviewState,
  type WorkOrderActionIntent,
  type WorkOrderActionPreview,
} from "@/components/admin/files/fileTrashSectionActions";
import {
  EmptyTrashConfirmModal,
  TrashDetailModal,
  WorkOrderActionPreviewModal,
} from "@/components/admin/files/fileTrashSectionModals";

type FileTrashSectionProps = {
  items: AdminTrashFileItem[];
  workOrderItems?: AdminStorageWorkOrderItem[];
  selectedItemIds: string[];
  selectedWorkOrderIds?: string[];
  onToggleItem: (itemId: string) => void;
  onToggleWorkOrder?: (workOrderId: string) => void;
  onPurgeAll?: () => void;
  onRefresh?: () => void;
  onRestore: () => void;
  onPurge: () => void;
  onRestoreItem?: (itemId: string) => void;
  onPurgeItem?: (itemId: string) => void;
  onRestoreWorkOrder?: (workOrderId: string) => void;
  onPurgeWorkOrder?: (workOrderId: string) => void;
  isActionPending?: boolean;
  isWorkOrderActionPending?: boolean;
  isRefreshing?: boolean;
};

export default function FileTrashSection({
  items,
  workOrderItems = [],
  selectedItemIds,
  selectedWorkOrderIds = [],
  onToggleItem,
  onToggleWorkOrder,
  onPurgeAll,
  onRefresh,
  onRestore,
  onPurge,
  onRestoreItem,
  onPurgeItem,
  onRestoreWorkOrder,
  onPurgeWorkOrder,
  isActionPending = false,
  isWorkOrderActionPending = false,
  isRefreshing = false,
}: FileTrashSectionProps) {
  const t = useAdminTranslation();
  const rows = useMemo(
    () =>
      createUnifiedRows({
        items,
        workOrderItems,
        selectedItemIds,
        selectedWorkOrderIds,
        t,
      }),
    [items, workOrderItems, selectedItemIds, selectedWorkOrderIds, t],
  );
  const [sortState, setSortState] = useState<TrashSortState | null>(null);
  const sortedRows = useMemo(
    () => sortUnifiedTrashRows(rows, sortState),
    [rows, sortState],
  );
  const [workOrderActionPreview, setWorkOrderActionPreview] =
    useState<WorkOrderActionPreview | null>(null);
  const [detailRow, setDetailRow] = useState<UnifiedTrashRow | null>(null);
  const [isEmptyTrashConfirmOpen, setIsEmptyTrashConfirmOpen] = useState(false);
  const {
    previewWorkOrder,
    previewWorkOrderBundleCount,
    previewWorkOrderBlockedCount,
    previewWorkOrderTotalSizeLabel,
  } = useMemo(
    () =>
      getWorkOrderActionPreviewState({
        items,
        workOrderItems,
        workOrderActionPreview,
        t,
      }),
    [items, workOrderItems, workOrderActionPreview, t],
  );

  function toggleSort(sortKey: TrashSortKey) {
    setSortState((current) => {
      if (current?.key !== sortKey) return { key: sortKey, direction: "asc" };
      return {
        key: sortKey,
        direction: current.direction === "asc" ? "desc" : "asc",
      };
    });
  }

  function openWorkOrderActionPreview(
    workOrderId: string,
    intent: WorkOrderActionIntent,
  ) {
    setWorkOrderActionPreview({ workOrderId, intent });
  }

  const {
    selectedItems,
    canRestoreSelection,
    canPurgeSelection,
    selectedCount,
    canEmptyTrash,
  } = getTrashSelectionActionState({
    items,
    workOrderItems,
    selectedItemIds,
    selectedWorkOrderIds,
    isActionPending,
    isWorkOrderActionPending,
  });
  const canRefresh = Boolean(onRefresh) && !isRefreshing;

  return (
    <section className="flex h-full min-h-[360px] flex-col rounded-[22px] border border-stone-200 bg-white p-3 shadow-sm md:min-h-0">
      <AdminActionBar title={t("trashPage.title", "휴지통")}>
        <AdminButton
          onClick={onRefresh}
          disabled={!canRefresh}
          title={t("filesSummary.refreshLabel", "저장소 데이터 새로고침")}
        >
          {isRefreshing ? t("filesPage.refreshing", "새로고침 중") : t("terms.actions.refresh", "새로고침")}
        </AdminButton>
        <AdminButton
          variant="primary"
          onClick={onRestore}
          disabled={!canRestoreSelection}
          title={
            selectedItems.some((item) => !item.canRestore)
              ? t(
                  "filesList.restoreSkipsBlockedItems",
                  "복원할 수 없는 선택 항목은 제외하고 처리합니다.",
                )
              : undefined
          }
        >
          {isActionPending || isWorkOrderActionPending
            ? t("filesList.processing", "처리 중")
            : t("terms.actions.restore", "복원")} {" "}
          {selectedCount > 0 ? formatAdminTermCount(t, selectedCount, "item") : ""}
        </AdminButton>
        <AdminButton
          variant="danger"
          onClick={onPurge}
          disabled={!canPurgeSelection}
          title={
            selectedItems.some((item) => !item.canPurge)
              ? t(
                  "filesList.purgeSkipsBlockedItems",
                  "삭제 요청할 수 없는 선택 항목은 제외하고 처리합니다.",
                )
              : undefined
          }
        >
          {isActionPending || isWorkOrderActionPending
            ? t("filesList.processing", "처리 중")
            : t("filesList.purge", "선택 삭제")} {" "}
          {selectedCount > 0 ? formatAdminTermCount(t, selectedCount, "item") : ""}
        </AdminButton>
        <AdminButton
          variant="danger"
          onClick={() => setIsEmptyTrashConfirmOpen(true)}
          disabled={!canEmptyTrash}
        >
          {t("filesList.emptyTrash", "비우기")}
        </AdminButton>
      </AdminActionBar>

      <EmptyTrashConfirmModal
        open={isEmptyTrashConfirmOpen}
        canEmptyTrash={canEmptyTrash}
        onClose={() => setIsEmptyTrashConfirmOpen(false)}
        onConfirm={onPurgeAll}
        t={t}
      />

      <WorkOrderActionPreviewModal
        actionPreview={workOrderActionPreview}
        previewWorkOrder={previewWorkOrder}
        bundleCount={previewWorkOrderBundleCount}
        blockedCount={previewWorkOrderBlockedCount}
        totalSizeLabel={previewWorkOrderTotalSizeLabel}
        isPending={isWorkOrderActionPending}
        onClose={() => setWorkOrderActionPreview(null)}
        onRestoreWorkOrder={onRestoreWorkOrder}
        onPurgeWorkOrder={onPurgeWorkOrder}
        t={t}
      />

      <TrashDetailModal
        row={detailRow}
        isActionPending={isActionPending}
        isWorkOrderActionPending={isWorkOrderActionPending}
        onClose={() => setDetailRow(null)}
        onRestoreItem={onRestoreItem}
        onPurgeItem={onPurgeItem}
        onRestoreWorkOrder={onRestoreWorkOrder}
        onPurgeWorkOrder={onPurgeWorkOrder}
        t={t}
      />

      <AdminTable
        className="mt-2 min-h-0 flex-1"
        headerClassName="hidden shrink-0 gap-3 bg-stone-50 px-3.5 py-1.5 text-[10px] font-semibold text-stone-500 md:grid"
        rowBaseClassName="grid w-full gap-3 px-3.5 py-1.5 text-left text-[11px] md:items-center"
        items={sortedRows}
        getRowKey={(row) => row.rowId}
        emptyLabel={t(
          "filesList.trashEmpty",
          "휴지통에 보관 중인 항목이 없습니다.",
        )}
        gridTemplateColumns={TRASH_TABLE_GRID}
        onRowClick={(row) => setDetailRow(row)}
        rowClassName={(row) => {
          const previewWorkOrderId = workOrderActionPreview?.workOrderId ?? null;
          if (row.kind === "workorder")
            return row.id === previewWorkOrderId || row.isSelected
              ? "bg-stone-100 ring-1 ring-inset ring-stone-300"
              : "bg-white shadow-[inset_3px_0_0_0_rgba(68,64,60,0.28)] hover:bg-stone-50";
          const isPreviewWorkOrderGroup = Boolean(
            previewWorkOrderId && row.sourceItem.workorderId === previewWorkOrderId,
          );
          if (row.isGroupedAttachment)
            return `${
              isPreviewWorkOrderGroup
                ? "shadow-[inset_4px_0_0_0_rgba(120,113,108,0.55)] bg-stone-100/70"
                : "shadow-[inset_4px_0_0_0_rgba(214,211,209,1)] bg-stone-50/70"
            } text-stone-500 transition`;
          return `transition ${row.isSelected ? "bg-stone-100 ring-1 ring-inset ring-stone-300" : "bg-white hover:bg-stone-50"}`;
        }}
        columns={createFileTrashColumns({
          t,
          onToggleItem,
          onToggleWorkOrder,
          sortState,
          onSort: toggleSort,
        })}
      />
    </section>
  );
}
