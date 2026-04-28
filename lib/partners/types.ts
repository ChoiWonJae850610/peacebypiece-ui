export {
  PARTNER_CAPABILITY_TYPE_VALUES,
  PARTNER_TYPE_VALUES,
  OUTSOURCING_PROCESS_TYPE_VALUES,
} from "@/types/partner";

export type {
  Partner,
  PartnerDraft,
  PartnerType,
  PartnerCapabilityType,
  OutsourcingProcessType,
} from "@/types/partner";

export const PARTNER_DB_TYPE_VALUES = ["factory", "fabric", "subsidiary", "outsourcing"] as const;

export type PartnerDbType = (typeof PARTNER_DB_TYPE_VALUES)[number];

export const PARTNER_ITEM_CATEGORY_VALUES = ["labor", "fabric", "subsidiary", "outsourcing"] as const;

export type PartnerItemCategory = (typeof PARTNER_ITEM_CATEGORY_VALUES)[number];

export const UNIT_CATEGORY_VALUES = ["count", "length", "bundle", "service"] as const;

export type UnitCategory = (typeof UNIT_CATEGORY_VALUES)[number] | (string & {});

export type PartnerDbRecord = {
  id: string;
  company_id: string | null;
  company_name?: string | null;
  name: string;
  type: PartnerDbType;
  contact_person?: string | null;
  contact: string | null;
  email: string | null;
  memo?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PartnerUnitRecord = {
  id: string;
  company_id: string | null;
  code: string;
  name: string;
  category: UnitCategory | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PartnerItemRecord = {
  id: string;
  partner_id: string;
  category: PartnerItemCategory;
  name: string;
  unit_id: string | null;
  unit_price: number;
  currency: string;
  memo: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  outsourcing_process_id?: string | null;
};

export type PartnerItemWithRelations = PartnerItemRecord & {
  partner_name: string | null;
  unit_name: string | null;
  unit_code: string | null;
  outsourcing_process_name?: string | null;
};

export type OutsourcingProcessRecord = {
  id: string;
  company_id: string | null;
  company_name?: string | null;
  name: string;
  memo: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PartnerDbPreparationStatus = {
  codeStructureReady: boolean;
  sqlExecuted: boolean;
  dbAdapterConnected: boolean;
};
