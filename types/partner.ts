export const PARTNER_TYPE_VALUES = ["factory", "material_vendor", "subsidiary_vendor", "outsourcing_vendor"] as const;

export type PartnerType = (typeof PARTNER_TYPE_VALUES)[number];

export type Partner = {
  id: string;
  name: string;
  partnerTypes: PartnerType[];
  isActive: boolean;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

export type PartnerDraft = {
  name: string;
  partnerTypes: PartnerType[];
  isActive: boolean;
  memo: string;
};
