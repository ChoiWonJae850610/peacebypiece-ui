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

export type PartnerDbRecord = {
  id: string;
  company_id: string | null;
  name: string;
  type: PartnerDbType;
  contact: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PartnerDbPreparationStatus = {
  codeStructureReady: boolean;
  sqlExecuted: boolean;
  dbAdapterConnected: boolean;
};
