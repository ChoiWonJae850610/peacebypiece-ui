import type { ReactNode } from "react";
import type { AdminTableColumn } from "@/lib/admin/common/types";
import { adminKo } from "@/lib/i18n/ko/admin";
import { joinAdminClassNames } from "@/components/admin/common/adminComponentVariants";

type AdminTableProps<TItem> = {
  items: readonly TItem[];
  columns: AdminTableColumn<TItem>[];
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
  onRowClick?: (item: TItem) => void;
};

export default function AdminTable<TItem>({
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
  onRowClick,
}: AdminTableProps<TItem>) {
  const gridStyle = gridTemplateColumns ? { gridTemplateColumns } : undefined;
  const baseRowClassName = rowBaseClassName ?? "grid w-full gap-2 px-3 py-3 text-left text-[11px] md:gap-3 md:px-4 md:py-2 md:items-center";
  const tableHeaderClassName = headerClassName ?? "hidden gap-3 bg-[var(--pbp-surface-muted)] px-4 py-2 text-[10px] font-semibold text-[var(--pbp-text-muted)] xl:grid";

  return (
    <div className={joinAdminClassNames("flex min-h-0 flex-col overflow-visible rounded-[22px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] xl:flex-1 xl:overflow-hidden", className)}>
      <div className={tableHeaderClassName} style={gridStyle}>
        {columns.map((column) => (
          <span key={column.key} className={column.headerClassName}>{column.label}</span>
        ))}
      </div>
      <div className="min-h-0 divide-y divide-[var(--pbp-border)] overflow-x-auto overflow-y-visible overscroll-contain xl:flex-1 xl:overflow-auto">
        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center bg-[var(--pbp-surface)] px-4 py-10 text-center text-sm text-[var(--pbp-text-muted)]">{loadingLabel}</div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center bg-[var(--pbp-surface)] px-4 py-10 text-center text-sm text-[var(--pbp-text-muted)]">
            <div className="max-w-md">
              <p className="font-semibold text-[var(--pbp-text-muted)]">{emptyLabel}</p>
              {emptyDescription ? (
                <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">{emptyDescription}</p>
              ) : null}
              {emptyAction ? <div className="mt-3">{emptyAction}</div> : null}
            </div>
          </div>
        ) : (
          items.map((item) => {
            const mergedRowClassName = joinAdminClassNames(baseRowClassName, rowClassName?.(item));
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
                  style={gridStyle}
                >
                  {cells}
                </div>
              );
            }

            return (
              <div key={getRowKey(item)} className={mergedRowClassName} style={gridStyle}>
                {cells}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
