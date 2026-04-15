import {
  OUTSOURCING_PROCESS_TYPE_VALUES,
  PARTNER_TYPE_VALUES,
  type OutsourcingProcessType,
  type Partner,
  type PartnerDraft,
  type PartnerType,
} from "@/types/partner";
import { formatPhoneNumber, normalizePhoneNumber } from "@/lib/utils/phoneFormat";

export type PartnerStatusFilter = "all" | "active" | "inactive";
export type PartnerFilterChip = "all" | PartnerType | OutsourcingProcessType;

export type PartnerListFilterState = {
  selectedTypes: PartnerFilterChip[];
  status: PartnerStatusFilter;
  searchTerm: string;
};

export const BASE_PARTNER_TYPE_VALUES = PARTNER_TYPE_VALUES.filter((type) => type !== "outsourcing_vendor") as PartnerType[];

export type OutsourcingProcessDefinition = {
  type: OutsourcingProcessType;
  label: string;
  tone: string;
  isActive: boolean;
  sortOrder: number;
};

export const PARTNER_TYPE_META: Record<PartnerType, { label: string; shortLabel: string; tone: string }> = {
  factory: { label: "공장", shortLabel: "공장", tone: "bg-sky-100 text-sky-700" },
  material_vendor: { label: "원단", shortLabel: "원단", tone: "bg-emerald-100 text-emerald-700" },
  subsidiary_vendor: { label: "부자재", shortLabel: "부자재", tone: "bg-amber-100 text-amber-700" },
  outsourcing_vendor: { label: "외주", shortLabel: "외주", tone: "bg-violet-100 text-violet-700" },
};

export const DEFAULT_OUTSOURCING_PROCESS_META: Record<OutsourcingProcessType, { label: string; tone: string }> = {
  cutting: { label: "재단", tone: "bg-indigo-100 text-indigo-700" },
  printing: { label: "나염", tone: "bg-fuchsia-100 text-fuchsia-700" },
  embroidery: { label: "자수", tone: "bg-rose-100 text-rose-700" },
  washing: { label: "워싱", tone: "bg-cyan-100 text-cyan-700" },
  finishing: { label: "후가공", tone: "bg-slate-200 text-slate-700" },
};

export const EMPTY_PARTNER_DRAFT: PartnerDraft = {
  name: "",
  partnerTypes: [],
  isActive: true,
  contactName: "",
  phone: "",
  email: "",
  outsourcingProcessTypes: [],
  memo: "",
};

export const PARTNER_STATUS_FILTER_OPTIONS: Array<{ value: PartnerStatusFilter; label: string }> = [
  { value: "all", label: "전체 상태" },
  { value: "active", label: "사용중" },
  { value: "inactive", label: "미사용" },
];

export const DEFAULT_PARTNER_FILTER_STATE: PartnerListFilterState = {
  selectedTypes: ["all"],
  status: "all",
  searchTerm: "",
};

export function createEmptyPartnerDraft(): PartnerDraft {
  return {
    ...EMPTY_PARTNER_DRAFT,
    partnerTypes: [],
    outsourcingProcessTypes: [],
  };
}

export function createDefaultOutsourcingProcessDefinitions(): OutsourcingProcessDefinition[] {
  return OUTSOURCING_PROCESS_TYPE_VALUES.map((type, index) => ({
    type,
    label: DEFAULT_OUTSOURCING_PROCESS_META[type].label,
    tone: DEFAULT_OUTSOURCING_PROCESS_META[type].tone,
    isActive: true,
    sortOrder: index + 1,
  }));
}

export function buildOutsourcingProcessMeta(definitions: OutsourcingProcessDefinition[]) {
  return definitions.reduce<Record<OutsourcingProcessType, { label: string; tone: string }>>((acc, definition) => {
    acc[definition.type] = { label: definition.label, tone: definition.tone };
    return acc;
  }, {} as Record<OutsourcingProcessType, { label: string; tone: string }>);
}

export function buildPartnerFilterOptions(definitions: OutsourcingProcessDefinition[]) {
  return [
    { value: "all" as const, label: "전체" },
    { value: "factory" as const, label: "공장" },
    { value: "material_vendor" as const, label: "원단" },
    { value: "subsidiary_vendor" as const, label: "부자재" },
    ...definitions
      .filter((definition) => definition.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((definition) => ({ value: definition.type, label: definition.label })),
  ];
}

export function buildPartnerDraftFromEntity(partner: Partner): PartnerDraft {
  return {
    name: partner.name,
    partnerTypes: [...partner.partnerTypes],
    isActive: partner.isActive,
    contactName: partner.contactName ?? "",
    phone: formatPhoneNumber(partner.phone ?? ""),
    email: partner.email ?? "",
    outsourcingProcessTypes: [...(partner.outsourcingProcessTypes ?? [])],
    memo: partner.memo,
  };
}

export function normalizePartnerDraft(draft: PartnerDraft): PartnerDraft {
  const normalizedTypes = Array.from(new Set(draft.partnerTypes));
  const isOutsourcingVendor = normalizedTypes.includes("outsourcing_vendor");

  return {
    ...draft,
    name: draft.name.trim(),
    partnerTypes: normalizedTypes,
    isActive: draft.isActive,
    contactName: draft.contactName.trim(),
    phone: normalizePhoneNumber(draft.phone),
    email: draft.email.trim(),
    outsourcingProcessTypes: isOutsourcingVendor ? Array.from(new Set(draft.outsourcingProcessTypes)) : [],
    memo: draft.memo.trim(),
  };
}

export function formatPartnerDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function formatPartnerPhone(value?: string) {
  return formatPhoneNumber(value ?? "");
}

function matchesPartnerSearch(
  partner: Partner,
  searchTerm: string,
  processMeta: Record<OutsourcingProcessType, { label: string; tone: string }>,
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
    ...(partner.outsourcingProcessTypes ?? []).map((type) => processMeta[type]?.label ?? DEFAULT_OUTSOURCING_PROCESS_META[type].label),
  ]
    .join(" ")
    .toLocaleLowerCase("ko-KR");

  return candidateText.includes(normalized);
}

function isPartnerTypeFilter(value: PartnerFilterChip): value is PartnerType {
  return value !== "all" && (PARTNER_TYPE_VALUES as readonly string[]).includes(value);
}

function isOutsourcingProcessFilter(value: PartnerFilterChip): value is OutsourcingProcessType {
  return value !== "all" && (OUTSOURCING_PROCESS_TYPE_VALUES as readonly string[]).includes(value);
}

export function togglePartnerFilterSelection(current: PartnerFilterChip[], nextValue: PartnerFilterChip) {
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
  processMeta: Record<OutsourcingProcessType, { label: string; tone: string }>,
) {
  return partners.filter((partner) => {
    const matchesType =
      filters.selectedTypes.includes("all") ||
      filters.selectedTypes.some((selectedType) => {
        if (isPartnerTypeFilter(selectedType)) {
          return partner.partnerTypes.includes(selectedType);
        }
        if (isOutsourcingProcessFilter(selectedType)) {
          return (partner.outsourcingProcessTypes ?? []).includes(selectedType);
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
