"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";

import {
  WaflDataTableBody,
  WaflDataTableHeader,
  WaflDataTableRow,
  WaflDataTableShell,
  WAFL_DATA_TABLE_CLICKABLE_ROW_CLASS,
  WAFL_DATA_TABLE_COMPACT_CARD_CLASS,
  WAFL_DATA_TABLE_COMPACT_CARD_CLICKABLE_CLASS,
  WAFL_DATA_TABLE_COMPACT_META_BOX_CLASS,
  WAFL_DATA_TABLE_COMPACT_META_LABEL_CLASS,
  WAFL_DATA_TABLE_COMPACT_META_VALUE_CLASS,
  WAFL_DATA_TABLE_MUTED_TEXT_CLASS,
  WAFL_DATA_TABLE_CELL_CLASS,
  WAFL_DATA_TABLE_HEADER_CELL_CLASS,
} from "@/components/admin/common/WaflDataTable";
import type { AdminTableColumn, AdminTableSortState } from "@/lib/admin/common/types";
import { AdminTableSortButton } from "@/components/admin/common/AdminTableSortButton";
import { AdminTableState } from "@/components/admin/common/AdminTableState";
import { AdminButton } from "@/components/admin/common/AdminButton";
import { WaflSurface } from "@/components/common/ui/WaflSurface";
import { useElementSize } from "@/lib/responsive/useElementSize";
import type { MemberDirectoryRow, MemberDirectorySortKey } from "@/components/admin/members/AdminMemberDirectoryTableColumns";

type AdminMemberDirectoryResponsiveRowsProps = {
  items: readonly MemberDirectoryRow[];
  columns: AdminTableColumn<MemberDirectoryRow, MemberDirectorySortKey>[];
  isLoading: boolean;
  loadingLabel: string;
  emptyLabel: string;
  emptyDescription: string;
  onOpenMemberDetail: (row: MemberDirectoryRow) => void;
  sortState: AdminTableSortState<MemberDirectorySortKey>;
  onSort: (sortKey: MemberDirectorySortKey) => void;
  expandListLabel: string;
  collapseListLabel: string;
};

const MEMBER_DIRECTORY_TABLE_MIN_WIDTH = 1080;
const MEMBER_DIRECTORY_COMPACT_PREVIEW_LIMIT = 6;
const MEMBER_DIRECTORY_TABLE_GRID =
  "minmax(120px,1fr) minmax(160px,1.2fr) 110px 110px 96px 110px 110px 120px 140px";

function getColumn(
  columns: AdminTableColumn<MemberDirectoryRow, MemberDirectorySortKey>[],
  key: string,
): AdminTableColumn<MemberDirectoryRow, MemberDirectorySortKey> | undefined {
  return columns.find((column) => column.key === key);
}

function MemberDirectoryWideTableRows({
  items,
  columns,
  isLoading,
  loadingLabel,
  emptyLabel,
  emptyDescription,
  onOpenMemberDetail,
  sortState,
  onSort,
}: AdminMemberDirectoryResponsiveRowsProps) {
  return (
    <WaflDataTableShell className="mb-1">
      <WaflDataTableHeader gridTemplateColumns={MEMBER_DIRECTORY_TABLE_GRID}>
        {columns.map((column) => (
          <span key={column.key} className={`${WAFL_DATA_TABLE_HEADER_CELL_CLASS} ${column.headerClassName ?? ""}`}>
            {column.sortKey ? (
              <AdminTableSortButton
                sortKey={column.sortKey as MemberDirectorySortKey}
                label={column.label}
                activeSort={sortState}
                onSort={onSort}
                align={column.sortAlign}
              />
            ) : (
              column.label
            )}
          </span>
        ))}
      </WaflDataTableHeader>

      {isLoading ? (
        <AdminTableState title={loadingLabel} kind="loading" minHeightClassName="min-h-40 md:min-h-[220px]" />
      ) : items.length === 0 ? (
        <AdminTableState title={emptyLabel} description={emptyDescription} minHeightClassName="min-h-40 md:min-h-[220px]" />
      ) : (
        <WaflDataTableBody>
          {items.map((row) => (
            <WaflDataTableRow
              key={row.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenMemberDetail(row)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpenMemberDetail(row);
                }
              }}
              gridTemplateColumns={MEMBER_DIRECTORY_TABLE_GRID}
              className={WAFL_DATA_TABLE_CLICKABLE_ROW_CLASS}
            >
              {columns.map((column) => (
                <div key={column.key} className={`${WAFL_DATA_TABLE_CELL_CLASS} ${column.className ?? ""}`}>
                  {column.render(row)}
                </div>
              ))}
            </WaflDataTableRow>
          ))}
        </WaflDataTableBody>
      )}
    </WaflDataTableShell>
  );
}

function MemberMetaItem({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className={WAFL_DATA_TABLE_COMPACT_META_BOX_CLASS}>
      <p className={WAFL_DATA_TABLE_COMPACT_META_LABEL_CLASS}>{label}</p>
      <div className={WAFL_DATA_TABLE_COMPACT_META_VALUE_CLASS}>{value}</div>
    </div>
  );
}

function MemberDirectoryCompactListRows({
  items,
  columns,
  isLoading,
  loadingLabel,
  emptyLabel,
  emptyDescription,
  onOpenMemberDetail,
  expandListLabel,
  collapseListLabel,
}: AdminMemberDirectoryResponsiveRowsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasOverflow = items.length > MEMBER_DIRECTORY_COMPACT_PREVIEW_LIMIT;
  const visibleItems = useMemo(
    () => isExpanded ? items : items.slice(0, MEMBER_DIRECTORY_COMPACT_PREVIEW_LIMIT),
    [items, isExpanded],
  );
  const nameColumn = getColumn(columns, "name");
  const emailColumn = getColumn(columns, "email");
  const phoneColumn = getColumn(columns, "phone");
  const roleColumn = getColumn(columns, "role");
  const statusColumn = getColumn(columns, "status");
  const requestedAtColumn = getColumn(columns, "requestedAt");
  const approvedAtColumn = getColumn(columns, "approvedAt");
  const lastActiveAtColumn = getColumn(columns, "lastActiveAt");
  const actionsColumn = getColumn(columns, "actions");

  return (
    <WaflSurface as="section" component="member-directory-compact-list" shape="control" className="mb-1 flex min-h-fit touch-pan-y flex-col overflow-visible p-2.5 sm:p-3.5 md:p-4" data-wafl-device-density="member-directory-compact">
      {isLoading ? (
        <AdminTableState title={loadingLabel} kind="loading" minHeightClassName="min-h-40 md:min-h-[220px]" />
      ) : items.length === 0 ? (
        <AdminTableState title={emptyLabel} description={emptyDescription} minHeightClassName="min-h-40 md:min-h-[220px]" />
      ) : (
        <div className="grid gap-2.5 sm:gap-3.5">
          {visibleItems.map((row) => (
            <article
              key={row.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenMemberDetail(row)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpenMemberDetail(row);
                }
              }}
              className={`${WAFL_DATA_TABLE_COMPACT_CARD_CLASS} ${WAFL_DATA_TABLE_COMPACT_CARD_CLICKABLE_CLASS}`}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  {nameColumn ? nameColumn.render(row) : <span>{row.name || "-"}</span>}
                  <div className={WAFL_DATA_TABLE_MUTED_TEXT_CLASS}>
                    {emailColumn ? emailColumn.render(row) : row.email || "-"}
                  </div>
                </div>
                <div className="shrink-0">{statusColumn?.render(row)}</div>
              </div>

              <div className="mt-2.5 grid gap-2 sm:mt-3 sm:grid-cols-3">
                {phoneColumn ? <MemberMetaItem label={phoneColumn.label} value={phoneColumn.render(row)} /> : null}
                {roleColumn ? <MemberMetaItem label={roleColumn.label} value={roleColumn.render(row)} /> : null}
                {lastActiveAtColumn ? (
                  <MemberMetaItem label={lastActiveAtColumn.label} value={lastActiveAtColumn.render(row)} />
                ) : null}
                {requestedAtColumn ? (
                  <MemberMetaItem label={requestedAtColumn.label} value={requestedAtColumn.render(row)} />
                ) : null}
                {approvedAtColumn ? (
                  <MemberMetaItem label={approvedAtColumn.label} value={approvedAtColumn.render(row)} />
                ) : null}
              </div>

              {actionsColumn ? (
                <div className="mt-2.5 flex justify-end sm:mt-3" onClick={(event) => event.stopPropagation()}>
                  {actionsColumn.render(row)}
                </div>
              ) : null}
            </article>
          ))}
          {hasOverflow ? (
            <div className="flex justify-center pt-1">
              <AdminButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsExpanded((current) => !current)}
              >
                {isExpanded ? collapseListLabel : expandListLabel}
              </AdminButton>
            </div>
          ) : null}
        </div>
      )}
    </WaflSurface>
  );
}

export default function AdminMemberDirectoryResponsiveRows(props: AdminMemberDirectoryResponsiveRowsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { width } = useElementSize(containerRef);
  const shouldUseWideTable = width >= MEMBER_DIRECTORY_TABLE_MIN_WIDTH;

  return (
    <div ref={containerRef} className="w-full min-w-0 pb-1" data-wafl-responsive-measure="member-directory">
      {shouldUseWideTable ? (
        <MemberDirectoryWideTableRows key="member-directory-wide" {...props} />
      ) : (
        <MemberDirectoryCompactListRows key="member-directory-compact" {...props} />
      )}
    </div>
  );
}
