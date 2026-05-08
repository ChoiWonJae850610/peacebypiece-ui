"use client";

import { useMemo, useState } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import AdminActionBar from "@/components/admin/common/AdminActionBar";
import AdminTable from "@/components/admin/common/AdminTable";
import type {
  AdminStorageWorkOrderItem,
  AdminTrashFileItem,
} from "@/lib/admin/files/types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import {
  TRASH_CELL_CENTER_CLASS,
  TRASH_CELL_SELECT_CLASS,
  TRASH_CELL_TARGET_CLASS,
  TRASH_HEADER_CENTER_CLASS,
  TRASH_HEADER_LEFT_CLASS,
  TRASH_TABLE_GRID,
  WORKORDER_STAGE_STEPS,
  createUnifiedRows,
  formatStorageSize,
  getWorkOrderStageIndex,
  type UnifiedTrashRow,
} from "@/components/admin/files/fileTrashSectionRows";

type FileTrashSectionProps = {
  items: AdminTrashFileItem[];
  workOrderItems?: AdminStorageWorkOrderItem[];
  selectedItemIds: string[];
  selectedWorkOrderIds?: string[];
  onToggleItem: (itemId: string) => void;
  onToggleWorkOrder?: (workOrderId: string) => void;
  onPurgeAll?: () => void;
  onRestore: () => void;
  onPurge: () => void;
  onRestoreItem?: (itemId: string) => void;
  onPurgeItem?: (itemId: string) => void;
  onRestoreWorkOrder?: (workOrderId: string) => void;
  onPurgeWorkOrder?: (workOrderId: string) => void;
  isActionPending?: boolean;
  isWorkOrderActionPending?: boolean;
};

type WorkOrderActionIntent = "restore" | "purge";

type WorkOrderActionPreview = {
  intent: WorkOrderActionIntent;
  workOrderId: string;
};

function WorkOrderStageInline({ statusLabel }: { statusLabel: string }) {
  const currentIndex = getWorkOrderStageIndex(statusLabel);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
            현재 단계
          </p>
          <p className="mt-1 text-sm font-medium text-stone-700">
            {statusLabel}
          </p>
        </div>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-500">
          삭제 당시
        </span>
      </div>
      <div className="mt-4 grid grid-cols-5 items-start gap-1.5">
        {WORKORDER_STAGE_STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isPassed = index < currentIndex;
          return (
            <div key={step.label} className="min-w-0">
              <div
                className={`h-1.5 rounded-full ${
                  isActive
                    ? "bg-stone-950"
                    : isPassed
                      ? "bg-stone-400"
                      : "bg-stone-200"
                }`}
              />
              <p
                className={`mt-1 truncate text-center text-[10px] font-medium ${
                  isActive ? "text-stone-800" : "text-stone-400"
                }`}
                title={step.label}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrashItemVisual({
  label,
  tone,
  compact = false,
  thumbnailUrl,
}: {
  label: string;
  tone: "workorder" | "image" | "pdf" | "file";
  compact?: boolean;
  thumbnailUrl?: string | null;
}) {
  const [hasPreviewError, setHasPreviewError] = useState(false);
  const sizeClass = compact ? "h-7 w-7 text-[8px]" : "h-10 w-10 text-[9px]";
  const toneClass =
    tone === "workorder"
      ? "border-stone-300 bg-stone-900 text-white"
      : tone === "image"
        ? "border-purple-100 bg-purple-50 text-purple-700"
        : tone === "pdf"
          ? "border-red-100 bg-red-50 text-red-600"
          : "border-stone-200 bg-stone-50 text-stone-600";

  if (tone === "image" && thumbnailUrl && !hasPreviewError) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50 ${sizeClass} shadow-sm`}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setHasPreviewError(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl border ${toneClass} ${sizeClass} font-medium shadow-sm`}
      aria-hidden="true"
      title={hasPreviewError ? "미리보기 실패" : undefined}
    >
      {label}
    </span>
  );
}

export default function FileTrashSection({
  items,
  workOrderItems = [],
  selectedItemIds,
  selectedWorkOrderIds = [],
  onToggleItem,
  onToggleWorkOrder,
  onPurgeAll,
  onRestore,
  onPurge,
  onRestoreItem,
  onPurgeItem,
  onRestoreWorkOrder,
  onPurgeWorkOrder,
  isActionPending = false,
  isWorkOrderActionPending = false,
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
  const [workOrderActionPreview, setWorkOrderActionPreview] =
    useState<WorkOrderActionPreview | null>(null);
  const [detailRow, setDetailRow] = useState<UnifiedTrashRow | null>(null);
  const [isEmptyTrashConfirmOpen, setIsEmptyTrashConfirmOpen] = useState(false);
  const previewWorkOrder = useMemo(
    () =>
      workOrderItems.find(
        (item) => item.id === workOrderActionPreview?.workOrderId,
      ) ?? null,
    [workOrderActionPreview?.workOrderId, workOrderItems],
  );
  const previewWorkOrderTrashItems = useMemo(() => {
    if (!workOrderActionPreview?.workOrderId) return [];
    return items.filter(
      (item) =>
        item.workorderId === workOrderActionPreview.workOrderId &&
        item.parentWorkOrderDeleted,
    );
  }, [items, workOrderActionPreview?.workOrderId]);
  const previewWorkOrderBundleCount = previewWorkOrderTrashItems.filter(
    (item) => item.restorePolicy === "bundle_required",
  ).length;
  const previewWorkOrderBlockedCount = previewWorkOrderTrashItems.filter(
    (item) => item.restorePolicy === "parent_deleted_restore_blocked",
  ).length;
  const previewWorkOrderTotalSizeLabel = formatStorageSize(
    previewWorkOrderTrashItems.reduce(
      (sum, item) => sum + item.fileSizeBytes,
      0,
    ),
    t,
  );

  function openWorkOrderActionPreview(
    workOrderId: string,
    intent: WorkOrderActionIntent,
  ) {
    setWorkOrderActionPreview({ workOrderId, intent });
  }

  const selectedItems = items.filter((item) =>
    selectedItemIds.includes(item.id),
  );
  const hasSelection =
    selectedItemIds.length > 0 || selectedWorkOrderIds.length > 0;
  const restoreEligibleItemCount = selectedItems.filter(
    (item) => item.canRestore,
  ).length;
  const purgeEligibleItemCount = selectedItems.filter(
    (item) => item.canPurge,
  ).length;
  const canAct = hasSelection && !isActionPending && !isWorkOrderActionPending;
  const canRestoreSelection =
    canAct && selectedWorkOrderIds.length + restoreEligibleItemCount > 0;
  const canPurgeSelection =
    canAct && selectedWorkOrderIds.length + purgeEligibleItemCount > 0;
  const selectedCount = selectedItemIds.length + selectedWorkOrderIds.length;
  const allPurgeableCount =
    items.filter((item) => item.canPurge).length + workOrderItems.length;
  const canEmptyTrash =
    allPurgeableCount > 0 &&
    !isActionPending &&
    !isWorkOrderActionPending;

  return (
    <section className="flex h-full min-h-[420px] flex-col rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
      <AdminActionBar title={t("trashPage.title", "휴지통")}>
        <button
          type="button"
          onClick={onRestore}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${canRestoreSelection ? "border-stone-300 bg-white text-stone-700 shadow-sm hover:bg-stone-50" : "border-stone-200 bg-stone-50 text-stone-400"}`}
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
            : t("filesList.restore", "복원")}{" "}
          {selectedCount > 0 ? selectedCount : ""}
        </button>
        <button
          type="button"
          onClick={onPurge}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${canPurgeSelection ? "border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50" : "border-stone-200 bg-stone-50 text-stone-400"}`}
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
            : t("filesList.purge", "선택 삭제")}{" "}
          {selectedCount > 0 ? selectedCount : ""}
        </button>
        <button
          type="button"
          onClick={() => setIsEmptyTrashConfirmOpen(true)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${canEmptyTrash ? "border-red-600 bg-red-600 text-white shadow-sm hover:bg-red-700" : "border-stone-200 bg-stone-50 text-stone-400"}`}
          disabled={!canEmptyTrash}
        >
          {t("filesList.emptyTrash", "비우기")}
        </button>
      </AdminActionBar>

      <ModalShell
        open={isEmptyTrashConfirmOpen}
        onClose={() => setIsEmptyTrashConfirmOpen(false)}
        title={t("filesList.emptyTrashConfirmTitle", "휴지통 비우기")}
        maxWidthClass="md:max-w-md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEmptyTrashConfirmOpen(false)}
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
            >
              {t("common.no", "아니오")}
            </button>
            <button
              type="button"
              disabled={!canEmptyTrash}
              onClick={() => {
                setIsEmptyTrashConfirmOpen(false);
                onPurgeAll?.();
              }}
              className="rounded-full border border-red-600 bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400"
            >
              {t("common.yes", "예")}
            </button>
          </div>
        }
      >
        <p className="text-sm font-medium text-stone-700">
          {t(
            "filesList.emptyTrashConfirmDescription",
            "휴지통의 모든 항목을 삭제 요청하시겠습니까?",
          )}
        </p>
      </ModalShell>

      <ModalShell
        open={Boolean(workOrderActionPreview && previewWorkOrder)}
        onClose={() => setWorkOrderActionPreview(null)}
        title={
          workOrderActionPreview?.intent === "purge"
            ? t("filesList.workorderPurgePreview", "영구삭제 범위 확인")
            : t("filesList.workorderRestorePreview", "복원 범위 확인")
        }
        description={
          previewWorkOrder
            ? `${previewWorkOrder.title} · ${previewWorkOrder.statusLabel}`
            : undefined
        }
        maxWidthClass="md:max-w-2xl"
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setWorkOrderActionPreview(null)}
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
            >
              {t("common.close", "닫기")}
            </button>
            <button
              type="button"
              disabled={isWorkOrderActionPending || !previewWorkOrder}
              onClick={() => {
                if (!previewWorkOrder) return;
                if (workOrderActionPreview?.intent === "restore") {
                  onRestoreWorkOrder?.(previewWorkOrder.id);
                  setWorkOrderActionPreview(null);
                  return;
                }
                if (workOrderActionPreview?.intent === "purge") {
                  onPurgeWorkOrder?.(previewWorkOrder.id);
                  setWorkOrderActionPreview(null);
                }
              }}
              className={`rounded-full border px-4 py-2 text-xs font-semibold ${workOrderActionPreview?.intent === "purge" ? "border-red-600 bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400" : "border-stone-900 bg-stone-900 text-white shadow-sm hover:bg-stone-800 disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400"}`}
            >
              {isWorkOrderActionPending
                ? t("filesList.processing", "처리 중")
                : workOrderActionPreview?.intent === "purge"
                  ? t("filesList.purge", "선택 삭제")
                  : t("filesList.restore", "복원")}
            </button>
          </div>
        }
      >
        {workOrderActionPreview && previewWorkOrder ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-xs font-semibold text-stone-900">
                {previewWorkOrder.title}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                {previewWorkOrder.statusLabel} ·{" "}
                {t("filesList.columns.deletedAt", "삭제일시")}{" "}
                {previewWorkOrder.deletedAt || "-"}
              </p>
            </div>

            <div className="grid gap-2 md:grid-cols-4">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
                <p className="text-[10px] font-semibold text-stone-400">
                  {t("filesList.selectedScope.workorder", "작업지시서")}
                </p>
                <p className="mt-1 text-[11px] font-medium text-stone-700">
                  {t("filesList.selectedScope.workorderValue", "대표 row 1건")}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
                <p className="text-[10px] font-semibold text-stone-400">
                  {t(
                    "filesList.selectedScope.bundleAttachments",
                    "묶음 처리 첨부",
                  )}
                </p>
                <p className="mt-1 text-[11px] font-medium text-stone-700">
                  {previewWorkOrderBundleCount}
                  {t("filesList.countSuffix", "개")}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
                <p className="text-[10px] font-semibold text-stone-400">
                  {t(
                    "filesList.selectedScope.restoreBlocked",
                    "복원 불가 파일",
                  )}
                </p>
                <p className="mt-1 text-[11px] font-medium text-stone-700">
                  {previewWorkOrderBlockedCount}
                  {t("filesList.countSuffix", "개")}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
                <p className="text-[10px] font-semibold text-stone-400">
                  {t("filesList.selectedScope.totalSize", "연결 파일 용량")}
                </p>
                <p className="mt-1 text-[11px] font-medium text-stone-700">
                  {previewWorkOrderTotalSizeLabel}
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
              <p className="font-semibold">
                {t(
                  "filesList.workorderActionGuardTitle",
                  "작업지시서 단위로 처리 범위를 확인합니다.",
                )}
              </p>
              <p className="text-[11px] text-amber-700">
                {workOrderActionPreview.intent === "restore"
                  ? t(
                      "filesList.workorderRestoreConnectedNotice",
                      "작업지시서와 첨부된 파일/메모가 함께 복원됩니다.",
                    )
                  : t(
                      "filesList.workorderActionSkeletonNotice",
                      "영구삭제는 작업지시서를 삭제 완료 상태로 전환하고 휴지통에서 제외합니다. R2 파일 삭제는 Worker 기반 purge 흐름으로 분리됩니다.",
                    )}
              </p>
              <p>
                {workOrderActionPreview.intent === "restore"
                  ? t(
                      "filesList.workorderRestoreGuardDescription",
                      "복원 연결 시 작업지시서와 작업지시서 삭제로 함께 휴지통 이동한 첨부/메모를 같은 트랜잭션에서 복원해야 합니다.",
                    )
                  : t(
                      "filesList.workorderPurgeGuardDescription",
                      "영구삭제 시 Neon row는 hard delete하지 않고 delete_status/purge_status만 완료 상태로 변경합니다. 작업지시서에 딸린 R2 파일은 직접 삭제하지 않습니다.",
                    )}
              </p>
            </div>
          </div>
        ) : null}
      </ModalShell>

      <ModalShell
        open={Boolean(detailRow)}
        onClose={() => setDetailRow(null)}
        title={
          detailRow?.kind === "workorder"
            ? t("filesList.workorderDetailTitle", "작업지시서 휴지통 상세")
            : t("filesList.fileDetailTitle", "파일 휴지통 상세")
        }
        description={detailRow?.targetLabel}
        maxWidthClass="md:max-w-xl"
        footer={
          detailRow ? (
            <div className="flex w-full flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailRow(null)}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
              >
                {t("common.close", "닫기")}
              </button>
              <button
                type="button"
                disabled={
                  detailRow.kind === "attachment"
                    ? isActionPending || !detailRow.canRestore
                    : isWorkOrderActionPending
                }
                onClick={() => {
                  if (!detailRow) return;
                  if (detailRow.kind === "workorder") {
                    onRestoreWorkOrder?.(detailRow.id);
                  } else {
                    onRestoreItem?.(detailRow.id);
                  }
                  setDetailRow(null);
                }}
                className="rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-stone-800 disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400"
                title={
                  detailRow.kind === "attachment"
                    ? (detailRow.restoreDisabledReason ?? undefined)
                    : detailRow.restoreDisabledReason
                }
              >
                {t("filesList.restore", "복원")}
              </button>
              <button
                type="button"
                disabled={
                  detailRow.kind === "attachment"
                    ? isActionPending || !detailRow.canPurge
                    : isWorkOrderActionPending
                }
                onClick={() => {
                  if (!detailRow) return;
                  if (detailRow.kind === "workorder") {
                    onPurgeWorkOrder?.(detailRow.id);
                  } else {
                    onPurgeItem?.(detailRow.id);
                  }
                  setDetailRow(null);
                }}
                className="rounded-full border border-red-600 bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400"
                title={
                  detailRow.kind === "attachment"
                    ? (detailRow.purgeDisabledReason ?? undefined)
                    : detailRow.purgeDisabledReason
                }
              >
                {t("filesList.purge", "선택 삭제")}
              </button>
            </div>
          ) : null
        }
      >
        {detailRow ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <TrashItemVisual
                label={detailRow.visualLabel}
                tone={detailRow.visualTone}
                thumbnailUrl={detailRow.thumbnailUrl || detailRow.previewUrl}
              />
              <div className="min-w-0">
                <p
                  className="truncate text-[13px] font-medium text-stone-700"
                  title={detailRow.targetLabel}
                >
                  {detailRow.targetLabel}
                </p>
                <p
                  className="mt-1 truncate text-xs text-stone-500"
                  title={detailRow.workorderTitle}
                >
                  {detailRow.workorderTitle}
                </p>
              </div>
            </div>

            {detailRow.kind === "attachment" && detailRow.previewUrl ? (
              <a
                href={detailRow.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs font-medium text-stone-600 shadow-sm transition hover:bg-stone-50"
              >
                파일 미리보기 열기
              </a>
            ) : null}
            {detailRow.kind === "workorder" ? (
              <WorkOrderStageInline
                statusLabel={detailRow.sourceItem.statusLabel}
              />
            ) : null}

            <div className="grid gap-2 md:grid-cols-2">
              {(detailRow.kind === "workorder"
                ? [
                    [t("filesList.columns.type", "유형"), detailRow.typeLabel],
                    [t("filesList.attachmentCount", "첨부파일"), detailRow.sourceItem.attachmentSummaryLabel],
                    [t("filesList.memoCount", "메모"), detailRow.sourceItem.memoSummaryLabel],
                    [
                      t("filesList.columns.deletedAt", "삭제일시"),
                      detailRow.deletedAt,
                    ],
                  ]
                : [
                    [t("filesList.columns.type", "유형"), detailRow.typeLabel],
                    [t("filesList.columns.size", "용량"), detailRow.sizeLabel],
                    [t("filesList.columns.workorder", "작업지시서"), detailRow.workorderTitle],
                    [
                      t("filesList.columns.deletedAt", "삭제일시"),
                      detailRow.deletedAt,
                    ],
                  ]
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
                    {label}
                  </p>
                  <p
                    className="mt-1 truncate text-sm font-normal text-stone-600"
                    title={value}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <p className="rounded-2xl bg-stone-50 px-4 py-3 text-xs leading-5 text-stone-500">
              {detailRow.kind === "workorder"
                ? t(
                    "filesList.detailWorkorderActionHint",
                    "작업지시서와 첨부된 파일/메모가 함께 복원됩니다.",
                  )
                : detailRow.restoreDisabledReason ||
                  detailRow.purgeDisabledReason ||
                  t(
                    "filesList.detailActionHint",
                    "복원 또는 선택 삭제 작업은 이 상세 창에서 처리합니다.",
                  )}
            </p>
          </div>
        ) : null}
      </ModalShell>

      <AdminTable
        className="mt-3 min-h-0 flex-1"
        items={rows}
        getRowKey={(row) => row.rowId}
        emptyLabel={t(
          "filesList.trashEmpty",
          "휴지통에 보관 중인 항목이 없습니다.",
        )}
        gridTemplateColumns={TRASH_TABLE_GRID}
        onRowClick={(row) => setDetailRow(row)}
        rowClassName={(row) => {
          const previewWorkOrderId =
            workOrderActionPreview?.workOrderId ?? null;
          if (row.kind === "workorder")
            return row.id === previewWorkOrderId || row.isSelected
              ? "bg-stone-100 ring-1 ring-inset ring-stone-300"
              : "bg-stone-50/90";
          const isPreviewWorkOrderGroup = Boolean(
            previewWorkOrderId &&
            row.sourceItem.workorderId === previewWorkOrderId,
          );
          if (row.isGroupedAttachment)
            return `${isPreviewWorkOrderGroup ? "shadow-[inset_4px_0_0_0_rgba(120,113,108,0.55)] bg-stone-100/70" : "shadow-[inset_4px_0_0_0_rgba(231,229,228,1)]"} transition ${row.isSelected ? "bg-stone-100" : "bg-stone-50/40 hover:bg-stone-50"}`;
          return `transition ${row.isSelected ? "bg-stone-100" : "bg-white hover:bg-stone-50"}`;
        }}
        columns={[
          {
            key: "select",
            label: t("filesList.columns.select", "선택"),
            headerClassName: TRASH_HEADER_CENTER_CLASS,
            className: TRASH_CELL_SELECT_CLASS,
            render: (row) => {
              if (row.kind === "workorder") {
                return (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleWorkOrder?.(row.id);
                    }}
                    className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${row.isSelected ? "border-stone-950 bg-stone-950 text-white" : "border-stone-300 bg-white text-transparent"}`}
                    aria-label={
                      row.isSelected
                        ? t(
                            "filesList.deselectWorkOrder",
                            "작업지시서 선택 해제",
                          )
                        : t("filesList.selectWorkOrder", "작업지시서 선택")
                    }
                  >
                    ✓
                  </button>
                );
              }
              if (row.restorePolicy === "bundle_required")
                return (
                  <span className="flex h-4 w-4 items-center justify-center text-[10px] font-medium text-stone-300">
                    -
                  </span>
                );
              return (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleItem(row.id);
                  }}
                  className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${row.isSelected ? "border-stone-950 bg-stone-950 text-white" : "border-stone-300 bg-white text-transparent"}`}
                  aria-label={
                    row.isSelected
                      ? t("filesList.deselectItem", "선택 해제")
                      : t("filesList.selectItem", "선택")
                  }
                >
                  ✓
                </button>
              );
            },
          },
          {
            key: "target",
            label: t("filesList.columns.target", "대상"),
            headerClassName: TRASH_HEADER_LEFT_CLASS,
            className: TRASH_CELL_TARGET_CLASS,
            render: (row) => (
              <div
                className={`flex w-full min-w-0 items-center gap-3 text-left ${row.kind === "workorder" ? "pl-2" : row.isGroupedAttachment ? "pl-5" : "pl-2"}`}
              >
                {row.isGroupedAttachment ? (
                  <span className="shrink-0 text-xs font-medium text-stone-300">
                    └
                  </span>
                ) : null}
                <TrashItemVisual
                  label={row.visualLabel}
                  tone={row.visualTone}
                  thumbnailUrl={row.thumbnailUrl || row.previewUrl}
                  compact
                />
                <div className="min-w-0 text-left">
                  <p className="text-[10px] text-stone-400 md:hidden">
                    {t("filesList.columns.target", "대상")}
                  </p>
                  <p
                    className="truncate text-left text-[13px] font-medium text-stone-700"
                    title={row.targetLabel}
                  >
                    {row.targetLabel}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "deletedAt",
            label: t("filesList.columns.deletedAt", "삭제일시"),
            headerClassName: TRASH_HEADER_CENTER_CLASS,
            className: TRASH_CELL_CENTER_CLASS,
            render: (row) => (
              <p
                className="truncate text-center text-[13px] text-stone-600"
                title={row.deletedAt}
              >
                {row.deletedAt}
              </p>
            ),
          },
          {
            key: "workorder",
            label: t("filesList.columns.workorder", "작업지시서"),
            headerClassName: TRASH_HEADER_CENTER_CLASS,
            className: TRASH_CELL_CENTER_CLASS,
            render: (row) => (
              <div className="min-w-0 text-center">
                <p className="text-[10px] text-stone-400 md:hidden">
                  {t("filesList.columns.workorder", "작업지시서")}
                </p>
                <p
                  className="truncate text-center text-[13px] font-medium text-stone-600"
                  title={row.kind === "workorder" ? "-" : row.workorderTitle}
                >
                  {row.kind === "workorder" ? "-" : row.workorderTitle}
                </p>
              </div>
            ),
          },
          {
            key: "type",
            label: t("filesList.columns.type", "유형"),
            headerClassName: TRASH_HEADER_CENTER_CLASS,
            className: TRASH_CELL_CENTER_CLASS,
            render: (row) => (
              <p
                className="truncate text-center text-[13px] text-stone-600"
                title={row.typeLabel}
              >
                {row.typeLabel}
              </p>
            ),
          },
          {
            key: "size",
            label: t("filesList.columns.size", "크기"),
            headerClassName: TRASH_HEADER_CENTER_CLASS,
            className: TRASH_CELL_CENTER_CLASS,
            render: (row) => (
              <p
                className="truncate text-center text-[13px] text-stone-600"
                title={row.sizeLabel}
              >
                {row.sizeLabel}
              </p>
            ),
          },
        ]}
      />
    </section>
  );
}
