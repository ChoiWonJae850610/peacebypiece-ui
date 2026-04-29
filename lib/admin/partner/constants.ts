import { OUTSOURCING_PROCESS_TYPE_VALUES, PARTNER_TYPE_VALUES, type PartnerDraft, type PartnerType } from "@/types/partner";
import type {
  BasePartnerType,
  OutsourcingProcessMeta,
  PartnerListFilterState,
  PartnerStatusFilterOption,
  PartnerTypeMeta,
} from "@/lib/admin/partner/types";

export const BASE_PARTNER_TYPE_VALUES = [...PARTNER_TYPE_VALUES] as BasePartnerType[];

export const PARTNER_TYPE_META: Record<PartnerType, PartnerTypeMeta> = {
  factory: { label: "공장", shortLabel: "공장", tone: "bg-sky-100 text-sky-700" },
  material_vendor: { label: "원단", shortLabel: "원단", tone: "bg-emerald-100 text-emerald-700" },
  subsidiary_vendor: { label: "부자재", shortLabel: "부자재", tone: "bg-amber-100 text-amber-700" },
  outsourcing_vendor: { label: "외주", shortLabel: "외주", tone: "bg-violet-100 text-violet-700" },
};

export const DEFAULT_OUTSOURCING_PROCESS_META: Record<string, OutsourcingProcessMeta> = {
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

export const PARTNER_STATUS_FILTER_OPTIONS: PartnerStatusFilterOption[] = [
  { value: "all", label: "전체 상태" },
  { value: "active", label: "사용중" },
  { value: "inactive", label: "미사용" },
];

export const DEFAULT_PARTNER_FILTER_STATE: PartnerListFilterState = {
  selectedTypes: ["all"],
  status: "all",
  searchTerm: "",
};

export const PARTNER_MASTER_FORM_ERRORS = {
  nameRequired: "업체명을 입력하세요.",
  typeRequired: "유형을 하나 이상 선택하세요.",
  emailInvalid: "올바른 이메일 형식으로 입력하세요.",
  processNameRequired: "공정명을 입력하세요.",
  duplicateProcessLabel: "같은 표시명의 외주공정이 이미 있다.",
} as const;

export const DEFAULT_OUTSOURCING_PROCESS_TYPES = OUTSOURCING_PROCESS_TYPE_VALUES;

export const PARTNER_INACTIVE_SELECTION_POLICY = {
  includeInAdminList: true,
  includeInEditModal: true,
  includeInWorkOrderOptions: false,
} as const;
