import { BASE_PARTNER_TYPE_VALUES } from "@/lib/admin/partnerMaster.constants";
import { buildOutsourcingProcessMeta, buildPartnerFilterOptions, buildPartnerSummary, selectFilteredPartners } from "@/lib/admin/partnerMaster.filters";
import type { OutsourcingProcessDefinition, PartnerListFilterState } from "@/lib/admin/partnerMaster.types";
import type { Partner } from "@/types/partner";

export function buildPartnerListViewModel(
  partners: Partner[],
  filters: PartnerListFilterState,
  definitions: OutsourcingProcessDefinition[],
) {
  const processMeta = buildOutsourcingProcessMeta(definitions);
  const filterOptions = buildPartnerFilterOptions(definitions);
  const filteredPartners = selectFilteredPartners(partners, filters, processMeta);
  const summary = buildPartnerSummary(partners);
  const filteredSummary = buildPartnerSummary(filteredPartners);
  const availableOutsourcingProcessTypes = definitions
    .filter((definition) => definition.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((definition) => definition.type);

  return {
    filters,
    summary,
    filteredPartners,
    filteredCount: filteredPartners.length,
    filteredSummary,
    hasSearch: Boolean(filters.searchTerm.trim()),
    availablePartnerTypes: BASE_PARTNER_TYPE_VALUES,
    availableOutsourcingProcessTypes,
    filterOptions,
    processMeta,
  };
}
