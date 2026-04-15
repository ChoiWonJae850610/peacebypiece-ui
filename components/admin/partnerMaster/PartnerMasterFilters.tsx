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
  activeCount: number;
  inactiveCount: number;
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
  activeCount,
  inactiveCount,
}: PartnerMasterFiltersProps) {
  const { i18n } = useI18n();
  const filterText = i18n.admin.partnerMaster.filters;
  const statusOptions = [
    { value: "all" as const, label: filterText.statusOptions.all },
    { value: "active" as const, label: filterText.statusOptions.active },
    { value: "inactive" as const, label: filterText.statusOptions.inactive },
  ];

  return (
    <>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <label className="space-y-2 md:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{filterText.searchLabel}</span>
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder={filterText.searchPlaceholder}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-stone-500"
          />
        </label>
      </div>

      <div className="mt-5 space-y-4 rounded-3xl border border-stone-200 bg-stone-50 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] lg:items-start">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{filterText.summaryLabel}</p>
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 text-sm text-stone-600">
              <p>{filterText.summaryDescription}</p>
            </div>
          </div>

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
                      "rounded-full px-3 py-1.5 text-sm font-medium transition",
                      isSelected ? "bg-stone-900 text-white" : "bg-white text-stone-700 hover:bg-stone-200",
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
                    "rounded-full px-3 py-1.5 text-sm font-medium transition",
                    selectedStatus === item.value ? "bg-stone-900 text-white" : "bg-white text-stone-700 hover:bg-stone-200",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm text-stone-600 md:flex-row md:items-center md:justify-between">
          <p>
            {filterText.currentListPrefix} <span className="font-semibold text-stone-900">{filteredCount}</span>
            {filterText.currentListSuffix}
            {hasSearch ? filterText.searchResultSuffix : ""}
          </p>
          <p>{filterText.usageSummary.replace("{active}", String(activeCount)).replace("{inactive}", String(inactiveCount))}</p>
        </div>
      </div>
    </>
  );
}
