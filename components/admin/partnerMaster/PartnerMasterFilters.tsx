"use client";

import AdminFilterBar from "@/components/admin/common/AdminFilterBar";
import {
  buildPartnerStatusFilterOptions,
  PartnerMasterSearchField,
  PartnerMasterSelectField,
  type PartnerMasterFilterOption,
} from "@/components/admin/partnerMaster/PartnerMasterFilterControls";
import { type PartnerFilterChip, type PartnerStatusFilter } from "@/lib/admin/partner";
import { useI18n } from "@/lib/i18n";

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
  const statusOptions = buildPartnerStatusFilterOptions(filterText);

  return (
    <AdminFilterBar
      layoutClassName="grid w-full min-w-0 gap-3 min-[720px]:grid-cols-[minmax(0,1fr)_minmax(140px,180px)_minmax(140px,180px)] min-[720px]:items-end"
    >
      <PartnerMasterSearchField
        label={filterText.searchLabel}
        placeholder={filterText.searchPlaceholder}
        value={searchTerm}
        onChange={onSearchTermChange}
      />

      <div className="grid min-w-0 grid-cols-2 gap-3 min-[720px]:contents">
        <PartnerMasterSelectField
          label={filterText.typeLabel}
          value={selectedType}
          options={filterOptions}
          onChange={onTypeChange}
        />

        <PartnerMasterSelectField
          label={filterText.statusLabel}
          value={selectedStatus}
          options={statusOptions}
          onChange={onStatusChange}
        />
      </div>
    </AdminFilterBar>
  );
}
