export const ADMIN_DB_TABLES = [
  "companies",
  "company_settings",
  "users",
  "spec_sheets",
  "orders",
  "partners",
  "partner_items",
  "attachments",
  "attachment_trash_items",
  "history_logs",
  "units",
  "item_categories",
  "outsourcing_processes",
  "materials",
  "material_attributes_fabric",
  "material_attributes_submaterial",
  "workorder_material_lines",
  "material_orders",
  "material_order_lines",
  "material_stocks",
  "material_allocations",
] as const;

export type AdminDbTableName = (typeof ADMIN_DB_TABLES)[number];

export const ADMIN_DB_COMPANY_SCOPED_TABLES = [
  "company_settings",
  "users",
  "spec_sheets",
  "orders",
  "partners",
  "partner_items",
  "attachments",
  "attachment_trash_items",
  "history_logs",
  "units",
  "item_categories",
  "outsourcing_processes",
  "materials",
  "workorder_material_lines",
  "material_orders",
  "material_order_lines",
  "material_stocks",
  "material_allocations",
] as const;

export type AdminDbCompanyScopedTableName = (typeof ADMIN_DB_COMPANY_SCOPED_TABLES)[number];

export const ADMIN_DB_AUDIT_COLUMNS = ["created_at", "updated_at"] as const;

export const ADMIN_DB_SOFT_DELETE_COLUMNS = ["is_active", "deleted_at"] as const;
