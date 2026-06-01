import type { ReactNode } from "react";
import type { AdminTableSortState } from "@/lib/admin/common/types";
import {
  ADMIN_RESPONSIVE_TABLE_HEADER_BUTTON_CLASS,
  ADMIN_RESPONSIVE_TABLE_SUBTLE_TEXT_CLASS,
} from "@/components/admin/common/responsiveTable/adminResponsiveTableStyles";

type AdminTableSortButtonProps<TKey extends string> = {
  sortKey: TKey;
  label: ReactNode;
  activeSort: AdminTableSortState<TKey>;
  onSort: (sortKey: TKey) => void;
  align?: "left" | "center";
};

function getSortMarker<TKey extends string>(
  activeSort: AdminTableSortState<TKey>,
  sortKey: TKey,
) {
  if (activeSort.key !== sortKey) return "↕";
  return activeSort.direction === "asc" ? "↑" : "↓";
}

export function AdminTableSortButton<TKey extends string>({
  sortKey,
  label,
  activeSort,
  onSort,
  align = "center",
}: AdminTableSortButtonProps<TKey>) {
  const isActive = activeSort.key === sortKey;
  const alignClassName = align === "center" ? "justify-center text-center" : "justify-start text-left";

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`${ADMIN_RESPONSIVE_TABLE_HEADER_BUTTON_CLASS} ${alignClassName}`}
      aria-sort={isActive ? (activeSort.direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className="truncate">{label}</span>
      <span
        className={isActive ? "text-[var(--admin-theme-primary)]" : ADMIN_RESPONSIVE_TABLE_SUBTLE_TEXT_CLASS}
        aria-hidden="true"
      >
        {getSortMarker(activeSort, sortKey)}
      </span>
    </button>
  );
}
