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
export type PartnerFilterType = "all" | PartnerType | OutsourcingProcessType;

export type PartnerListFilterState = {
  selectedType: PartnerFilterType;
  status: PartnerStatusFilter;
  searchTerm: string;
};

export const PARTNER_TYPE_META: Record<PartnerType, { label: string; shortLabel: string; tone: string }> = {
  factory: { label: "공장", shortLabel: "공장", tone: "bg-sky-100 text-sky-700" },
  material_vendor: { label: "원단", shortLabel: "원단", tone: "bg-emerald-100 text-emerald-700" },
  subsidiary_vendor: { label: "부자재", shortLabel: "부자재", tone: "bg-amber-100 text-amber-700" },
  outsourcing_vendor: { label: "외주", shortLabel: "외주", tone: "bg-violet-100 text-violet-700" },
};

export const OUTSOURCING_PROCESS_META: Record<OutsourcingProcessType, { label: string; tone: string }> = {
  cutting: { label: "재단", tone: "bg-indigo-100 text-indigo-700" },
  printing: { label: "나염", tone: "bg-fuchsia-100 text-fuchsia-700" },
  embroidery: { label: "자수", tone: "bg-rose-100 text-rose-700" },
  washing: { label: "워싱", tone: "bg-cyan-100 text-cyan-700" },
  finishing: { label: "후가공", tone: "bg-slate-200 text-slate-700" },
};

export const PARTNER_FILTER_OPTIONS: Array<{ value: PartnerFilterType; label: string }> = [
  { value: "all", label: "전체" },
  { value: "factory", label: "공장" },
  { value: "material_vendor", label: "원단" },
  { value: "subsidiary_vendor", label: "부자재" },
  ...OUTSOURCING_PROCESS_TYPE_VALUES.map((value) => ({ value, label: OUTSOURCING_PROCESS_META[value].label })),
];

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
  selectedType: "all",
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

function matchesPartnerSearch(partner: Partner, searchTerm: string) {
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
    ...(partner.outsourcingProcessTypes ?? []).map((type) => OUTSOURCING_PROCESS_META[type].label),
  ]
    .join(" ")
    .toLocaleLowerCase("ko-KR");

  return candidateText.includes(normalized);
}

function isPartnerTypeFilter(value: PartnerFilterType): value is PartnerType {
  return value !== "all" && (PARTNER_TYPE_VALUES as readonly string[]).includes(value);
}

function isOutsourcingProcessFilter(value: PartnerFilterType): value is OutsourcingProcessType {
  return value !== "all" && (OUTSOURCING_PROCESS_TYPE_VALUES as readonly string[]).includes(value);
}

export function selectFilteredPartners(partners: Partner[], filters: PartnerListFilterState) {
  return partners.filter((partner) => {
    const matchesType =
      filters.selectedType === "all"
        ? true
        : isPartnerTypeFilter(filters.selectedType)
          ? partner.partnerTypes.includes(filters.selectedType)
          : isOutsourcingProcessFilter(filters.selectedType)
            ? (partner.outsourcingProcessTypes ?? []).includes(filters.selectedType)
            : true;
    const matchesStatus = filters.status === "all" || (filters.status === "active" ? partner.isActive : !partner.isActive);
    const matchesSearch = matchesPartnerSearch(partner, filters.searchTerm);
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

export function buildPartnerListViewModel(partners: Partner[], filters: PartnerListFilterState) {
  const filteredPartners = selectFilteredPartners(partners, filters);
  const summary = buildPartnerSummary(partners);
  const filteredSummary = buildPartnerSummary(filteredPartners);

  return {
    filters,
    summary,
    filteredPartners,
    filteredCount: filteredPartners.length,
    filteredSummary,
    hasSearch: Boolean(filters.searchTerm.trim()),
    availablePartnerTypes: PARTNER_TYPE_VALUES,
    availableOutsourcingProcessTypes: OUTSOURCING_PROCESS_TYPE_VALUES,
    filterOptions: PARTNER_FILTER_OPTIONS,
  };
}
