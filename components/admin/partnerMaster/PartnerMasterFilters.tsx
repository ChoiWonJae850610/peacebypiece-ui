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
    <AdminFilterBar className="mt-3 block shrink-0 border-[var(--admin-theme-border)] bg-[var(--admin-theme-soft)] px-3 py-3 transition-colors md:px-4">
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[260px_minmax(360px,1fr)_minmax(260px,0.9fr)_180px] xl:items-end xl:gap-8">
        <label className="min-w-0 space-y-2 xl:justify-self-start">
          <span className="text-[13px] font-semibold text-[var(--pbp-text-muted)]">{filterText.searchLabel}</span>
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder={filterText.searchPlaceholder}
            className="h-11 w-full rounded-2xl border border-[var(--pbp-field-search-border)] bg-[var(--pbp-field-search-surface)] px-4 text-sm outline-none transition focus:border-[var(--admin-theme-border)] focus:ring-4 focus:ring-[var(--admin-theme-ring)]"
          />
        </label>

        <div className="min-w-0 space-y-2 xl:w-full xl:max-w-[460px] xl:justify-self-center">
          <p className="text-[13px] font-semibold text-[var(--pbp-text-muted)]">{filterText.typeLabel}</p>
          <div className="flex flex-wrap gap-2 xl:justify-start">
            {filterOptions.map((item) => {
              const isSelected = selectedTypes.includes(item.value);
              return (
                <AdminButton
                  key={item.value}
                  type="button"
                  onClick={() => onToggleType(item.value)}
                  variant={isSelected ? "primary" : "secondary"}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {item.label}
                </AdminButton>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 space-y-2 xl:w-full xl:max-w-[320px] xl:justify-self-center">
          <p className="text-[13px] font-semibold text-[var(--pbp-text-muted)]">{filterText.statusLabel}</p>
          <div className="flex flex-wrap gap-2 xl:justify-start">
            {statusOptions.map((item) => (
              <AdminButton
                key={item.value}
                type="button"
                onClick={() => onStatusChange(item.value)}
                variant={selectedStatus === item.value ? "primary" : "secondary"}
                size="sm"
                className="whitespace-nowrap"
              >
                {item.label}
              </AdminButton>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 items-end lg:col-span-2 xl:col-span-1 xl:justify-self-end">
          <p className="w-full min-w-[150px] rounded-2xl bg-[var(--pbp-surface)] px-3 py-2 text-center text-sm text-[var(--pbp-text-muted)]">
            {filterText.currentListPrefix} <span className="font-semibold text-[var(--pbp-text-primary)]">{filteredCount}</span>
            {filterText.currentListSuffix}
            {hasSearch ? filterText.searchResultSuffix : ""}
          </p>
        </div>
      </div>
    </AdminFilterBar>
  );
}
