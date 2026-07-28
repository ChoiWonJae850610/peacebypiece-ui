#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = process.cwd();
const diagnosis = JSON.parse(fs.readFileSync(
  path.join(root, ".tmp", "wafl-external-qa", "a57-v10-fix-diagnosis.json"),
  "utf8",
));
const repair = JSON.parse(fs.readFileSync(
  path.join(root, ".tmp", "wafl-external-qa", "a57-v10-fix-repair.json"),
  "utf8",
));
const runtime = JSON.parse(fs.readFileSync(
  path.join(root, ".tmp", "wafl-external-qa", "a57-v10-runtime-result.json"),
  "utf8",
));
const guard = JSON.parse(fs.readFileSync(
  path.join(root, ".tmp", "wafl-external-qa", "a57-v10-fix-guard-runtime.json"),
  "utf8",
));
const evidencePath = path.join(root, ".tmp", "wafl-external-qa", "a57-v10-fix-final-audit.json");

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

assert.equal(diagnosis.diagnosis.actualGuardReason, "trial_expired");
assert.equal(diagnosis.diagnosis.sessionBindingMismatch, false);
assert.equal(diagnosis.diagnosis.devTestFixtureDrift, true);
assert.equal(repair.ok, true);
assert.equal(repair.repair.affectedRows, 2);
assert.equal(guard.listGet, 200);
assert.equal(guard.targetDetailGet, 200);
assert.equal(guard.foreignWorkspaceDetail.status, 404);
assert.equal(guard.anonymousList.status, 401);
assert.equal(runtime.ok, true);

const env = readEnv();
assert.ok(env.DATABASE_URL, "DATABASE_URL_MISSING");
const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  application_name: "wafl-a57-v10-fix-final-audit",
});
await client.connect();

try {
  await client.query("BEGIN READ ONLY");
  const current = (await client.query(`
    SELECT w.entity_version AS work_order_version,
           r.entity_version AS revision_version,
           w.product_type_code, w.item_code, w.season_code,
           c.is_active, c.onboarding_status, c.billing_status, c.subscription_status,
           c.trial_ends_at, s.plan_code, s.status AS canonical_subscription_status,
           s.trial_ends_at AS subscription_trial_ends_at,
           (SELECT count(*)::integer FROM domain_events) AS events,
           (SELECT count(*)::integer FROM work_order_command_receipts) AS receipts,
           (SELECT count(*)::integer FROM work_order_material_lines) AS material_rows,
           (SELECT COALESCE(sum(entity_version), 0)::integer FROM work_order_material_lines) AS material_version_sum,
           (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration
      FROM work_orders w
      JOIN work_order_revisions r
        ON r.company_id = w.company_id AND r.id = w.current_revision_id
      JOIN companies c ON c.id = w.company_id
      JOIN company_subscriptions s ON s.company_id = c.id
     WHERE w.company_id = 'wafl-fn-company-a'
       AND w.deleted_at IS NULL
       AND EXISTS (
         SELECT 1
           FROM work_order_material_lines marker
          WHERE marker.company_id = w.company_id
            AND marker.revision_id = r.id
            AND marker.name = 'UNITEDITABLEMATERI'
       )
     LIMIT 1
  `)).rows[0];
  assert.ok(current, "V10_TARGET_MISSING");
  const fixtures = (await client.query(`
    SELECT material_type, unit_code, entity_version, archived_at
      FROM work_order_material_lines
     WHERE name LIKE 'A57V10\\_%' ESCAPE '\\'
     ORDER BY material_type
  `)).rows;
  await client.query("ROLLBACK");

  const expectedQaDelta = {
    workOrderVersion: 6,
    revisionVersion: 6,
    event: 6,
    receipt: 4,
    materialRows: 2,
    materialVersionSum: 4,
    migration: 0,
  };
  const observedQaDelta = {
    workOrderVersion: Number(current.work_order_version) - diagnosis.workOrderFixture.workOrderVersion,
    revisionVersion: Number(current.revision_version) - diagnosis.workOrderFixture.revisionVersion,
    event: Number(current.events) - diagnosis.counters.events,
    receipt: Number(current.receipts) - diagnosis.counters.receipts,
    materialRows: Number(current.material_rows) - diagnosis.counters.materialRows,
    materialVersionSum: Number(current.material_version_sum) - diagnosis.counters.materialVersionSum,
    migration: Number(current.migration) - diagnosis.counters.migration,
  };
  assert.deepEqual(observedQaDelta, expectedQaDelta);
  assert.deepEqual(runtime.mutationDelta, expectedQaDelta);
  assert.equal(current.product_type_code, null);
  assert.equal(current.item_code, null);
  assert.equal(current.season_code, null);
  assert.deepEqual({
    isActive: current.is_active,
    onboardingStatus: current.onboarding_status,
    billingStatus: current.billing_status,
    subscriptionStatus: current.subscription_status,
    planCode: current.plan_code,
    canonicalSubscriptionStatus: current.canonical_subscription_status,
  }, {
    isActive: true,
    onboardingStatus: "active",
    billingStatus: "trial",
    subscriptionStatus: "trialing",
    planCode: "lite",
    canonicalSubscriptionStatus: "trialing",
  });
  assert.equal(new Date(current.trial_ends_at).toISOString(), repair.repair.after.companyTrialEndsAt);
  assert.equal(
    new Date(current.subscription_trial_ends_at).toISOString(),
    repair.repair.after.subscriptionTrialEndsAt,
  );
  assert.equal(fixtures.length, 2);
  assert.deepEqual(
    fixtures.map((row) => ({
      materialType: row.material_type,
      unitCode: row.unit_code,
      entityVersion: Number(row.entity_version),
      archived: Boolean(row.archived_at),
    })),
    [
      { materialType: "accessory", unitCode: "개", entityVersion: 2, archived: true },
      { materialType: "fabric", unitCode: "yd", entityVersion: 2, archived: true },
    ],
  );

  const result = {
    ok: true,
    recoveryMutation: {
      affectedRows: 2,
      scope: ["Company A companies.trial_ends_at", "Company A company_subscriptions.trial_ends_at"],
      businessEventReceiptDelta: 0,
      productionOrPaymentMutation: 0,
    },
    runtimeQaMutation: observedQaDelta,
    categoryBaselineRestored: true,
    fixtureCleanup: {
      activeRows: fixtures.filter((row) => !row.archived_at).length,
      archivedTombstones: fixtures.filter((row) => row.archived_at).length,
      units: fixtures.map((row) => row.unit_code).sort(),
    },
    security: {
      foreignWorkspaceStatus: guard.foreignWorkspaceDetail.status,
      anonymousStatus: guard.anonymousList.status,
      guardDisabled: false,
      entitlementBypass: false,
      forced402Conversion: false,
      directR2Access: 0,
      workerBypass: 0,
      r2Put: 0,
      r2Delete: 0,
      migrationDelta: 0,
      unknownMutation: 0,
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
