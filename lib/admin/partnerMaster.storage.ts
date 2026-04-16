import type { Partner } from "@/types/partner";

export type PartnerStorageRecord = Partner;

function dedupeStrings(values: readonly string[] | undefined) {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

export function normalizePartnerStorageRecord(record: PartnerStorageRecord): PartnerStorageRecord {
  return {
    ...record,
    id: record.id.trim(),
    name: record.name.trim(),
    partnerTypes: dedupeStrings(record.partnerTypes) as Partner["partnerTypes"],
    outsourcingProcessTypes: dedupeStrings(record.outsourcingProcessTypes) as Partner["outsourcingProcessTypes"],
    supportedProcesses: dedupeStrings(record.supportedProcesses) as Partner["supportedProcesses"],
    contactName: record.contactName?.trim() ?? "",
    phone: record.phone?.replace(/\D/g, "") ?? "",
    email: record.email?.trim() ?? "",
    memo: record.memo.trim(),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function normalizePartnerStorageRecords(records: PartnerStorageRecord[]): PartnerStorageRecord[] {
  const seenIds = new Set<string>();

  return records
    .map(normalizePartnerStorageRecord)
    .filter((record) => {
      if (!record.id || seenIds.has(record.id)) return false;
      seenIds.add(record.id);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export function mapPartnerStorageRecordToEntity(record: PartnerStorageRecord): Partner {
  return {
    ...record,
    partnerTypes: [...record.partnerTypes],
    outsourcingProcessTypes: [...(record.outsourcingProcessTypes ?? [])],
    supportedProcesses: [...(record.supportedProcesses ?? record.outsourcingProcessTypes ?? [])],
  };
}

export function mapPartnerEntityToStorageRecord(partner: Partner): PartnerStorageRecord {
  return normalizePartnerStorageRecord({
    ...partner,
    partnerTypes: [...partner.partnerTypes],
    outsourcingProcessTypes: [...(partner.outsourcingProcessTypes ?? [])],
    supportedProcesses: [...(partner.supportedProcesses ?? partner.outsourcingProcessTypes ?? [])],
  });
}

export function mapPartnerStorageRecordsToEntities(records: PartnerStorageRecord[]): Partner[] {
  return normalizePartnerStorageRecords(records).map(mapPartnerStorageRecordToEntity);
}
