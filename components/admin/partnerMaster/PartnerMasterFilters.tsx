"use client";

import { type PartnerFilterChip, type PartnerStatusFilter } from "@/lib/admin/partnerMaster";
import { useI18n } from "@/lib/i18n";

type PartnerMasterFilterOption = {
  value: PartnerFilterChip;
  label: string;
};

type PartnerMasterFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  filterOptions: PartnerMasterFilterOption[];
  selectedTypes: PartnerFilterChip[];
  onToggleType: (value: PartnerFilterChip) => void;
  selectedStatus: PartnerStatusFilter;
  onStatusChange: (value: PartnerStatusFilter) => void;
  filteredCount: number;
  hasSearch: boolean;
};

export default function PartnerMasterFilters({
  searchTerm,
  onSearchTermChange,
  filterOptions,
  selectedTypes,
  onToggleType,
  selectedStatus,
  onStatusChange,
  filteredCount,
  hasSearch,
}: PartnerMasterFiltersProps) {
  const { i18n } = useI18n();
  const filterText = i18n.admin.partnerMaster.filters;
  const statusOptions = [
    { value: "all" as const, label: filterText.statusOptions.all },
    { value: "active" as const, label: filterText.statusOptions.active },
    { value: "inactive" as const, label: filterText.statusOptions.inactive },
  ];

  return (
    <div className="mt-5 space-y-4 rounded-[28px] border border-[var(--admin-theme-border)] bg-[var(--admin-theme-soft)] p-4 transition-colors">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{filterText.searchLabel}</span>
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder={filterText.searchPlaceholder}
            className="h-10 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none transition focus:border-[var(--admin-theme-border)] focus:ring-4 focus:ring-[var(--admin-theme-ring)]"
          />
        </label>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{filterText.typeLabel}</p>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((item) => {
              const isSelected = selectedTypes.includes(item.value);
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onToggleType(item.value)}
                  className={[
                    "inline-flex h-9 items-center rounded-full px-3 text-sm font-medium transition",
                    isSelected ? "bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)] shadow-sm" : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-100",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{filterText.statusLabel}</p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onStatusChange(item.value)}
                className={[
                  "inline-flex h-9 items-center rounded-full px-3 text-sm font-medium transition",
                  selectedStatus === item.value ? "bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)] shadow-sm" : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-100",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-stone-600">
        {filterText.currentListPrefix} <span className="font-semibold text-stone-900">{filteredCount}</span>
        {filterText.currentListSuffix}
        {hasSearch ? filterText.searchResultSuffix : ""}
      </p>
    </div>
  );
}
