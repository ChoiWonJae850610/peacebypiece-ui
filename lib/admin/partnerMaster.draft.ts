import { formatPhoneNumber, normalizePhoneNumber } from "@/lib/utils/phoneFormat";
import { EMPTY_PARTNER_DRAFT } from "@/lib/admin/partnerMaster.constants";
import type { BasePartnerType } from "@/lib/admin/partnerMaster.types";
import type { Partner, PartnerDraft, PartnerType } from "@/types/partner";

export function createEmptyPartnerDraft(): PartnerDraft {
  return {
    ...EMPTY_PARTNER_DRAFT,
    partnerTypes: [],
    outsourcingProcessTypes: [],
  };
}

export function isBasePartnerType(type: PartnerType): type is BasePartnerType {
  return type !== "outsourcing_vendor";
}

export function applyPartnerTypeSelectionPolicy(currentTypes: PartnerType[], targetType: BasePartnerType): PartnerType[] {
  const hasOutsourcing = currentTypes.includes("outsourcing_vendor");
  const currentBaseTypes = currentTypes.filter(isBasePartnerType);
  const nextBaseTypes = currentBaseTypes.includes(targetType)
    ? currentBaseTypes.filter((type) => type !== targetType)
    : [...currentBaseTypes, targetType];

  return [
    ...nextBaseTypes,
    ...(hasOutsourcing ? (["outsourcing_vendor"] as PartnerType[]) : []),
  ];
}

export function normalizePartnerTypeSelection(types: PartnerType[]) {
  const uniqueTypes = Array.from(new Set(types));
  const hasOutsourcing = uniqueTypes.includes("outsourcing_vendor");
  const baseTypes = uniqueTypes.filter(isBasePartnerType);

  return [
    ...baseTypes,
    ...(hasOutsourcing ? (["outsourcing_vendor"] as PartnerType[]) : []),
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
  const normalizedTypes = normalizePartnerTypeSelection(draft.partnerTypes);
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
