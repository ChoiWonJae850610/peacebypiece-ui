"use client";

import { AdminButton } from "@/components/admin/common/AdminButton";
import AdminFilterBar from "@/components/admin/common/AdminFilterBar";
import { type PartnerFilterChip, type PartnerStatusFilter } from "@/lib/admin/partner";
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
    <AdminFilterBar className="mt-3 block shrink-0 space-y-4 border-[var(--admin-theme-border)] bg-[var(--admin-theme-soft)] transition-colors">
      <div className="grid gap-y-4 gap-x-8 xl:grid-cols-[minmax(260px,0.9fr)_minmax(360px,1.4fr)_minmax(220px,0.7fr)] xl:items-start">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{filterText.searchLabel}</span>
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder={filterText.searchPlaceholder}
            className="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none transition focus:border-[var(--admin-theme-border)] focus:ring-4 focus:ring-[var(--admin-theme-ring)]"
          />
        </label>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{filterText.typeLabel}</p>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((item) => {
              const isSelected = selectedTypes.includes(item.value);
              return (
                <AdminButton
                  key={item.value}
                  type="button"
                  onClick={() => onToggleType(item.value)}
                  variant={isSelected ? "primary" : "secondary"}
                  size="sm"
                >
                  {item.label}
                </AdminButton>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{filterText.statusLabel}</p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((item) => (
              <AdminButton
                key={item.value}
                type="button"
                onClick={() => onStatusChange(item.value)}
                variant={selectedStatus === item.value ? "primary" : "secondary"}
                size="sm"
              >
                {item.label}
              </AdminButton>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-stone-600">
        {filterText.currentListPrefix} <span className="font-semibold text-stone-900">{filteredCount}</span>
        {filterText.currentListSuffix}
        {hasSearch ? filterText.searchResultSuffix : ""}
      </p>
    </AdminFilterBar>
  );
}
