"use client";

import type { AdminTableColumn } from "@/lib/admin/common/types";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { TrashItemVisual } from "@/components/admin/files/fileTrashSectionPresentation";
import { ADMIN_TRASH_RESTORE_POLICIES } from "@/lib/admin/files/trashPolicy";
import {
  TRASH_CELL_CENTER_CLASS,
  TRASH_CELL_SELECT_CLASS,
  TRASH_CELL_TARGET_CLASS,
  TRASH_HEADER_CENTER_CLASS,
  type TrashSortKey,
  type TrashSortState,
  type UnifiedTrashRow,
} from "@/components/admin/files/fileTrashSectionRows";

type FileTrashColumnsInput = {
  t: ReturnType<typeof useAdminTranslation>;
  onToggleItem: (itemId: string) => void;
  onToggleWorkOrder?: (workOrderId: string) => void;
  sortState?: TrashSortState | null;
  onSort?: (key: TrashSortKey) => void;
};

function SortableHeader({
  label,
  sortKey,
  sortState,
  onSort,
}: {
  label: string;
  sortKey: TrashSortKey;
  sortState?: TrashSortState | null;
  onSort?: (key: TrashSortKey) => void;
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
      onClick={() => onSort?.(sortKey)}
      className="inline-flex w-full items-center justify-center gap-1 rounded px-1 py-0.5 text-center transition hover:bg-stone-100 hover:text-stone-800"
    >
      <span>{label}</span>
      <span className={isActive ? "text-stone-900" : "text-stone-300"}>
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
}: FileTrashColumnsInput & { row: UnifiedTrashRow }) {
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
      <span className="flex h-4 w-4 items-center justify-center text-[10px] font-medium text-stone-300">
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
}

function TrashTargetCell({
  row,
  t,
}: {
  row: UnifiedTrashRow;
  t: ReturnType<typeof useAdminTranslation>;
}) {
  return (
    <div
      className={`flex w-full min-w-0 items-center gap-3 text-left ${row.kind === "workorder" ? "pl-2" : row.isGroupedAttachment ? "pl-5" : "pl-2"}`}
    >
      {row.isGroupedAttachment ? (
        <span className="shrink-0 text-xs font-medium text-stone-300">└</span>
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
  );
}

function CenterTextCell({
  value,
  mobileLabel,
  title,
  isStrong = false,
}: {
  value: string;
  mobileLabel?: string;
  title?: string;
  isStrong?: boolean;
}) {
  return (
    <div className="min-w-0 text-center">
      {mobileLabel ? (
        <p className="text-[10px] text-stone-400 md:hidden">{mobileLabel}</p>
      ) : null}
      <p
        className={`truncate text-center text-[13px] ${isStrong ? "font-medium" : ""} text-stone-600`}
        title={title ?? value}
      >
        {value}
      </p>
    </div>
  );
}

export function createFileTrashColumns({
  t,
  onToggleItem,
  onToggleWorkOrder,
  sortState,
  onSort,
}: FileTrashColumnsInput): AdminTableColumn<UnifiedTrashRow>[] {
  return [
    {
      key: "select",
      label: t("filesList.columns.select", "선택"),
      headerClassName: TRASH_HEADER_CENTER_CLASS,
      className: TRASH_CELL_SELECT_CLASS,
      render: (row) => (
        <TrashSelectionControl
          row={row}
          t={t}
          onToggleItem={onToggleItem}
          onToggleWorkOrder={onToggleWorkOrder}
        />
      ),
    },
    {
      key: "target",
      label: (
        <SortableHeader
          label={t("filesList.columns.target", "대상")}
          sortKey="target"
          sortState={sortState}
          onSort={onSort}
        />
      ),
      headerClassName: TRASH_HEADER_CENTER_CLASS,
      className: TRASH_CELL_TARGET_CLASS,
      render: (row) => <TrashTargetCell row={row} t={t} />,
    },
    {
      key: "deletedAt",
      label: (
        <SortableHeader
          label={t("filesList.columns.deletedAt", "삭제일시")}
          sortKey="deletedAt"
          sortState={sortState}
          onSort={onSort}
        />
      ),
      headerClassName: TRASH_HEADER_CENTER_CLASS,
      className: TRASH_CELL_CENTER_CLASS,
      render: (row) => <CenterTextCell value={row.deletedAt} />,
    },
    {
      key: "workorder",
      label: (
        <SortableHeader
          label={t("filesList.columns.workorder", "작업지시서")}
          sortKey="workorder"
          sortState={sortState}
          onSort={onSort}
        />
      ),
      headerClassName: TRASH_HEADER_CENTER_CLASS,
      className: TRASH_CELL_CENTER_CLASS,
      render: (row) => (
        <CenterTextCell
          value={row.kind === "workorder" ? "-" : row.workorderTitle}
          title={row.kind === "workorder" ? "-" : row.workorderTitle}
          mobileLabel={t("filesList.columns.workorder", "작업지시서")}
          isStrong
        />
      ),
    },
    {
      key: "type",
      label: (
        <SortableHeader
          label={t("filesList.columns.type", "유형")}
          sortKey="type"
          sortState={sortState}
          onSort={onSort}
        />
      ),
      headerClassName: TRASH_HEADER_CENTER_CLASS,
      className: TRASH_CELL_CENTER_CLASS,
      render: (row) => <CenterTextCell value={row.typeLabel} />,
    },
    {
      key: "size",
      label: (
        <SortableHeader
          label={t("filesList.columns.size", "크기")}
          sortKey="size"
          sortState={sortState}
          onSort={onSort}
        />
      ),
      headerClassName: TRASH_HEADER_CENTER_CLASS,
      className: TRASH_CELL_CENTER_CLASS,
      render: (row) => <CenterTextCell value={row.sizeLabel} />,
    },
  ];
}
