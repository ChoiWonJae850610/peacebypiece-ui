import type { PartnerSortKey, PartnerSortState } from "@/lib/admin/partner";
import {
  ADMIN_RESPONSIVE_TABLE_HEADER_BUTTON_CLASS,
  ADMIN_RESPONSIVE_TABLE_SUBTLE_TEXT_CLASS,
} from "@/components/admin/common/responsiveTable/adminResponsiveTableStyles";

type PartnerMasterSortButtonProps = {
  sortKey: PartnerSortKey;
  label: string;
  activeSort: PartnerSortState;
  onSort: (sortKey: PartnerSortKey) => void;
  align?: "left" | "center";
};

type PartnerMasterCompactSortButtonProps = Omit<PartnerMasterSortButtonProps, "align">;

function getSortMarker(activeSort: PartnerSortState, sortKey: PartnerSortKey) {
  if (activeSort.key !== sortKey) return "↕";
  return activeSort.direction === "asc" ? "↑" : "↓";
}

export function PartnerMasterTableSortButton({
  sortKey,
  label,
  activeSort,
  onSort,
  align = "center",
}: PartnerMasterSortButtonProps) {
  const isActive = activeSort.key === sortKey;
  const marker = getSortMarker(activeSort, sortKey);
  const alignClassName = align === "center" ? "justify-center text-center" : "justify-start text-left";

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`${ADMIN_RESPONSIVE_TABLE_HEADER_BUTTON_CLASS} ${alignClassName}`}
      aria-sort={isActive ? (activeSort.direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className="truncate">{label}</span>
      <span className={isActive ? "text-[var(--admin-theme-primary)]" : ADMIN_RESPONSIVE_TABLE_SUBTLE_TEXT_CLASS} aria-hidden="true">
        {marker}
      </span>
    </button>
  );
}

export function PartnerMasterCompactSortButton({
  sortKey,
  label,
  activeSort,
  onSort,
}: PartnerMasterCompactSortButtonProps) {
  const isActive = activeSort.key === sortKey;
  const marker = getSortMarker(activeSort, sortKey);

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={[
        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
        isActive
          ? "border-[var(--admin-theme-primary)] bg-[var(--admin-theme-soft)] text-[var(--admin-theme-primary)]"
          : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-muted)] hover:border-[var(--pbp-border-strong)]",
      ].join(" ")}
      aria-pressed={isActive}
    >
      <span>{label}</span>
      <span aria-hidden="true">{marker}</span>
    </button>
  );
}
