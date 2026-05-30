"use client";

import {
  ADMIN_STORAGE_MUTED_TEXT_CLASS,
  ADMIN_STORAGE_SUBTLE_TEXT_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import type { UnifiedTrashRow } from "@/components/admin/files/fileTrashSectionRows";
import { FileTrashTypeBadge } from "@/components/admin/files/trash/FileTrashTypeBadge";
import {
  handleTrashRowKeyDown,
  getFileTrashRowToneClass,
  TargetSummary,
  TrashSelectionControl,
  type AdminTrashTranslation,
  type FileTrashRowsCommonProps,
} from "@/components/admin/files/trash/FileTrashSharedCells";

function CompactMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} text-[10px] font-medium`}>
        {label}
      </p>
      <p className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} mt-0.5 truncate text-[12px] font-medium`} title={value}>
        {value}
      </p>
    </div>
  );
}

function CompactTrashRow({
  row,
  t,
  onRowClick,
  onToggleItem,
  onToggleWorkOrder,
  previewWorkOrderId,
}: FileTrashRowsCommonProps & { row: UnifiedTrashRow }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onRowClick(row)}
      onKeyDown={(event) => handleTrashRowKeyDown(event, row, onRowClick)}
      className={`w-full cursor-pointer rounded-[16px] border border-[var(--pbp-border)] px-3 py-2.5 text-left text-[11px] shadow-[var(--pbp-shadow-card)] transition hover:bg-[var(--pbp-surface-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--pbp-focus-ring)] ${getFileTrashRowToneClass(row, previewWorkOrderId)}`}
    >
      <div className="flex items-start gap-3">
        <div className="pt-1">
          <TrashSelectionControl
            row={row}
            t={t}
            onToggleItem={onToggleItem}
            onToggleWorkOrder={onToggleWorkOrder}
          />
        </div>
        <div className="min-w-0 flex-1">
          <TargetSummary row={row} t={t} />
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
            <CompactMetaItem
              label={t("filesList.columns.deletedAt", "삭제 일시")}
              value={row.deletedAt}
            />
            <CompactMetaItem
              label={t("filesList.columns.workorder", "작업지시서")}
              value={row.kind === "workorder" ? "-" : row.workorderTitle}
            />
            <div className="min-w-0">
              <p className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} text-[10px] font-medium`}>
                {t("filesList.columns.type", "유형")}
              </p>
              <div className="mt-1">
                <FileTrashTypeBadge row={row} />
              </div>
            </div>
            <CompactMetaItem
              label={t("filesList.columns.size", "크기")}
              value={row.sizeLabel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyTrashRows({
  emptyLabel,
  emptyDescription,
}: {
  emptyLabel: string;
  emptyDescription: string;
}) {
  return (
    <div className="flex min-h-[220px] items-center justify-center bg-[var(--pbp-surface)] px-4 py-10 text-center text-sm text-[var(--pbp-text-muted)]">
      <div className="max-w-md">
        <p className="font-semibold text-[var(--pbp-text-muted)]">{emptyLabel}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
          {emptyDescription}
        </p>
      </div>
    </div>
  );
}

export function FileTrashCompactListRows({
  rows,
  t,
  onRowClick,
  onToggleItem,
  onToggleWorkOrder,
  previewWorkOrderId,
}: FileTrashRowsCommonProps & {
  rows: UnifiedTrashRow[];
  t: AdminTrashTranslation;
}) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <CompactTrashRow
          key={row.rowId}
          row={row}
          t={t}
          onRowClick={onRowClick}
          onToggleItem={onToggleItem}
          onToggleWorkOrder={onToggleWorkOrder}
          previewWorkOrderId={previewWorkOrderId}
        />
      ))}
    </div>
  );
}
