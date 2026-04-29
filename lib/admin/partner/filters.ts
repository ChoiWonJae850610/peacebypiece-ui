import { DEFAULT_OUTSOURCING_PROCESS_META, PARTNER_TYPE_META } from "@/lib/admin/partner/constants";
import type {
  OutsourcingProcessDefinition,
  OutsourcingProcessMeta,
  PartnerFilterChip,
  PartnerFilterOption,
  PartnerListFilterState,
} from "@/lib/admin/partner/types";
import { formatPartnerPhone } from "@/lib/admin/partner/draft";
import { PARTNER_TYPE_VALUES, type Partner, type PartnerType } from "@/types/partner";

export function buildOutsourcingProcessMeta(definitions: OutsourcingProcessDefinition[]) {
  return definitions.reduce<Record<string, OutsourcingProcessMeta>>((acc, definition) => {
    acc[definition.type] = { label: definition.label, tone: definition.tone };
    return acc;
  }, {});
}

export function buildPartnerFilterOptions(_definitions: OutsourcingProcessDefinition[]): PartnerFilterOption[] {
  return [
    { value: "all", label: "전체" },
    { value: "factory", label: "공장" },
    { value: "material_vendor", label: "원단" },
    { value: "subsidiary_vendor", label: "부자재" },
    { value: "outsourcing_vendor", label: "외주" },
  ];
}

function matchesPartnerSearch(
  partner: Partner,
  searchTerm: string,
  processMeta: Record<string, OutsourcingProcessMeta>,
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
    ...partner.partnerTypes.map((type) => PARTNER_TYPE_META[type].label),
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
    const matchesSearch = matchesPartnerSearch(partner, filters.searchTerm, processMeta);
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
