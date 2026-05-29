"use client";

import { useRef } from "react";
import { AppBadge, type AppBadgeTone } from "@/components/common/ui";
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
import {
  type TrashSortKey,
  type TrashSortState,
  type UnifiedTrashRow,
} from "@/components/admin/files/fileTrashSectionRows";
import { ADMIN_TRASH_RESTORE_POLICIES } from "@/lib/admin/files/trashPolicy";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { useElementSize } from "@/lib/responsive/useElementSize";

const TRASH_TABLE_MIN_WIDTH = 1080;
const WIDE_TRASH_GRID =
  "48px minmax(260px,1.45fr) 136px minmax(180px,1fr) 104px 88px";

type AdminT = ReturnType<typeof useAdminTranslation>;

function getTrashTypeBadgeTone(row: UnifiedTrashRow): AppBadgeTone {
  if (row.kind === "workorder") return "workorder";

  const normalizedType = row.typeLabel.trim().toLowerCase();
  if (normalizedType.includes("디자인") || normalizedType.includes("design")) {
    return "design";
  }
  if (normalizedType.includes("문서") || normalizedType.includes("pdf") || normalizedType.includes("document")) {
    return "document";
  }
  if (normalizedType.includes("메모") || normalizedType.includes("memo")) {
    return "memo";
  }
  if (row.visualTone === "image") return "design";
  if (row.visualTone === "pdf") return "document";
  return "file";
}

function TrashTypeBadge({ row, className = "" }: { row: UnifiedTrashRow; className?: string }) {
  return (
    <AppBadge
      size="xs"
      tone={getTrashTypeBadgeTone(row)}
      className={`max-w-[104px] truncate ${className}`}
      title={row.typeLabel}
    >
      {row.typeLabel}
    </AppBadge>
  );
}

type FileTrashResponsiveRowsProps = {
  rows: UnifiedTrashRow[];
  t: AdminT;
  sortState: TrashSortState | null;
  onSort: (key: TrashSortKey) => void;
  onRowClick: (row: UnifiedTrashRow) => void;
  onToggleItem: (itemId: string) => void;
  onToggleWorkOrder?: (workOrderId: string) => void;
  previewWorkOrderId?: string | null;
};

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

function TrashSelectionControl({
  row,
  t,
  onToggleItem,
  onToggleWorkOrder,
}: {
  row: UnifiedTrashRow;
  t: AdminT;
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

function TargetSummary({ row, t }: { row: UnifiedTrashRow; t: AdminT }) {
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

function TableHeader({
  t,
  sortState,
  onSort,
}: {
  t: AdminT;
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

function getRowToneClass(row: UnifiedTrashRow, previewWorkOrderId?: string | null) {
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

function WideTrashRow({
  row,
  t,
  onRowClick,
  onToggleItem,
  onToggleWorkOrder,
  previewWorkOrderId,
}: {
  row: UnifiedTrashRow;
  t: AdminT;
  onRowClick: (row: UnifiedTrashRow) => void;
  onToggleItem: (itemId: string) => void;
  onToggleWorkOrder?: (workOrderId: string) => void;
  previewWorkOrderId?: string | null;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onRowClick(row)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onRowClick(row);
        }
      }}
      className={`grid w-full cursor-pointer items-center gap-3 px-4 py-2 text-left text-[11px] transition hover:bg-[var(--pbp-surface-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--pbp-focus-ring)] ${getRowToneClass(row, previewWorkOrderId)}`}
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
        <TrashTypeBadge row={row} className="min-w-[64px] justify-center" />
      </span>
      <span className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} truncate text-center text-[12px] font-semibold`}>
        {row.sizeLabel}
      </span>
    </div>
  );
}

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
}: {
  row: UnifiedTrashRow;
  t: AdminT;
  onRowClick: (row: UnifiedTrashRow) => void;
  onToggleItem: (itemId: string) => void;
  onToggleWorkOrder?: (workOrderId: string) => void;
  previewWorkOrderId?: string | null;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onRowClick(row)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onRowClick(row);
        }
      }}
      className={`w-full cursor-pointer rounded-[16px] border border-[var(--pbp-border)] px-3 py-2.5 text-left text-[11px] shadow-[var(--pbp-shadow-card)] transition hover:bg-[var(--pbp-surface-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--pbp-focus-ring)] ${getRowToneClass(row, previewWorkOrderId)}`}
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
                <TrashTypeBadge row={row} />
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

function EmptyTrashRows({
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

export function FileTrashResponsiveRows({
  rows,
  t,
  sortState,
  onSort,
  onRowClick,
  onToggleItem,
  onToggleWorkOrder,
  previewWorkOrderId,
}: FileTrashResponsiveRowsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { width } = useElementSize(containerRef);
  const isWideTable = width >= TRASH_TABLE_MIN_WIDTH;
  const emptyLabel = t("filesList.trashEmpty", "휴지통에 보관 중인 항목이 없습니다.");
  const emptyDescription = t(
    "filesList.trashEmptyDescription",
    "삭제한 작업지시서, 문서, 디자인, 메모가 있으면 복원 또는 삭제 요청 대상으로 표시됩니다.",
  );

  return (
    <div
      ref={containerRef}
      className={`flex min-h-fit touch-pan-y flex-col overflow-visible rounded-[22px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] ${
        isWideTable ? "divide-y divide-[var(--pbp-border)]" : "gap-2 border-0 bg-transparent"
      }`}
    >
      {isWideTable ? (
        <TableHeader t={t} sortState={sortState} onSort={onSort} />
      ) : null}
      {rows.length === 0 ? (
        <EmptyTrashRows
          emptyLabel={emptyLabel}
          emptyDescription={emptyDescription}
        />
      ) : isWideTable ? (
        <div className="divide-y divide-[var(--pbp-border)]">
          {rows.map((row) => (
            <WideTrashRow
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
      ) : (
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
      )}
    </div>
  );
}
