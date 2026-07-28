#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = process.cwd();
const COMPANY_A = "wafl-fn-company-a";
const diagnosisPath = path.join(root, ".tmp", "wafl-external-qa", "a57-v10-fix-diagnosis.json");
const evidencePath = path.join(root, ".tmp", "wafl-external-qa", "a57-v10-fix-repair.json");

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

function assertApprovedDevTestTarget(connectionString) {
  const url = new URL(connectionString);
  const fingerprint = shaRef(`${url.hostname}/${decodeURIComponent(url.pathname.replace(/^\/+/, ""))}`);
  assert.equal(process.env.WAFL_V10_FIX_RUNTIME, "dev", "DEV_RUNTIME_REQUIRED");
  assert.equal(process.env.WAFL_V10_FIX_TEST_PREFIX, "wafl-fn", "DEV_TEST_PREFIX_REQUIRED");
  assert.equal(fingerprint, process.env.WAFL_V10_FIX_APPROVED_DB_FINGERPRINT, "DB_FINGERPRINT_MISMATCH");
  assert.equal(process.env.WAFL_V10_FIX_CONFIRM, "REPAIR A57 V10 COMPANY A DEV TRIAL WINDOW", "REPAIR_CONFIRMATION_REQUIRED");
  return fingerprint;
}

function iso(value) {
  return value instanceof Date ? value.toISOString() : value ? new Date(value).toISOString() : null;
}

const env = readEnv();
assert.ok(env.DATABASE_URL, "DATABASE_URL_MISSING");
const fingerprint = assertApprovedDevTestTarget(env.DATABASE_URL);
const diagnosis = JSON.parse(fs.readFileSync(diagnosisPath, "utf8"));
assert.equal(diagnosis.db.approvedDevTestFingerprint, true);
assert.equal(diagnosis.canonicalFixture.companyRef, shaRef(COMPANY_A));
assert.equal(diagnosis.canonicalFixture.nameHasSimulatorPrefix, true);
assert.equal(diagnosis.diagnosis.sessionBindingMismatch, false);
assert.equal(diagnosis.diagnosis.devTestFixtureDrift, true);
assert.equal(diagnosis.diagnosis.actualGuardReason, "trial_expired");

const repairedAt = new Date();
const repairedTrialEndsAt = new Date(repairedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  application_name: "wafl-a57-v10-fix-dev-trial-repair",
});
await client.connect();

try {
  await client.query("BEGIN");
  const before = (await client.query(`
    SELECT c.id, c.name, c.is_active, c.onboarding_status, c.billing_status,
           c.subscription_status, c.trial_started_at, c.trial_ends_at, c.updated_at,
           s.id AS subscription_id, s.plan_code, s.status AS canonical_subscription_status,
           s.trial_started_at AS subscription_trial_started_at,
           s.trial_ends_at AS subscription_trial_ends_at,
           s.updated_at AS subscription_updated_at,
           (SELECT count(*)::integer FROM domain_events) AS events,
           (SELECT count(*)::integer FROM work_order_command_receipts) AS receipts,
           (SELECT count(*)::integer FROM work_order_material_lines) AS material_rows,
           (SELECT COALESCE(sum(entity_version), 0)::integer FROM work_order_material_lines) AS material_version_sum,
           (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration
      FROM companies c
      JOIN company_subscriptions s ON s.company_id = c.id
     WHERE c.id = $1
     FOR UPDATE OF c, s
  `, [COMPANY_A])).rows[0];
  assert.ok(before, "COMPANY_A_AND_SUBSCRIPTION_REQUIRED");
  assert.equal(before.id, COMPANY_A);
  assert.equal(String(before.name).startsWith("[SIM]"), true);
  assert.deepEqual({
    isActive: before.is_active,
    onboardingStatus: before.onboarding_status,
    billingStatus: before.billing_status,
    subscriptionStatus: before.subscription_status,
    planCode: before.plan_code,
    canonicalSubscriptionStatus: before.canonical_subscription_status,
  }, {
    isActive: true,
    onboardingStatus: "active",
    billingStatus: "trial",
    subscriptionStatus: "trialing",
    planCode: "lite",
    canonicalSubscriptionStatus: "trialing",
  });
  assert.ok(new Date(before.trial_ends_at) <= repairedAt, "COMPANY_TRIAL_WINDOW_NOT_EXPIRED");
  assert.ok(new Date(before.subscription_trial_ends_at) <= repairedAt, "SUBSCRIPTION_TRIAL_WINDOW_NOT_EXPIRED");
  assert.equal(shaRef(before.id), diagnosis.canonicalFixture.companyRef);
  assert.equal(shaRef(before.subscription_id), diagnosis.subscriptionRow.subscriptionRef);

  const companyRepair = await client.query(`
    UPDATE companies
       SET trial_ends_at = $2::timestamptz,
           updated_at = $3::timestamptz
     WHERE id = $1
       AND id LIKE 'wafl-fn-company-%'
       AND name LIKE '[SIM]%'
       AND is_active = true
       AND onboarding_status = 'active'
       AND billing_status = 'trial'
       AND subscription_status = 'trialing'
       AND trial_ends_at <= $3::timestamptz
  `, [COMPANY_A, repairedTrialEndsAt.toISOString(), repairedAt.toISOString()]);
  assert.equal(companyRepair.rowCount, 1, "COMPANY_TRIAL_REPAIR_ROW_COUNT");

  const subscriptionRepair = await client.query(`
    UPDATE company_subscriptions
       SET trial_ends_at = $2::timestamptz,
           updated_at = $3::timestamptz
     WHERE company_id = $1
       AND id = $1 || '-subscription'
       AND plan_code = 'lite'
       AND status = 'trialing'
       AND trial_ends_at <= $3::timestamptz
  `, [COMPANY_A, repairedTrialEndsAt.toISOString(), repairedAt.toISOString()]);
  assert.equal(subscriptionRepair.rowCount, 1, "SUBSCRIPTION_TRIAL_REPAIR_ROW_COUNT");

  const after = (await client.query(`
    SELECT c.trial_started_at, c.trial_ends_at, c.updated_at,
           c.is_active, c.onboarding_status, c.billing_status, c.subscription_status,
           s.trial_started_at AS subscription_trial_started_at,
           s.trial_ends_at AS subscription_trial_ends_at,
           s.updated_at AS subscription_updated_at,
           s.plan_code, s.status AS canonical_subscription_status,
           (SELECT count(*)::integer FROM domain_events) AS events,
           (SELECT count(*)::integer FROM work_order_command_receipts) AS receipts,
           (SELECT count(*)::integer FROM work_order_material_lines) AS material_rows,
           (SELECT COALESCE(sum(entity_version), 0)::integer FROM work_order_material_lines) AS material_version_sum,
           (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration
      FROM companies c
      JOIN company_subscriptions s ON s.company_id = c.id
     WHERE c.id = $1
  `, [COMPANY_A])).rows[0];
  assert.ok(after);
  assert.equal(iso(after.trial_started_at), iso(before.trial_started_at));
  assert.equal(iso(after.subscription_trial_started_at), iso(before.subscription_trial_started_at));
  assert.equal(iso(after.trial_ends_at), repairedTrialEndsAt.toISOString());
  assert.equal(iso(after.subscription_trial_ends_at), repairedTrialEndsAt.toISOString());
  assert.deepEqual({
    isActive: after.is_active,
    onboardingStatus: after.onboarding_status,
    billingStatus: after.billing_status,
    subscriptionStatus: after.subscription_status,
    planCode: after.plan_code,
    canonicalSubscriptionStatus: after.canonical_subscription_status,
  }, {
    isActive: true,
    onboardingStatus: "active",
    billingStatus: "trial",
    subscriptionStatus: "trialing",
    planCode: "lite",
    canonicalSubscriptionStatus: "trialing",
  });
  assert.deepEqual({
    events: Number(after.events) - Number(before.events),
    receipts: Number(after.receipts) - Number(before.receipts),
    materialRows: Number(after.material_rows) - Number(before.material_rows),
    materialVersionSum: Number(after.material_version_sum) - Number(before.material_version_sum),
    migration: Number(after.migration) - Number(before.migration),
  }, {
    events: 0,
    receipts: 0,
    materialRows: 0,
    materialVersionSum: 0,
    migration: 0,
  });
  await client.query("COMMIT");

  const result = {
    ok: true,
    approvedTarget: {
      dbFingerprintPrefix: fingerprint.slice(0, 6),
      companyAlias: "Company A",
      companyRef: shaRef(COMPANY_A),
      simulatorFixture: true,
    },
    repair: {
      kind: "dev-test trial-window drift repair",
      affectedRows: 2,
      changedFields: {
        companies: ["trial_ends_at", "updated_at"],
        companySubscriptions: ["trial_ends_at", "updated_at"],
      },
      unchangedFields: [
        "is_active",
        "onboarding_status",
        "billing_status",
        "subscription_status",
        "plan_code",
        "company_subscription.status",
        "trial_started_at",
      ],
      before: {
        companyTrialEndsAt: iso(before.trial_ends_at),
        subscriptionTrialEndsAt: iso(before.subscription_trial_ends_at),
      },
      after: {
        companyTrialEndsAt: iso(after.trial_ends_at),
        subscriptionTrialEndsAt: iso(after.subscription_trial_ends_at),
      },
    },
    outOfScopeMutation: {
      production: 0,
      realCustomer: 0,
      paymentOrStripe: 0,
      event: 0,
      receipt: 0,
      materialRows: 0,
      materialVersionSum: 0,
      migration: 0,
      r2Put: 0,
      r2Delete: 0,
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
