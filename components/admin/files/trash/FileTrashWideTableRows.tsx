"use client";

import {
  ADMIN_STORAGE_MUTED_TEXT_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import type {
  TrashSortKey,
  TrashSortState,
  UnifiedTrashRow,
} from "@/components/admin/files/fileTrashSectionRows";
import { FileTrashTypeBadge } from "@/components/admin/files/trash/FileTrashTypeBadge";
import {
  handleTrashRowKeyDown,
  getFileTrashRowToneClass,
  TargetSummary,
  TrashSelectionControl,
  type AdminTrashTranslation,
  type FileTrashRowsCommonProps,
} from "@/components/admin/files/trash/FileTrashSharedCells";
import { WIDE_TRASH_GRID } from "@/components/admin/files/trash/fileTrashResponsivePresentation";

function SortButton({
  label,
  sortKey,
  sortState,
  onSort,
}: {
  label: string;
  sortKey: TrashSortKey;
  sortState: TrashSortState | null;
  onSort: (key: TrashSortKey) => void;
}) {
  const isActive = sortState?.key === sortKey;
  const directionLabel = isActive
    ? sortState.direction === "asc"
      ? "▲"
      : "▼"
    : "↕";

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex w-full items-center justify-center gap-1 rounded px-1 py-0.5 text-center transition hover:bg-[var(--pbp-surface-soft)] hover:text-[var(--pbp-text-primary)]"
    >
      <span>{label}</span>
      <span
        className={
          isActive
            ? "text-[var(--pbp-text-primary)]"
            : "text-[var(--pbp-text-subtle)]"
        }
      >
        {directionLabel}
      </span>
    </button>
  );
}

function WideTrashTableHeader({
  t,
  sortState,
  onSort,
}: {
  t: AdminTrashTranslation;
  sortState: TrashSortState | null;
  onSort: (key: TrashSortKey) => void;
}) {
  return (
    <div
      className="grid items-center gap-3 bg-[var(--pbp-surface-muted)] px-4 py-2 text-center text-[10px] font-semibold text-[var(--pbp-text-muted)]"
      style={{ gridTemplateColumns: WIDE_TRASH_GRID }}
    >
      <span>{t("filesList.columns.select", "선택")}</span>
      <SortButton
        label={t("filesList.columns.target", "삭제 대상")}
        sortKey="target"
        sortState={sortState}
        onSort={onSort}
      />
      <SortButton
        label={t("filesList.columns.deletedAt", "삭제 일시")}
        sortKey="deletedAt"
        sortState={sortState}
        onSort={onSort}
      />
      <SortButton
        label={t("filesList.columns.workorder", "작업지시서")}
        sortKey="workorder"
        sortState={sortState}
        onSort={onSort}
      />
      <SortButton
        label={t("filesList.columns.type", "유형")}
        sortKey="type"
        sortState={sortState}
        onSort={onSort}
      />
      <SortButton
        label={t("filesList.columns.size", "크기")}
        sortKey="size"
        sortState={sortState}
        onSort={onSort}
      />
    </div>
  );
}

function WideTrashTableRow({
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
      className={`grid w-full cursor-pointer items-center gap-3 px-4 py-2 text-left text-[11px] transition hover:bg-[var(--pbp-surface-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--pbp-focus-ring)] ${getFileTrashRowToneClass(row, previewWorkOrderId)}`}
      style={{ gridTemplateColumns: WIDE_TRASH_GRID }}
    >
      <span className="flex justify-center">
        <TrashSelectionControl
          row={row}
          t={t}
          onToggleItem={onToggleItem}
          onToggleWorkOrder={onToggleWorkOrder}
        />
      </span>
      <TargetSummary row={row} t={t} />
      <span className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} truncate text-center text-[12px]`}>
        {row.deletedAt}
      </span>
      <span
        className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} mx-auto max-w-[220px] truncate text-center text-[12px] font-medium`}
        title={row.kind === "workorder" ? "-" : row.workorderTitle}
      >
        {row.kind === "workorder" ? "-" : row.workorderTitle}
      </span>
      <span className="flex justify-center">
        <FileTrashTypeBadge row={row} className="min-w-[64px] justify-center" />
      </span>
      <span className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} truncate text-center text-[12px] font-semibold`}>
        {row.sizeLabel}
      </span>
    </div>
  );
}

export function FileTrashWideTableRows({
  rows,
  t,
  sortState,
  onSort,
  onRowClick,
  onToggleItem,
  onToggleWorkOrder,
  previewWorkOrderId,
}: FileTrashRowsCommonProps & {
  rows: UnifiedTrashRow[];
  sortState: TrashSortState | null;
  onSort: (key: TrashSortKey) => void;
}) {
  return (
    <>
      <WideTrashTableHeader t={t} sortState={sortState} onSort={onSort} />
      <div className="divide-y divide-[var(--pbp-border)]">
        {rows.map((row) => (
          <WideTrashTableRow
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
    </>
  );
}
