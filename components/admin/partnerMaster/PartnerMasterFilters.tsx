"use client";

import AdminFilterBar from "@/components/admin/common/AdminFilterBar";
import { AppSelect } from "@/components/common/ui";
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
  selectedType: PartnerFilterChip;
  onTypeChange: (value: PartnerFilterChip) => void;
  selectedStatus: PartnerStatusFilter;
  onStatusChange: (value: PartnerStatusFilter) => void;
};

export default function PartnerMasterFilters({
  searchTerm,
  onSearchTermChange,
  filterOptions,
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
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
      <div className="grid w-full min-w-0 gap-3 min-[720px]:grid-cols-[minmax(0,1fr)_minmax(140px,180px)_minmax(140px,180px)] min-[720px]:items-end">
        <label className="min-w-0 space-y-2 min-[720px]:col-span-1">
          <span className="text-[12px] font-semibold text-[var(--pbp-text-muted)]">{filterText.searchLabel}</span>
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder={filterText.searchPlaceholder}
            className="h-10 w-full min-w-0 rounded-2xl border border-[var(--pbp-field-search-border)] bg-[var(--pbp-field-search-surface)] px-4 text-sm outline-none transition focus:border-[var(--pbp-focus-ring)] focus:ring-4 focus:ring-[var(--pbp-focus-ring)]"
          />
        </label>

        <div className="grid min-w-0 grid-cols-2 gap-3 min-[720px]:contents">
          <label className="min-w-0 space-y-2">
            <span className="text-[12px] font-semibold text-[var(--pbp-text-muted)]">{filterText.typeLabel}</span>
            <AppSelect
              value={selectedType}
              onValueChange={(value) => onTypeChange(value as PartnerFilterChip)}
              options={filterOptions.map((item) => ({ value: item.value, label: item.label }))}
              size="sm"
              width="full"
              ariaLabel={filterText.typeLabel}
              triggerClassName="h-10 rounded-2xl"
            />
          </label>

          <label className="min-w-0 space-y-2">
            <span className="text-[12px] font-semibold text-[var(--pbp-text-muted)]">{filterText.statusLabel}</span>
            <AppSelect
              value={selectedStatus}
              onValueChange={(value) => onStatusChange(value as PartnerStatusFilter)}
              options={statusOptions.map((item) => ({ value: item.value, label: item.label }))}
              size="sm"
              width="full"
              ariaLabel={filterText.statusLabel}
              triggerClassName="h-10 rounded-2xl"
            />
          </label>
        </div>
      </div>
    </AdminFilterBar>
  );
}
