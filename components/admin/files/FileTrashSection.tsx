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

type FileTrashSectionProps = {
  items: AdminTrashFileItem[];
  workOrderItems?: AdminStorageWorkOrderItem[];
  selectedItemIds: string[];
  selectedWorkOrderIds?: string[];
  onToggleItem: (itemId: string) => void;
  onToggleWorkOrder?: (workOrderId: string) => void;
  onToggleAll: () => void;
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

type UnifiedTrashRow =
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

const TRASH_TABLE_GRID = "0.34fr 1.5fr 0.82fr 1.15fr 0.62fr 0.58fr";

const WORKORDER_STAGE_STEPS = [
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

function getWorkOrderStageIndex(statusLabel: string): number {
  const normalizedStatus = statusLabel.trim().toLowerCase();
  const foundIndex = WORKORDER_STAGE_STEPS.findIndex((step) =>
    step.keys.some((key) => key.toLowerCase() === normalizedStatus),
  );
  return foundIndex >= 0 ? foundIndex : 0;
}

function WorkOrderStageInline({ statusLabel }: { statusLabel: string }) {
  const currentIndex = getWorkOrderStageIndex(statusLabel);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
            현재 단계
          </p>
          <p className="mt-1 text-sm font-semibold text-stone-900">
            {statusLabel}
          </p>
        </div>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
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
                className={`mt-1 truncate text-center text-[10px] font-semibold ${
                  isActive ? "text-stone-950" : "text-stone-400"
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


function getTrashFileType(
  item: AdminTrashFileItem,
  t: ReturnType<typeof useAdminTranslation>,
) {
  if (item.fileIcon === "PDF") return t("filesList.fileTypes.document", "문서");
  if (item.fileIcon === "IMG") return t("filesList.fileTypes.design", "디자인");
  return t("filesList.fileTypes.other", "기타");
}

function formatStorageSize(
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

function getTrashVisualInfo(input: {
  kind: "workorder" | "attachment";
  fileIcon?: string;
  typeLabel?: string;
}): { label: string; tone: "workorder" | "image" | "pdf" | "file" } {
  if (input.kind === "workorder") return { label: "작지", tone: "workorder" };
  const icon = (input.fileIcon || "").trim().toUpperCase();
  const typeLabel = (input.typeLabel || "").trim();
  if (icon === "IMG" || typeLabel === "디자인") return { label: "IMG", tone: "image" };
  if (icon === "PDF" || typeLabel === "문서") return { label: "PDF", tone: "pdf" };
  return { label: "FILE", tone: "file" };
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
  const sizeClass = compact ? "h-8 w-8 text-[9px]" : "h-11 w-11 text-[10px]";
  const toneClass =
    tone === "workorder"
      ? "border-stone-300 bg-stone-950 text-white"
      : tone === "image"
        ? "border-purple-100 bg-purple-50 text-purple-700"
        : tone === "pdf"
          ? "border-red-100 bg-red-50 text-red-600"
          : "border-stone-200 bg-stone-50 text-stone-600";

  if (tone === "image" && thumbnailUrl) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 ${sizeClass} shadow-sm`}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-2xl border ${toneClass} ${sizeClass} font-bold shadow-sm`}
      aria-hidden="true"
    >
      {label}
    </span>
  );
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

function createUnifiedRows(input: {
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
      "작업지시서를 복구하고 작업지시서 삭제와 함께 이동한 첨부/메모를 함께 복구합니다.",
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

export default function FileTrashSection({
  items,
  workOrderItems = [],
  selectedItemIds,
  selectedWorkOrderIds = [],
  onToggleItem,
  onToggleWorkOrder,
  onToggleAll,
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

  const selectableItems = items.filter(
    (item) => item.restorePolicy !== "bundle_required",
  );
  const selectableWorkOrderIds = workOrderItems.map((item) => item.id);
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
  const selectableCount =
    selectableItems.length + selectableWorkOrderIds.length;
  const allSelected =
    selectableCount > 0 &&
    selectedItemIds.length === selectableItems.length &&
    selectedWorkOrderIds.length === selectableWorkOrderIds.length;

  return (
    <section className="flex h-full min-h-[420px] flex-col rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
      <AdminActionBar title={t("trashPage.title", "휴지통")}>
        <button
          type="button"
          onClick={onToggleAll}
          disabled={
            isActionPending || isWorkOrderActionPending || selectableCount === 0
          }
          className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400"
        >
          {allSelected
            ? t("filesList.clearAll", "전체 해제")
            : t("filesList.selectAll", "전체 선택")}
        </button>
        <button
          type="button"
          onClick={onRestore}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${canRestoreSelection ? "border-stone-300 bg-white text-stone-700 shadow-sm hover:bg-stone-50" : "border-stone-200 bg-stone-50 text-stone-400"}`}
          disabled={!canRestoreSelection}
          title={
            selectedItems.some((item) => !item.canRestore)
              ? t(
                  "filesList.restoreSkipsBlockedItems",
                  "복구할 수 없는 선택 항목은 제외하고 처리합니다.",
                )
              : undefined
          }
        >
          {isActionPending || isWorkOrderActionPending
            ? t("filesList.processing", "처리 중")
            : t("filesList.restore", "복구")}{" "}
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
                  "영구삭제할 수 없는 선택 항목은 제외하고 처리합니다.",
                )
              : undefined
          }
        >
          {isActionPending || isWorkOrderActionPending
            ? t("filesList.processing", "처리 중")
            : t("filesList.purge", "영구 삭제")}{" "}
          {selectedCount > 0 ? selectedCount : ""}
        </button>
      </AdminActionBar>

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
                  ? t("filesList.purge", "영구 삭제")
                  : t("filesList.restore", "복구")}
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
                <p className="mt-1 text-[11px] font-bold text-stone-800">
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
                <p className="mt-1 text-[11px] font-bold text-stone-800">
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
                <p className="mt-1 text-[11px] font-bold text-stone-800">
                  {previewWorkOrderBlockedCount}
                  {t("filesList.countSuffix", "개")}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
                <p className="text-[10px] font-semibold text-stone-400">
                  {t("filesList.selectedScope.totalSize", "연결 파일 용량")}
                </p>
                <p className="mt-1 text-[11px] font-bold text-stone-800">
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
                      "복구는 이번 단계에서 실제 DB 복원 API에 연결됩니다. 작업지시서 삭제와 함께 휴지통으로 이동한 첨부/메모만 함께 복구합니다.",
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
                {t("filesList.restore", "복구")}
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
                {t("filesList.purge", "영구 삭제")}
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
                  className="truncate text-sm font-bold text-stone-950"
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
                className="block rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
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
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                    {label}
                  </p>
                  <p
                    className="mt-1 truncate text-sm font-semibold text-stone-800"
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
                    "복구하면 작업지시서와 연결된 첨부파일/메모가 함께 복구됩니다.",
                  )
                : detailRow.restoreDisabledReason ||
                  detailRow.purgeDisabledReason ||
                  t(
                    "filesList.detailActionHint",
                    "복구 또는 영구 삭제 작업은 이 상세 창에서 처리합니다.",
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
            return `border-l-4 ${isPreviewWorkOrderGroup ? "border-l-stone-400 bg-stone-100/70" : "border-l-stone-200"} transition ${row.isSelected ? "bg-stone-100" : "bg-stone-50/40 hover:bg-stone-50"}`;
          return `transition ${row.isSelected ? "bg-stone-100" : "bg-white hover:bg-stone-50"}`;
        }}
        columns={[
          {
            key: "select",
            label: t("filesList.columns.select", "선택"),
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
                  <span className="text-[10px] font-semibold text-stone-300">
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
            render: (row) => (
              <div
                className={`flex min-w-0 items-center gap-3 ${row.isGroupedAttachment ? "pl-4" : ""}`}
              >
                {row.isGroupedAttachment ? (
                  <span className="shrink-0 text-xs font-semibold text-stone-300">
                    └
                  </span>
                ) : null}
                <TrashItemVisual
                  label={row.visualLabel}
                  tone={row.visualTone}
                  thumbnailUrl={row.thumbnailUrl || row.previewUrl}
                  compact
                />
                <div className="min-w-0">
                  <p className="text-[10px] text-stone-400 md:hidden">
                    {t("filesList.columns.target", "대상")}
                  </p>
                  <p
                    className="truncate text-sm font-medium text-stone-800"
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
            render: (row) => (
              <p
                className="truncate text-sm text-stone-600"
                title={row.deletedAt}
              >
                {row.deletedAt}
              </p>
            ),
          },
          {
            key: "workorder",
            label: t("filesList.columns.workorder", "작업지시서"),
            render: (row) => (
              <div className="min-w-0">
                <p className="text-[10px] text-stone-400 md:hidden">
                  {t("filesList.columns.workorder", "작업지시서")}
                </p>
                <p
                  className="truncate text-sm font-medium text-stone-700"
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
            render: (row) => (
              <p
                className="truncate text-sm text-stone-600"
                title={row.typeLabel}
              >
                {row.typeLabel}
              </p>
            ),
          },
          {
            key: "size",
            label: t("filesList.columns.size", "크기"),
            render: (row) => (
              <p
                className="truncate text-sm text-stone-600"
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
