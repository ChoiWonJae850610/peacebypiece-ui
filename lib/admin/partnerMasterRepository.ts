import { mapPartnerEntityToStorageRecord, mapPartnerStorageRecordsToEntities, normalizePartnerStorageRecords } from "@/lib/admin/partnerMaster.storage";
import { mockPartnerRepository } from "@/lib/repositories/mockPartnerRepository";
import { persistPartners } from "@/lib/repositories/partnerPersistence";
import type { Partner, PartnerDraft } from "@/types/partner";

function normalizeRepositoryPartners(partners: Partner[]) {
  return mapPartnerStorageRecordsToEntities(partners.map(mapPartnerEntityToStorageRecord));
}

function syncNormalizedPartners(partners: Partner[]) {
  const normalizedRecords = normalizePartnerStorageRecords(partners.map(mapPartnerEntityToStorageRecord));
  persistPartners(normalizedRecords);
  return mapPartnerStorageRecordsToEntities(normalizedRecords);
}

export function listPartnerMasterItems(): Partner[] {
  return normalizeRepositoryPartners(mockPartnerRepository.listPartners());
}

export function createPartnerMasterItem(draft: PartnerDraft): Partner[] {
  mockPartnerRepository.createPartner(draft);
  return syncNormalizedPartners(mockPartnerRepository.listPartners());
}

export function updatePartnerMasterItem(partnerId: string, draft: PartnerDraft): Partner[] {
  mockPartnerRepository.updatePartner(partnerId, draft);
  return syncNormalizedPartners(mockPartnerRepository.listPartners());
}
