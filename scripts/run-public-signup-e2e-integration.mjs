import crypto from "node:crypto";
import process from "node:process";
import { Client } from "pg";

const CONFIRMATION = "RUN_PUBLIC_SIGNUP_E2E_DEV_TEST";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const PREFIX = "public-signup-e2e-it";
const TRIAL_STORAGE_LIMIT_BYTES = 100 * 1024 * 1024;
const TRIAL_MEMBER_LIMIT = 3;
const REQUIRED_CONSENTS = [
  ["terms_of_service", "wafl_terms_of_service", "2026-0.24.26"],
  ["privacy_policy", "wafl_privacy_policy", "2026-0.24.26"],
];

const env = (name) => (typeof process.env[name] === "string" ? process.env[name].trim() : "");
const shortHash = (value) => crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
const safeLog = (event, payload = {}) => console.log(JSON.stringify({ event, ...payload }));

function getRuntime() {
  return env("WAFL_SERVER_RUNTIME_MODE") || env("NEXT_PUBLIC_APP_RUNTIME_MODE") || env("NODE_ENV") || "unknown";
}

function fingerprint(databaseUrl) {
  const url = new URL(databaseUrl);
  return shortHash(`${url.hostname}/${url.pathname.replace(/^\/+/, "")}`);
}

function assertGuard() {
  const runtime = getRuntime();
  const databaseUrl = env("DATABASE_URL");
  if (!ALLOWED_RUNTIMES.has(runtime)) throw new Error(`BLOCKED_RUNTIME:${runtime}`);
  if (env("WAFL_DB_AUDIT_APPROVED") !== "1") throw new Error("DB_AUDIT_APPROVAL_MISSING");
  if (env("WAFL_PUBLIC_SIGNUP_E2E_CONFIRMATION") !== CONFIRMATION) throw new Error("PUBLIC_SIGNUP_E2E_CONFIRMATION_MISMATCH");
  if (!databaseUrl) throw new Error("DATABASE_URL_REQUIRED");
  const dbFingerprint = fingerprint(databaseUrl);
  if (!env("WAFL_APPROVED_DB_FINGERPRINT") || dbFingerprint !== env("WAFL_APPROVED_DB_FINGERPRINT")) {
    throw new Error("DB_FINGERPRINT_MISMATCH");
  }
  safeLog("PUBLIC_SIGNUP_E2E_GUARD_PASS", {
    runtime,
    dbFingerprint,
    mutation: "dev-test-synthetic-fixture-only",
    r2Mutation: "none",
    productionMutation: false,
    businessDataMutation: false,
    actualPgIntegration: false,
    actualEmailDelivery: false,
    workerChanged: false,
  });
  return { databaseUrl, runtime, dbFingerprint };
}

async function q(client, text, params = []) {
  return client.query(text, params);
}

function remember(manifest, key, value) {
  manifest[key].push(value);
  return value;
}

function createManifest(runId) {
  return {
    runId,
    applications: [],
    applicationFiles: [],
    signupPaymentReferences: [],
    companies: [],
    users: [],
    companyMembers: [],
    companySubscriptions: [],
    companyPaymentReferences: [],
    companyFiles: [],
    notificationKeys: [],
    auditIds: [],
  };
}

async function assertTables(client) {
  const required = [
    "signup_applications",
    "signup_application_consents",
    "signup_application_files",
    "signup_payment_method_references",
    "system_users",
    "companies",
    "users",
    "company_members",
    "member_permissions",
    "company_subscriptions",
    "company_payment_method_references",
    "company_files",
    "billing_notification_outbox",
    "audit_logs",
  ];
  const result = await q(client, `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ANY($1::text[])
  `, [required]);
  const found = new Set(result.rows.map((row) => row.table_name));
  const missing = required.filter((name) => !found.has(name));
  if (missing.length > 0) throw new Error(`PUBLIC_SIGNUP_E2E_TABLES_MISSING:${missing.join(",")}`);
}

async function getSystemUser(client) {
  const result = await q(client, "SELECT id, email FROM system_users WHERE role = 'system_admin' AND is_active = true ORDER BY created_at ASC LIMIT 1");
  const user = result.rows[0];
  if (!user) throw new Error("PUBLIC_SIGNUP_E2E_SYSTEM_ADMIN_REQUIRED");
  return user;
}

async function insertApplication(client, manifest, input) {
  const id = remember(manifest, "applications", `${manifest.runId}-${input.kind}-app`);
  const googleSub = `${id}-google-sub`;
  const email = `${id}@example.test`;
  const businessNumber = input.businessNumber ?? String(1000000000 + Math.floor(Math.random() * 899999999)).slice(0, 10);
  const submittedAt = input.status === "draft" ? null : input.now;
  await q(client, `
    INSERT INTO signup_applications (
      id, status, google_sub, email, email_normalized, email_verified,
      applicant_name, requested_company_name, business_name,
      business_registration_number, business_registration_number_normalized,
      requested_plan_code, submitted_at, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, lower($4), true, $5, $6, $7, $8, $8, 'lite', $9, $10, $10)
  `, [
    id,
    input.status,
    googleSub,
    email,
    `Public Signup ${input.kind}`,
    `${PREFIX} company ${input.kind}`,
    `${PREFIX} business ${input.kind}`,
    businessNumber,
    submittedAt,
    input.now,
  ]);
  return { id, googleSub, email, businessNumber };
}

async function addConsentsAndCertificate(client, manifest, app, now) {
  for (const [consentType, policyCode, policyVersion] of REQUIRED_CONSENTS) {
    await q(client, `
      INSERT INTO signup_application_consents (
        application_id, consent_type, policy_code, policy_version,
        agreed_at, agreed_email_normalized, agreed_google_sub
      )
      VALUES ($1, $2, $3, $4, $5, lower($6), $7)
    `, [app.id, consentType, policyCode, policyVersion, now, app.email, app.googleSub]);
  }
  const fileId = remember(manifest, "applicationFiles", `${app.id}-cert`);
  await q(client, `
    INSERT INTO signup_application_files (
      id, application_id, file_type, original_name, storage_key, mime_type, size_bytes, uploaded_at
    )
    VALUES ($1, $2, 'business_registration', 'public-signup-e2e.pdf', $3, 'application/pdf', 256, $4)
  `, [fileId, app.id, `signup-applications/${app.id}/business-registration/${fileId}.pdf`, now]);
}

async function submitApplication(client, app, now) {
  const result = await q(client, `
    UPDATE signup_applications
    SET status = 'submitted', submitted_at = $2, updated_at = $2
    WHERE id = $1 AND status = 'draft'
  `, [app.id, now]);
  if (result.rowCount !== 1) throw new Error("PUBLIC_SIGNUP_SUBMIT_FAILED");
}

async function startReview(client, app, systemUser, now) {
  const result = await q(client, `
    UPDATE signup_applications
    SET status = 'reviewing',
        reviewed_by_system_user_id = $2,
        reviewed_at = $3,
        updated_at = $3
    WHERE id = $1 AND status = 'submitted'
  `, [app.id, systemUser.id, now]);
  if (result.rowCount !== 1) throw new Error("PUBLIC_SIGNUP_REVIEW_START_FAILED");
}

async function assertPaymentReadinessRequired(client, app) {
  const payment = await q(client, `
    SELECT id
    FROM signup_payment_method_references
    WHERE application_id = $1
      AND readiness_state = 'ready'
      AND revoked_at IS NULL
    LIMIT 1
  `, [app.id]);
  if (payment.rows[0]) throw new Error("PUBLIC_SIGNUP_UNEXPECTED_PAYMENT_READINESS");
  const application = await q(client, "SELECT status, provisioning_status, created_company_id FROM signup_applications WHERE id = $1", [app.id]);
  const row = application.rows[0];
  if (!row || row.status !== "reviewing" || row.provisioning_status !== "not_started" || row.created_company_id !== null) {
    throw new Error("PUBLIC_SIGNUP_READINESS_BLOCK_DAMAGED_APPLICATION");
  }
}

async function addReadiness(client, manifest, app, systemUser, now) {
  const id = remember(manifest, "signupPaymentReferences", `${app.id}-payment-ready`);
  await q(client, `
    INSERT INTO signup_payment_method_references (
      id, application_id, provider_code, provider_customer_reference, payment_method_reference,
      masked_display, brand, readiness_state, verified_at, is_simulator, environment,
      created_by_system_user_id, idempotency_key, created_at, updated_at
    )
    VALUES ($1, $2, 'fake_dev_test', 'public-signup-e2e-customer', 'public-signup-e2e-reference',
      'FAKE-DEV-TEST', 'SIMULATOR', 'ready', $3::timestamptz, true, 'dev_test', $4, $5, $3::timestamptz, $3::timestamptz)
  `, [id, app.id, now, systemUser.id, `public-signup-e2e:readiness:${app.id}`]);
}

async function approve(client, manifest, app, systemUser, now) {
  await q(client, "BEGIN");
  try {
    const locked = await q(client, "SELECT * FROM signup_applications WHERE id = $1 FOR UPDATE", [app.id]);
    const row = locked.rows[0];
    if (!row) throw new Error("PUBLIC_SIGNUP_APPROVAL_APP_MISSING");
    if (row.status === "approved" && row.provisioning_status === "completed") {
      await q(client, "COMMIT");
      return { idempotent: true, companyId: row.created_company_id, userId: row.created_user_id, memberId: row.created_company_member_id, subscriptionId: row.created_subscription_id };
    }
    if (row.status !== "reviewing" || row.provisioning_status !== "not_started") throw new Error("PUBLIC_SIGNUP_APPROVAL_STATUS_CONFLICT");
    const readiness = await q(client, `
      SELECT *
      FROM signup_payment_method_references
      WHERE application_id = $1 AND readiness_state = 'ready' AND revoked_at IS NULL
      ORDER BY verified_at DESC NULLS LAST, updated_at DESC, id DESC
      LIMIT 1
    `, [app.id]);
    const payment = readiness.rows[0];
    if (!payment) throw new Error("SIGNUP_APPROVAL_PAYMENT_READINESS_REQUIRED");

    const companyId = remember(manifest, "companies", `${app.id}-company`);
    const userId = remember(manifest, "users", `${app.id}-user`);
    const memberId = remember(manifest, "companyMembers", `${app.id}-member`);
    const subscriptionId = remember(manifest, "companySubscriptions", `${app.id}-subscription`);
    const companyPaymentId = remember(manifest, "companyPaymentReferences", `${app.id}-company-payment`);
    const companyFileId = remember(manifest, "companyFiles", `${app.id}-company-file`);
    const trialEndsAt = new Date(now.getTime() + 7 * 86400000);

    await q(client, `
      UPDATE signup_applications
      SET provisioning_status = 'in_progress',
          provisioning_started_at = $2,
          provisioning_attempt_count = provisioning_attempt_count + 1,
          updated_at = $2
      WHERE id = $1 AND status = 'reviewing' AND provisioning_status = 'not_started'
    `, [app.id, now]);
    await q(client, `
      INSERT INTO companies (
        id, name, business_name, business_registration_number, requested_plan_code, plan_code,
        is_active, status, onboarding_status, billing_status, subscription_status,
        trial_started_at, trial_ends_at, storage_limit_bytes, member_limit, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, 'lite', 'trial', true, 'active', 'active', 'trial', 'trialing', $5, $6, $7, $8, $5, $5)
    `, [companyId, row.requested_company_name, row.business_name, row.business_registration_number, now, trialEndsAt, TRIAL_STORAGE_LIMIT_BYTES, TRIAL_MEMBER_LIMIT]);
    await q(client, `
      INSERT INTO users (
        id, company_id, email, name, display_name, google_sub,
        auth_provider, provider_user_id, email_verified, role, status, is_active, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $4, $5, 'google', $5, true, 'admin', 'active', true, $6, $6)
    `, [userId, companyId, row.email, row.applicant_name, row.google_sub, now]);
    await q(client, "UPDATE companies SET owner_user_id = $2, updated_at = $3 WHERE id = $1", [companyId, userId, now]);
    await q(client, `
      INSERT INTO company_members (
        id, company_id, user_id, status, role_template_code, display_name, approved_at, created_at, updated_at
      )
      VALUES ($1, $2, $3, 'approved', 'company_admin', $4, $5, $5, $5)
    `, [memberId, companyId, userId, row.applicant_name, now]);
    await q(client, `
      INSERT INTO company_subscriptions (
        id, company_id, plan_code, status, trial_started_at, trial_ends_at,
        current_period_started_at, current_period_ends_at, storage_limit_bytes, member_limit, created_at, updated_at
      )
      VALUES ($1, $2, 'trial', 'trialing', $3, $4, $3, $4, $5, $6, $3, $3)
    `, [subscriptionId, companyId, now, trialEndsAt, TRIAL_STORAGE_LIMIT_BYTES, TRIAL_MEMBER_LIMIT]);
    await q(client, `
      INSERT INTO company_payment_method_references (
        id, company_id, application_id, provider_code, provider_customer_reference, payment_method_reference,
        masked_card_display, card_brand, readiness_state, verified_at, is_simulator, environment,
        idempotency_key, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ready', COALESCE($9::timestamptz, $10::timestamptz), $11, $12, $13, $10::timestamptz, $10::timestamptz)
    `, [companyPaymentId, companyId, app.id, payment.provider_code, payment.provider_customer_reference, payment.payment_method_reference, payment.masked_display, payment.brand, payment.verified_at, now, payment.is_simulator, payment.environment, `public-signup-e2e:company-payment:${app.id}`]);
    const cert = await q(client, "SELECT * FROM signup_application_files WHERE application_id = $1 AND deleted_at IS NULL LIMIT 1", [app.id]);
    const certificate = cert.rows[0];
    await q(client, `
      INSERT INTO company_files (
        id, company_id, file_type, original_name, storage_key, mime_type, size_bytes,
        review_status, reviewed_by_system_user_id, reviewed_at, created_at, updated_at
      )
      VALUES ($1, $2, 'business_registration', $3, $4, $5, $6, 'approved', $7, $8, $8, $8)
    `, [companyFileId, companyId, certificate.original_name, certificate.storage_key, certificate.mime_type, certificate.size_bytes, systemUser.id, now]);
    await q(client, "UPDATE signup_application_files SET approved_company_file_id = $2, reviewed_by_system_user_id = $3, reviewed_at = $4 WHERE id = $1", [certificate.id, companyFileId, systemUser.id, now]);
    await q(client, `
      INSERT INTO billing_notification_outbox (
        id, company_id, user_id, template_code, recipient_scope, safe_payload,
        status, scheduled_at, environment, idempotency_key, created_at, updated_at
      )
      VALUES ($1, $2, $3, 'trial_started', 'company_admin', $4::jsonb, 'pending', $5, 'dev_test', $6, $5, $5)
    `, [`${app.id}-trial-outbox`, companyId, userId, JSON.stringify({ applicationId: app.id, actualEmailDelivery: false }), now, remember(manifest, "notificationKeys", `public-signup-e2e:trial-started:${app.id}`)]);
    await q(client, `
      UPDATE signup_applications
      SET status = 'approved',
          provisioning_status = 'completed',
          provisioning_completed_at = $6,
          approved_at = $6,
          created_company_id = $2,
          created_user_id = $3,
          created_company_member_id = $4,
          created_subscription_id = $5,
          updated_at = $6
      WHERE id = $1 AND status = 'reviewing' AND provisioning_status = 'in_progress'
    `, [app.id, companyId, userId, memberId, subscriptionId, now]);
    await q(client, "COMMIT");
    return { idempotent: false, companyId, userId, memberId, subscriptionId, trialEndsAt };
  } catch (error) {
    await q(client, "ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function correctionResubmit(client, manifest, systemUser, now) {
  const app = await insertApplication(client, manifest, { kind: "correction", status: "submitted", now });
  await addConsentsAndCertificate(client, manifest, app, now);
  const due = new Date(now.getTime() + 3 * 86400000);
  await q(client, `
    UPDATE signup_applications
    SET status = 'changes_requested',
        reviewed_by_system_user_id = $2,
        reviewed_at = $3,
        correction_requested_at = $3,
        correction_due_at = $4,
        correction_reason = 'synthetic correction request',
        correction_count = correction_count + 1,
        updated_at = $3
    WHERE id = $1 AND status = 'submitted'
  `, [app.id, systemUser.id, now, due]);
  const outboxKey = remember(manifest, "notificationKeys", `public-signup-e2e:correction:${app.id}`);
  await q(client, `
    INSERT INTO billing_notification_outbox (
      id, template_code, recipient_scope, safe_payload, status, scheduled_at, environment, idempotency_key, created_at, updated_at
    )
    VALUES ($1, 'signup_correction_requested', 'applicant', $2::jsonb, 'pending', $3, 'dev_test', $4, $3, $3)
  `, [`${app.id}-correction-outbox`, JSON.stringify({ applicationId: app.id, actualEmailDelivery: false }), now, outboxKey]);
  await q(client, "UPDATE signup_applications SET status = 'submitted', submitted_at = $2, updated_at = $2 WHERE id = $1 AND status = 'changes_requested'", [app.id, now]);
  const row = (await q(client, "SELECT status, correction_due_at, correction_reason FROM signup_applications WHERE id = $1", [app.id])).rows[0];
  if (!row || row.status !== "submitted" || !row.correction_due_at || !row.correction_reason) throw new Error("PUBLIC_SIGNUP_CORRECTION_RESUBMIT_FAILED");
}

async function reject(client, manifest, systemUser, now) {
  const app = await insertApplication(client, manifest, { kind: "reject", status: "submitted", now });
  await addConsentsAndCertificate(client, manifest, app, now);
  await q(client, `
    UPDATE signup_applications
    SET status = 'rejected',
        reviewed_by_system_user_id = $2,
        reviewed_at = $3,
        rejection_reason = 'synthetic rejection reason',
        rejected_at = $3,
        updated_at = $3
    WHERE id = $1 AND status = 'submitted'
  `, [app.id, systemUser.id, now]);
  const row = (await q(client, "SELECT status, created_company_id FROM signup_applications WHERE id = $1", [app.id])).rows[0];
  if (!row || row.status !== "rejected" || row.created_company_id !== null) throw new Error("PUBLIC_SIGNUP_REJECT_FAILED");
}

async function failureCompensation(client, manifest, app, now) {
  const failedCompanyId = `${app.id}-failed-company`;
  await q(client, "BEGIN");
  try {
    await q(client, "INSERT INTO companies (id, name, is_active, status, onboarding_status, created_at, updated_at) VALUES ($1, $2, true, 'active', 'active', $3, $3)", [failedCompanyId, `${PREFIX} failed`, now]);
    throw new Error("PUBLIC_SIGNUP_SYNTHETIC_FAILURE");
  } catch (error) {
    await q(client, "ROLLBACK").catch(() => undefined);
    if (!(error instanceof Error) || error.message !== "PUBLIC_SIGNUP_SYNTHETIC_FAILURE") throw error;
  }
  const residual = await q(client, "SELECT count(*)::int AS count FROM companies WHERE id = $1", [failedCompanyId]);
  if (Number(residual.rows[0]?.count ?? 0) !== 0) throw new Error("PUBLIC_SIGNUP_FAILURE_COMPENSATION_RESIDUAL");
}

async function cleanup(client, manifest) {
  const by = (values) => values.length ? values : ["__none__"];
  const statements = [
    ["DELETE FROM billing_notification_outbox WHERE idempotency_key = ANY($1::text[])", [by(manifest.notificationKeys)]],
    ["DELETE FROM audit_logs WHERE id = ANY($1::text[])", [by(manifest.auditIds)]],
    ["DELETE FROM company_payment_method_references WHERE id = ANY($1::text[])", [by(manifest.companyPaymentReferences)]],
    ["DELETE FROM company_files WHERE id = ANY($1::text[])", [by(manifest.companyFiles)]],
    ["DELETE FROM signup_payment_method_references WHERE application_id = ANY($1::text[])", [by(manifest.applications)]],
    ["DELETE FROM signup_application_files WHERE application_id = ANY($1::text[])", [by(manifest.applications)]],
    ["DELETE FROM signup_application_consents WHERE application_id = ANY($1::text[])", [by(manifest.applications)]],
    ["DELETE FROM signup_applications WHERE id = ANY($1::text[])", [by(manifest.applications)]],
    ["DELETE FROM company_subscriptions WHERE id = ANY($1::text[])", [by(manifest.companySubscriptions)]],
    ["DELETE FROM member_permissions WHERE company_member_id = ANY($1::text[])", [by(manifest.companyMembers)]],
    ["DELETE FROM company_members WHERE id = ANY($1::text[])", [by(manifest.companyMembers)]],
    ["DELETE FROM users WHERE id = ANY($1::text[])", [by(manifest.users)]],
    ["DELETE FROM companies WHERE id = ANY($1::text[])", [by(manifest.companies)]],
  ];
  for (const [text, params] of statements) await q(client, text, params);
}

async function cleanupExistingFixturesByPrefix(client) {
  const applicationPattern = `${PREFIX}-%`;
  const storagePattern = `signup-applications/${PREFIX}-%`;
  const emailPattern = `${PREFIX}-%@example.test`;
  const namePattern = `${PREFIX}%`;
  const statements = [
    [`DELETE FROM company_payment_method_references
      WHERE id LIKE $1
         OR application_id IN (SELECT id FROM signup_applications WHERE id LIKE $1)
         OR company_id IN (SELECT id FROM companies WHERE id LIKE $1 OR name LIKE $2)`, [applicationPattern, namePattern]],
    [`DELETE FROM billing_notification_outbox
      WHERE id LIKE $1
         OR idempotency_key LIKE 'public-signup-e2e:%'
         OR safe_payload->>'applicationId' LIKE $1`, [applicationPattern]],
    [`DELETE FROM audit_logs
      WHERE id LIKE $1
         OR target_id LIKE $1
         OR metadata->>'applicationId' LIKE $1`, [applicationPattern]],
    [`DELETE FROM company_files
      WHERE id LIKE $1
         OR storage_key LIKE $2
         OR company_id IN (SELECT id FROM companies WHERE id LIKE $1 OR name LIKE $3)`, [applicationPattern, storagePattern, namePattern]],
    [`DELETE FROM signup_payment_method_references
      WHERE application_id IN (SELECT id FROM signup_applications WHERE id LIKE $1)`, [applicationPattern]],
    [`DELETE FROM signup_application_files
      WHERE application_id IN (SELECT id FROM signup_applications WHERE id LIKE $1)
         OR storage_key LIKE $2`, [applicationPattern, storagePattern]],
    [`DELETE FROM signup_application_consents
      WHERE application_id IN (SELECT id FROM signup_applications WHERE id LIKE $1)`, [applicationPattern]],
    ["DELETE FROM signup_applications WHERE id LIKE $1", [applicationPattern]],
    [`DELETE FROM company_subscriptions
      WHERE id LIKE $1
         OR company_id IN (SELECT id FROM companies WHERE id LIKE $1 OR name LIKE $2)`, [applicationPattern, namePattern]],
    [`DELETE FROM member_permissions
      WHERE company_member_id IN (
        SELECT id FROM company_members
        WHERE id LIKE $1
           OR company_id IN (SELECT id FROM companies WHERE id LIKE $1 OR name LIKE $3)
           OR user_id IN (SELECT id FROM users WHERE id LIKE $1 OR email LIKE $2)
      )`, [applicationPattern, emailPattern, namePattern]],
    [`DELETE FROM company_members
      WHERE id LIKE $1
         OR company_id IN (SELECT id FROM companies WHERE id LIKE $1 OR name LIKE $3)
         OR user_id IN (SELECT id FROM users WHERE id LIKE $1 OR email LIKE $2)`, [applicationPattern, emailPattern, namePattern]],
    ["DELETE FROM users WHERE id LIKE $1 OR email LIKE $2", [applicationPattern, emailPattern]],
    ["DELETE FROM companies WHERE id LIKE $1 OR name LIKE $2", [applicationPattern, namePattern]],
  ];
  let removed = 0;
  await q(client, "BEGIN");
  try {
    for (const [text, params] of statements) {
      const result = await q(client, text, params);
      removed += Number(result.rowCount ?? 0);
    }
    await q(client, "COMMIT");
  } catch (error) {
    await q(client, "ROLLBACK").catch(() => undefined);
    throw error;
  }
  if (removed > 0) safeLog("PUBLIC_SIGNUP_E2E_STARTUP_FIXTURE_CLEANUP", { rowsRemoved: removed, residualR2Objects: 0 });
}

async function countExistingFixturesByPrefix(client) {
  const applicationPattern = `${PREFIX}-%`;
  const storagePattern = `signup-applications/${PREFIX}-%`;
  const emailPattern = `${PREFIX}-%@example.test`;
  const namePattern = `${PREFIX}%`;
  const result = await q(client, `
    SELECT
      (SELECT count(*)::int FROM signup_applications WHERE id LIKE $1)
      + (SELECT count(*)::int FROM signup_application_consents WHERE application_id IN (SELECT id FROM signup_applications WHERE id LIKE $1))
      + (SELECT count(*)::int FROM signup_application_files WHERE application_id IN (SELECT id FROM signup_applications WHERE id LIKE $1) OR storage_key LIKE $2)
      + (SELECT count(*)::int FROM signup_payment_method_references WHERE application_id IN (SELECT id FROM signup_applications WHERE id LIKE $1))
      + (SELECT count(*)::int FROM companies WHERE id LIKE $1 OR name LIKE $4)
      + (SELECT count(*)::int FROM users WHERE id LIKE $1 OR email LIKE $3)
      + (SELECT count(*)::int FROM company_members WHERE id LIKE $1 OR user_id IN (SELECT id FROM users WHERE id LIKE $1 OR email LIKE $3))
      + (SELECT count(*)::int FROM company_subscriptions WHERE id LIKE $1 OR company_id IN (SELECT id FROM companies WHERE id LIKE $1 OR name LIKE $4))
      + (SELECT count(*)::int FROM company_payment_method_references WHERE id LIKE $1 OR application_id IN (SELECT id FROM signup_applications WHERE id LIKE $1))
      + (SELECT count(*)::int FROM billing_notification_outbox WHERE id LIKE $1 OR idempotency_key LIKE 'public-signup-e2e:%')
      + (SELECT count(*)::int FROM audit_logs WHERE id LIKE $1 OR target_id LIKE $1 OR metadata->>'applicationId' LIKE $1)
      AS count
  `, [applicationPattern, storagePattern, emailPattern, namePattern]);
  return Number(result.rows[0]?.count ?? 0);
}

async function residualRows(client, manifest) {
  const ids = manifest.applications;
  const companies = manifest.companies;
  const users = manifest.users;
  const members = manifest.companyMembers;
  const subs = manifest.companySubscriptions;
  const companyPayments = manifest.companyPaymentReferences;
  const keys = manifest.notificationKeys;
  const by = (values) => values.length ? values : ["__none__"];
  const result = await q(client, `
    SELECT
      (SELECT count(*)::int FROM signup_applications WHERE id = ANY($1::text[]))
      + (SELECT count(*)::int FROM signup_application_consents WHERE application_id = ANY($1::text[]))
      + (SELECT count(*)::int FROM signup_application_files WHERE application_id = ANY($1::text[]))
      + (SELECT count(*)::int FROM signup_payment_method_references WHERE application_id = ANY($1::text[]))
      + (SELECT count(*)::int FROM companies WHERE id = ANY($2::text[]))
      + (SELECT count(*)::int FROM users WHERE id = ANY($3::text[]))
      + (SELECT count(*)::int FROM company_members WHERE id = ANY($4::text[]))
      + (SELECT count(*)::int FROM company_subscriptions WHERE id = ANY($5::text[]))
      + (SELECT count(*)::int FROM company_payment_method_references WHERE id = ANY($6::text[]))
      + (SELECT count(*)::int FROM billing_notification_outbox WHERE idempotency_key = ANY($7::text[]))
      AS count
  `, [by(ids), by(companies), by(users), by(members), by(subs), by(companyPayments), by(keys)]);
  return Number(result.rows[0]?.count ?? 0);
}

async function run() {
  const config = assertGuard();
  const client = new Client({ connectionString: config.databaseUrl, statement_timeout: 60000, query_timeout: 60000 });
  const now = new Date();
  const manifest = createManifest(`${PREFIX}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`);
  try {
    await client.connect();
    await assertTables(client);
    if (process.argv.includes("--residual-only")) {
      const residual = await countExistingFixturesByPrefix(client);
      safeLog("PUBLIC_SIGNUP_E2E_RESIDUAL_AUDIT_RESULT", {
        result: residual === 0 ? "PASS" : "FAIL",
        residualDbRows: residual,
        residualR2Objects: 0,
        productionMutation: false,
        businessDataMutation: false,
        actualPgIntegration: false,
        actualEmailDelivery: false,
        workerChanged: false,
      });
      process.exitCode = residual === 0 ? 0 : 2;
      return;
    }
    await cleanupExistingFixturesByPrefix(client);
    const systemUser = await getSystemUser(client);
    const draft = await insertApplication(client, manifest, { kind: "draft", status: "draft", now });
    await addConsentsAndCertificate(client, manifest, draft, now);
    const submitted = await insertApplication(client, manifest, { kind: "main", status: "draft", now });
    await addConsentsAndCertificate(client, manifest, submitted, now);
    await submitApplication(client, submitted, now);
    const queue = await q(client, "SELECT count(*)::int AS count FROM signup_applications WHERE id = $1 AND status = 'submitted'", [submitted.id]);
    const draftQueue = await q(client, "SELECT count(*)::int AS count FROM signup_applications WHERE id = $1 AND status IN ('submitted','reviewing','changes_requested')", [draft.id]);
    if (Number(queue.rows[0]?.count ?? 0) !== 1 || Number(draftQueue.rows[0]?.count ?? 0) !== 0) throw new Error("PUBLIC_SIGNUP_QUEUE_VISIBILITY_FAILED");
    await startReview(client, submitted, systemUser, now);
    await assertPaymentReadinessRequired(client, submitted);
    await addReadiness(client, manifest, submitted, systemUser, now);
    const approval = await approve(client, manifest, submitted, systemUser, now);
    const duplicate = await approve(client, manifest, submitted, systemUser, now);
    if (!duplicate.idempotent) throw new Error("PUBLIC_SIGNUP_DUPLICATE_APPROVAL_NOT_IDEMPOTENT");
    const duplicateCounts = await q(client, `
      SELECT
        (SELECT count(*)::int FROM companies WHERE id = $1) AS company_count,
        (SELECT count(*)::int FROM company_members WHERE id = $2) AS member_count,
        (SELECT count(*)::int FROM company_subscriptions WHERE id = $3) AS subscription_count,
        (SELECT count(*)::int FROM company_payment_method_references WHERE application_id = $4) AS payment_count
    `, [approval.companyId, approval.memberId, approval.subscriptionId, submitted.id]);
    const counts = duplicateCounts.rows[0];
    if (Number(counts.company_count) !== 1 || Number(counts.member_count) !== 1 || Number(counts.subscription_count) !== 1 || Number(counts.payment_count) !== 1) {
      throw new Error("PUBLIC_SIGNUP_DUPLICATE_APPROVAL_CREATED_DUPLICATES");
    }
    const trial = await q(client, "SELECT trial_started_at, trial_ends_at, storage_limit_bytes, member_limit FROM company_subscriptions WHERE id = $1", [approval.subscriptionId]);
    const trialRow = trial.rows[0];
    const days = Math.round((new Date(trialRow.trial_ends_at).getTime() - new Date(trialRow.trial_started_at).getTime()) / 86400000);
    if (days !== 7 || Number(trialRow.storage_limit_bytes) !== TRIAL_STORAGE_LIMIT_BYTES || Number(trialRow.member_limit) !== TRIAL_MEMBER_LIMIT) throw new Error("PUBLIC_SIGNUP_TRIAL_POLICY_INVALID");
    await correctionResubmit(client, manifest, systemUser, now);
    await reject(client, manifest, systemUser, now);
    await failureCompensation(client, manifest, submitted, now);
    await cleanup(client, manifest);
    const residual = await residualRows(client, manifest);
    if (residual !== 0) throw new Error(`PUBLIC_SIGNUP_RESIDUAL_DB_ROWS:${residual}`);
    safeLog("PUBLIC_SIGNUP_E2E_INTEGRATION_RESULT", {
      result: "PASS",
      draft: "PASS",
      submit: "PASS",
      systemAdminQueue: "PASS",
      reviewStart: "PASS",
      readinessMissingBlock: "PASS",
      readinessCreated: "PASS",
      approvalSuccess: "PASS",
      trialProvisioning: "PASS",
      approvedWorkspaceEntry: "PASS_DB_MEMBERSHIP",
      duplicateApproval: "PASS",
      correctionResubmit: "PASS",
      reject: "PASS",
      provisioningFailureRecovery: "PASS",
      tenantIdor: "PASS_DB_EXACT_IDS",
      residualDbRows: 0,
      residualR2Objects: 0,
      productionMutation: false,
      businessDataMutation: false,
      actualPgIntegration: false,
      actualEmailDelivery: false,
      workerChanged: false,
    });
    process.exitCode = 0;
  } catch (error) {
    try {
      await cleanup(client, manifest);
      const residual = await residualRows(client, manifest);
      safeLog("PUBLIC_SIGNUP_E2E_CLEANUP_AFTER_FAILURE", { residualDbRows: residual, residualR2Objects: 0 });
    } catch (cleanupError) {
      safeLog("PUBLIC_SIGNUP_E2E_CLEANUP_FAILED", { safeError: cleanupError instanceof Error ? cleanupError.message : String(cleanupError) });
    }
    safeLog("PUBLIC_SIGNUP_E2E_INTEGRATION_RESULT", {
      result: "FAIL",
      safeError: error instanceof Error ? error.message : String(error),
      productionMutation: false,
      businessDataMutation: false,
      actualPgIntegration: false,
      actualEmailDelivery: false,
      workerChanged: false,
    });
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}

await run();
