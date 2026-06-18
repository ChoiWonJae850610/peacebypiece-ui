import fixture from "@/tests/fixtures/functions/company-scenarios.json";

export type WaflTestDataScale = "empty" | "small" | "medium" | "large" | "edge";

export type WaflTestCompanyScenario = {
  id: string;
  code: string;
  name: string;
  plan: string;
  status: string;
  billing: string;
  memberLimit: number;
  members: number;
  scale: WaflTestDataScale;
  workorders: number;
  materialOrders: number;
  partners: number;
  files: number;
  notifications: number;
  purpose: string[];
};

export type WaflTestDataCatalog = {
  schemaVersion: string;
  runtime: string[];
  productionAllowed: boolean;
  idPrefix: string;
  companies: WaflTestCompanyScenario[];
  roles: string[];
  commands: Record<"seed" | "reset" | "cleanup" | "summary", string>;
};

export const WAFL_TEST_DATA_CATALOG = fixture as WaflTestDataCatalog;

export const WAFL_TEST_DATA_TOTALS = WAFL_TEST_DATA_CATALOG.companies.reduce(
  (totals, company) => ({
    companies: totals.companies + 1,
    members: totals.members + company.members,
    workorders: totals.workorders + company.workorders,
    materialOrders: totals.materialOrders + company.materialOrders,
    partners: totals.partners + company.partners,
    files: totals.files + company.files,
    notifications: totals.notifications + company.notifications,
  }),
  { companies: 0, members: 0, workorders: 0, materialOrders: 0, partners: 0, files: 0, notifications: 0 },
);
