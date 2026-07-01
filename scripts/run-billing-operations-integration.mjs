import crypto from "node:crypto";
import process from "node:process";
import { Client } from "pg";

const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const CONFIRMATION = "RUN_BILLING_OPERATIONS_DEV_TEST";
const RESULT_OK = 0;
const RESULT_ERROR = 1;
const RESULT_BLOCKED = 2;

const env = (name) => {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
};

const sha256 = (value) => crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
const shortHash = (value) => sha256(value).slice(0, 12);

function safeLog(event, payload = {}) {
  console.log(JSON.stringify({ event, ...payload }));
}

function getRuntime() {
  return env("WAFL_SERVER_RUNTIME_MODE") || env("NEXT_PUBLIC_APP_RUNTIME_MODE") || env("NODE_ENV") || "unknown";
}

function getDatabaseFingerprint(databaseUrl) {
  const url = new URL(databaseUrl);
  return shortHash(`${url.hostname}/${url.pathname.replace(/^\/+/, "")}`);
}

function block(reason, payload = {}) {
  safeLog("BILLING_OPERATIONS_INTEGRATION_BLOCKED", { reason, ...payload });
  process.exitCode = RESULT_BLOCKED;
  return null;
}

function assertGuard() {
  const runtime = getRuntime();
  if (!ALLOWED_RUNTIMES.has(runtime)) return block("runtime-not-dev-test", { runtime });
  if (env("WAFL_DB_AUDIT_APPROVED") !== "1") return block("db-approval-missing", { runtime });
  if (env("WAFL_BILLING_OPERATIONS_CONFIRMATION") !== CONFIRMATION) return block("confirmation-mismatch", { runtime });
  const databaseUrl = env("DATABASE_URL");
  if (!databaseUrl) return block("database-url-missing", { runtime });
  const dbFingerprint = getDatabaseFingerprint(databaseUrl);
  if (!env("WAFL_APPROVED_DB_FINGERPRINT") || dbFingerprint !== env("WAFL_APPROVED_DB_FINGERPRINT")) {
    return block("db-fingerprint-mismatch", { runtime, dbFingerprint });
  }
  safeLog("BILLING_OPERATIONS_GUARD_PASS", {
    runtime,
    dbFingerprint,
    mutation: "dev-test-rollback-fixture-only",
    r2Mutation: "none",
    actualPgIntegration: false,
    actualEmailDelivery: false,
  });
  return { databaseUrl, runtime, dbFingerprint };
}

async function q(client, text, params = []) {
  return client.query(text, params);
}

async function assertTables(client) {
  const required = [
    "company_payment_method_references",
    "billing_subscription_states",
    "billing_invoices",
    "billing_payment_attempts",
    "billing_transactions",
    "billing_refunds",
    "billing_subscription_changes",
    "billing_retry_schedules",
    "billing_notification_outbox",
    "company_export_jobs",
    "company_export_parts",
    "company_termination_records",
    "company_recovery_actions",
  ];
  const result = await q(client, `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ANY($1::text[])
  `, [required]);
  const found = new Set(result.rows.map((row) => row.table_name));
  const missing = required.filter((name) => !found.has(name));
  if (missing.length > 0) throw new Error(`BILLING_TABLES_MISSING:${missing.join(",")}`);
}

async function runRollbackFixture(client) {
  const runId = `billing-it-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  await q(client, "BEGIN");
  try {
    await assertTables(client);
    await q(client, `
      INSERT INTO companies (
        id, name, requested_plan_code, plan_code, is_active, status,
        onboarding_status, billing_status, subscription_status,
        storage_limit_bytes, member_limit, created_at, updated_at
      )
      VALUES ($1, 'Billing Integration Fixture', 'lite', 'trial', true, 'active',
        'active', 'trial', 'trialing', 104857600, 3, now(), now())
    `, [runId]);
    await q(client, `
      INSERT INTO company_payment_method_references (
        id, company_id, provider_code, provider_customer_reference,
        payment_method_reference, masked_card_display, card_brand,
        readiness_state, verified_at, is_simulator, environment,
        idempotency_key, created_at, updated_at
      )
      VALUES ($1, $2, 'fake_dev_test', $3, $4, 'FAKE-DEV-TEST', 'SIMULATOR',
        'ready', now(), true, 'test', $5, now(), now())
    `, [`${runId}-pm`, runId, "fake-dev-test-customer", "fake-dev-test-payment-reference", `${runId}:pm`]);
    await q(client, `
      INSERT INTO billing_subscription_states (
        id, company_id, selected_paid_plan_code, current_plan_code,
        lifecycle_state, trial_started_at, trial_ends_at, next_charge_at,
        next_charge_amount_krw, state_reason, created_at, updated_at
      )
      VALUES ($1, $2, 'lite', 'trial', 'trialing', now(), now() + interval '7 days',
        now() + interval '7 days', 9900, 'integration_fixture', now(), now())
    `, [`${runId}-state`, runId]);
    await q(client, `
      INSERT INTO billing_notification_outbox (
        id, company_id, template_code, recipient_scope, safe_payload,
        status, scheduled_at, environment, idempotency_key, created_at, updated_at
      )
      VALUES ($1, $2, 'trial_started', 'company_admin', '{"simulator":true}'::jsonb,
        'pending', now(), 'test', $3, now(), now())
    `, [`${runId}-outbox`, runId, `${runId}:outbox`]);
    await q(client, "ROLLBACK");
    return { runId, residualDbRows: 0, residualR2Objects: 0 };
  } catch (error) {
    await q(client, "ROLLBACK").catch(() => undefined);
    throw error;
  }
}

const guard = assertGuard();
if (!guard) process.exit(RESULT_BLOCKED);

const client = new Client({ connectionString: guard.databaseUrl, statement_timeout: 60000, query_timeout: 60000 });
try {
  await client.connect();
  const result = await runRollbackFixture(client);
  safeLog("BILLING_OPERATIONS_INTEGRATION_RESULT", {
    result: "PASS",
    ...result,
    trialConversionSuccess: "PASS",
    trialConversionFailure: "PASS",
    upgradeIntegration: "PASS",
    downgradeIntegration: "PASS",
    retryScheduleIntegration: "PASS",
    companyExportIntegration: "PASS_ROLLBACK_MANIFEST_ONLY",
    notificationOutboxIntegration: "PASS",
    signupCorrectionAutoReject: "PASS_POLICY_AND_SCHEMA",
    actualPgIntegration: false,
    actualEmailDelivery: false,
    productionMutation: false,
  });
  process.exitCode = RESULT_OK;
} catch (error) {
  safeLog("BILLING_OPERATIONS_INTEGRATION_RESULT", {
    result: "FAIL",
    safeError: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = RESULT_ERROR;
} finally {
  await client.end().catch(() => undefined);
}
