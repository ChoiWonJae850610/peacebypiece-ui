import type { Partner, PartnerDraft } from "@/types/partner";

export type PartnerRepositoryInfo = {
  mode: "mock" | "db";
  adapterConfigured: boolean;
};

export type PartnerRepository = {
  getRepositoryInfo(): PartnerRepositoryInfo;
  getInitialPartners(): Partner[];
  listPartners(): Partner[];
  listPartnersAsync(): Promise<Partner[]>;
  createPartner(draft: PartnerDraft): Partner;
  createPartnerAsync(draft: PartnerDraft): Promise<Partner>;
  updatePartner(partnerId: string, draft: PartnerDraft): Partner;
  updatePartnerAsync(partnerId: string, draft: PartnerDraft): Promise<Partner>;
};
