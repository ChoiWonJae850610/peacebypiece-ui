import { WORKSPACE_COMPANY_ID } from "@/lib/constants/company";

export type CompanyScopedWorkOrderTable =
  | "spec_sheets"
  | "orders"
  | "attachments"
  | "memos"
  | "partners"
  | "partner_items"
  | "spec_sheet_materials"
  | "spec_sheet_outsourcing_lines"
  | "material_stocks"
  | "material_orders"
  | "material_order_lines"
  | "material_allocations";

export interface WorkOrderCompanyScope {
  companyId: string;
}

export interface WorkOrderCompanyScopeCheck {
  tableName: CompanyScopedWorkOrderTable;
  companyIdColumn: "company_id";
  requiredForRead: boolean;
  requiredForWrite: boolean;
  currentStatus: "scoped" | "needs_review";
  note: string;
}

export const DEFAULT_WORKORDER_COMPANY_SCOPE: WorkOrderCompanyScope = {
  companyId: WORKSPACE_COMPANY_ID,
};

export const WORKORDER_COMPANY_SCOPED_TABLES: WorkOrderCompanyScopeCheck[] = [
  {
    tableName: "spec_sheets",
    companyIdColumn: "company_id",
    requiredForRead: true,
    requiredForWrite: true,
    currentStatus: "scoped",
    note: "dbWorkOrderRepository reads/writes with workspace company scope when company_id column exists.",
  },
  {
    tableName: "orders",
    companyIdColumn: "company_id",
    requiredForRead: true,
    requiredForWrite: true,
    currentStatus: "needs_review",
    note: "factory order sync should stay under the parent spec_sheet company_id.",
  },
  {
    tableName: "attachments",
    companyIdColumn: "company_id",
    requiredForRead: true,
    requiredForWrite: true,
    currentStatus: "needs_review",
    note: "attachment and file routes must keep company_id filtering aligned with workOrderId.",
  },
  {
    tableName: "memos",
    companyIdColumn: "company_id",
    requiredForRead: true,
    requiredForWrite: true,
    currentStatus: "needs_review",
    note: "memo snapshots should keep company_id equal to the work order scope.",
  },
  {
    tableName: "partners",
    companyIdColumn: "company_id",
    requiredForRead: true,
    requiredForWrite: true,
    currentStatus: "needs_review",
    note: "partner master queries should filter by current company_id before tenant rollout.",
  },
  {
    tableName: "partner_items",
    companyIdColumn: "company_id",
    requiredForRead: true,
    requiredForWrite: true,
    currentStatus: "needs_review",
    note: "partner item queries should follow partner company_id.",
  },
  {
    tableName: "spec_sheet_materials",
    companyIdColumn: "company_id",
    requiredForRead: true,
    requiredForWrite: true,
    currentStatus: "needs_review",
    note: "material sync should inherit company_id from the parent spec_sheet.",
  },
  {
    tableName: "spec_sheet_outsourcing_lines",
    companyIdColumn: "company_id",
    requiredForRead: true,
    requiredForWrite: true,
    currentStatus: "needs_review",
    note: "outsourcing sync should inherit company_id from the parent spec_sheet.",
  },
  {
    tableName: "material_stocks",
    companyIdColumn: "company_id",
    requiredForRead: true,
    requiredForWrite: true,
    currentStatus: "needs_review",
    note: "stock records should be scoped before multi-company inventory screens are enabled.",
  },
  {
    tableName: "material_orders",
    companyIdColumn: "company_id",
    requiredForRead: true,
    requiredForWrite: true,
    currentStatus: "needs_review",
    note: "material order headers must be filtered by company_id.",
  },
  {
    tableName: "material_order_lines",
    companyIdColumn: "company_id",
    requiredForRead: true,
    requiredForWrite: true,
    currentStatus: "needs_review",
    note: "material order lines must be filtered by company_id.",
  },
  {
    tableName: "material_allocations",
    companyIdColumn: "company_id",
    requiredForRead: true,
    requiredForWrite: true,
    currentStatus: "needs_review",
    note: "allocation rows must be filtered by company_id.",
  },
];

export function normalizeWorkOrderCompanyId(companyId?: string | null): string {
  const normalized = companyId?.trim();

  return normalized || DEFAULT_WORKORDER_COMPANY_SCOPE.companyId;
}

export function createCompanyScopedParams(companyId?: string | null): [string] {
  return [normalizeWorkOrderCompanyId(companyId)];
}

export function createCompanyScopedWhereClause(
  alias: string,
  parameterIndex = 1,
): string {
  const tableAlias = alias.trim();

  if (!tableAlias) {
    return `company_id = $${parameterIndex}`;
  }

  return `${tableAlias}.company_id = $${parameterIndex}`;
}

export function isWorkOrderCompanyScopedTable(
  tableName: string,
): tableName is CompanyScopedWorkOrderTable {
  return WORKORDER_COMPANY_SCOPED_TABLES.some(
    (item) => item.tableName === tableName,
  );
}

export function getWorkOrderCompanyScopeChecks(): WorkOrderCompanyScopeCheck[] {
  return WORKORDER_COMPANY_SCOPED_TABLES;
}
