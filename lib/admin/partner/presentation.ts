import { BASE_PARTNER_TYPE_VALUES, DEFAULT_OUTSOURCING_PROCESS_META, PARTNER_TYPE_META } from "@/lib/admin/partner/constants";
import { buildOutsourcingProcessMeta, buildPartnerFilterOptions, buildPartnerSummary, selectFilteredPartners } from "@/lib/admin/partner/filters";
import { formatPartnerDate, formatPartnerPhone } from "@/lib/admin/partner/draft";
import type { OutsourcingProcessDefinition, PartnerListFilterState, PartnerListItemViewModel, PartnerTypeLabelMap } from "@/lib/admin/partner/types";
import type { Partner } from "@/types/partner";

function buildPartnerListItemViewModel(
  partner: Partner,
  processMeta: Record<string, { label: string; tone: string }>,
  typeLabels: PartnerTypeLabelMap = {},
): PartnerListItemViewModel {
  const baseTypeBadges = partner.partnerTypes
    .filter((type) => type !== "outsourcing_vendor")
    .map((type) => ({
      key: `${partner.id}-${type}`,
      type,
      label: typeLabels[type] ?? PARTNER_TYPE_META[type].shortLabel,
      tone: PARTNER_TYPE_META[type].tone,
    }));

  const outsourcingProcessBadges = (partner.outsourcingProcessTypes ?? []).map((type) => {
    const meta = processMeta[type] ?? DEFAULT_OUTSOURCING_PROCESS_META[type] ?? { label: type, tone: "bg-slate-200 text-slate-700" };
    return {
      key: `${partner.id}-${type}`,
      label: meta.label,
      tone: meta.tone,
    };
  });

  const contactName = partner.contactName?.trim() || "-";
  const phone = formatPartnerPhone(partner.phone) || "-";
  const outsourcingProcessNames = outsourcingProcessBadges.map((badge) => badge.label);
  const outsourcingProcessLabel = outsourcingProcessNames.length > 0 ? outsourcingProcessNames.join(", ") : "";
  const baseTypeNames = baseTypeBadges.map((badge) => badge.label);
  const typeDisplayLabel = [
    baseTypeNames.length > 0 ? baseTypeNames.join(" · ") : "",
    outsourcingProcessNames.length > 0 ? outsourcingProcessNames.join(" · ") : "",
  ]
    .filter(Boolean)
    .join(" / ");

  return {
    id: partner.id,
    name: partner.name,
    isActive: partner.isActive,
    contactName,
    phone,
    email: partner.email?.trim() || "-",
    memo: partner.memo || "",
    updatedAtLabel: formatPartnerDate(partner.updatedAt),
    baseTypeBadges,
    outsourcingProcessBadges,
    outsourcingProcessLabel,
    hasBaseTypes: baseTypeBadges.length > 0,
    hasOutsourcingProcesses: outsourcingProcessBadges.length > 0,
    typeDisplayLabel,
  };
}

export function buildPartnerListViewModel(
  partners: Partner[],
  filters: PartnerListFilterState,
  definitions: OutsourcingProcessDefinition[],
  typeLabels: PartnerTypeLabelMap = {},
) {
  const processMeta = buildOutsourcingProcessMeta(definitions);
  const filterOptions = buildPartnerFilterOptions(definitions, typeLabels);
  const filteredPartners = selectFilteredPartners(partners, filters, processMeta, typeLabels);
  const summary = buildPartnerSummary(partners);
  const filteredSummary = buildPartnerSummary(filteredPartners);
  const availableOutsourcingProcessTypes = definitions
    .filter((definition) => definition.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((definition) => definition.type);
  const items = filteredPartners.map((partner) => buildPartnerListItemViewModel(partner, processMeta, typeLabels));
  const editablePartnerMap = filteredPartners.reduce<Record<string, Partner>>((acc, partner) => {
    acc[partner.id] = partner;
    return acc;
  }, {});

  return {
    filters,
    summary,
    filteredPartners,
    items,
    editablePartnerMap,
    filteredCount: filteredPartners.length,
    filteredSummary,
    hasSearch: Boolean(filters.searchTerm.trim()),
    availablePartnerTypes: BASE_PARTNER_TYPE_VALUES,
    availableOutsourcingProcessTypes,
    filterOptions,
    processMeta,
  };
}
