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
  "company_members",
  "partners",
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
  company_members: [
    "id",
    "company_id",
    "user_id",
    "status",
    "role_template_code",
    "approved_by",
    "approved_at",
    "suspended_by",
    "suspended_at",
    "withdrawal_requested_by",
    "withdrawal_requested_at",
    "withdrawn_by",
    "withdrawn_at",
  ],
  partners: ["id", "company_id", "name", "contact", "contact_person", "email", "memo", "is_active"],
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

async function assertMemberLifecycleContract(client) {
  logStep("member lifecycle contract");
  console.log("  - creating rollback-only member status/withdrawal fixtures");

  const companyId = "smoke-member-lifecycle-company";
  const adminUserId = "smoke-member-lifecycle-admin";
  const memberUserId = "smoke-member-lifecycle-user";
  const memberId = "smoke-member-lifecycle-member";

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
     ) VALUES ($1, 'Smoke Member Lifecycle Company', 'active', 'active', 'active', true, now(), now())`,
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
     ) VALUES
       ($1, $3, 'smoke-member-admin@example.test', 'Smoke Member Admin', 'admin', true, now(), now()),
       ($2, $3, 'smoke-member-user@example.test', 'Smoke Member User', 'designer', true, now(), now())`,
    [adminUserId, memberUserId, companyId],
  );

  await client.query(
    `INSERT INTO company_members (
       id,
       company_id,
       user_id,
       status,
       role_template_code,
       display_name,
       approved_by,
       approved_at,
       created_at,
       updated_at
     ) VALUES ($1, $2, $3, 'approved', 'designer', 'Smoke Member User', $4, now(), now(), now())`,
    [memberId, companyId, memberUserId, adminUserId],
  );

  await client.query(
    `UPDATE company_members
        SET status = 'suspended',
            suspended_by = $2,
            suspended_at = COALESCE(suspended_at, now()),
            withdrawal_requested_by = NULL,
            withdrawal_requested_at = NULL,
            withdrawn_by = NULL,
            withdrawn_at = NULL,
            updated_at = now()
      WHERE id = $1`,
    [memberId, adminUserId],
  );

  const suspendedResult = await client.query(
    `SELECT status, suspended_by, suspended_at
       FROM company_members
      WHERE id = $1`,
    [memberId],
  );
  const suspendedRow = suspendedResult.rows[0];
  if (!suspendedRow || suspendedRow.status !== "suspended" || suspendedRow.suspended_by !== adminUserId || !suspendedRow.suspended_at) {
    throwSmokeError({
      area: "member lifecycle contract",
      target: "company_members.status",
      message: "member suspension status/timestamp contract failed.",
      next: "check company_members status update handling in memberRepository.",
    });
  }

  await client.query(
    `UPDATE company_members
        SET status = 'withdrawal_requested',
            withdrawal_requested_by = $2,
            withdrawal_requested_at = COALESCE(withdrawal_requested_at, now()),
            withdrawn_by = NULL,
            withdrawn_at = NULL,
            updated_at = now()
      WHERE id = $1
        AND company_id = $3
        AND user_id = $2`,
    [memberId, memberUserId, companyId],
  );

  const withdrawalRequestResult = await client.query(
    `SELECT status, withdrawal_requested_by, withdrawal_requested_at, withdrawn_by, withdrawn_at
       FROM company_members
      WHERE id = $1`,
    [memberId],
  );
  const withdrawalRequestRow = withdrawalRequestResult.rows[0];
  if (
    !withdrawalRequestRow ||
    withdrawalRequestRow.status !== "withdrawal_requested" ||
    withdrawalRequestRow.withdrawal_requested_by !== memberUserId ||
    !withdrawalRequestRow.withdrawal_requested_at ||
    withdrawalRequestRow.withdrawn_by !== null ||
    withdrawalRequestRow.withdrawn_at !== null
  ) {
    throwSmokeError({
      area: "member lifecycle contract",
      target: "company_members.withdrawal_requested",
      message: "personal withdrawal request status/timestamp contract failed.",
      next: "check requestPersonalMemberWithdrawal and company_members withdrawal consistency constraints.",
    });
  }

  await client.query(
    `UPDATE company_members
        SET status = 'withdrawn',
            withdrawn_by = $2,
            withdrawn_at = COALESCE(withdrawn_at, now()),
            updated_at = now()
      WHERE id = $1`,
    [memberId, adminUserId],
  );

  const withdrawnResult = await client.query(
    `SELECT status, withdrawn_by, withdrawn_at
       FROM company_members
      WHERE id = $1`,
    [memberId],
  );
  const withdrawnRow = withdrawnResult.rows[0];
  if (!withdrawnRow || withdrawnRow.status !== "withdrawn" || withdrawnRow.withdrawn_by !== adminUserId || !withdrawnRow.withdrawn_at) {
    throwSmokeError({
      area: "member lifecycle contract",
      target: "company_members.withdrawn",
      message: "admin withdrawal completion status/timestamp contract failed.",
      next: "check admin member status update handling and company_members withdrawn consistency constraints.",
    });
  }

  logOk("company members: status change, personal withdrawal request, and withdrawal completion contract");
}

async function assertCompanyAccountRequestReviewContract(client) {
  logStep("company account request review contract");
  console.log("  - creating rollback-only approved/rejected company request fixtures");

  const systemUserId = "smoke-system-admin";
  const approvedCompanyId = "smoke-company-account-request-approved-company";
  const approvedUserId = "smoke-company-account-request-approved-user";
  const approvedRequestId = "smoke-company-account-request-approved";
  const rejectedCompanyId = "smoke-company-account-request-rejected-company";
  const rejectedUserId = "smoke-company-account-request-rejected-user";
  const rejectedRequestId = "smoke-company-account-request-rejected";

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
    `INSERT INTO companies (
       id,
       name,
       onboarding_status,
       subscription_status,
       billing_status,
       is_active,
       created_at,
       updated_at
     ) VALUES
       ($1, 'Smoke Approved Company', 'active', 'active', 'active', true, now(), now()),
       ($2, 'Smoke Rejected Company', 'active', 'active', 'active', true, now(), now())`,
    [approvedCompanyId, rejectedCompanyId],
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
     ) VALUES
       ($1, $2, 'smoke-approved-admin@example.test', 'Smoke Approved Admin', 'admin', true, now(), now()),
       ($3, $4, 'smoke-rejected-admin@example.test', 'Smoke Rejected Admin', 'admin', true, now(), now())`,
    [approvedUserId, approvedCompanyId, rejectedUserId, rejectedCompanyId],
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
     ) VALUES
       ($1, $2, $3, 'account_deactivation', 'pending', '계정 비활성화 요청', 'smoke approved account deactivation request message', '{}'::jsonb, now(), now()),
       ($4, $5, $6, 'account_deactivation', 'pending', '계정 비활성화 요청', 'smoke rejected account deactivation request message', '{}'::jsonb, now(), now())`,
    [approvedRequestId, approvedCompanyId, approvedUserId, rejectedRequestId, rejectedCompanyId, rejectedUserId],
  );

  await client.query(
    `UPDATE company_account_requests
        SET request_status = 'approved',
            reviewed_by_system_user_id = $1,
            reviewed_at = now(),
            review_message = 'smoke approved',
            updated_at = now()
      WHERE id = $2`,
    [systemUserId, approvedRequestId],
  );

  await client.query(
    `UPDATE companies
        SET is_active = false,
            subscription_status = 'canceled',
            updated_at = now()
      WHERE id = $1`,
    [approvedCompanyId],
  );

  await client.query(
    `UPDATE company_account_requests
        SET request_status = 'rejected',
            reviewed_by_system_user_id = $1,
            reviewed_at = now(),
            review_message = 'smoke rejected',
            updated_at = now()
      WHERE id = $2`,
    [systemUserId, rejectedRequestId],
  );

  const result = await client.query(
    `SELECT
       request.id,
       request.request_status,
       request.reviewed_by_system_user_id,
       request.review_message,
       reviewer_user.name AS reviewer_name,
       company.is_active,
       company.subscription_status
     FROM company_account_requests request
     LEFT JOIN system_users reviewer_user
       ON reviewer_user.id = request.reviewed_by_system_user_id
     INNER JOIN companies company
       ON company.id = request.company_id
     WHERE request.id = ANY($1::text[])
     ORDER BY request.id`,
    [[approvedRequestId, rejectedRequestId]],
  );

  const rowsById = new Map(result.rows.map((row) => [row.id, row]));
  const approvedRow = rowsById.get(approvedRequestId);
  const rejectedRow = rowsById.get(rejectedRequestId);

  if (!approvedRow || !rejectedRow) {
    throwSmokeError({
      area: "company account request review contract",
      target: "company_account_requests",
      message: "approved/rejected review rows were not both found after fixture update.",
      next: "check request id filters and rollback-only fixture inserts.",
    });
  }
  if (approvedRow.request_status !== "approved" || approvedRow.is_active !== false || approvedRow.subscription_status !== "canceled") {
    throwSmokeError({
      area: "company account request review contract",
      target: "approved account_deactivation",
      message: "approval status or approved side effect contract failed.",
      next: "check account request approval update and company deactivation side effect handling.",
    });
  }
  if (rejectedRow.request_status !== "rejected" || rejectedRow.is_active !== true || rejectedRow.subscription_status !== "active") {
    throwSmokeError({
      area: "company account request review contract",
      target: "rejected account_deactivation",
      message: "rejection status or rejected side effect contract failed.",
      next: "check account request rejection handling and ensure rejected requests do not deactivate the company.",
    });
  }
  for (const row of [approvedRow, rejectedRow]) {
    if (row.reviewed_by_system_user_id !== systemUserId || row.reviewer_name !== "Smoke System Admin") {
      throwSmokeError({
        area: "company account request review contract",
        target: "system reviewer join",
        message: "system reviewer id/name join failed for a review result.",
        next: "check reviewed_by_system_user_id and system_users.id relation.",
      });
    }
  }

  logOk("company account requests: approval/rejection review result and side effect contract");
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
       'smoke-policy-agreement-updated',
       $1,
       $2,
       $3,
       'company_admin_onboarding',
       'smoke_test_retry',
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
       COUNT(agreement.id)::int AS agreed_required_count,
       MAX(agreement.agreement_source) AS agreement_source
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
  if (row.agreement_source !== "smoke_test_retry") {
    throwSmokeError({
      area: "policy agreement contract",
      target: "policy_agreements unique upsert",
      message: "policy agreement upsert did not update the existing user/version agreement.",
      next: "check the policy_agreements_version_user_unique constraint and ON CONFLICT handling.",
    });
  }

  logOk("policy agreement: required policy agreement save/read/upsert contract");
}

async function assertPartnerNamePhoneContract(client) {
  logStep("partner name/phone contract");
  console.log("  - creating rollback-only partner duplicate identity fixtures");

  const companyId = "smoke-partner-company";

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
     ) VALUES ($1, 'Smoke Partner Company', 'active', 'active', 'active', true, now(), now())`,
    [companyId],
  );

  await client.query(
    `INSERT INTO partners (
       id,
       company_id,
       company_name,
       name,
       contact,
       contact_person,
       email,
       memo,
       is_active,
       created_at,
       updated_at
     ) VALUES
       ('smoke-partner-a', $1, 'Smoke Partner Company', '동일공장', '01012345678', '담당자 A', NULL, NULL, true, now(), now()),
       ('smoke-partner-b', $1, 'Smoke Partner Company', '동일공장', '01022223333', '담당자 B', NULL, NULL, true, now(), now())`,
    [companyId],
  );

  const sameNameDifferentPhone = await client.query(
    `SELECT COUNT(*)::int AS count
       FROM partners
      WHERE company_id = $1
        AND name = '동일공장'`,
    [companyId],
  );
  if (sameNameDifferentPhone.rows[0]?.count !== 2) {
    throwSmokeError({
      area: "partner name/phone contract",
      target: "partners name/contact",
      message: "same partner name with different phone numbers should be representable.",
      next: "check partner save validation and partners contact storage.",
    });
  }

  const duplicateIdentity = await client.query(
    `SELECT id
       FROM partners
      WHERE company_id = $1
        AND lower(name) = lower($2)
        AND regexp_replace(COALESCE(contact, ''), '\D', '', 'g') = $3
      LIMIT 1`,
    [companyId, '동일공장', '01012345678'],
  );

  if (!duplicateIdentity.rows[0]) {
    throwSmokeError({
      area: "partner name/phone contract",
      target: "partners duplicate identity lookup",
      message: "partner name + normalized phone duplicate lookup did not find the existing partner.",
      next: "check contact normalization and duplicate validation before partner create/update.",
    });
  }

  logOk("partners: same name allowed only when normalized phone differs");
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
      await assertMemberLifecycleContract(client);
      await assertCompanyAccountRequestReviewContract(client);
      await assertPolicyAgreementContract(client);
      await assertPartnerNamePhoneContract(client);
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
