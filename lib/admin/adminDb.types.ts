import type { AdminDbCompanyScopedTableName, AdminDbTableName } from "@/lib/constants/adminDb";

export type AdminDbAuditFields = {
  created_at: string;
  updated_at: string;
};

export type AdminDbCompanyScopedRecord = {
  company_id: string;
  company_name?: string | null;
};

export type AdminDbTableDefinition = {
  tableName: AdminDbTableName;
  companyScoped: boolean;
  softDelete: boolean;
  audit: boolean;
};

export type AdminDbStructureSummary = {
  tables: AdminDbTableDefinition[];
  companyScopedTables: readonly AdminDbCompanyScopedTableName[];
};
