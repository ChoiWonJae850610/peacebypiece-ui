import { DEFAULT_OUTSOURCING_PROCESS_META } from "@/lib/admin/partnerMaster.constants";
import { normalizePartnerDraft } from "@/lib/admin/partnerMaster.draft";
import type { OutsourcingProcessDefinition } from "@/lib/admin/partnerMaster.types";
import type { OutsourcingProcessRecord, PartnerDbRecord, PartnerDbType, PartnerItemWithRelations } from "@/lib/partners/types";
import type { OutsourcingProcessType, Partner, PartnerDraft, PartnerType } from "@/types/partner";

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

function mapPartnerItemToPartnerType(item: PartnerItemWithRelations): PartnerType | null {
  if (item.category === "labor") return "factory";
  if (item.category === "fabric") return "material_vendor";
  if (item.category === "subsidiary") return "subsidiary_vendor";
  if (item.category === "outsourcing") return "outsourcing_vendor";
  return null;
}

export function selectPrimaryPartnerDbType(partnerTypes: readonly PartnerType[]): PartnerDbType {
  if (partnerTypes.includes("factory")) return "factory";
  if (partnerTypes.includes("material_vendor")) return "fabric";
  if (partnerTypes.includes("subsidiary_vendor")) return "subsidiary";
  if (partnerTypes.includes("outsourcing_vendor")) return "outsourcing";
  return "factory";
}

export function mapPartnerDbRecordsToAdminPartners(
  records: PartnerDbRecord[],
  partnerItems: PartnerItemWithRelations[] = [],
): Partner[] {
  const itemsByPartnerId = partnerItems.reduce<Record<string, PartnerItemWithRelations[]>>((acc, item) => {
    acc[item.partner_id] = [...(acc[item.partner_id] ?? []), item];
    return acc;
  }, {});

  return records.map((record) => {
    const items = itemsByPartnerId[record.id] ?? [];
    const partnerTypes = Array.from(
      new Set(
        items
          .map(mapPartnerItemToPartnerType)
          .filter((type): type is PartnerType => type !== null),
      ),
    );

    const fallbackType = mapPartnerDbTypeToPartnerType(record.type);
    const normalizedPartnerTypes = partnerTypes.length > 0 ? partnerTypes : [fallbackType];
    const outsourcingProcessTypes = items
      .filter((item) => item.category === "outsourcing")
      .map((item) => item.outsourcing_process_id ?? item.name)
      .filter((type): type is OutsourcingProcessType => Boolean(type));

    return {
      id: record.id,
      name: record.name,
      partnerTypes: normalizedPartnerTypes,
      isActive: record.is_active,
      contactName: record.contact_person ?? "",
      phone: record.contact ?? "",
      email: record.email ?? "",
      outsourcingProcessTypes,
      supportedProcesses: outsourcingProcessTypes,
      memo: record.memo ?? "",
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  });
}

export function mapOutsourcingProcessRecordsToDefinitions(records: OutsourcingProcessRecord[]): OutsourcingProcessDefinition[] {
  return records.map((record) => ({
    type: record.id,
    label: record.name,
    tone: DEFAULT_OUTSOURCING_PROCESS_META[record.id]?.tone ?? "bg-slate-200 text-slate-700",
    isActive: record.is_active,
    sortOrder: record.sort_order,
  }));
}

export function buildPartnerDbCreateInput(draft: PartnerDraft) {
  const normalized = normalizePartnerDraft(draft);

  return {
    name: normalized.name,
    type: selectPrimaryPartnerDbType(normalized.partnerTypes),
    contact_person: normalized.contactName || null,
    contact: normalized.phone || null,
    email: normalized.email || null,
    memo: normalized.memo || null,
    is_active: normalized.isActive,
  };
}

export function buildPartnerDbUpdateInput(draft: PartnerDraft) {
  const normalized = normalizePartnerDraft(draft);

  return {
    name: normalized.name,
    type: selectPrimaryPartnerDbType(normalized.partnerTypes),
    contact_person: normalized.contactName || null,
    contact: normalized.phone || null,
    email: normalized.email || null,
    memo: normalized.memo || null,
    is_active: normalized.isActive,
  };
}

export function buildPartnerRoleItemsFromDraft(draft: PartnerDraft) {
  const normalized = normalizePartnerDraft(draft);
  const items: Array<{ category: "labor" | "fabric" | "subsidiary" | "outsourcing"; name: string; outsourcing_process_id?: string | null; is_active: boolean }> = [];

  for (const type of normalized.partnerTypes) {
    const dbType = PARTNER_TYPE_TO_DB_TYPE[type];
    if (dbType === "factory") items.push({ category: "labor", name: "공장", is_active: normalized.isActive });
    if (dbType === "fabric") items.push({ category: "fabric", name: "원단", is_active: normalized.isActive });
    if (dbType === "subsidiary") items.push({ category: "subsidiary", name: "부자재", is_active: normalized.isActive });
  }

  for (const processType of normalized.outsourcingProcessTypes) {
    items.push({
      category: "outsourcing",
      name: String(processType),
      outsourcing_process_id: String(processType),
      is_active: normalized.isActive,
    });
  }

  return items;
}

export function buildOutsourcingProcessDbInputs(definitions: OutsourcingProcessDefinition[]) {
  return definitions
    .map((definition, index) => ({
      id: String(definition.type),
      name: definition.label.trim(),
      sort_order: definition.sortOrder || index + 1,
      is_active: definition.isActive,
    }))
    .filter((definition) => definition.name.length > 0);
}
