import { normalizePartnerDraft } from "@/lib/admin/partnerMaster.draft";
import type { PartnerDbRecord, PartnerDbType } from "@/lib/partners/types";
import type { Partner, PartnerDraft, PartnerType } from "@/types/partner";

const PARTNER_TYPE_TO_DB_TYPE: Record<PartnerType, PartnerDbType> = {
  factory: "factory",
  material_vendor: "fabric",
  subsidiary_vendor: "subsidiary",
  outsourcing_vendor: "outsourcing",
};

const DB_TYPE_TO_PARTNER_TYPE: Record<PartnerDbType, PartnerType> = {
  factory: "factory",
  fabric: "material_vendor",
  subsidiary: "subsidiary_vendor",
  outsourcing: "outsourcing_vendor",
};

export function mapPartnerDbTypeToPartnerType(type: PartnerDbType): PartnerType {
  return DB_TYPE_TO_PARTNER_TYPE[type];
}

export function selectPrimaryPartnerDbType(partnerTypes: readonly PartnerType[]): PartnerDbType {
  if (partnerTypes.includes("factory")) return "factory";
  if (partnerTypes.includes("material_vendor")) return "fabric";
  if (partnerTypes.includes("subsidiary_vendor")) return "subsidiary";
  if (partnerTypes.includes("outsourcing_vendor")) return "outsourcing";
  return "factory";
}

export function mapPartnerDbRecordToAdminPartner(record: PartnerDbRecord): Partner {
  const partnerType = mapPartnerDbTypeToPartnerType(record.type);

  return {
    id: record.id,
    name: record.name,
    partnerTypes: [partnerType],
    isActive: record.is_active,
    contactName: "",
    phone: record.contact ?? "",
    email: record.email ?? "",
    outsourcingProcessTypes: partnerType === "outsourcing_vendor" ? [] : [],
    supportedProcesses: partnerType === "outsourcing_vendor" ? [] : [],
    memo: "",
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function mapPartnerDbRecordsToAdminPartners(records: PartnerDbRecord[]): Partner[] {
  return records.map(mapPartnerDbRecordToAdminPartner);
}

export function buildPartnerDbCreateInput(draft: PartnerDraft) {
  const normalized = normalizePartnerDraft(draft);

  return {
    name: normalized.name,
    type: selectPrimaryPartnerDbType(normalized.partnerTypes),
    contact: normalized.phone || null,
    email: normalized.email || null,
    is_active: normalized.isActive,
  };
}

export function buildPartnerDbUpdateInput(draft: PartnerDraft) {
  const normalized = normalizePartnerDraft(draft);

  return {
    name: normalized.name,
    type: selectPrimaryPartnerDbType(normalized.partnerTypes),
    contact: normalized.phone || null,
    email: normalized.email || null,
    is_active: normalized.isActive,
  };
}
