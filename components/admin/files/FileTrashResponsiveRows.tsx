"use client";

import { useRef } from "react";
import type {
  TrashSortKey,
  TrashSortState,
  UnifiedTrashRow,
} from "@/components/admin/files/fileTrashSectionRows";
import { EmptyTrashRows, FileTrashCompactListRows } from "@/components/admin/files/trash/FileTrashCompactListRows";
import { FileTrashWideTableRows } from "@/components/admin/files/trash/FileTrashWideTableRows";
import { TRASH_TABLE_MIN_WIDTH } from "@/components/admin/files/trash/fileTrashResponsivePresentation";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { useElementSize } from "@/lib/responsive/useElementSize";

type AdminT = ReturnType<typeof useAdminTranslation>;

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
      {rows.length === 0 ? (
        <EmptyTrashRows
          emptyLabel={emptyLabel}
          emptyDescription={emptyDescription}
        />
      ) : isWideTable ? (
        <FileTrashWideTableRows
          rows={rows}
          t={t}
          sortState={sortState}
          onSort={onSort}
          onRowClick={onRowClick}
          onToggleItem={onToggleItem}
          onToggleWorkOrder={onToggleWorkOrder}
          previewWorkOrderId={previewWorkOrderId}
        />
      ) : (
        <FileTrashCompactListRows
          rows={rows}
          t={t}
          onRowClick={onRowClick}
          onToggleItem={onToggleItem}
          onToggleWorkOrder={onToggleWorkOrder}
          previewWorkOrderId={previewWorkOrderId}
        />
      )}
    </div>
  );
}
