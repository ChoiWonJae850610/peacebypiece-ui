#!/usr/bin/env node
/**
 * WAFL DB/API contract smoke test helper.
 *
 * This script validates the DB contracts used by recent API flows without
 * starting Next.js and without touching production data. Every write is wrapped
 * in a transaction and rolled back at the end.
 *
 * Required env:
 *   DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING, or NEON_DATABASE_URL
 *
 * Usage:
 *   npm run test:smoke:db-api
 */
import process from "node:process";
import pg from "pg";

const { Client } = pg;

const DATABASE_URL_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "NEON_DATABASE_URL",
];

const REQUIRED_TABLES = [
  "companies",
  "users",
  "system_users",
  "company_account_requests",
  "policy_documents",
  "policy_versions",
  "policy_agreements",
];

const REQUIRED_COLUMNS = {
  companies: ["id", "name", "is_active", "onboarding_status", "subscription_status", "billing_status"],
  users: ["id", "company_id", "email", "name", "role", "is_active"],
  system_users: ["id", "email", "name", "role", "is_active"],
  company_account_requests: [
    "id",
    "company_id",
    "requested_by_user_id",
    "request_type",
    "request_status",
    "request_title",
    "request_message",
    "request_payload",
    "reviewed_by_user_id",
    "reviewed_by_system_user_id",
    "reviewed_at",
    "review_message",
  ],
  policy_documents: ["id", "document_key", "title", "category", "is_customer_visible"],
  policy_versions: [
    "id",
    "policy_document_id",
    "version_label",
    "is_current",
    "is_required_for_approval",
    "requires_reagreement",
    "content_snapshot",
  ],
  policy_agreements: [
    "id",
    "policy_version_id",
    "company_id",
    "user_id",
    "agreement_scope",
    "agreement_source",
    "agreed_at",
  ],
};

const CHECK_RESULTS = [];

function findDatabaseUrl() {
  for (const key of DATABASE_URL_ENV_KEYS) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return { key, value: value.trim() };
    }
  }
  return null;
}

function logHeader(databaseKey) {
  console.log("[smoke] WAFL DB/API contract smoke test");
  console.log(`[smoke] Database env: ${databaseKey}`);
  console.log("[smoke] Safety: write checks run inside a transaction and are rolled back.");
}

function logStep(label) {
  console.log(`\n[smoke] ${label}`);
}

function logOk(label) {
  CHECK_RESULTS.push({ label, status: "passed" });
  console.log(`  ✓ ${label}`);
}

function formatErrorMessage({ area, target, message, next }) {
  return [
    `[${area}] ${target}: ${message}`,
    next ? `Next check: ${next}` : null,
  ].filter(Boolean).join("\n");
}

function throwSmokeError(payload) {
  throw new Error(formatErrorMessage(payload));
}

async function assertTableExists(client, tableName) {
  const result = await client.query(
    `SELECT to_regclass($1) AS table_name`,
    [`public.${tableName}`],
  );
  if (!result.rows[0]?.table_name) {
    throwSmokeError({
      area: "schema contract",
      target: tableName,
      message: "required table was not found.",
      next: "full_reset.sql or the latest migration may not have been applied.",
    });
  }
}

async function assertColumnsExist(client, tableName, columns) {
  const result = await client.query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = ANY($2::text[])
      ORDER BY column_name`,
    [tableName, columns],
  );
  const found = new Set(result.rows.map((row) => row.column_name));
  const missing = columns.filter((column) => !found.has(column));
  if (missing.length > 0) {
    throwSmokeError({
      area: "schema contract",
      target: tableName,
      message: `missing required column(s): ${missing.join(", ")}`,
      next: "compare db/schema/full_reset.sql and recent db/migrations files with the current database.",
    });
  }
}

async function assertSchema(client) {
  logStep("schema contract");
  for (const tableName of REQUIRED_TABLES) {
    await assertTableExists(client, tableName);
    await assertColumnsExist(client, tableName, REQUIRED_COLUMNS[tableName]);
    logOk(`${tableName}: required table/columns present`);
  }
}

async function assertCompanyAccountRequestReviewContract(client) {
  logStep("company account request review contract");
  console.log("  - creating rollback-only company/request/reviewer fixture");

  const companyId = "smoke-company-account-request";
  const userId = "smoke-customer-admin";
  const systemUserId = "smoke-system-admin";
  const requestId = "smoke-company-account-request-review";

  await client.query(
    `INSERT INTO companies (
       id,
       name,
       onboarding_status,
       subscription_status,
       billing_status,
       is_active,
       created_at,
       updated_at
     ) VALUES ($1, 'Smoke Test Company', 'active', 'active', 'active', true, now(), now())`,
    [companyId],
  );

  await client.query(
    `INSERT INTO users (
       id,
       company_id,
       email,
       name,
       role,
       is_active,
       created_at,
       updated_at
     ) VALUES ($1, $2, 'smoke-customer-admin@example.test', 'Smoke Customer Admin', 'admin', true, now(), now())`,
    [userId, companyId],
  );

  await client.query(
    `INSERT INTO system_users (
       id,
       email,
       name,
       role,
       is_active,
       created_at,
       updated_at
     ) VALUES ($1, 'smoke-system-admin@example.test', 'Smoke System Admin', 'system_admin', true, now(), now())`,
    [systemUserId],
  );

  await client.query(
    `INSERT INTO company_account_requests (
       id,
       company_id,
       requested_by_user_id,
       request_type,
       request_status,
       request_title,
       request_message,
       request_payload,
       created_at,
       updated_at
     ) VALUES (
       $1,
       $2,
       $3,
       'account_deactivation',
       'pending',
       '계정 비활성화 요청',
       'smoke test account deactivation request message',
       '{}'::jsonb,
       now(),
       now()
     )`,
    [requestId, companyId, userId],
  );

  await client.query(
    `UPDATE company_account_requests
        SET request_status = 'approved',
            reviewed_by_system_user_id = $1,
            reviewed_at = now(),
            review_message = 'smoke approved',
            updated_at = now()
      WHERE id = $2`,
    [systemUserId, requestId],
  );

  await client.query(
    `UPDATE companies
        SET is_active = false,
            subscription_status = 'canceled',
            updated_at = now()
      WHERE id = $1`,
    [companyId],
  );

  const result = await client.query(
    `SELECT
       request.request_status,
       request.reviewed_by_system_user_id,
       reviewer_user.name AS reviewer_name,
       company.is_active,
       company.subscription_status
     FROM company_account_requests request
     LEFT JOIN system_users reviewer_user
       ON reviewer_user.id = request.reviewed_by_system_user_id
     INNER JOIN companies company
       ON company.id = request.company_id
     WHERE request.id = $1`,
    [requestId],
  );

  const row = result.rows[0];
  if (!row) {
    throwSmokeError({
      area: "company account request review contract",
      target: "company_account_requests",
      message: "review row was not found after fixture update.",
      next: "check request id filters and rollback-only fixture inserts.",
    });
  }
  if (row.request_status !== "approved") {
    throwSmokeError({
      area: "company account request review contract",
      target: "request_status",
      message: "approval status was not persisted as approved.",
      next: "check the account request approval update query.",
    });
  }
  if (row.reviewed_by_system_user_id !== systemUserId) {
    throwSmokeError({
      area: "company account request review contract",
      target: "reviewed_by_system_user_id",
      message: "system reviewer id was not persisted.",
      next: "check reviewer FK handling between company_account_requests and system_users.",
    });
  }
  if (row.reviewer_name !== "Smoke System Admin") {
    throwSmokeError({
      area: "company account request review contract",
      target: "system_users join",
      message: "system reviewer name join failed.",
      next: "check reviewed_by_system_user_id and system_users.id relation.",
    });
  }
  if (row.is_active !== false) {
    throwSmokeError({
      area: "company account request review contract",
      target: "companies.is_active",
      message: "company deactivation contract failed.",
      next: "check approval result application for account deactivation requests.",
    });
  }
  if (row.subscription_status !== "canceled") {
    throwSmokeError({
      area: "company account request review contract",
      target: "companies.subscription_status",
      message: "company subscription status contract failed.",
      next: "check approval result application for subscription/account state.",
    });
  }

  logOk("company account request: system reviewer FK and approval result contract");
}

async function assertPolicyAgreementContract(client) {
  logStep("policy agreement contract");
  console.log("  - creating rollback-only policy/version/agreement fixture");

  const companyId = "smoke-policy-company";
  const userId = "smoke-policy-user";
  const documentId = "smoke-policy-document";
  const versionId = "smoke-policy-version";

  await client.query(
    `INSERT INTO companies (
       id,
       name,
       onboarding_status,
       subscription_status,
       billing_status,
       is_active,
       created_at,
       updated_at
     ) VALUES ($1, 'Smoke Policy Company', 'profile_required', 'trialing', 'trial', true, now(), now())`,
    [companyId],
  );

  await client.query(
    `INSERT INTO users (
       id,
       company_id,
       email,
       name,
       role,
       is_active,
       created_at,
       updated_at
     ) VALUES ($1, $2, 'smoke-policy-user@example.test', 'Smoke Policy User', 'admin', true, now(), now())`,
    [userId, companyId],
  );

  await client.query(
    `INSERT INTO policy_documents (
       id,
       document_key,
       title,
       category,
       is_customer_visible,
       created_at,
       updated_at
     ) VALUES ($1, 'smoke-policy-required', 'Smoke Required Policy', 'service', true, now(), now())`,
    [documentId],
  );

  await client.query(
    `INSERT INTO policy_versions (
       id,
       policy_document_id,
       version_label,
       effective_date_label,
       is_current,
       is_required_for_approval,
       requires_reagreement,
       content_snapshot,
       published_at,
       created_at,
       updated_at
     ) VALUES ($1, $2, 'smoke-v1', '테스트', true, true, false, '{}'::jsonb, now(), now(), now())`,
    [versionId, documentId],
  );

  await client.query(
    `INSERT INTO policy_agreements (
       id,
       policy_version_id,
       company_id,
       user_id,
       agreement_scope,
       agreement_source,
       ip_address,
       user_agent,
       agreed_at,
       created_at
     ) VALUES (
       'smoke-policy-agreement',
       $1,
       $2,
       $3,
       'company_admin_onboarding',
       'smoke_test',
       NULL,
       'smoke-db-api',
       now(),
       now()
     )
     ON CONFLICT (policy_version_id, user_id) DO UPDATE SET
       agreement_scope = EXCLUDED.agreement_scope,
       agreement_source = EXCLUDED.agreement_source,
       agreed_at = EXCLUDED.agreed_at`,
    [versionId, companyId, userId],
  );

  const result = await client.query(
    `SELECT
       COUNT(*)::int AS required_count,
       COUNT(agreement.id)::int AS agreed_required_count
     FROM policy_documents document
     INNER JOIN policy_versions version
       ON version.policy_document_id = document.id
      AND version.is_current = true
     LEFT JOIN policy_agreements agreement
       ON agreement.policy_version_id = version.id
      AND agreement.company_id = $1
      AND agreement.user_id = $2
     WHERE document.is_customer_visible = true
       AND version.is_required_for_approval = true
       AND document.document_key = 'smoke-policy-required'`,
    [companyId, userId],
  );

  const row = result.rows[0];
  if (!row || row.required_count !== 1 || row.agreed_required_count !== 1) {
    throwSmokeError({
      area: "policy agreement contract",
      target: "policy_agreements",
      message: "required policy agreement count did not match expected result.",
      next: "check policy_documents, policy_versions, and policy_agreements joins for required approval policies.",
    });
  }

  logOk("policy agreement: required policy agreement save/read contract");
}

function logSummary() {
  console.log("\n[smoke] Summary");
  console.log(`  Passed checks: ${CHECK_RESULTS.length}`);
  for (const result of CHECK_RESULTS) {
    console.log(`  ✓ ${result.label}`);
  }
  console.log("  Result: completed successfully");
  console.log("  Persistence: no test data was persisted");
}

async function main() {
  const database = findDatabaseUrl();
  if (!database) {
    console.error("[smoke] Missing database URL.");
    console.error(`  Set one of: ${DATABASE_URL_ENV_KEYS.join(", ")}`);
    console.error("  Example PowerShell: $env:DATABASE_URL=\"postgres://...\"; npm run test:smoke:db-api");
    process.exitCode = 1;
    return;
  }

  logHeader(database.key);

  const client = new Client({ connectionString: database.value });
  let transactionStarted = false;

  try {
    await client.connect();
    await assertSchema(client);
    await client.query("BEGIN");
    transactionStarted = true;
    try {
      await assertCompanyAccountRequestReviewContract(client);
      await assertPolicyAgreementContract(client);
    } finally {
      await client.query("ROLLBACK");
      transactionStarted = false;
    }
    logSummary();
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Keep the original failure visible. The connection will be closed below.
      }
    }
    console.error("\n[smoke] Failed.");
    console.error(error instanceof Error ? error.message : String(error));
    console.error("  Persistence: rollback attempted for write checks.");
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();
