import type {
  OutsourcingProcessRecord,
  PartnerDbRecord,
  PartnerDbType,
  PartnerItemCategory,
  PartnerItemRecord,
  PartnerItemWithRelations,
  PartnerUnitRecord,
} from "@/lib/partners/types";

export type PartnerRepositoryMode = "db";

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
  listOutsourcingProcesses?(activeOnly?: boolean): Promise<OutsourcingProcessRecord[]>;
};

export type PartnerWritableRepository = PartnerRepository & {
  createPartner(input: Pick<PartnerDbRecord, "name"> & Partial<Pick<PartnerDbRecord, "type" | "company_id" | "company_name" | "contact_person" | "contact" | "email" | "memo" | "is_active">>): Promise<PartnerDbRecord>;
  updatePartner(partnerId: string, input: Partial<Pick<PartnerDbRecord, "name" | "type" | "company_id" | "company_name" | "contact_person" | "contact" | "email" | "memo" | "is_active">>): Promise<PartnerDbRecord>;
  createPartnerItem(input: Pick<PartnerItemRecord, "partner_id" | "category" | "name"> & Partial<Pick<PartnerItemRecord, "unit_id" | "unit_price" | "currency" | "memo" | "is_active" | "outsourcing_process_id">>): Promise<PartnerItemRecord>;
  replacePartnerRoleItems?(partnerId: string, items: Array<Pick<PartnerItemRecord, "category" | "name"> & Partial<Pick<PartnerItemRecord, "outsourcing_process_id" | "memo" | "is_active">>>): Promise<void>;
  replaceOutsourcingProcesses?(items: Array<Pick<OutsourcingProcessRecord, "id" | "name" | "sort_order" | "is_active"> & Partial<Pick<OutsourcingProcessRecord, "company_id" | "company_name" | "memo">>>): Promise<void>;
};
