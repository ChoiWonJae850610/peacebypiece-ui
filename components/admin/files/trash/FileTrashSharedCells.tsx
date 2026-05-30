"use client";

import type { KeyboardEvent } from "react";

import {
  ADMIN_STORAGE_CHECKBOX_CLASS,
  ADMIN_STORAGE_CHECKBOX_IDLE_CLASS,
  ADMIN_STORAGE_CHECKBOX_SELECTED_CLASS,
  ADMIN_STORAGE_MUTED_TEXT_CLASS,
  ADMIN_STORAGE_ROW_CLASS,
  ADMIN_STORAGE_SELECTED_ROW_CLASS,
  ADMIN_STORAGE_SUBTLE_TEXT_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import { TrashItemVisual } from "@/components/admin/files/fileTrashSectionPresentation";
import type { UnifiedTrashRow } from "@/components/admin/files/fileTrashSectionRows";
import { ADMIN_TRASH_RESTORE_POLICIES } from "@/lib/admin/files/trashPolicy";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

export type AdminTrashTranslation = ReturnType<typeof useAdminTranslation>;

export type FileTrashRowsCommonProps = {
  t: AdminTrashTranslation;
  onRowClick: (row: UnifiedTrashRow) => void;
  onToggleItem: (itemId: string) => void;
  onToggleWorkOrder?: (workOrderId: string) => void;
  previewWorkOrderId?: string | null;
};

export function getFileTrashRowToneClass(
  row: UnifiedTrashRow,
  previewWorkOrderId?: string | null,
) {
  if (row.kind === "workorder") {
    return row.id === previewWorkOrderId || row.isSelected
      ? ADMIN_STORAGE_SELECTED_ROW_CLASS
      : `${ADMIN_STORAGE_ROW_CLASS} border-l-4 border-l-[var(--pbp-border-strong)]`;
  }

  const isPreviewWorkOrderGroup = Boolean(
    previewWorkOrderId && row.sourceItem.workorderId === previewWorkOrderId,
  );

  if (row.isGroupedAttachment) {
    return isPreviewWorkOrderGroup
      ? "border-l-4 border-l-[var(--pbp-border-strong)] bg-[var(--pbp-selected-surface-soft)] text-[var(--pbp-text-muted)]"
      : "border-l-4 border-l-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-muted)]";
  }

  return row.isSelected ? ADMIN_STORAGE_SELECTED_ROW_CLASS : ADMIN_STORAGE_ROW_CLASS;
}

export function TrashSelectionControl({
  row,
  t,
  onToggleItem,
  onToggleWorkOrder,
}: {
  row: UnifiedTrashRow;
  t: AdminTrashTranslation;
  onToggleItem: (itemId: string) => void;
  onToggleWorkOrder?: (workOrderId: string) => void;
}) {
  if (row.kind === "workorder") {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleWorkOrder?.(row.id);
        }}
        className={`${ADMIN_STORAGE_CHECKBOX_CLASS} ${
          row.isSelected
            ? ADMIN_STORAGE_CHECKBOX_SELECTED_CLASS
            : ADMIN_STORAGE_CHECKBOX_IDLE_CLASS
        }`}
        aria-label={
          row.isSelected
            ? t("filesList.deselectWorkOrder", "작업지시서 선택 해제")
            : t("filesList.selectWorkOrder", "작업지시서 선택")
        }
      >
        ✓
      </button>
    );
  }

  if (row.restorePolicy === ADMIN_TRASH_RESTORE_POLICIES.bundleRequired) {
    return (
      <span
        className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} flex h-4 w-4 items-center justify-center text-[10px] font-medium`}
      >
        -
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggleItem(row.id);
      }}
      className={`${ADMIN_STORAGE_CHECKBOX_CLASS} ${
        row.isSelected
          ? ADMIN_STORAGE_CHECKBOX_SELECTED_CLASS
          : ADMIN_STORAGE_CHECKBOX_IDLE_CLASS
      }`}
      aria-label={
        row.isSelected
          ? t("filesList.deselectItem", "선택 해제")
          : t("filesList.selectItem", "선택")
      }
    >
      ✓
    </button>
  );
}

export function TargetSummary({
  row,
  t,
}: {
  row: UnifiedTrashRow;
  t: AdminTrashTranslation;
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 ${
        row.kind === "workorder"
          ? "pl-0"
          : row.isGroupedAttachment
            ? "pl-5"
            : "pl-0"
      }`}
    >
      {row.isGroupedAttachment ? (
        <span
          className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} shrink-0 text-xs font-medium`}
        >
          └
        </span>
      ) : null}
      <TrashItemVisual
        label={row.visualLabel}
        tone={row.visualTone}
        thumbnailUrl={row.thumbnailUrl || row.previewUrl}
        previewFailedLabel={t("filesList.detail.previewFailed", "Preview failed")}
        compact
      />
      <div className="min-w-0 text-left">
        <p
          className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} truncate text-[13px] font-semibold`}
          title={row.targetLabel}
        >
          {row.targetLabel}
        </p>
        <p className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} mt-0.5 truncate text-[10px]`}>
          {row.restorePolicyLabel}
        </p>
      </div>
    </div>
  );
}

export function handleTrashRowKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  row: UnifiedTrashRow,
  onRowClick: (row: UnifiedTrashRow) => void,
) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onRowClick(row);
  }
}
