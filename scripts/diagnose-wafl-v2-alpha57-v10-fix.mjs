#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = process.cwd();
const COMPANY_A = "wafl-fn-company-a";
const evidencePath = path.join(root, ".tmp", "wafl-external-qa", "a57-v10-fix-diagnosis.json");

function readEnv() {
  const values = {};
  for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (value.length >= 2 && (
      (value.startsWith("\"") && value.endsWith("\""))
      || (value.startsWith("'") && value.endsWith("'"))
    )) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

function shaRef(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

function iso(value) {
  return value instanceof Date ? value.toISOString() : value ? new Date(value).toISOString() : null;
}

function assertApprovedDevTestTarget(connectionString) {
  const url = new URL(connectionString);
  const fingerprint = shaRef(`${url.hostname}/${decodeURIComponent(url.pathname.replace(/^\/+/, ""))}`);
  assert.equal(process.env.WAFL_V10_FIX_RUNTIME, "dev", "DEV_RUNTIME_REQUIRED");
  assert.equal(process.env.WAFL_V10_FIX_TEST_PREFIX, "wafl-fn", "DEV_TEST_PREFIX_REQUIRED");
  assert.equal(fingerprint, process.env.WAFL_V10_FIX_APPROVED_DB_FINGERPRINT, "DB_FINGERPRINT_MISMATCH");
  return fingerprint;
}

const env = readEnv();
assert.ok(env.DATABASE_URL, "DATABASE_URL_MISSING");
const dbFingerprintPrefix = assertApprovedDevTestTarget(env.DATABASE_URL);
const fixture = JSON.parse(fs.readFileSync(
  path.join(root, "tests", "fixtures", "functions", "company-scenarios.json"),
  "utf8",
));
const fixtureCompany = fixture.companies.find((company) => company.id === COMPANY_A);
assert.ok(fixtureCompany, "COMPANY_A_CANONICAL_FIXTURE_MISSING");
assert.deepEqual(
  {
    status: fixtureCompany.status,
    billing: fixtureCompany.billing,
    purpose: fixtureCompany.purpose,
  },
  {
    status: "active",
    billing: "trial",
    purpose: ["기본 정상 흐름", "작업지시서 수정"],
  },
  "COMPANY_A_CANONICAL_NORMAL_FLOW_MISMATCH",
);

const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  application_name: "wafl-a57-v10-fix-diagnosis",
});
await client.connect();

try {
  await client.query("BEGIN READ ONLY");
  const company = (await client.query(`
    SELECT c.id, c.name, c.is_active, c.onboarding_status, c.billing_status,
           c.subscription_status, c.trial_started_at, c.trial_ends_at, c.updated_at,
           s.id AS subscription_id, s.plan_code, s.status AS canonical_subscription_status,
           s.trial_started_at AS subscription_trial_started_at,
           s.trial_ends_at AS subscription_trial_ends_at,
           s.updated_at AS subscription_updated_at
      FROM companies c
      LEFT JOIN company_subscriptions s ON s.company_id = c.id
     WHERE c.id = $1
     LIMIT 1
  `, [COMPANY_A])).rows[0];
  assert.ok(company, "COMPANY_A_MISSING");

  const targets = (await client.query(`
    SELECT u.id AS user_id, cm.id AS company_member_id, cm.status,
           cm.role_template_code, u.is_active AS user_active,
           COALESCE((
             SELECT bool_or(mp.permission_code = 'workorder.read' AND mp.is_enabled = true)
               FROM member_permissions mp
              WHERE mp.company_member_id = cm.id
           ), false) AS workorder_read
      FROM company_members cm
      JOIN users u ON u.id = cm.user_id
     WHERE cm.company_id = $1
       AND cm.status = 'approved'
       AND cm.role_template_code = 'company_admin'
       AND u.is_active = true
     ORDER BY cm.id
  `, [COMPANY_A])).rows;

  const workOrder = (await client.query(`
    SELECT w.id, w.company_id, w.current_revision_id,
           w.entity_version AS work_order_version,
           r.entity_version AS revision_version
      FROM work_orders w
      JOIN work_order_revisions r
        ON r.company_id = w.company_id AND r.id = w.current_revision_id
     WHERE w.deleted_at IS NULL
       AND EXISTS (
         SELECT 1
           FROM work_order_material_lines marker
          WHERE marker.company_id = w.company_id
            AND marker.revision_id = r.id
            AND marker.name = 'UNITEDITABLEMATERI'
       )
     LIMIT 1
  `)).rows[0];
  assert.ok(workOrder, "APPROVED_V10_WORK_ORDER_FIXTURE_MISSING");

  const counters = (await client.query(`
    SELECT
      (SELECT count(*)::integer FROM domain_events) AS events,
      (SELECT count(*)::integer FROM work_order_command_receipts) AS receipts,
      (SELECT count(*)::integer FROM work_order_material_lines) AS material_rows,
      (SELECT COALESCE(sum(entity_version), 0)::integer FROM work_order_material_lines) AS material_version_sum,
      (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration
  `)).rows[0];
  await client.query("ROLLBACK");

  const now = new Date();
  const trialEndsAt = company.trial_ends_at ? new Date(company.trial_ends_at) : null;
  const trialExpired = company.subscription_status !== "active"
    && (
      ["trial_expired", "past_due", "canceled"].includes(company.subscription_status)
      || (trialEndsAt && Number.isFinite(trialEndsAt.getTime()) && trialEndsAt <= now)
    );
  const guardReason = company.subscription_status === "canceled"
    ? "canceled"
    : company.subscription_status === "past_due"
      ? "past_due"
      : trialExpired
        ? "trial_expired"
        : null;
  const seedConflictRefreshesCompanyTrialWindow = /trial_ends_at\s*=\s*EXCLUDED\.trial_ends_at/.test(
    fs.readFileSync(path.join(root, "tools", "simulator", "commands", "db-data.mjs"), "utf8")
      .match(/ON CONFLICT \(id\) DO UPDATE SET[\s\S]*?updated_at=now\(\)/)?.[0] ?? "",
  );
  const seedConflictRefreshesSubscriptionTrialWindow = /trial_ends_at\s*=\s*EXCLUDED\.trial_ends_at/.test(
    fs.readFileSync(path.join(root, "tools", "simulator", "commands", "db-data.mjs"), "utf8")
      .match(/INSERT INTO company_subscriptions[\s\S]*?ON CONFLICT \(id\) DO UPDATE SET[\s\S]*?updated_at=now\(\)/)?.[0] ?? "",
  );

  const result = {
    ok: true,
    db: {
      approvedDevTestFingerprint: true,
      fingerprintPrefix: dbFingerprintPrefix.slice(0, 6),
      testPrefix: "wafl-fn",
    },
    canonicalFixture: {
      companyAlias: "Company A",
      companyRef: shaRef(company.id),
      nameHasSimulatorPrefix: String(company.name).startsWith("[SIM]"),
      expectedPurpose: fixtureCompany.purpose,
      expectedStatus: "active",
      expectedBilling: "trial",
      expectedSubscriptionStatus: "trialing",
    },
    actualCompany: {
      isActive: company.is_active,
      onboardingStatus: company.onboarding_status,
      billingStatus: company.billing_status,
      subscriptionStatus: company.subscription_status,
      trialStartedAt: iso(company.trial_started_at),
      trialEndsAt: iso(company.trial_ends_at),
      updatedAt: iso(company.updated_at),
      trialExpired,
      guardReason,
    },
    subscriptionRow: {
      present: Boolean(company.subscription_id),
      subscriptionRef: company.subscription_id ? shaRef(company.subscription_id) : null,
      planCode: company.plan_code,
      status: company.canonical_subscription_status,
      trialStartedAt: iso(company.subscription_trial_started_at),
      trialEndsAt: iso(company.subscription_trial_ends_at),
      updatedAt: iso(company.subscription_updated_at),
    },
    sessionTarget: {
      exactTargetCount: targets.length,
      companyRef: shaRef(COMPANY_A),
      userRef: targets[0] ? shaRef(targets[0].user_id) : null,
      memberRef: targets[0] ? shaRef(targets[0].company_member_id) : null,
      memberStatus: targets[0]?.status ?? null,
      role: targets[0]?.role_template_code ?? null,
      userActive: targets[0]?.user_active ?? null,
      workorderRead: targets[0]?.workorder_read ?? null,
    },
    workOrderFixture: {
      workOrderRef: shaRef(workOrder.id),
      companyMatchesSessionTarget: workOrder.company_id === COMPANY_A,
      workOrderVersion: Number(workOrder.work_order_version),
      revisionVersion: Number(workOrder.revision_version),
    },
    counters: {
      events: Number(counters.events),
      receipts: Number(counters.receipts),
      materialRows: Number(counters.material_rows),
      materialVersionSum: Number(counters.material_version_sum),
      migration: Number(counters.migration),
    },
    seedContract: {
      conflictRefreshesCompanyTrialWindow: seedConflictRefreshesCompanyTrialWindow,
      conflictRefreshesSubscriptionTrialWindow: seedConflictRefreshesSubscriptionTrialWindow,
    },
    diagnosis: {
      sessionBindingMismatch: targets.length !== 1 || workOrder.company_id !== COMPANY_A,
      devTestFixtureDrift: (
        String(company.id).startsWith("wafl-fn-")
        && String(company.name).startsWith("[SIM]")
        && company.is_active === true
        && company.onboarding_status === "active"
        && company.billing_status === "trial"
        && company.subscription_status === "trialing"
        && trialExpired
        && !seedConflictRefreshesCompanyTrialWindow
      ),
      actualGuardReason: guardReason,
    },
  };
  fs.writeFileSync(evidencePath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result));
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
