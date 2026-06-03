import type { CSSProperties, ReactNode } from "react";
import type { AdminTableColumn, AdminTableSortState } from "@/lib/admin/common/types";
import { AdminTableSortButton } from "@/components/admin/common/AdminTableSortButton";
import { adminKo } from "@/lib/i18n/ko/admin";
import { joinAdminClassNames } from "@/components/admin/common/adminComponentVariants";
import { AdminTableState } from "@/components/admin/common/AdminTableState";
import {
  WAFL_DATA_TABLE_SHELL_CLASS,
  WAFL_DATA_TABLE_HEADER_CLASS,
  WAFL_DATA_TABLE_ROW_CLASS,
  WAFL_DATA_TABLE_DIVIDER_CLASS,
} from "@/components/admin/common/WaflDataTable";

type AdminTableScrollMode = "internal" | "page";

type AdminTableProps<TItem, TSortKey extends string = string> = {
  items: readonly TItem[];
  columns: AdminTableColumn<TItem, TSortKey>[];
  getRowKey: (item: TItem) => string;
  emptyLabel: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
  className?: string;
  gridTemplateColumns?: string;
  rowClassName?: (item: TItem) => string;
  rowBaseClassName?: string;
  headerClassName?: string;
  responsiveGridClassName?: string;
  onRowClick?: (item: TItem) => void;
  sortState?: AdminTableSortState<TSortKey>;
  onSort?: (sortKey: TSortKey) => void;
  bodyClassName?: string;
  scrollMode?: AdminTableScrollMode;
};

export default function AdminTable<TItem, TSortKey extends string = string>({
  items,
  columns,
  getRowKey,
  emptyLabel,
  emptyDescription,
  emptyAction,
  isLoading = false,
  loadingLabel = adminKo.common.loadingList,
  className = "",
  gridTemplateColumns,
  rowClassName,
  rowBaseClassName,
  headerClassName,
  responsiveGridClassName: responsiveGridClassNameOverride,
  onRowClick,
  sortState,
  onSort,
  bodyClassName,
  scrollMode = "internal",
}: AdminTableProps<TItem, TSortKey>) {
  const gridStyle = gridTemplateColumns
    ? ({ "--admin-table-columns": gridTemplateColumns } as CSSProperties)
    : undefined;
  const responsiveGridClassName = responsiveGridClassNameOverride ?? (gridTemplateColumns
    ? "grid-cols-1 2xl:[grid-template-columns:var(--admin-table-columns)]"
    : "grid-cols-1");
  const baseRowClassName = rowBaseClassName ?? WAFL_DATA_TABLE_ROW_CLASS;
  const tableHeaderClassName = headerClassName ?? `${WAFL_DATA_TABLE_HEADER_CLASS} hidden 2xl:grid 2xl:[grid-template-columns:var(--admin-table-columns)]`;

  const bodyScrollClassName =
    scrollMode === "internal"
      ? `${WAFL_DATA_TABLE_DIVIDER_CLASS} min-h-fit touch-pan-y overflow-visible overscroll-auto 2xl:min-h-0 2xl:flex-1 2xl:overflow-auto 2xl:overscroll-contain`
      : `${WAFL_DATA_TABLE_DIVIDER_CLASS} min-h-fit touch-pan-y overflow-visible overscroll-auto`;
  const outerScrollClassName =
    scrollMode === "internal"
      ? "2xl:min-h-0 2xl:flex-1 2xl:overflow-hidden"
      : "2xl:min-h-0 2xl:overflow-visible";

  return (
    <div
      className={joinAdminClassNames(
        WAFL_DATA_TABLE_SHELL_CLASS,
        outerScrollClassName,
        className,
      )}
      style={gridStyle}
    >
      <div className={joinAdminClassNames(tableHeaderClassName, "2xl:[grid-template-columns:var(--admin-table-columns)]")}>
        {columns.map((column) => (
          <span key={column.key} className={column.headerClassName}>
            {column.sortKey && sortState && onSort ? (
              <AdminTableSortButton
                sortKey={column.sortKey}
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
      </div>
      <div className={joinAdminClassNames(bodyScrollClassName, bodyClassName)}>
        {isLoading ? (
          <AdminTableState title={loadingLabel} />
        ) : items.length === 0 ? (
          <AdminTableState title={emptyLabel} description={emptyDescription} action={emptyAction} />
        ) : (
          items.map((item) => {
            const mergedRowClassName = joinAdminClassNames(baseRowClassName, responsiveGridClassName, rowClassName?.(item));
            const cells = columns.map((column) => (
              <div key={column.key} className={joinAdminClassNames("min-w-0", column.className)}>{column.render(item)}</div>
            ));

            if (onRowClick) {
              return (
                <div
                  key={getRowKey(item)}
                  role="button"
                  tabIndex={0}
                  onClick={() => onRowClick(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRowClick(item);
                    }
                  }}
                  className={joinAdminClassNames(mergedRowClassName, "cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--pbp-focus-ring)]")}
                  >
                  {cells}
                </div>
              );
            }

            return (
              <div key={getRowKey(item)} className={mergedRowClassName}>
                {cells}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
