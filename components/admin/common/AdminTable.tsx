import type { AdminTableColumn } from "@/lib/admin/common/types";

type AdminTableProps<TItem> = {
  items: TItem[];
  columns: AdminTableColumn<TItem>[];
  getRowKey: (item: TItem) => string;
  emptyLabel: string;
  isLoading?: boolean;
  loadingLabel?: string;
  className?: string;
  gridTemplateColumns?: string;
};

export default function AdminTable<TItem>({
  items,
  columns,
  getRowKey,
  emptyLabel,
  isLoading = false,
  loadingLabel = "목록을 불러오는 중입니다.",
  className = "",
  gridTemplateColumns,
}: AdminTableProps<TItem>) {
  const gridStyle = gridTemplateColumns ? { gridTemplateColumns } : undefined;

  return (
    <div className={["flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-stone-200", className].filter(Boolean).join(" ")}>
      <div className="hidden gap-3 bg-stone-50 px-4 py-1.5 text-[10px] font-semibold text-stone-500 md:grid" style={gridStyle}>
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
          items.map((item) => (
            <div key={getRowKey(item)} className="grid gap-3 px-4 py-1.5 text-left text-[11px] md:items-center" style={gridStyle}>
              {columns.map((column) => (
                <div key={column.key} className={column.className}>{column.render(item)}</div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
