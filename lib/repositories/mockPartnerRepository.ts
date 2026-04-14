import { SAMPLE_PARTNERS } from "@/lib/data/sample/partners";
import { loadPersistedPartners, persistPartners } from "@/lib/repositories/partnerPersistence";
import type { PartnerRepository } from "@/lib/repositories/partnerRepository";
import type { Partner, PartnerDraft } from "@/types/partner";

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function createPartnerId() {
  return `partner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getSeedPartners(): Partner[] {
  return cloneValue(SAMPLE_PARTNERS);
}

function getCurrentPartners(): Partner[] {
  const persisted = loadPersistedPartners();
  return persisted ? cloneValue(persisted) : getSeedPartners();
}

function savePartners(partners: Partner[]): Partner[] {
  const normalized = cloneValue(partners)
    .map((partner) => ({
      ...partner,
      partnerTypes: [...new Set(partner.partnerTypes)],
      outsourcingProcessTypes: [...new Set(partner.outsourcingProcessTypes ?? [])],
      name: partner.name.trim(),
      contactName: partner.contactName?.trim() ?? "",
      phone: partner.phone?.trim() ?? "",
      memo: partner.memo.trim(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));

  persistPartners(normalized);
  return cloneValue(normalized);
}

export const mockPartnerRepository: PartnerRepository = {
  getRepositoryInfo: () => ({ mode: "mock", adapterConfigured: true }),
  getInitialPartners: getSeedPartners,
  listPartners: getCurrentPartners,
  listPartnersAsync: async () => getCurrentPartners(),
  createPartner: (draft: PartnerDraft) => {
    const now = new Date().toISOString();
    const nextPartner: Partner = {
      id: createPartnerId(),
      name: draft.name.trim(),
      partnerTypes: [...new Set(draft.partnerTypes)],
      isActive: draft.isActive,
      contactName: draft.contactName.trim(),
      phone: draft.phone.trim(),
      outsourcingProcessTypes: [...new Set(draft.outsourcingProcessTypes)],
      memo: draft.memo.trim(),
      createdAt: now,
      updatedAt: now,
    };
    const saved = savePartners([nextPartner, ...getCurrentPartners()]);
    return saved.find((partner) => partner.id === nextPartner.id) ?? nextPartner;
  },
  createPartnerAsync: async (draft: PartnerDraft) => mockPartnerRepository.createPartner(draft),
  updatePartner: (partnerId: string, draft: PartnerDraft) => {
    const now = new Date().toISOString();
    const current = getCurrentPartners();
    const target = current.find((partner) => partner.id === partnerId);
    if (!target) {
      throw new Error("Partner not found");
    }
    const updatedPartner: Partner = {
      ...target,
      name: draft.name.trim(),
      partnerTypes: [...new Set(draft.partnerTypes)],
      isActive: draft.isActive,
      contactName: draft.contactName.trim(),
      phone: draft.phone.trim(),
      outsourcingProcessTypes: [...new Set(draft.outsourcingProcessTypes)],
      memo: draft.memo.trim(),
      updatedAt: now,
    };
    const saved = savePartners(current.map((partner) => (partner.id === partnerId ? updatedPartner : partner)));
    return saved.find((partner) => partner.id === partnerId) ?? updatedPartner;
  },
  updatePartnerAsync: async (partnerId: string, draft: PartnerDraft) => mockPartnerRepository.updatePartner(partnerId, draft),
};
