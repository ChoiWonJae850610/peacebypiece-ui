export const SIMULATOR_DB_MANIFEST = {
  schemaVersion: "1.0",
  sourceSchema: "db/schema/full_reset.sql",
  fixtureSource: "tests/fixtures/functions/company-scenarios.json",
  prefix: "wafl-fn",
  tables: [
    { name: "companies", key: "id", requiredColumns: ["id", "name", "onboarding_status", "storage_limit_bytes", "member_limit", "billing_status", "subscription_status"], cleanupOrder: 100 },
    { name: "company_subscriptions", key: "company_id", requiredColumns: ["company_id", "plan_code", "status", "storage_limit_bytes", "member_limit"], cleanupOrder: 90 },
    { name: "users", key: "company_id", requiredColumns: ["id", "company_id", "email", "name", "role", "is_active"], cleanupOrder: 80 },
    { name: "company_users", key: "company_id", requiredColumns: ["company_id", "user_id", "role", "is_active"], cleanupOrder: 79 },
    { name: "company_members", key: "company_id", requiredColumns: ["company_id", "user_id", "status", "role_template_code"], cleanupOrder: 78 },
    { name: "partners", key: "company_id", requiredColumns: ["id", "company_id", "name", "is_active"], cleanupOrder: 70 },
    { name: "partner_items", key: "company_id", requiredColumns: ["company_id", "partner_id", "item_type", "is_active"], cleanupOrder: 69 },
    { name: "item_categories", key: "company_id", requiredColumns: ["company_id", "level", "name", "is_active"], cleanupOrder: 68 },
    { name: "outsourcing_processes", key: "company_id", requiredColumns: ["company_id", "name", "is_active"], cleanupOrder: 67 },
    { name: "spec_sheets", key: "company_id", requiredColumns: ["id", "company_id", "title", "status"], cleanupOrder: 60 },
    { name: "orders", key: "company_id", requiredColumns: ["company_id", "spec_sheet_id", "factory_partner_id", "status"], cleanupOrder: 59 },
    { name: "material_orders", key: "company_id", requiredColumns: ["id", "company_id", "material_type", "status"], cleanupOrder: 50 },
    { name: "material_order_lines", key: "company_id", requiredColumns: ["id", "company_id", "material_order_id", "item_name", "item_type"], cleanupOrder: 49 },
    { name: "material_order_allocations", key: "company_id", requiredColumns: ["id", "company_id", "material_order_line_id", "work_order_id"], cleanupOrder: 48 },
    { name: "attachments", key: "company_id", requiredColumns: ["id", "company_id", "order_id", "storage_key", "original_name", "size_bytes"], cleanupOrder: 40 },
    { name: "storage_usage_snapshots", key: "company_id", requiredColumns: ["company_id", "used_bytes", "attachment_count", "source"], cleanupOrder: 30 }
  ],
  mutationPolicy: {
    executeEnabled: true,
    cleanupEnabled: true,
    transactionRequired: true,
    idempotentUpsertRequired: true,
    cleanupCompanyPrefixOnly: true,
    productionAllowed: false
  }
};
