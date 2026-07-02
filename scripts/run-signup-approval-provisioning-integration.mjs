import crypto from "node:crypto";
import { Client } from "pg";

const CONFIRMATION_PHRASE = "RUN_SIGNUP_APPROVAL_PROVISIONING_DEV_TEST";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const RESULT_OK = 0;
const RESULT_ERROR = 1;
const RESULT_BLOCKED = 2;
const FIXTURE_PREFIX = "signup-approval-it";
const CLEANUP_ONLY = process.argv.includes("--cleanup-leftovers") || process.env.WAFL_SIGNUP_APPROVAL_PROVISIONING_CLEANUP_ONLY === "1";
const SCHEMA_DIAGNOSTIC = process.argv.includes("--schema-diagnostic") || process.env.WAFL_SIGNUP_APPROVAL_PROVISIONING_SCHEMA_DIAGNOSTIC === "1";
const TRIAL_STORAGE_LIMIT_BYTES = 100 * 1024 * 1024;
const TRIAL_MEMBER_LIMIT = 3;
const REQUIRED_CONSENTS = [
  ["terms_of_service", "wafl_terms_of_service", "0.24.26"],
  ["privacy_policy", "wafl_privacy_policy", "0.24.26"],
];

const env = (name) => {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
};

const sha256 = (value) => crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
const shortHash = (value) => sha256(value).slice(0, 12);

function safeLog(event, payload = {}) {
  console.log(JSON.stringify({ event, ...payload }));
}

function failBlocked(reason, payload = {}) {
  safeLog("SIGNUP_APPROVAL_PROVISIONING_INTEGRATION_BLOCKED", { reason, ...payload });
  process.exitCode = RESULT_BLOCKED;
  return null;
}

function getRuntime() {
  return env("WAFL_SERVER_RUNTIME_MODE") || env("NEXT_PUBLIC_APP_RUNTIME_MODE") || env("NODE_ENV") || "unknown";
}

function getDatabaseFingerprint(databaseUrl) {
  const url = new URL(databaseUrl);
  return shortHash(`${url.hostname}/${url.pathname.replace(/^\/+/, "")}`);
}

function assertGuard() {
  const runtime = getRuntime();
  if (!ALLOWED_RUNTIMES.has(runtime)) return failBlocked("runtime-not-dev-test", { runtime });
  if (env("WAFL_DB_AUDIT_APPROVED") !== "1") return failBlocked("db-approval-missing", { runtime });
  if (env("WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING") !== "1") {
    return failBlocked("provisioning-flag-missing", { runtime });
  }
  if (env("WAFL_SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION") !== CONFIRMATION_PHRASE) {
    return failBlocked("confirmation-mismatch", { runtime });
  }
  const databaseUrl = env("DATABASE_URL");
  if (!databaseUrl) return failBlocked("database-url-missing", { runtime });

  let dbFingerprint = "";
  try {
    dbFingerprint = getDatabaseFingerprint(databaseUrl);
  } catch {
    return failBlocked("database-fingerprint-failed", { runtime });
  }
  if (!env("WAFL_APPROVED_DB_FINGERPRINT") || dbFingerprint !== env("WAFL_APPROVED_DB_FINGERPRINT")) {
    return failBlocked("db-fingerprint-mismatch", { runtime, dbFingerprint });
  }
  safeLog("SIGNUP_APPROVAL_PROVISIONING_GUARD_PASS", {
    runtime,
    dbFingerprint,
    mutation: "dev-test-db-fixture-only",
    r2Mutation: "none",
  });
  return { runtime, databaseUrl, dbFingerprint };
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function createManifest() {
  const runId = `${FIXTURE_PREFIX}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  return {
    runId,
    ids: new Set(),
    companies: new Set(),
    users: new Set(),
    members: new Set(),
    subscriptions: new Set(),
    companyFiles: new Set(),
    applications: new Set(),
    rowsRemoved: 0,
    residualRows: null,
    result: {
      newApplicant: "NOT_RUN",
      idempotency: "NOT_RUN",
      identityConflict: "NOT_RUN",
      existingUserReuse: "NOT_RUN",
      trial: "NOT_RUN",
      applicantWorkspace: "NOT_RUN",
    },
  };
}

function safeErrorCode(error) {
  if (!(error instanceof Error)) return "SIGNUP_APPROVAL_PROVISIONING_FAILED";
  if (typeof error.code === "string" && error.code.length > 0) return `${error.message}:${error.code}`;
  return error.message;
}

function remember(set, value) {
  if (value) set.add(value);
  return value;
}

async function q(client, text, params = []) {
  return client.query(text, params);
}

async function insertApplicationFixture(client, manifest, input = {}) {
  const id = input.applicationId ?? `${manifest.runId}-app-${crypto.randomBytes(3).toString("hex")}`;
  const googleSub = input.googleSub ?? `${id}-google-sub`;
  const email = input.email ?? `${id}@example.test`;
  const businessNumber = input.businessNumber ?? String(1000000000 + Math.floor(Math.random() * 899999999)).padStart(10, "0").slice(0, 10);
  const companyName = input.companyName ?? `${FIXTURE_PREFIX} company ${shortHash(id)}`;
  await q(client, `
    INSERT INTO signup_applications (
      id, status, google_sub, email, email_normalized, email_verified, applicant_name,
      requested_company_name, business_name, business_registration_number,
      business_registration_number_normalized, requested_plan_code, submitted_at,
      reviewed_by_system_user_id, reviewed_at
    )
    VALUES ($1, 'reviewing', $2, $3, lower($3), true, 'Signup Approval Fixture',
      $4, $5, $6, $6, 'lite', $7, $8, $7)
  `, [id, googleSub, email, companyName, `${companyName} business`, businessNumber, input.now, input.systemUserId]);
  remember(manifest.applications, id);

  for (const [consentType, policyCode, policyVersion] of REQUIRED_CONSENTS) {
    await q(client, `
      INSERT INTO signup_application_consents (
        application_id, consent_type, policy_code, policy_version,
        agreed_at, agreed_email_normalized, agreed_google_sub
      )
      VALUES ($1, $2, $3, $4, $5, lower($6), $7)
    `, [id, consentType, policyCode, policyVersion, input.now, email, googleSub]);
  }

  const fileId = `${id}-cert`;
  await q(client, `
    INSERT INTO signup_application_files (
      id, application_id, file_type, original_name, storage_key, mime_type, size_bytes, uploaded_at
    )
    VALUES ($1, $2, 'business_registration', 'signup-approval-fixture.pdf', $3, 'application/pdf', 128, $4)
  `, [fileId, id, `signup-applications/${id}/business-registration/${fileId}.pdf`, input.now]);
  await q(client, `
    INSERT INTO signup_payment_method_references (
      id, application_id, provider_code, provider_customer_reference, payment_method_reference,
      masked_display, brand, readiness_state, verified_at, is_simulator, environment,
      created_by_system_user_id, idempotency_key, created_at, updated_at
    )
    VALUES ($1, $2, 'fake_dev_test', 'signup-approval-fixture-customer', 'signup-approval-fixture-reference',
      'FAKE-DEV-TEST', 'SIMULATOR', 'ready', $3, true, 'dev_test', $4, $5, $3, $3)
    ON CONFLICT (idempotency_key) DO NOTHING
  `, [`${id}-payment-ready`, id, input.now, input.systemUserId, `signup-approval-payment-readiness:${id}`]);
  return { id, googleSub, email, businessNumber };
}

async function getSystemUserId(client) {
  const result = await q(client, "SELECT id FROM system_users WHERE is_active = true ORDER BY created_at ASC LIMIT 1");
  const id = result.rows[0]?.id;
  if (!id) throw new Error("SYSTEM_USER_FIXTURE_REQUIRED");
  return id;
}

async function approveApplication(client, manifest, input) {
  await q(client, "BEGIN");
  try {
    const locked = await q(client, `
      SELECT *
      FROM signup_applications
      WHERE id = $1
      FOR UPDATE
    `, [input.applicationId]);
    const app = locked.rows[0];
    if (!app) throw new Error("SIGNUP_APPROVAL_STATUS_CONFLICT");
    if (app.status === "approved" && app.provisioning_status === "completed") {
      await q(client, "COMMIT");
      return {
        idempotent: true,
        companyId: app.created_company_id,
        userId: app.created_user_id,
        companyMemberId: app.created_company_member_id,
        subscriptionId: app.created_subscription_id,
      };
    }
    if (app.status !== "reviewing" || app.provisioning_status !== "not_started") {
      throw new Error("SIGNUP_APPROVAL_STATUS_CONFLICT");
    }
    const consent = await q(client, `
      SELECT count(*)::int AS count
      FROM signup_application_consents
      WHERE application_id = $1 AND revoked_at IS NULL
    `, [input.applicationId]);
    if (Number(consent.rows[0]?.count ?? 0) < REQUIRED_CONSENTS.length) throw new Error("SIGNUP_APPROVAL_CONSENT_INCOMPLETE");
    const cert = await q(client, `
      SELECT id, original_name, storage_key, mime_type, size_bytes, approved_company_file_id
      FROM signup_application_files
      WHERE application_id = $1 AND file_type = 'business_registration' AND deleted_at IS NULL
      LIMIT 1
    `, [input.applicationId]);
    const certificate = cert.rows[0];
    if (!certificate) throw new Error("SIGNUP_APPROVAL_CERTIFICATE_MISSING");
    const emailConflict = await q(client, `
      SELECT EXISTS (
        SELECT 1 FROM users
        WHERE lower(email) = $1 AND (google_sub IS NULL OR google_sub <> $2)
      ) AS exists
    `, [app.email_normalized, app.google_sub]);
    if (emailConflict.rows[0]?.exists === true) throw new Error("SIGNUP_APPROVAL_IDENTITY_CONFLICT");
    const paymentReadiness = await q(client, `
      SELECT id, provider_code, provider_customer_reference, payment_method_reference, masked_display, brand, verified_at, is_simulator, environment
      FROM signup_payment_method_references
      WHERE application_id = $1
        AND readiness_state = 'ready'
        AND revoked_at IS NULL
      ORDER BY verified_at DESC NULLS LAST, updated_at DESC, id DESC
      LIMIT 1
    `, [input.applicationId]);
    const payment = paymentReadiness.rows[0];
    if (!payment) throw new Error("SIGNUP_APPROVAL_PAYMENT_READINESS_REQUIRED");

    const started = await q(client, `
      UPDATE signup_applications
      SET provisioning_status = 'in_progress',
          provisioning_started_at = COALESCE(provisioning_started_at, $3),
          provisioning_attempt_count = provisioning_attempt_count + 1,
          reviewed_by_system_user_id = $2,
          reviewed_at = $3,
          updated_at = $3
      WHERE id = $1 AND status = 'reviewing' AND provisioning_status = 'not_started'
    `, [input.applicationId, input.systemUserId, input.now]);
    if (started.rowCount !== 1) throw new Error("SIGNUP_PROVISIONING_START_CONFLICT");

    const trialEndsAt = addDays(input.now, 7);
    const companyId = remember(manifest.companies, `${input.applicationId}-company`);
    await q(client, `
      INSERT INTO companies (
        id, name, business_name, business_registration_number, requested_plan_code, plan_code,
        is_active, status, onboarding_status, billing_status, subscription_status,
        trial_started_at, trial_ends_at, storage_limit_bytes, member_limit, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, 'trial', true, 'active', 'active', 'trial', 'trialing', $6, $7, $8, $9, $6, $6)
    `, [companyId, app.requested_company_name, app.business_name, app.business_registration_number, app.requested_plan_code, input.now, trialEndsAt, TRIAL_STORAGE_LIMIT_BYTES, TRIAL_MEMBER_LIMIT]);

    let userId;
    const existingUser = await q(client, "SELECT id, company_id, role, email, google_sub FROM users WHERE google_sub = $1 LIMIT 1", [app.google_sub]);
    if (existingUser.rows[0]) {
      userId = existingUser.rows[0].id;
      await q(client, `
        UPDATE users
        SET email = COALESCE(email, $2),
            name = $3,
            display_name = COALESCE(display_name, $3),
            google_picture_url = COALESCE($4, google_picture_url),
            avatar_url = COALESCE($4, avatar_url),
            auth_provider = COALESCE(auth_provider, 'google'),
            provider_user_id = COALESCE(provider_user_id, $5),
            email_verified = true,
            status = 'active',
            is_active = true,
            updated_at = $6
        WHERE id = $1
      `, [userId, app.email, app.applicant_name, app.google_picture_url, app.google_sub, input.now]);
    } else {
      userId = remember(manifest.users, `${input.applicationId}-user`);
      await q(client, `
        INSERT INTO users (
          id, company_id, email, name, display_name, google_sub, google_picture_url, avatar_url,
          auth_provider, provider_user_id, email_verified, role, status, is_active, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $4, $5, $6, $6, 'google', $5, true, 'admin', 'active', true, $7, $7)
      `, [userId, companyId, app.email, app.applicant_name, app.google_sub, app.google_picture_url, input.now]);
    }

    let memberId = remember(manifest.members, `${input.applicationId}-member`);
    const memberResult = await q(client, `
      INSERT INTO company_members (id, company_id, user_id, status, role_template_code, display_name, approved_at, created_at, updated_at)
      VALUES ($1, $2, $3, 'approved', 'company_admin', $4, $5, $5, $5)
      ON CONFLICT (company_id, user_id)
      DO UPDATE SET status = 'approved', role_template_code = 'company_admin', approved_at = COALESCE(company_members.approved_at, EXCLUDED.approved_at), updated_at = EXCLUDED.updated_at
      RETURNING id
    `, [memberId, companyId, userId, app.applicant_name, input.now]);
    memberId = remember(manifest.members, memberResult.rows[0]?.id ?? memberId);

    const permissions = [
      "workorder.read", "workorder.create", "workorder.update", "workorder.delete", "workorder.restore",
      "workorder.status.review", "workorder.status.order", "workorder.status.inspect", "workorder.status.complete",
      "material.order.request", "material.order.place", "partner.read", "partner.create", "partner.update",
      "partner.delete", "partner.manage", "storage.read", "storage.delete.request", "storage.restore",
      "stats.read", "settings.read", "settings.manage", "standards.read", "standards.create",
      "standards.update", "standards.delete", "standards.manage", "member.read", "member.invite",
      "member.approve", "member.reject", "member.permission.update", "member.suspend",
      "audit.read.company", "personal_settings.manage",
    ];
    for (const permission of permissions) {
      await q(client, `
        INSERT INTO member_permissions (company_member_id, permission_code, is_enabled, granted_by, granted_at)
        VALUES ($1, $2, true, NULL, $3)
        ON CONFLICT (company_member_id, permission_code)
        DO UPDATE SET is_enabled = true, granted_at = EXCLUDED.granted_at, updated_at = now()
      `, [memberId, permission, input.now]);
    }
    await q(client, "UPDATE companies SET owner_user_id = $2, updated_at = $3 WHERE id = $1", [companyId, userId, input.now]);

    const subscriptionId = remember(manifest.subscriptions, `${input.applicationId}-subscription`);
    await q(client, `
      INSERT INTO company_subscriptions (
        id, company_id, plan_code, status, trial_started_at, trial_ends_at,
        current_period_started_at, current_period_ends_at, storage_limit_bytes, member_limit, created_at, updated_at
      )
      VALUES ($1, $2, 'trial', 'trialing', $3, $4, $3, $4, $5, $6, $3, $3)
    `, [subscriptionId, companyId, input.now, trialEndsAt, TRIAL_STORAGE_LIMIT_BYTES, TRIAL_MEMBER_LIMIT]);
    await q(client, `
      INSERT INTO company_payment_method_references (
        id, company_id, application_id, provider_code, provider_customer_reference, payment_method_reference,
        masked_card_display, card_brand, readiness_state, verified_at, is_simulator, environment,
        idempotency_key, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ready', COALESCE($9, $10), $11, $12, $13, $10, $10)
      ON CONFLICT (idempotency_key) DO NOTHING
    `, [
      `${input.applicationId}-company-payment-ready`,
      companyId,
      app.id,
      payment.provider_code,
      payment.provider_customer_reference,
      payment.payment_method_reference,
      payment.masked_display,
      payment.brand,
      payment.verified_at,
      input.now,
      payment.is_simulator,
      payment.environment,
      `signup-approval-payment-reference:${app.id}`,
    ]);

    const companyFileId = remember(manifest.companyFiles, `${input.applicationId}-company-file`);
    await q(client, `
      INSERT INTO company_files (
        id, company_id, file_type, original_name, storage_key, mime_type, size_bytes,
        review_status, reviewed_by_system_user_id, reviewed_at, created_at, updated_at
      )
      VALUES ($1, $2, 'business_registration', $3, $4, $5, $6, 'approved', $7, $8, $8, $8)
    `, [companyFileId, companyId, certificate.original_name, certificate.storage_key, certificate.mime_type, certificate.size_bytes, input.systemUserId, input.now]);
    await q(client, `
      UPDATE signup_application_files
      SET reviewed_by_system_user_id = $3, reviewed_at = $4, approved_company_file_id = $5
      WHERE id = $1 AND application_id = $2 AND deleted_at IS NULL
    `, [certificate.id, app.id, input.systemUserId, input.now, companyFileId]);

    const provisioned = await q(client, `
      UPDATE signup_applications
      SET created_company_id = $2,
          created_user_id = $3,
          created_company_member_id = $4,
          created_subscription_id = $5,
          updated_at = $6
      WHERE id = $1
        AND status = 'reviewing'
        AND provisioning_status = 'in_progress'
    `, [app.id, companyId, userId, memberId, subscriptionId, input.now]);
    if (provisioned.rowCount !== 1) throw new Error("SIGNUP_PROVISIONING_COMPLETE_CONFLICT");

    const completed = await q(client, `
      UPDATE signup_applications
      SET status = 'approved',
          provisioning_status = 'completed',
          provisioning_completed_at = $6,
          approved_at = $6,
          reviewed_by_system_user_id = $7,
          reviewed_at = COALESCE(reviewed_at, $6),
          updated_at = $6
      WHERE id = $1
        AND status = 'reviewing'
        AND provisioning_status = 'in_progress'
        AND created_company_id = $2
        AND created_user_id = $3
        AND created_company_member_id = $4
        AND created_subscription_id = $5
    `, [app.id, companyId, userId, memberId, subscriptionId, input.now, input.systemUserId]);
    if (completed.rowCount !== 1) throw new Error("SIGNUP_PROVISIONING_COMPLETE_CONFLICT");

    await q(client, `
      INSERT INTO audit_logs (id, actor_user_id, actor_role, company_id, target_type, target_id, event_type, severity, summary, metadata, created_at)
      VALUES ($1, $2, 'system_admin', $3, 'company', $3, 'signup.approved', 'high', 'signup approval integration fixture', $4::jsonb, $5)
    `, [`${input.applicationId}-audit`, input.systemUserId, companyId, JSON.stringify({ fixture: true, applicationId: app.id }), input.now]);

    await q(client, "COMMIT");
    return { idempotent: false, companyId, userId, companyMemberId: memberId, subscriptionId, trialEndsAt };
  } catch (error) {
    await q(client, "ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function verifyProvisioning(client, result) {
  const trial = await q(client, `
    SELECT plan_code, status, trial_started_at, trial_ends_at, storage_limit_bytes, member_limit
    FROM company_subscriptions
    WHERE id = $1
  `, [result.subscriptionId]);
  const row = trial.rows[0];
  if (!row) throw new Error("TRIAL_SUBSCRIPTION_MISSING");
  const started = new Date(row.trial_started_at);
  const ended = new Date(row.trial_ends_at);
  if (Math.round((ended.getTime() - started.getTime()) / 86400000) !== 7) throw new Error("TRIAL_DURATION_INVALID");
  if (Number(row.storage_limit_bytes) !== TRIAL_STORAGE_LIMIT_BYTES) throw new Error("TRIAL_STORAGE_INVALID");
  if (Number(row.member_limit) !== TRIAL_MEMBER_LIMIT) throw new Error("TRIAL_MEMBER_LIMIT_INVALID");

  const membership = await q(client, `
    SELECT cm.id, cm.status, cm.role_template_code, count(mp.permission_code)::int AS permission_count
    FROM company_members cm
    LEFT JOIN member_permissions mp ON mp.company_member_id = cm.id AND mp.is_enabled = true
    WHERE cm.id = $1
    GROUP BY cm.id, cm.status, cm.role_template_code
  `, [result.companyMemberId]);
  const member = membership.rows[0];
  if (!member || member.status !== "approved" || member.role_template_code !== "company_admin" || Number(member.permission_count) < 30) {
    throw new Error("COMPANY_ADMIN_PERMISSION_INVALID");
  }
}

async function countFixtureRows(client, manifest) {
  const ids = Array.from(new Set([
    ...manifest.applications,
    ...manifest.companyFiles,
    ...manifest.subscriptions,
    ...manifest.members,
    ...manifest.users,
    ...manifest.companies,
  ]));
  const result = await q(client, `
    SELECT
      (SELECT count(*)::int FROM audit_logs WHERE target_id = ANY($1::text[]) OR (metadata->>'applicationId') = ANY($1::text[]))
      + (SELECT count(*)::int FROM company_files WHERE id = ANY($1::text[]) OR company_id = ANY($1::text[]))
      + (SELECT count(*)::int FROM company_subscriptions WHERE id = ANY($1::text[]) OR company_id = ANY($1::text[]))
      + (SELECT count(*)::int FROM member_permissions WHERE company_member_id = ANY($1::text[]))
      + (SELECT count(*)::int FROM company_members WHERE id = ANY($1::text[]) OR company_id = ANY($1::text[]) OR user_id = ANY($1::text[]))
      + (SELECT count(*)::int FROM users WHERE id = ANY($1::text[]))
      + (SELECT count(*)::int FROM companies WHERE id = ANY($1::text[]))
      + (SELECT count(*)::int FROM signup_application_files WHERE application_id = ANY($1::text[]) OR id = ANY($1::text[]))
      + (SELECT count(*)::int FROM signup_application_consents WHERE application_id = ANY($1::text[]))
      + (SELECT count(*)::int FROM signup_applications WHERE id = ANY($1::text[]))
      AS count
  `, [ids]);
  return Number(result.rows[0]?.count ?? 0);
}

async function collectFixtureIdsByPrefix(client) {
  const result = await q(client, `
    WITH fixture_applications AS (
      SELECT id FROM signup_applications
      WHERE id LIKE $1 OR email_normalized LIKE $2 OR google_sub LIKE $1
    ),
    fixture_companies AS (
      SELECT id FROM companies
      WHERE id LIKE $1 OR name LIKE $1 OR business_name LIKE $1
    ),
    fixture_users AS (
      SELECT id FROM users
      WHERE id LIKE $1 OR lower(email) LIKE $2 OR google_sub LIKE $1
    ),
    fixture_members AS (
      SELECT id FROM company_members
      WHERE id LIKE $1
         OR company_id IN (SELECT id FROM fixture_companies)
         OR user_id IN (SELECT id FROM fixture_users)
    ),
    fixture_subscriptions AS (
      SELECT id FROM company_subscriptions
      WHERE id LIKE $1 OR company_id IN (SELECT id FROM fixture_companies)
    ),
    fixture_company_files AS (
      SELECT id FROM company_files
      WHERE id LIKE $1
         OR company_id IN (SELECT id FROM fixture_companies)
         OR storage_key LIKE $3
    )
    SELECT
      COALESCE((SELECT array_agg(id) FROM fixture_applications), ARRAY[]::text[]) AS applications,
      COALESCE((SELECT array_agg(id) FROM fixture_companies), ARRAY[]::text[]) AS companies,
      COALESCE((SELECT array_agg(id) FROM fixture_users), ARRAY[]::text[]) AS users,
      COALESCE((SELECT array_agg(id) FROM fixture_members), ARRAY[]::text[]) AS members,
      COALESCE((SELECT array_agg(id) FROM fixture_subscriptions), ARRAY[]::text[]) AS subscriptions,
      COALESCE((SELECT array_agg(id) FROM fixture_company_files), ARRAY[]::text[]) AS company_files
  `, [`${FIXTURE_PREFIX}%`, `${FIXTURE_PREFIX}%@example.test`, `signup-applications/${FIXTURE_PREFIX}%`]);
  const row = result.rows[0] ?? {};
  return {
    applications: row.applications ?? [],
    companies: row.companies ?? [],
    users: row.users ?? [],
    members: row.members ?? [],
    subscriptions: row.subscriptions ?? [],
    companyFiles: row.company_files ?? [],
  };
}

async function countFixtureRowsByPrefix(client) {
  const ids = await collectFixtureIdsByPrefix(client);
  const allIds = Array.from(new Set([
    ...ids.applications,
    ...ids.companies,
    ...ids.users,
    ...ids.members,
    ...ids.subscriptions,
    ...ids.companyFiles,
  ]));
  if (allIds.length === 0) return 0;
  const manifest = {
    applications: new Set(ids.applications),
    companyFiles: new Set(ids.companyFiles),
    subscriptions: new Set(ids.subscriptions),
    members: new Set(ids.members),
    users: new Set(ids.users),
    companies: new Set(ids.companies),
  };
  return countFixtureRows(client, manifest);
}

async function cleanupFixtureRowsByPrefix(client) {
  const ids = await collectFixtureIdsByPrefix(client);
  const appIds = ids.applications;
  const companyFileIds = ids.companyFiles;
  const subscriptionIds = ids.subscriptions;
  const memberIds = ids.members;
  const userIds = ids.users;
  const companyIds = ids.companies;
  let rowsRemoved = 0;
  await q(client, "BEGIN");
  try {
    const statements = [
      ["DELETE FROM audit_logs WHERE target_id = ANY($1::text[]) OR (metadata->>'applicationId') = ANY($2::text[]) OR summary = 'signup approval integration fixture'", [companyIds, appIds]],
      ["DELETE FROM signup_application_files WHERE application_id = ANY($1::text[]) OR id = ANY($2::text[]) OR storage_key LIKE $3", [appIds, companyFileIds, `signup-applications/${FIXTURE_PREFIX}%`]],
      ["DELETE FROM signup_application_consents WHERE application_id = ANY($1::text[])", [appIds]],
      ["DELETE FROM signup_applications WHERE id = ANY($1::text[])", [appIds]],
      ["DELETE FROM company_files WHERE id = ANY($1::text[]) OR company_id = ANY($2::text[]) OR storage_key LIKE $3", [companyFileIds, companyIds, `signup-applications/${FIXTURE_PREFIX}%`]],
      ["DELETE FROM company_subscriptions WHERE id = ANY($1::text[]) OR company_id = ANY($2::text[])", [subscriptionIds, companyIds]],
      ["DELETE FROM member_permissions WHERE company_member_id = ANY($1::text[])", [memberIds]],
      ["DELETE FROM company_members WHERE id = ANY($1::text[]) OR company_id = ANY($2::text[]) OR user_id = ANY($3::text[])", [memberIds, companyIds, userIds]],
      ["DELETE FROM users WHERE id = ANY($1::text[])", [userIds]],
      ["DELETE FROM companies WHERE id = ANY($1::text[])", [companyIds]],
    ];
    for (const [text, params] of statements) {
      const result = await q(client, text, params);
      rowsRemoved += Number(result.rowCount ?? 0);
    }
    await q(client, "COMMIT");
  } catch (error) {
    await q(client, "ROLLBACK").catch(() => undefined);
    throw error;
  }
  return {
    rowsRemoved,
    residualRows: await countFixtureRowsByPrefix(client),
  };
}

async function cleanup(client, manifest) {
  const ids = Array.from(new Set([
    ...manifest.applications,
    ...manifest.companyFiles,
    ...manifest.subscriptions,
    ...manifest.members,
    ...manifest.users,
    ...manifest.companies,
  ]));
  const statements = [
    ["DELETE FROM audit_logs WHERE target_id = ANY($1::text[]) OR (metadata->>'applicationId') = ANY($1::text[])", ids],
    ["DELETE FROM signup_application_files WHERE application_id = ANY($1::text[]) OR id = ANY($1::text[])", ids],
    ["DELETE FROM signup_application_consents WHERE application_id = ANY($1::text[])", ids],
    ["DELETE FROM signup_applications WHERE id = ANY($1::text[])", ids],
    ["DELETE FROM company_files WHERE id = ANY($1::text[]) OR company_id = ANY($1::text[])", ids],
    ["DELETE FROM company_subscriptions WHERE id = ANY($1::text[]) OR company_id = ANY($1::text[])", ids],
    ["DELETE FROM member_permissions WHERE company_member_id = ANY($1::text[])", ids],
    ["DELETE FROM company_members WHERE id = ANY($1::text[]) OR company_id = ANY($1::text[]) OR user_id = ANY($1::text[])", ids],
    ["DELETE FROM users WHERE id = ANY($1::text[])", ids],
    ["DELETE FROM companies WHERE id = ANY($1::text[])", ids],
  ];
  await q(client, "BEGIN");
  try {
    for (const [text, params] of statements) {
      const result = await q(client, text, [params]);
      manifest.rowsRemoved += Number(result.rowCount ?? 0);
    }
    await q(client, "COMMIT");
  } catch (error) {
    await q(client, "ROLLBACK").catch(() => undefined);
    throw error;
  }
  manifest.residualRows = await countFixtureRows(client, manifest);
}

async function run() {
  const config = assertGuard();
  if (!config) return;
  const client = new Client({ connectionString: config.databaseUrl });
  const manifest = createManifest();
  let residualBeforeCleanup = null;
  try {
    await client.connect();
    if (SCHEMA_DIAGNOSTIC) {
      const constraints = await q(client, `
        SELECT conname, pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE conrelid = 'public.signup_applications'::regclass
          AND conname IN (
            'signup_applications_approved_check',
            'signup_applications_status_provisioning_consistency_check'
          )
        ORDER BY conname
      `);
      const triggers = await q(client, `
        SELECT tgname, tgenabled, pg_get_triggerdef(oid) AS definition
        FROM pg_trigger
        WHERE tgrelid = 'public.signup_applications'::regclass
          AND NOT tgisinternal
        ORDER BY tgname
      `);
      safeLog("SIGNUP_APPROVAL_PROVISIONING_SCHEMA_DIAGNOSTIC", {
        result: "PASS",
        runtime: config.runtime,
        dbFingerprint: config.dbFingerprint,
        constraints: constraints.rows,
        triggers: triggers.rows,
        mutation: "none",
        residualR2Objects: 0,
      });
      process.exitCode = RESULT_OK;
      return;
    }
    if (CLEANUP_ONLY) {
      const cleanupResult = await cleanupFixtureRowsByPrefix(client);
      safeLog("SIGNUP_APPROVAL_PROVISIONING_CLEANUP_ONLY_RESULT", {
        result: cleanupResult.residualRows === 0 ? "PASS" : "FAIL",
        rowsRemoved: cleanupResult.rowsRemoved,
        residualDbRows: cleanupResult.residualRows,
        residualR2Objects: 0,
        productionMutation: false,
        schemaMigrationThisRun: false,
      });
      process.exitCode = cleanupResult.residualRows === 0 ? RESULT_OK : RESULT_ERROR;
      return;
    }
    const systemUserId = await getSystemUserId(client);
    const now = new Date();

    const appA = await insertApplicationFixture(client, manifest, { now, systemUserId });
    const resultA = await approveApplication(client, manifest, { applicationId: appA.id, systemUserId, now });
    await verifyProvisioning(client, resultA);
    manifest.result.newApplicant = "PASS";
    manifest.result.trial = "PASS";
    manifest.result.applicantWorkspace = "PASS";

    const beforeCompanyCount = (await q(client, "SELECT count(*)::int AS count FROM companies WHERE id LIKE $1", [`${appA.id}%`])).rows[0].count;
    const resultA2 = await approveApplication(client, manifest, { applicationId: appA.id, systemUserId, now });
    const afterCompanyCount = (await q(client, "SELECT count(*)::int AS count FROM companies WHERE id LIKE $1", [`${appA.id}%`])).rows[0].count;
    if (!resultA2.idempotent || Number(beforeCompanyCount) !== Number(afterCompanyCount)) throw new Error("IDEMPOTENCY_FAILED");
    manifest.result.idempotency = "PASS";

    const conflictEmail = `${manifest.runId}-conflict@example.test`;
    const conflictUserId = remember(manifest.users, `${manifest.runId}-conflict-user`);
    const conflictCompanyId = remember(manifest.companies, `${manifest.runId}-conflict-company`);
    await q(client, "INSERT INTO companies (id, name, is_active, status, onboarding_status) VALUES ($1, $2, true, 'active', 'active')", [conflictCompanyId, `${manifest.runId} conflict base`]);
    await q(client, "INSERT INTO users (id, company_id, email, name, google_sub, role, is_active) VALUES ($1, $2, $3, 'Conflict User', $4, 'designer', true)", [conflictUserId, conflictCompanyId, conflictEmail, `${manifest.runId}-other-sub`]);
    const appC = await insertApplicationFixture(client, manifest, { now, systemUserId, email: conflictEmail, googleSub: `${manifest.runId}-new-sub` });
    try {
      await approveApplication(client, manifest, { applicationId: appC.id, systemUserId, now });
      throw new Error("IDENTITY_CONFLICT_NOT_BLOCKED");
    } catch (error) {
      if (error.message !== "SIGNUP_APPROVAL_IDENTITY_CONFLICT") throw error;
    }
    const conflictApp = await q(client, "SELECT status, provisioning_status FROM signup_applications WHERE id = $1", [appC.id]);
    if (conflictApp.rows[0]?.status !== "reviewing" || conflictApp.rows[0]?.provisioning_status !== "not_started") throw new Error("IDENTITY_CONFLICT_ROLLBACK_FAILED");
    manifest.result.identityConflict = "PASS";

    const reuseCompanyId = remember(manifest.companies, `${manifest.runId}-reuse-base-company`);
    const reuseUserId = remember(manifest.users, `${manifest.runId}-reuse-user`);
    const reuseSub = `${manifest.runId}-reuse-sub`;
    await q(client, "INSERT INTO companies (id, name, is_active, status, onboarding_status) VALUES ($1, $2, true, 'active', 'active')", [reuseCompanyId, `${manifest.runId} reuse base`]);
    await q(client, "INSERT INTO users (id, company_id, email, name, google_sub, role, is_active) VALUES ($1, $2, $3, 'Reuse User', $4, 'designer', true)", [reuseUserId, reuseCompanyId, `${manifest.runId}-reuse@example.test`, reuseSub]);
    const appD = await insertApplicationFixture(client, manifest, { now, systemUserId, googleSub: reuseSub, email: `${manifest.runId}-reuse@example.test` });
    await approveApplication(client, manifest, { applicationId: appD.id, systemUserId, now });
    const reused = await q(client, "SELECT company_id, role FROM users WHERE id = $1", [reuseUserId]);
    if (reused.rows[0]?.company_id !== reuseCompanyId || reused.rows[0]?.role !== "designer") throw new Error("EXISTING_USER_TENANT_OVERWRITE_DETECTED");
    manifest.result.existingUserReuse = "PASS";

    residualBeforeCleanup = await countFixtureRows(client, manifest);
    await cleanup(client, manifest);
    if (manifest.residualRows !== 0) throw new Error("CLEANUP_RESIDUAL_ROWS_NONZERO");

    safeLog("SIGNUP_APPROVAL_PROVISIONING_RESULT", {
      result: "PASS",
      runtime: config.runtime,
      dbFingerprint: config.dbFingerprint,
      scenarios: manifest.result,
      residualDbRowsBeforeCleanup: residualBeforeCleanup,
      residualDbRows: manifest.residualRows,
      residualR2Objects: 0,
      devTestDbMutation: true,
      devTestR2Mutation: false,
      productionMutation: false,
      schemaMigrationThisRun: false,
      cleanup: "PASS",
    });
    process.exitCode = RESULT_OK;
  } catch (error) {
    safeLog("SIGNUP_APPROVAL_PROVISIONING_RESULT", {
      result: "FAIL",
      safeCode: safeErrorCode(error),
      residualDbRowsBeforeCleanup: residualBeforeCleanup,
      residualDbRows: manifest.residualRows,
      residualR2Objects: 0,
      productionMutation: false,
      schemaMigrationThisRun: false,
    });
    try {
      await cleanup(client, manifest);
      safeLog("SIGNUP_APPROVAL_PROVISIONING_CLEANUP_AFTER_FAILURE", {
        residualDbRows: manifest.residualRows,
        residualR2Objects: 0,
      });
    } catch (cleanupError) {
      safeLog("SIGNUP_APPROVAL_PROVISIONING_CLEANUP_FAILED", {
        safeCode: safeErrorCode(cleanupError),
        residualDbRows: "unknown",
        residualR2Objects: 0,
      });
    }
    process.exitCode = RESULT_ERROR;
  } finally {
    await client.end().catch(() => undefined);
  }
}

await run();
