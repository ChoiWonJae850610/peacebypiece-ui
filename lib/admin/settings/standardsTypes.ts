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
  repository?: {
    mode: "db" | "fallback";
    adapterConfigured: boolean;
    supportsWrite: boolean;
  };
  error?: string;
};
