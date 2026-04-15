export const PARTNER_TYPE_VALUES = ["factory", "material_vendor", "subsidiary_vendor", "outsourcing_vendor"] as const;

export type PartnerType = (typeof PARTNER_TYPE_VALUES)[number];

export const OUTSOURCING_PROCESS_TYPE_VALUES = ["cutting", "printing", "embroidery", "washing", "finishing"] as const;

export type OutsourcingProcessType = string;

export type Partner = {
  id: string;
  name: string;
  partnerTypes: PartnerType[];
  isActive: boolean;
  contactName?: string;
  phone?: string;
  email?: string;
  outsourcingProcessTypes?: OutsourcingProcessType[];
  memo: string;
  createdAt: string;
  updatedAt: string;
};

export type PartnerDraft = {
  name: string;
  partnerTypes: PartnerType[];
  isActive: boolean;
  contactName: string;
  phone: string;
  email: string;
  outsourcingProcessTypes: OutsourcingProcessType[];
  memo: string;
};
