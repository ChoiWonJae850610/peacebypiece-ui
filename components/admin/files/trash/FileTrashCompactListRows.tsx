"use client";

import { WaflEmptyCard } from "@/components/common/ui";
import { WaflSurface } from "@/components/common/ui/WaflSurface";
import {
  ADMIN_RESPONSIVE_COMPACT_CARD_CLASS,
  ADMIN_RESPONSIVE_COMPACT_CARD_CLICKABLE_CLASS,
  ADMIN_RESPONSIVE_COMPACT_META_LABEL_CLASS,
  ADMIN_RESPONSIVE_COMPACT_META_VALUE_CLASS,
} from "@/components/admin/common/responsiveTable/adminResponsiveTableStyles";
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
      <p className={ADMIN_RESPONSIVE_COMPACT_META_LABEL_CLASS}>
        {label}
      </p>
      <p className={ADMIN_RESPONSIVE_COMPACT_META_VALUE_CLASS} title={value}>
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
    <WaflSurface
      as="article"
      component="storage-trash-compact-row"
      shape="control"
      role="button"
      tabIndex={0}
      onClick={() => onRowClick(row)}
      onKeyDown={(event) => handleTrashRowKeyDown(event, row, onRowClick)}
      className={`${ADMIN_RESPONSIVE_COMPACT_CARD_CLASS} ${ADMIN_RESPONSIVE_COMPACT_CARD_CLICKABLE_CLASS} ${getFileTrashRowToneClass(row, previewWorkOrderId)}`}
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
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
              <p className={ADMIN_RESPONSIVE_COMPACT_META_LABEL_CLASS}>
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
    </WaflSurface>
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
    <WaflEmptyCard
      component="storage-trash-empty"
      shape="control"
      density="spacious"
      className="flex min-h-40 flex-col items-center justify-center px-4 py-6 md:min-h-[220px] md:py-8"
    >
      <p className="text-sm font-bold text-[var(--pbp-text-primary)]">{emptyLabel}</p>
      <p className="mt-2 max-w-md text-center text-xs font-medium leading-5 text-[var(--pbp-text-muted)]">{emptyDescription}</p>
    </WaflEmptyCard>
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
    <div className="flex flex-col gap-2" data-wafl-device-density="storage-trash-compact-list">
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
