import type { OutsourcingProcessDefinition } from "@/lib/admin/partner/types";

export type AdminUnitCategory = "count" | "length" | "bundle" | "service" | (string & {});

export type AdminUnitDefinition = {
  id: string;
  company_id?: string | null;
  code: string;
  name: string;
  category: AdminUnitCategory | null;
  is_active: boolean;
  sort_order: number;
};

export type AdminItemCategoryLevel = 1 | 2 | 3;

export type AdminItemCategoryDefinition = {
  id: string;
  company_id?: string | null;
  parent_id?: string | null;
  level: AdminItemCategoryLevel;
  name: string;
  is_active: boolean;
  sort_order: number;
};

export type AdminStandardsPayload = {
  units: AdminUnitDefinition[];
  itemCategories: AdminItemCategoryDefinition[];
  defaultItemCategories?: AdminItemCategoryDefinition[];
  repository?: {
    mode: "db" | "unavailable";
    adapterConfigured: boolean;
    supportsWrite: boolean;
  };
  error?: string;
};

export type AdminStandardProcessesPayload = {
  processDefinitions: OutsourcingProcessDefinition[];
  error?: string;
};
