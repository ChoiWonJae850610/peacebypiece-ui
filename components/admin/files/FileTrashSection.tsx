"use client";

import { useMemo, useState } from "react";
import AdminActionBar from "@/components/admin/common/AdminActionBar";
import { AdminButton } from "@/components/admin/common/AdminButton";
import AdminTable from "@/components/admin/common/AdminTable";
import {
  ADMIN_STORAGE_PANEL_TIGHT_CLASS,
  ADMIN_STORAGE_ROW_CLASS,
  ADMIN_STORAGE_SELECTED_ROW_CLASS,
  ADMIN_STORAGE_TABLE_HEADER_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import type {
  AdminStorageWorkOrderItem,
  AdminTrashFileItem,
} from "@/lib/admin/files/types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { formatAdminTermCount } from "@/lib/i18n/adminTermFormatters";
import { createFileTrashColumns } from "@/components/admin/files/fileTrashSectionColumns";
import {
  createUnifiedRows,
  sortUnifiedTrashRows,
  type TrashSortKey,
  type TrashSortState,
  type UnifiedTrashRow,
} from "@/components/admin/files/fileTrashSectionRows";
import { TRASH_TABLE_GRID } from "@/lib/admin/files/trashTablePresentation";
import {
  createTrashSelectionConfirmSummary,
  getTrashSelectionActionState,
  getWorkOrderActionPreviewState,
  type TrashSelectionConfirmIntent,
  type WorkOrderActionIntent,
  type WorkOrderActionPreview,
} from "@/components/admin/files/fileTrashSectionActions";
import {
  EmptyTrashConfirmModal,
  TrashDetailModal,
  TrashSelectionConfirmModal,
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
  const [selectionConfirmIntent, setSelectionConfirmIntent] =
    useState<TrashSelectionConfirmIntent | null>(null);
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

  const selectionConfirmSummary = useMemo(
    () =>
      selectionConfirmIntent
        ? createTrashSelectionConfirmSummary({
            items,
            workOrderItems,
            selectedItemIds,
            selectedWorkOrderIds,
            intent: selectionConfirmIntent,
            t,
          })
        : null,
    [
      items,
      selectedItemIds,
      selectedWorkOrderIds,
      selectionConfirmIntent,
      t,
      workOrderItems,
    ],
  );
  const isSelectionActionPending = isActionPending || isWorkOrderActionPending;

  function openSelectionConfirm(intent: TrashSelectionConfirmIntent) {
    setSelectionConfirmIntent(intent);
  }

  function runSelectionConfirmAction() {
    if (selectionConfirmIntent === "restore") {
      onRestore();
      return;
    }
    if (selectionConfirmIntent === "purge") {
      onPurge();
    }
  }

  return (
    <section className={`${ADMIN_STORAGE_PANEL_TIGHT_CLASS} flex min-h-fit touch-pan-y flex-col gap-3 p-3 md:p-4 2xl:h-full 2xl:min-h-[340px] 2xl:gap-2`}>
      <AdminActionBar
        title={t("trashPage.title", "휴지통")}
        actionsClassName="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:[&>button]:flex-none [&>button]:min-h-9 [&>button]:px-3"
      >
        <AdminButton
          onClick={onRefresh}
          disabled={!canRefresh}
          title={t("filesSummary.refreshLabel", "저장소 데이터 새로고침")}
        >
          {isRefreshing
            ? t("filesList.refreshing", "새로고침 중")
            : t("filesList.refresh", "새로고침")}
        </AdminButton>
        <AdminButton
          variant="primary"
          onClick={() => openSelectionConfirm("restore")}
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
            : t("terms.actions.restore", "복원")}{" "}
          {selectedCount > 0
            ? formatAdminTermCount(t, selectedCount, "item")
            : ""}
        </AdminButton>
        <AdminButton
          variant="danger"
          onClick={() => openSelectionConfirm("purge")}
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
            : t("filesList.delete", "삭제")}{" "}
          {selectedCount > 0
            ? formatAdminTermCount(t, selectedCount, "item")
            : ""}
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

      <TrashSelectionConfirmModal
        intent={selectionConfirmIntent}
        summary={selectionConfirmSummary}
        isPending={isSelectionActionPending}
        onClose={() => setSelectionConfirmIntent(null)}
        onConfirm={runSelectionConfirmAction}
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
        className="min-h-fit touch-pan-y border-0 bg-transparent shadow-none 2xl:min-h-[300px] 2xl:flex-1 2xl:border 2xl:bg-[var(--pbp-surface)]"
        headerClassName={ADMIN_STORAGE_TABLE_HEADER_CLASS}
        rowBaseClassName="grid w-full gap-2 rounded-[16px] border border-[var(--pbp-border)] px-3 py-2.5 text-left text-[11px] shadow-[var(--pbp-shadow-card)] md:items-center md:gap-2.5 md:px-3.5 md:py-2.5 xl:gap-3 2xl:rounded-none 2xl:border-0 2xl:px-3.5 2xl:py-1.5 2xl:shadow-none"
        items={sortedRows}
        getRowKey={(row) => row.rowId}
        emptyLabel={t(
          "filesList.trashEmpty",
          "휴지통에 보관 중인 항목이 없습니다.",
        )}
        emptyDescription={t(
          "filesList.trashEmptyDescription",
          "삭제한 작업지시서, 문서, 디자인, 메모가 있으면 복원 또는 삭제 요청 대상으로 표시됩니다.",
        )}
        gridTemplateColumns={TRASH_TABLE_GRID}
        responsiveGridClassName="grid-cols-[auto_minmax(0,1fr)] md:[grid-template-columns:34px_minmax(220px,1fr)_minmax(150px,0.72fr)_minmax(150px,0.72fr)] xl:[grid-template-columns:38px_minmax(260px,1.2fr)_128px_minmax(180px,0.9fr)_96px_82px] 2xl:[grid-template-columns:var(--admin-table-columns)]"
        onRowClick={(row) => setDetailRow(row)}
        rowClassName={(row) => {
          const previewWorkOrderId =
            workOrderActionPreview?.workOrderId ?? null;
          if (row.kind === "workorder")
            return row.id === previewWorkOrderId || row.isSelected
              ? ADMIN_STORAGE_SELECTED_ROW_CLASS
              : `${ADMIN_STORAGE_ROW_CLASS} border-l-4 border-l-[var(--pbp-border-strong)]`;
          const isPreviewWorkOrderGroup = Boolean(
            previewWorkOrderId &&
            row.sourceItem.workorderId === previewWorkOrderId,
          );
          if (row.isGroupedAttachment)
            return `${
              isPreviewWorkOrderGroup
                ? "border-l-4 border-l-[var(--pbp-border-strong)] bg-[var(--pbp-selected-surface-soft)]"
                : "border-l-4 border-l-[var(--pbp-border)] bg-[var(--pbp-surface-muted)]"
            } text-[var(--pbp-text-muted)] transition`;
          return `transition ${row.isSelected ? ADMIN_STORAGE_SELECTED_ROW_CLASS : ADMIN_STORAGE_ROW_CLASS}`;
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
