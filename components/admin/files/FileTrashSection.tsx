"use client";

import { useMemo, useState } from "react";
import { RefreshCw, RotateCcw, Trash, Trash2 } from "lucide-react";
import AdminActionBar from "@/components/admin/common/AdminActionBar";
import { AdminIconActionButton } from "@/components/admin/common/AdminIconActionButton";
import WaflSectionPanel from "@/components/admin/common/WaflSectionPanel";
import type {
  AdminStorageWorkOrderItem,
  AdminTrashFileItem,
} from "@/lib/admin/files/types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { formatAdminTermCount } from "@/lib/i18n/adminTermFormatters";
import {
  createUnifiedRows,
  sortUnifiedTrashRows,
  type TrashSortKey,
  type TrashSortState,
  type UnifiedTrashRow,
} from "@/components/admin/files/fileTrashSectionRows";
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
import { FileTrashResponsiveRows } from "@/components/admin/files/FileTrashResponsiveRows";

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
    <WaflSectionPanel
      eyebrow={t("trashPage.eyebrow", "TRASH LIST")}
      title={t("trashPage.title", "휴지통")}
      description={t(
        "trashPage.description",
        "삭제된 작업지시서, 문서, 디자인, 메모를 확인하고 복원 또는 정리합니다.",
      )}
      descriptionActions={
        <AdminActionBar
          className="flex-row items-center justify-end gap-2"
          actionsClassName="ml-auto flex w-fit shrink-0 flex-wrap items-center justify-end gap-1.5 [&>button]:h-8 [&>button]:min-h-8 [&>button]:w-8 [&>button]:px-0 [&>button]:py-0"
        >
          <AdminIconActionButton
            onClick={onRefresh}
            disabled={!canRefresh}
            title={t("filesSummary.refreshLabel", "저장소 데이터 새로고침")}
            label={t("filesSummary.refreshLabel", "저장소 데이터 새로고침")}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            <span className="sr-only">
              {isRefreshing
                ? t("filesList.refreshing", "새로고침 중")
                : t("filesList.refresh", "새로고침")}
            </span>
          </AdminIconActionButton>
          <AdminIconActionButton
            tone="primary"
            onClick={() => openSelectionConfirm("restore")}
            disabled={!canRestoreSelection}
            title={
              selectedItems.some((item) => !item.canRestore)
                ? t(
                    "filesList.restoreSkipsBlockedItems",
                    "복원할 수 없는 선택 항목은 제외하고 처리합니다.",
                  )
                : selectedCount > 0
                  ? `${t("terms.actions.restore", "복원")} · ${formatAdminTermCount(t, selectedCount, "item")}`
                  : t("terms.actions.restore", "복원")
            }
            label={t("terms.actions.restore", "복원")}
            className="relative"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">
              {isActionPending || isWorkOrderActionPending
                ? t("filesList.processing", "처리 중")
                : t("terms.actions.restore", "복원")}
            </span>
            {selectedCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center wafl-shape-compact border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-1 text-[9px] font-bold text-[var(--pbp-text-primary)] shadow-sm">
                {selectedCount}
              </span>
            ) : null}
          </AdminIconActionButton>
          <AdminIconActionButton
            tone="danger"
            onClick={() => openSelectionConfirm("purge")}
            disabled={!canPurgeSelection}
            title={
              selectedItems.some((item) => !item.canPurge)
                ? t(
                    "filesList.purgeSkipsBlockedItems",
                    "삭제 요청할 수 없는 선택 항목은 제외하고 처리합니다.",
                  )
                : selectedCount > 0
                  ? `${t("filesList.delete", "삭제")} · ${formatAdminTermCount(t, selectedCount, "item")}`
                  : t("filesList.delete", "삭제")
            }
            label={t("filesList.delete", "삭제")}
            className="relative"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">
              {isActionPending || isWorkOrderActionPending
                ? t("filesList.processing", "처리 중")
                : t("filesList.delete", "삭제")}
            </span>
            {selectedCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center wafl-shape-compact border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-1 text-[9px] font-bold text-[var(--pbp-text-primary)] shadow-sm">
                {selectedCount}
              </span>
            ) : null}
          </AdminIconActionButton>
          <AdminIconActionButton
            tone="danger"
            onClick={() => setIsEmptyTrashConfirmOpen(true)}
            disabled={!canEmptyTrash}
            title={t("filesList.emptyTrash", "비우기")}
            label={t("filesList.emptyTrash", "비우기")}
          >
            <Trash className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">{t("filesList.emptyTrash", "비우기")}</span>
          </AdminIconActionButton>
        </AdminActionBar>
      }
      className="flex min-h-fit touch-pan-y flex-col overflow-visible"
      bodyClassName="pt-3"
    >
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

      <FileTrashResponsiveRows
        rows={sortedRows}
        t={t}
        sortState={sortState}
        onSort={toggleSort}
        onRowClick={(row) => setDetailRow(row)}
        onToggleItem={onToggleItem}
        onToggleWorkOrder={onToggleWorkOrder}
        previewWorkOrderId={workOrderActionPreview?.workOrderId ?? null}
      />
    </WaflSectionPanel>
  );
}
