import { mockPartnerRepository } from "@/lib/repositories/mockPartnerRepository";
import type { Partner, PartnerDraft } from "@/types/partner";

export function listPartnerMasterItems(): Partner[] {
  return mockPartnerRepository.listPartners();
}

export function createPartnerMasterItem(draft: PartnerDraft): Partner[] {
  mockPartnerRepository.createPartner(draft);
  return mockPartnerRepository.listPartners();
}

export function updatePartnerMasterItem(partnerId: string, draft: PartnerDraft): Partner[] {
  mockPartnerRepository.updatePartner(partnerId, draft);
  return mockPartnerRepository.listPartners();
}
