"use client";

import { useMemo, useState } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import AdminActionBar from "@/components/admin/common/AdminActionBar";
import AdminTable from "@/components/admin/common/AdminTable";
import type { AdminStorageWorkOrderItem, AdminTrashFileItem } from "@/lib/admin/files/types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type FileTrashSectionProps = {
  items: AdminTrashFileItem[];
  workOrderItems?: AdminStorageWorkOrderItem[];
  selectedItemIds: string[];
  onToggleItem: (itemId: string) => void;
  onToggleAll: () => void;
  onRestore: () => void;
  onPurge: () => void;
  onRestoreItem?: (itemId: string) => void;
  onPurgeItem?: (itemId: string) => void;
  isActionPending?: boolean;
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
      restorePolicyLabel: string;
      restorePolicy: "workorder_bundle";
      canRestore: false;
      canPurge: false;
      restoreDisabledReason: string;
      purgeDisabledReason: string;
      isSelected: false;
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

const TRASH_TABLE_GRID = "0.34fr 1.24fr 0.82fr 1.12fr 0.58fr 0.56fr 1.05fr 1.08fr";

function getTrashFileType(item: AdminTrashFileItem, t: ReturnType<typeof useAdminTranslation>) {
  if (item.fileIcon === "PDF") return t("filesList.fileTypes.document", "문서");
  if (item.fileIcon === "IMG") return t("filesList.fileTypes.design", "디자인");
  return t("filesList.fileTypes.other", "기타");
}

function getRestorePolicyBadgeClass(row: UnifiedTrashRow): string {
  if (row.restorePolicy === "workorder_bundle") return "border-stone-300 bg-stone-100 text-stone-700";
  if (row.restorePolicy === "bundle_required") return "border-amber-200 bg-amber-50 text-amber-700";
  if (row.restorePolicy === "parent_deleted_restore_blocked") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-stone-200 bg-stone-50 text-stone-600";
}

function formatStorageSize(bytes: number, t: ReturnType<typeof useAdminTranslation>): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return `0${t("filesList.sizeUnit.mb", "MB")}`;
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}${t("filesList.sizeUnit.gb", "GB")}`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}${t("filesList.sizeUnit.mb", "MB")}`;
  if (bytes >= 1024) return `${Math.ceil(bytes / 1024)}${t("filesList.sizeUnit.kb", "KB")}`;
  return `${bytes}${t("filesList.sizeUnit.byte", "B")}`;
}

function sortByDeletedAtDesc<T extends { deletedAt: string | null; targetLabel?: string; fileName?: string }>(a: T, b: T): number {
  const deletedAtCompare = (b.deletedAt || "").localeCompare(a.deletedAt || "");
  if (deletedAtCompare !== 0) return deletedAtCompare;
  return (a.targetLabel || a.fileName || "").localeCompare(b.targetLabel || b.fileName || "", "ko");
}

function createUnifiedRows(input: {
  items: AdminTrashFileItem[];
  workOrderItems: AdminStorageWorkOrderItem[];
  selectedItemIds: string[];
  t: ReturnType<typeof useAdminTranslation>;
}): UnifiedTrashRow[] {
  const { items, workOrderItems, selectedItemIds, t } = input;
  const workOrderIdSet = new Set(workOrderItems.map((item) => item.id));

  const createWorkOrderRow = (item: AdminStorageWorkOrderItem): UnifiedTrashRow => ({
    kind: "workorder",
    id: item.id,
    rowId: `workorder:${item.id}`,
    targetLabel: item.title,
    deletedAt: item.deletedAt || "-",
    workorderTitle: item.title,
    typeLabel: t("filesList.types.workorder", "작업지시서"),
    sizeLabel: "-",
    restorePolicyLabel: t("filesList.restorePolicies.workorderBundle", "작업지시서 단위 처리"),
    restorePolicy: "workorder_bundle",
    canRestore: false,
    canPurge: false,
    restoreDisabledReason: t("filesList.workorderRestorePreparing", "작업지시서 복원은 다음 단계에서 연결합니다."),
    purgeDisabledReason: t("filesList.workorderPurgePreparing", "작업지시서 영구삭제는 다음 단계에서 연결합니다."),
    isSelected: false,
    isGroupedAttachment: false,
    sourceItem: item,
  });

  const createAttachmentRow = (item: AdminTrashFileItem, isGroupedAttachment: boolean): UnifiedTrashRow => ({
    kind: "attachment",
    id: item.id,
    rowId: `attachment:${item.id}`,
    targetLabel: item.fileName,
    deletedAt: item.deletedAt,
    workorderTitle: item.workorderTitle,
    typeLabel: getTrashFileType(item, t),
    sizeLabel: item.fileSizeLabel,
    restorePolicyLabel: item.restorePolicyLabel,
    restorePolicy: item.restorePolicy,
    canRestore: item.canRestore,
    canPurge: item.canPurge,
    restoreDisabledReason: item.restoreDisabledReason,
    purgeDisabledReason: item.purgeDisabledReason,
    isSelected: selectedItemIds.includes(item.id),
    isGroupedAttachment,
    sourceItem: item,
  });

  const rows: UnifiedTrashRow[] = [];
  const groupedAttachmentIds = new Set<string>();

  [...workOrderItems].sort(sortByDeletedAtDesc).forEach((workOrder) => {
    rows.push(createWorkOrderRow(workOrder));

    items
      .filter((item) => item.workorderId === workOrder.id && item.parentWorkOrderDeleted)
      .sort(sortByDeletedAtDesc)
      .forEach((item) => {
        groupedAttachmentIds.add(item.id);
        rows.push(createAttachmentRow(item, true));
      });
  });

  items
    .filter((item) => !groupedAttachmentIds.has(item.id))
    .sort((a, b) => {
      if (workOrderIdSet.has(a.workorderId) !== workOrderIdSet.has(b.workorderId)) {
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
  onToggleItem,
  onToggleAll,
  onRestore,
  onPurge,
  onRestoreItem,
  onPurgeItem,
  isActionPending = false,
}: FileTrashSectionProps) {
  const t = useAdminTranslation();
  const rows = useMemo(() => createUnifiedRows({ items, workOrderItems, selectedItemIds, t }), [items, workOrderItems, selectedItemIds, t]);
  const [workOrderActionPreview, setWorkOrderActionPreview] = useState<WorkOrderActionPreview | null>(null);
  const previewWorkOrder = useMemo(() => workOrderItems.find((item) => item.id === workOrderActionPreview?.workOrderId) ?? null, [workOrderActionPreview?.workOrderId, workOrderItems]);
  const previewWorkOrderTrashItems = useMemo(() => {
    if (!workOrderActionPreview?.workOrderId) return [];
    return items.filter((item) => item.workorderId === workOrderActionPreview.workOrderId && item.parentWorkOrderDeleted);
  }, [items, workOrderActionPreview?.workOrderId]);
  const previewWorkOrderBundleCount = previewWorkOrderTrashItems.filter((item) => item.restorePolicy === "bundle_required").length;
  const previewWorkOrderBlockedCount = previewWorkOrderTrashItems.filter((item) => item.restorePolicy === "parent_deleted_restore_blocked").length;
  const previewWorkOrderTotalSizeLabel = formatStorageSize(
    previewWorkOrderTrashItems.reduce((sum, item) => sum + item.fileSizeBytes, 0),
    t,
  );

  function openWorkOrderActionPreview(workOrderId: string, intent: WorkOrderActionIntent) {
    setWorkOrderActionPreview({ workOrderId, intent });
  }

  const hasSelection = selectedItemIds.length > 0;
  const selectedItems = items.filter((item) => selectedItemIds.includes(item.id));
  const hasRestoreBlockedSelection = selectedItems.some((item) => !item.canRestore);
  const hasPurgeBlockedSelection = selectedItems.some((item) => !item.canPurge);
  const canAct = hasSelection && !isActionPending;
  const canRestoreSelection = canAct && !hasRestoreBlockedSelection;
  const canPurgeSelection = canAct && !hasPurgeBlockedSelection;
  const allSelected = items.length > 0 && selectedItemIds.length === items.length;
  const policySummary = useMemo(() => {
    const fileUnitCount = items.filter((item) => item.restorePolicy === "file_unit").length;
    const parentBlockedCount = items.filter((item) => item.restorePolicy === "parent_deleted_restore_blocked").length;
    const bundleRequiredCount = items.filter((item) => item.restorePolicy === "bundle_required").length;

    return [
      {
        label: t("filesList.policySummary.fileUnit", "파일 단위"),
        value: `${fileUnitCount}${t("filesList.countSuffix", "개")}`,
        description: t("filesList.policySummary.fileUnitDescription", "복구와 영구삭제를 파일별로 처리합니다."),
      },
      {
        label: t("filesList.policySummary.parentBlocked", "복원 불가"),
        value: `${parentBlockedCount}${t("filesList.countSuffix", "개")}`,
        description: t("filesList.policySummary.parentBlockedDescription", "부모 작업지시서가 삭제되어 복구는 막고 영구삭제만 허용합니다."),
      },
      {
        label: t("filesList.policySummary.bundleRequired", "묶음 처리"),
        value: `${bundleRequiredCount}${t("filesList.countSuffix", "개")}`,
        description: t("filesList.policySummary.bundleRequiredDescription", "작업지시서 대표 row에서 복원/삭제해야 하는 파일입니다."),
      },
    ];
  }, [items, t]);

  return (
    <section className="flex h-full min-h-[420px] flex-col rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
      <AdminActionBar
        title={t("trashPage.title", "휴지통")}
        description={t("trashPage.description", "삭제된 항목의 처리 단위를 먼저 확인한 뒤 복구 또는 영구삭제를 진행합니다. 작업지시서 묶음 항목은 대표 row에서만 처리합니다.")}
      >
        <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-600">
          {t("filesList.retentionPolicy", "30일 휴지통 보관")}
        </span>
        <button type="button" onClick={onToggleAll} disabled={isActionPending || items.length === 0} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400">
          {allSelected ? t("filesList.clearAll", "전체 해제") : t("filesList.selectAll", "첨부 전체 선택")}
        </button>
        <button
          type="button"
          onClick={onRestore}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${canRestoreSelection ? "border-stone-300 bg-white text-stone-700 shadow-sm hover:bg-stone-50" : "border-stone-200 bg-stone-50 text-stone-400"}`}
          disabled={!canRestoreSelection}
          title={hasRestoreBlockedSelection ? selectedItems.find((item) => !item.canRestore)?.restoreDisabledReason ?? t("filesList.restoreBlockedByWorkOrder", "선택한 파일 중 복구할 수 없는 항목이 있습니다.") : undefined}
        >
          {isActionPending ? t("filesList.processing", "처리 중") : t("filesList.restore", "복구")} {hasSelection ? selectedItemIds.length : ""}
        </button>
        <button
          type="button"
          onClick={onPurge}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${canPurgeSelection ? "border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50" : "border-stone-200 bg-stone-50 text-stone-400"}`}
          disabled={!canPurgeSelection}
          title={hasPurgeBlockedSelection ? selectedItems.find((item) => !item.canPurge)?.purgeDisabledReason ?? t("filesList.purgeBlockedByWorkOrder", "선택한 파일 중 영구삭제할 수 없는 항목이 있습니다.") : undefined}
        >
          {isActionPending ? t("filesList.processing", "처리 중") : t("filesList.purge", "영구 삭제")} {hasSelection ? selectedItemIds.length : ""}
        </button>
      </AdminActionBar>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {policySummary.map((item) => (
          <div key={item.label} className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold text-stone-600">{item.label}</p>
              <p className="text-xs font-bold text-stone-900">{item.value}</p>
            </div>
            <p className="mt-1 text-[10px] leading-4 text-stone-500">{item.description}</p>
          </div>
        ))}
      </div>

      <ModalShell
        open={Boolean(workOrderActionPreview && previewWorkOrder)}
        onClose={() => setWorkOrderActionPreview(null)}
        title={
          workOrderActionPreview?.intent === "purge"
            ? t("filesList.workorderPurgePreview", "영구삭제 범위 확인")
            : t("filesList.workorderRestorePreview", "복원 범위 확인")
        }
        description={previewWorkOrder ? `${previewWorkOrder.title} · ${previewWorkOrder.statusLabel}` : undefined}
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
              disabled
              className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-400"
              title={t("filesList.workorderActionApiPreparing", "작업지시서 단위 처리 API 연결 후 활성화됩니다.")}
            >
              {workOrderActionPreview?.intent === "purge"
                ? t("filesList.workorderPurgeApiPreparing", "영구삭제 API 미연결")
                : t("filesList.workorderRestoreApiPreparing", "복구 API 미연결")}
            </button>
          </div>
        }
      >
        {workOrderActionPreview && previewWorkOrder ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-xs font-semibold text-stone-900">{previewWorkOrder.title}</p>
              <p className="mt-1 text-xs text-stone-500">
                {previewWorkOrder.statusLabel} · {t("filesList.columns.deletedAt", "삭제일시")} {previewWorkOrder.deletedAt || "-"}
              </p>
            </div>

            <div className="grid gap-2 md:grid-cols-4">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
                <p className="text-[10px] font-semibold text-stone-400">{t("filesList.selectedScope.workorder", "작업지시서")}</p>
                <p className="mt-1 text-[11px] font-bold text-stone-800">{t("filesList.selectedScope.workorderValue", "대표 row 1건")}</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
                <p className="text-[10px] font-semibold text-stone-400">{t("filesList.selectedScope.bundleAttachments", "묶음 처리 첨부")}</p>
                <p className="mt-1 text-[11px] font-bold text-stone-800">{previewWorkOrderBundleCount}{t("filesList.countSuffix", "개")}</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
                <p className="text-[10px] font-semibold text-stone-400">{t("filesList.selectedScope.restoreBlocked", "복원 불가 파일")}</p>
                <p className="mt-1 text-[11px] font-bold text-stone-800">{previewWorkOrderBlockedCount}{t("filesList.countSuffix", "개")}</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
                <p className="text-[10px] font-semibold text-stone-400">{t("filesList.selectedScope.totalSize", "연결 파일 용량")}</p>
                <p className="mt-1 text-[11px] font-bold text-stone-800">{previewWorkOrderTotalSizeLabel}</p>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
              <p className="font-semibold">{t("filesList.workorderActionGuardTitle", "아직 실제 작업지시서 복원/영구삭제 API는 연결하지 않았습니다.")}</p>
              <p className="text-[11px] text-amber-700">
                {t("filesList.workorderActionSkeletonNotice", "이번 단계에서는 서버 skeleton이 요청을 방어하며, 실제 DB/R2 상태 변경은 수행하지 않습니다.")}
              </p>
              <p>
                {workOrderActionPreview.intent === "restore"
                  ? t("filesList.workorderRestoreGuardDescription", "복원 연결 시 작업지시서와 작업지시서 삭제로 함께 휴지통 이동한 첨부/메모를 같은 트랜잭션에서 복원해야 합니다.")
                  : t("filesList.workorderPurgeGuardDescription", "영구삭제 연결 시 작업지시서 대표 row와 묶음 처리 첨부/메모를 작업지시서 단위로 확정 처리하고, R2 삭제는 Worker 기반 purge 흐름만 사용해야 합니다.")}
              </p>
            </div>
          </div>
        ) : null}
      </ModalShell>

      <AdminTable
        className="mt-3 min-h-0 flex-1"
        items={rows}
        getRowKey={(row) => row.rowId}
        emptyLabel={t("filesList.trashEmpty", "휴지통에 보관 중인 항목이 없습니다.")}
        gridTemplateColumns={TRASH_TABLE_GRID}
        rowClassName={(row) => {
          const previewWorkOrderId = workOrderActionPreview?.workOrderId ?? null;
          if (row.kind === "workorder") return row.id === previewWorkOrderId ? "bg-stone-100 ring-1 ring-inset ring-stone-300" : "bg-stone-50/90";
          const isPreviewWorkOrderGroup = Boolean(previewWorkOrderId && row.sourceItem.workorderId === previewWorkOrderId);
          if (row.isGroupedAttachment) return `border-l-4 ${isPreviewWorkOrderGroup ? "border-l-stone-400 bg-stone-100/70" : "border-l-stone-200"} transition ${row.isSelected ? "bg-stone-100" : "bg-stone-50/40 hover:bg-stone-50"}`;
          return `transition ${row.isSelected ? "bg-stone-100" : "bg-white hover:bg-stone-50"}`;
        }}
        columns={[
          {
            key: "select",
            label: t("filesList.columns.select", "선택"),
            render: (row) => {
              if (row.kind === "workorder") return <span className="text-[10px] font-semibold text-stone-400">-</span>;
              return (
                <button
                  type="button"
                  onClick={() => onToggleItem(row.id)}
                  className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${row.isSelected ? "border-stone-950 bg-stone-950 text-white" : "border-stone-300 bg-white text-transparent"}`}
                  aria-label={row.isSelected ? t("filesList.deselectItem", "선택 해제") : t("filesList.selectItem", "선택")}
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
              <div className={`min-w-0 ${row.isGroupedAttachment ? "pl-4" : ""}`}>
                <p className="text-[10px] text-stone-400 md:hidden">{t("filesList.columns.target", "대상")}</p>
                <p className={`truncate font-semibold ${row.kind === "workorder" ? "text-stone-950" : "text-stone-800"}`}>
                  {row.isGroupedAttachment ? "└ " : ""}{row.targetLabel}
                </p>
                {row.kind === "workorder" ? (
                  <div className="mt-1 space-y-0.5 text-[10px] text-stone-500">
                    <p>{row.sourceItem.statusLabel}</p>
                    <p>{row.sourceItem.attachmentSummaryLabel}</p>
                    <p>{row.sourceItem.memoSummaryLabel}</p>
                  </div>
                ) : null}
                {row.isGroupedAttachment ? <p className="mt-1 text-[10px] text-stone-400">{t("filesList.groupedAttachmentHint", "작업지시서 대표 row에서 처리할 파일")}</p> : null}
              </div>
            ),
          },
          { key: "deletedAt", label: t("filesList.columns.deletedAt", "삭제일시"), render: (row) => <p className="text-[11px] text-stone-600">{row.deletedAt}</p> },
          {
            key: "workorder",
            label: t("filesList.columns.workorder", "작업지시서"),
            render: (row) => (
              <div className="min-w-0">
                <p className="text-[10px] text-stone-400 md:hidden">{t("filesList.columns.workorder", "작업지시서")}</p>
                <p className={`truncate text-[11px] ${row.kind === "workorder" ? "font-semibold text-stone-800" : "text-stone-700"}`}>{row.workorderTitle}</p>
              </div>
            ),
          },
          { key: "type", label: t("filesList.columns.type", "유형"), render: (row) => <p className="text-[11px] text-stone-600">{row.typeLabel}</p> },
          { key: "size", label: t("filesList.columns.size", "크기"), render: (row) => <p className="text-[11px] text-stone-600">{row.sizeLabel}</p> },
          {
            key: "restorePolicy",
            label: t("filesList.columns.restorePolicy", "복구정책"),
            render: (row) => (
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getRestorePolicyBadgeClass(row)}`}
                title={row.restoreDisabledReason ?? row.purgeDisabledReason ?? undefined}
              >
                {row.restorePolicyLabel}
              </span>
            ),
          },
          {
            key: "actions",
            label: t("filesList.columns.actions", "작업"),
            render: (row) => {
              if (row.kind === "workorder") {
                return (
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => openWorkOrderActionPreview(row.id, "restore")} className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-stone-700 shadow-sm hover:bg-stone-50" title={row.restoreDisabledReason}>
                      {t("filesList.restore", "복구")}
                    </button>
                    <button type="button" onClick={() => openWorkOrderActionPreview(row.id, "purge")} className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-red-600 shadow-sm hover:bg-red-50" title={row.purgeDisabledReason}>
                      {t("filesList.purge", "영구 삭제")}
                    </button>
                  </div>
                );
              }

              return (
                <div className="flex flex-wrap gap-1.5" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    disabled={isActionPending || !row.canRestore}
                    onClick={() => onRestoreItem?.(row.id)}
                    className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-stone-700 shadow-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400"
                    title={row.restoreDisabledReason ?? undefined}
                  >
                    {t("filesList.restore", "복구")}
                  </button>
                  <button
                    type="button"
                    disabled={isActionPending || !row.canPurge}
                    onClick={() => onPurgeItem?.(row.id)}
                    className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-red-600 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400"
                    title={row.purgeDisabledReason ?? undefined}
                  >
                    {t("filesList.purge", "영구 삭제")}
                  </button>
                </div>
              );
            },
          },
        ]}
      />
    </section>
  );
}
