"use client";

import type { AdminTableColumn } from "@/lib/admin/common/types";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  ADMIN_STORAGE_CHECKBOX_CLASS,
  ADMIN_STORAGE_CHECKBOX_IDLE_CLASS,
  ADMIN_STORAGE_CHECKBOX_SELECTED_CLASS,
  ADMIN_STORAGE_MUTED_TEXT_CLASS,
  ADMIN_STORAGE_SUBTLE_TEXT_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import { TrashItemVisual } from "@/components/admin/files/fileTrashSectionPresentation";
import { ADMIN_TRASH_RESTORE_POLICIES } from "@/lib/admin/files/trashPolicy";
import {
  type TrashSortKey,
  type TrashSortState,
  type UnifiedTrashRow,
} from "@/components/admin/files/fileTrashSectionRows";
import {
  TRASH_CELL_CENTER_CLASS,
  TRASH_CELL_SELECT_CLASS,
  TRASH_CELL_TARGET_CLASS,
  TRASH_HEADER_CENTER_CLASS,
} from "@/lib/admin/files/trashTablePresentation";

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
      className="inline-flex w-full items-center justify-center gap-1 rounded px-1 py-0.5 text-center transition hover:bg-[var(--pbp-surface-soft)] hover:text-[var(--pbp-text-primary)]"
    >
      <span>{label}</span>
      <span className={isActive ? "text-[var(--pbp-text-primary)]" : "text-[var(--pbp-text-subtle)]"}>
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
        className={`${ADMIN_STORAGE_CHECKBOX_CLASS} ${row.isSelected ? ADMIN_STORAGE_CHECKBOX_SELECTED_CLASS : ADMIN_STORAGE_CHECKBOX_IDLE_CLASS}`}
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
      <span className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} flex h-4 w-4 items-center justify-center text-[10px] font-medium`}>
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
      className={`${ADMIN_STORAGE_CHECKBOX_CLASS} ${row.isSelected ? ADMIN_STORAGE_CHECKBOX_SELECTED_CLASS : ADMIN_STORAGE_CHECKBOX_IDLE_CLASS}`}
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
        <span className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} shrink-0 text-xs font-medium`}>└</span>
      ) : null}
      <TrashItemVisual
        label={row.visualLabel}
        tone={row.visualTone}
        thumbnailUrl={row.thumbnailUrl || row.previewUrl}
        previewFailedLabel={t("filesList.detail.previewFailed", "Preview failed")}
        compact
      />
      <div className="min-w-0 text-left">
        <p className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} text-[10px] min-[1180px]:hidden`}>
          {t("filesList.columns.target", "삭제 대상")}
        </p>
        <p
          className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} truncate text-left text-[13px] font-medium`}
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
    <div className="flex min-w-0 w-full flex-col items-start justify-center text-left min-[1180px]:items-center min-[1180px]:text-center">
      {mobileLabel ? (
        <p className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} text-[10px] min-[1180px]:hidden`}>{mobileLabel}</p>
      ) : null}
      <p
        className={`max-w-full truncate text-left text-[12px] min-[1180px]:mx-auto min-[1180px]:text-center ${isStrong ? `font-semibold ${ADMIN_STORAGE_MUTED_TEXT_CLASS}` : ADMIN_STORAGE_MUTED_TEXT_CLASS}`}
        title={title ?? value}
      >
        {value}
      </p>
    </div>
  );
}

function WorkOrderCell({
  value,
  mobileLabel,
}: {
  value: string;
  mobileLabel: string;
}) {
  return (
    <div className="flex min-w-0 w-full flex-col items-start justify-center text-left min-[1180px]:items-center min-[1180px]:text-center">
      <p className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} text-[10px] min-[1180px]:hidden`}>{mobileLabel}</p>
      <p
        className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} max-w-full truncate text-left text-[12px] font-medium min-[1180px]:mx-auto min-[1180px]:max-w-[220px] min-[1180px]:text-center`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function TypeBadgeCell({ value, mobileLabel }: { value: string; mobileLabel?: string }) {
  return (
    <div className="flex min-w-0 w-full flex-col items-start justify-center text-left min-[1180px]:items-center min-[1180px]:text-center">
      {mobileLabel ? (
        <p className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} text-[10px] min-[1180px]:hidden`}>{mobileLabel}</p>
      ) : null}
      <AdminStatusBadge
        size="xs"
        tone="neutral"
        className="max-w-[140px] truncate text-left min-[1180px]:max-w-[92px] min-[1180px]:text-center"
      >
        {value}
      </AdminStatusBadge>
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
          label={t("filesList.columns.target", "삭제 대상")}
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
          label={t("filesList.columns.deletedAt", "삭제 일시")}
          sortKey="deletedAt"
          sortState={sortState}
          onSort={onSort}
        />
      ),
      headerClassName: TRASH_HEADER_CENTER_CLASS,
      className: TRASH_CELL_CENTER_CLASS,
      render: (row) => (
        <CenterTextCell
          value={row.deletedAt}
          mobileLabel={t("filesList.columns.deletedAt", "삭제 일시")}
        />
      ),
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
        <WorkOrderCell
          value={row.kind === "workorder" ? "-" : row.workorderTitle}
          mobileLabel={t("filesList.columns.workorder", "작업지시서")}
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
      render: (row) => (
        <TypeBadgeCell
          value={row.typeLabel}
          mobileLabel={t("filesList.columns.type", "유형")}
        />
      ),
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
      render: (row) => (
        <CenterTextCell
          value={row.sizeLabel}
          mobileLabel={t("filesList.columns.size", "크기")}
          isStrong
        />
      ),
    },
  ];
}
