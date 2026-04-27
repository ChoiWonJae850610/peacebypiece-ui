import type {
  OutsourcingProcessType,
  PartnerType,
} from "@/types/partner";

export type PartnerStatusFilter = "all" | "active" | "inactive";
export type PartnerFilterChip = "all" | PartnerType;

export type PartnerListFilterState = {
  selectedTypes: PartnerFilterChip[];
  status: PartnerStatusFilter;
  searchTerm: string;
};

export type BasePartnerType = PartnerType;

export type OutsourcingProcessDefinition = {
  type: OutsourcingProcessType;
  label: string;
  tone: string;
  isActive: boolean;
  sortOrder: number;
};

export type PartnerTypeMeta = { label: string; shortLabel: string; tone: string };
export type OutsourcingProcessMeta = { label: string; tone: string };

export type PartnerFilterOption = {
  value: PartnerFilterChip;
  label: string;
};

export type PartnerStatusFilterOption = {
  value: PartnerStatusFilter;
  label: string;
};

export type PartnerListItemViewModel = {
  id: string;
  name: string;
  isActive: boolean;
  contactName: string;
  phone: string;
  email: string;
  memo: string;
  updatedAtLabel: string;
  baseTypeBadges: { key: string; label: string; tone: string }[];
  outsourcingProcessBadges: { key: string; label: string; tone: string }[];
  outsourcingProcessLabel: string;
  hasBaseTypes: boolean;
  hasOutsourcingProcesses: boolean;
  typeDisplayLabel: string;
};

export type PartnerListViewModel = {
  filters: PartnerListFilterState;
  summary: { total: number; active: number; inactive: number };
  filteredPartners: import("@/types/partner").Partner[];
  items: PartnerListItemViewModel[];
  editablePartnerMap: Record<string, import("@/types/partner").Partner>;
  filteredCount: number;
  filteredSummary: { total: number; active: number; inactive: number };
  hasSearch: boolean;
  availablePartnerTypes: BasePartnerType[];
  availableOutsourcingProcessTypes: OutsourcingProcessType[];
  filterOptions: PartnerFilterOption[];
  processMeta: Record<string, OutsourcingProcessMeta>;
};

