import { DEFAULT_OUTSOURCING_PROCESS_META, PARTNER_TYPE_META } from "@/lib/admin/partner/constants";
import type {
  OutsourcingProcessDefinition,
  OutsourcingProcessMeta,
  PartnerFilterChip,
  PartnerFilterOption,
  PartnerListFilterState,
  PartnerTypeLabelMap,
} from "@/lib/admin/partner/types";
import { formatPartnerPhone } from "@/lib/admin/partner/draft";
import { PARTNER_TYPE_VALUES, type Partner, type PartnerType } from "@/types/partner";

export function buildOutsourcingProcessMeta(definitions: OutsourcingProcessDefinition[]) {
  return definitions.reduce<Record<string, OutsourcingProcessMeta>>((acc, definition) => {
    acc[definition.type] = { label: definition.label, tone: definition.tone };
    return acc;
  }, {});
}

export function buildPartnerFilterOptions(_definitions: OutsourcingProcessDefinition[], labels: PartnerTypeLabelMap = {}): PartnerFilterOption[] {
  return [
    { value: "all", label: labels.all ?? "전체" },
    { value: "factory", label: labels.factory ?? PARTNER_TYPE_META.factory.shortLabel },
    { value: "material_vendor", label: labels.material_vendor ?? PARTNER_TYPE_META.material_vendor.shortLabel },
    { value: "subsidiary_vendor", label: labels.subsidiary_vendor ?? PARTNER_TYPE_META.subsidiary_vendor.shortLabel },
    { value: "outsourcing_vendor", label: labels.outsourcing_vendor ?? PARTNER_TYPE_META.outsourcing_vendor.shortLabel },
  ];
}

function matchesPartnerSearch(
  partner: Partner,
  searchTerm: string,
  processMeta: Record<string, OutsourcingProcessMeta>,
  labels: PartnerTypeLabelMap = {},
) {
  if (!searchTerm) return true;

  const normalized = searchTerm.trim().toLocaleLowerCase("ko-KR");
  if (!normalized) return true;

  const candidateText = [
    partner.name,
    partner.contactName ?? "",
    partner.phone ?? "",
    formatPartnerPhone(partner.phone),
    partner.email ?? "",
    partner.memo,
    ...partner.partnerTypes.flatMap((type) => [labels[type] ?? PARTNER_TYPE_META[type].label, PARTNER_TYPE_META[type].label]),
    ...(partner.outsourcingProcessTypes ?? []).map((type) => processMeta[type]?.label ?? DEFAULT_OUTSOURCING_PROCESS_META[type]?.label ?? String(type)),
  ]
    .join(" ")
    .toLocaleLowerCase("ko-KR");

  return candidateText.includes(normalized);
}

function isPartnerTypeFilter(value: PartnerFilterChip): value is PartnerType {
  return value !== "all" && (PARTNER_TYPE_VALUES as readonly string[]).includes(value);
}

export function togglePartnerFilterSelection(current: PartnerFilterChip[], nextValue: PartnerFilterChip): PartnerFilterChip[] {
  if (nextValue === "all") {
    return ["all"];
  }

  const baseSelection = current.filter((value) => value !== "all");
  const nextSelection = baseSelection.includes(nextValue)
    ? baseSelection.filter((value) => value !== nextValue)
    : [...baseSelection, nextValue];

  return nextSelection.length > 0 ? nextSelection : ["all"];
}

export function selectFilteredPartners(
  partners: Partner[],
  filters: PartnerListFilterState,
  processMeta: Record<string, OutsourcingProcessMeta>,
  labels: PartnerTypeLabelMap = {},
) {
  return partners.filter((partner) => {
    const matchesType =
      filters.selectedTypes.includes("all") ||
      filters.selectedTypes.some((selectedType) => {
        if (isPartnerTypeFilter(selectedType)) {
          return partner.partnerTypes.includes(selectedType);
        }
        return false;
      });

    const matchesStatus = filters.status === "all" || (filters.status === "active" ? partner.isActive : !partner.isActive);
    const matchesSearch = matchesPartnerSearch(partner, filters.searchTerm, processMeta, labels);
    return matchesType && matchesStatus && matchesSearch;
  });
}

export function buildPartnerSummary(partners: Partner[]) {
  const activeCount = partners.filter((partner) => partner.isActive).length;
  return {
    total: partners.length,
    active: activeCount,
    inactive: partners.length - activeCount,
  };
}
