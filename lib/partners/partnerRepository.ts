import type {
  PartnerDbRecord,
  PartnerDbType,
  PartnerItemCategory,
  PartnerItemRecord,
  PartnerItemWithRelations,
  PartnerUnitRecord,
} from "@/lib/partners/types";

export type PartnerRepositoryMode = "mock" | "db";

export type PartnerRepositoryInfo = {
  mode: PartnerRepositoryMode;
  adapterConfigured: boolean;
  supportsWrite: boolean;
};

export type ListPartnersOptions = {
  type?: PartnerDbType;
  activeOnly?: boolean;
};

export type ListPartnerItemsOptions = {
  partnerId?: string;
  category?: PartnerItemCategory;
  activeOnly?: boolean;
};

export type PartnerRepository = {
  getRepositoryInfo(): PartnerRepositoryInfo;
  listPartners(options?: ListPartnersOptions): Promise<PartnerDbRecord[]>;
  listUnits(activeOnly?: boolean): Promise<PartnerUnitRecord[]>;
  listPartnerItems(options?: ListPartnerItemsOptions): Promise<PartnerItemWithRelations[]>;
};

export type PartnerWritableRepository = PartnerRepository & {
  createPartner(input: Pick<PartnerDbRecord, "name" | "type"> & Partial<Pick<PartnerDbRecord, "company_id" | "contact" | "email" | "is_active">>): Promise<PartnerDbRecord>;
  updatePartner(partnerId: string, input: Partial<Pick<PartnerDbRecord, "name" | "type" | "company_id" | "contact" | "email" | "is_active">>): Promise<PartnerDbRecord>;
  createPartnerItem(input: Pick<PartnerItemRecord, "partner_id" | "category" | "name"> & Partial<Pick<PartnerItemRecord, "unit_id" | "unit_price" | "currency" | "memo" | "is_active">>): Promise<PartnerItemRecord>;
};
