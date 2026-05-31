"use client";

import { AppSelect } from "@/components/common/ui";
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

const PARTNER_FILTER_LABEL_CLASS = "text-[12px] font-semibold text-[var(--pbp-text-muted)]";
const PARTNER_FILTER_FIELD_CLASS = "min-w-0 space-y-2";

export function PartnerMasterSearchField({
  label,
  placeholder,
  value,
  onChange,
}: PartnerMasterSearchFieldProps) {
  return (
    <label className={`${PARTNER_FILTER_FIELD_CLASS} min-[720px]:col-span-1`}>
      <span className={PARTNER_FILTER_LABEL_CLASS}>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full min-w-0 rounded-2xl border border-[var(--pbp-field-search-border)] bg-[var(--pbp-field-search-surface)] px-4 text-sm outline-none transition focus:border-[var(--pbp-focus-ring)] focus:ring-4 focus:ring-[var(--pbp-focus-ring)]"
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
    <label className={PARTNER_FILTER_FIELD_CLASS}>
      <span className={PARTNER_FILTER_LABEL_CLASS}>{label}</span>
      <AppSelect
        value={value}
        onValueChange={(nextValue) => onChange(nextValue as TValue)}
        options={options.map((item) => ({ value: item.value, label: item.label }))}
        size="sm"
        width="full"
        ariaLabel={label}
        triggerClassName="h-10 rounded-2xl"
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
