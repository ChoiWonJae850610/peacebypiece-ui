import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("db/migrations/patch_0_24_32_billing_operations.sql", "utf8");
const approvedRunner = fs.readFileSync("scripts/run-approved-db-migration.mjs", "utf8");
const readonlyAudit = fs.readFileSync("scripts/run-readonly-db-audit.mjs", "utf8");

for (const table of [
  "company_billing_customers",
  "company_payment_method_references",
  "billing_subscription_states",
  "billing_cycles",
  "billing_invoices",
  "billing_invoice_lines",
  "billing_payment_attempts",
  "billing_transactions",
  "billing_refunds",
  "billing_subscription_changes",
  "billing_events",
  "billing_retry_schedules",
  "billing_webhook_events",
  "billing_notification_outbox",
  "company_export_jobs",
  "company_export_parts",
  "company_termination_records",
  "company_recovery_actions",
]) {
  assert.ok(migration.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `migration missing ${table}`);
}

for (const token of [
  "company_id text NOT NULL REFERENCES companies",
  "idempotency_key text NOT NULL",
  "amount_krw integer NOT NULL",
  "currency text NOT NULL DEFAULT 'KRW'",
  "vat_policy text NOT NULL DEFAULT 'vat_included'",
  "provider_code IN ('deferred_pg', 'fake_dev_test')",
  "NOT (environment = 'production' AND provider_code = 'fake_dev_test' AND readiness_state = 'ready')",
  "rawProvider",
  "signedUrl",
  "company_export_parts_storage_key_check",
]) {
  assert.ok(migration.includes(token), `migration missing policy token: ${token}`);
}

assert.doesNotMatch(migration.replace(/--.*$/gm, "").replace(/\bON\s+DELETE\b/gi, "ON_DELETE"), /\b(DROP|TRUNCATE|DELETE|UPDATE)\b/i);
assert.ok(approvedRunner.includes('"billing-operations"'));
assert.ok(readonlyAudit.includes("'billing-compatibility'"));
assert.ok(readonlyAudit.includes("'billing-post-apply'"));

console.log("billing operations schema contract passed");
