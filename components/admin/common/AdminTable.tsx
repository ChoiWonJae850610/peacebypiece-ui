import type { AdminTableColumn } from "@/lib/admin/common/types";
import { adminKo } from "@/lib/i18n/ko/admin";

type AdminTableProps<TItem> = {
  items: TItem[];
  columns: AdminTableColumn<TItem>[];
  getRowKey: (item: TItem) => string;
  emptyLabel: string;
  isLoading?: boolean;
  loadingLabel?: string;
  className?: string;
  gridTemplateColumns?: string;
  rowClassName?: (item: TItem) => string;
  onRowClick?: (item: TItem) => void;
};

export default function AdminTable<TItem>({
  items,
  columns,
  getRowKey,
  emptyLabel,
  isLoading = false,
  loadingLabel = adminKo.common.loadingList,
  className = "",
  gridTemplateColumns,
  rowClassName,
  onRowClick,
}: AdminTableProps<TItem>) {
  const gridStyle = gridTemplateColumns ? { gridTemplateColumns } : undefined;
  const baseRowClassName = "grid w-full gap-3 px-4 py-2 text-left text-[11px] md:items-center";

  return (
    <div className={["flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-stone-200 bg-white", className].filter(Boolean).join(" ")}>
      <div className="hidden gap-3 bg-stone-50 px-4 py-2 text-[10px] font-semibold text-stone-500 md:grid" style={gridStyle}>
        {columns.map((column) => (
          <span key={column.key} className={column.headerClassName}>{column.label}</span>
        ))}
      </div>
      <div className="min-h-0 flex-1 divide-y divide-stone-200 overflow-y-auto">
        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center bg-white px-4 py-10 text-center text-sm text-stone-500">{loadingLabel}</div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center bg-white px-4 py-10 text-center text-sm text-stone-500">{emptyLabel}</div>
        ) : (
          items.map((item) => {
            const mergedRowClassName = [baseRowClassName, rowClassName?.(item)].filter(Boolean).join(" ");
            const cells = columns.map((column) => (
              <div key={column.key} className={column.className}>{column.render(item)}</div>
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
                  className={[mergedRowClassName, "cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-300"].join(" ")}
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
