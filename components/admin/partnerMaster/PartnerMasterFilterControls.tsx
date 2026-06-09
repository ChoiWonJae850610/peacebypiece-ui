"use client";

import { AppSelect } from "@/components/common/ui";
import {
  WAFL_FILTER_FIELD_CLASS,
  WAFL_FILTER_INPUT_CLASS,
  WAFL_FILTER_LABEL_CLASS,
  WAFL_FILTER_SELECT_TRIGGER_CLASS,
} from "@/components/admin/common/WaflFilterBar";
import { type PartnerFilterChip, type PartnerStatusFilter } from "@/lib/admin/partner";

type PartnerMasterFilterOption = {
  value: PartnerFilterChip;
  label: string;
};

type PartnerMasterStatusOption = {
  value: PartnerStatusFilter;
  label: string;
};

type PartnerMasterSearchFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

type PartnerMasterSelectFieldProps<TValue extends string> = {
  label: string;
  value: TValue;
  options: readonly { value: TValue; label: string }[];
  onChange: (value: TValue) => void;
};

export function PartnerMasterSearchField({
  label,
  placeholder,
  value,
  onChange,
}: PartnerMasterSearchFieldProps) {
  return (
    <label data-wafl-component="filter-field" className={`${WAFL_FILTER_FIELD_CLASS} min-[720px]:col-span-1`}>
      <span className={WAFL_FILTER_LABEL_CLASS}>{label}</span>
      <input
        data-wafl-component="search-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={WAFL_FILTER_INPUT_CLASS}
      />
    </label>
  );
}

export function PartnerMasterSelectField<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: PartnerMasterSelectFieldProps<TValue>) {
  return (
    <label data-wafl-component="filter-field" className={WAFL_FILTER_FIELD_CLASS}>
      <span className={WAFL_FILTER_LABEL_CLASS}>{label}</span>
      <AppSelect
        value={value}
        onValueChange={(nextValue) => onChange(nextValue as TValue)}
        options={options.map((item) => ({ value: item.value, label: item.label }))}
        size="sm"
        width="full"
        ariaLabel={label}
        triggerClassName={WAFL_FILTER_SELECT_TRIGGER_CLASS}
      />
    </label>
  );
}

export function buildPartnerStatusFilterOptions(filterText: {
  statusOptions: {
    all: string;
    active: string;
    inactive: string;
  };
}): PartnerMasterStatusOption[] {
  return [
    { value: "all", label: filterText.statusOptions.all },
    { value: "active", label: filterText.statusOptions.active },
    { value: "inactive", label: filterText.statusOptions.inactive },
  ];
}

export type { PartnerMasterFilterOption };
