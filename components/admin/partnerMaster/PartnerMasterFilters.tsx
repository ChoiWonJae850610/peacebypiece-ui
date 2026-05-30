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
    <AdminFilterBar className="mt-3 shrink-0 border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-3 py-3 transition-colors md:px-4">
      <div className="flex flex-col gap-3 min-[1120px]:flex-row min-[1120px]:items-end min-[1120px]:justify-between">
        <label className="min-w-0 space-y-2 min-[1120px]:w-[260px] min-[1280px]:w-[300px]">
          <span className="text-[12px] font-semibold text-[var(--pbp-text-muted)]">{filterText.searchLabel}</span>
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder={filterText.searchPlaceholder}
            className="h-10 w-full rounded-2xl border border-[var(--pbp-field-search-border)] bg-[var(--pbp-field-search-surface)] px-4 text-sm outline-none transition focus:border-[var(--pbp-focus-ring)] focus:ring-4 focus:ring-[var(--pbp-focus-ring)]"
          />
        </label>

        <div className="grid min-w-0 gap-3 min-[720px]:grid-cols-2 min-[1120px]:flex min-[1120px]:flex-1 min-[1120px]:items-end min-[1120px]:gap-4">
          <div className="min-w-0 space-y-2 min-[1120px]:flex-1">
            <p className="text-[12px] font-semibold text-[var(--pbp-text-muted)]">{filterText.typeLabel}</p>
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
                    className="h-9 whitespace-nowrap px-3 text-xs"
                  >
                    {item.label}
                  </AdminButton>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 space-y-2 min-[1120px]:w-[220px]">
            <p className="text-[12px] font-semibold text-[var(--pbp-text-muted)]">{filterText.statusLabel}</p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((item) => (
                <AdminButton
                  key={item.value}
                  type="button"
                  onClick={() => onStatusChange(item.value)}
                  variant={selectedStatus === item.value ? "primary" : "secondary"}
                  size="sm"
                  className="h-9 whitespace-nowrap px-3 text-xs"
                >
                  {item.label}
                </AdminButton>
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 justify-end min-[1120px]:w-[150px]">
          <p className="min-w-[132px] rounded-2xl bg-[var(--pbp-surface)] px-3 py-2 text-center text-sm text-[var(--pbp-text-muted)]">
            {filterText.currentListPrefix} <span className="font-semibold text-[var(--pbp-text-primary)]">{filteredCount}</span>
            {filterText.currentListSuffix}
            {hasSearch ? filterText.searchResultSuffix : ""}
          </p>
        </div>
      </div>
    </AdminFilterBar>
  );
}
