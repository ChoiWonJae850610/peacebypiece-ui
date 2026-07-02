#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("db/migrations/patch_0_24_34_workorder_size_spec_and_pdf.sql", "utf8");
const repository = fs.readFileSync("lib/workorder/sizeSpec/repository.ts", "utf8");
const route = fs.readFileSync("app/api/workorders/[workOrderId]/size-spec/route.ts", "utf8");
const panel = fs.readFileSync("components/workorder/detail/WorkOrderSizeSpecPanel.tsx", "utf8");
const valuePolicy = fs.readFileSync("lib/workorder/sizeSpec/valuePolicy.ts", "utf8");

for (const relation of [
  "workorder_size_specs",
  "workorder_size_spec_sizes",
  "workorder_size_spec_poms",
  "workorder_size_spec_values",
]) {
  assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${relation}`), `missing ${relation}`);
}

const migrationForSafetyScan = migration.replace(/--.*$/gm, "").replace(/\bON\s+DELETE\b/gi, "ON_DELETE");
assert.doesNotMatch(migrationForSafetyScan, /\bDROP\b|\bTRUNCATE\b|\bALTER\b|\bUPDATE\b/i, "migration must stay additive-only");
assert.doesNotMatch(migration, /INSERT\s+INTO\s+spec_sheets|INSERT\s+INTO\s+companies|INSERT\s+INTO\s+company_subscriptions/i, "migration must not backfill business data");
assert.match(migration, /measurement_unit IN \('cm', 'inch'\)/, "cm/inch unit check required");

assert.match(repository, /company_size_set_activations/, "repository must read active company size sets");
assert.match(repository, /company_pom_activations/, "repository must read active company POMs");
assert.match(repository, /work_order\.company_id = spec\.company_id/, "repository must maintain tenant scope");
assert.match(repository, /ON CONFLICT \(work_order_id\)/, "size spec upsert must be idempotent");
assert.match(repository, /parseMeasurementValue/, "repository must normalize numeric values");

assert.match(valuePolicy, /1\/8/);
assert.match(valuePolicy, /7\/8/);
assert.match(valuePolicy, /INVALID_INCH_MEASUREMENT/);

assert.match(route, /requireWorkspaceApiGuard/);
assert.match(route, /MEMBER_PERMISSION_CODE\.workorderRead/);
assert.match(route, /MEMBER_PERMISSION_CODE\.workorderUpdate/);
assert.match(route, /getWorkOrderDetailByCompany/);
assert.match(route, /createWorkOrderFactoryInstructionLockedResponse/);
assert.doesNotMatch(route, /getCurrentWaflSession\(\).*companyId/s, "route should use workspace guard instead of client role");

assert.match(panel, /WorkOrderSizeSpecPanel/);
assert.match(panel, /\/size-spec/);
assert.match(panel, /measurementUnit/);
assert.match(panel, /미완성 PDF/);
assert.match(panel, /최종 PDF/);

console.log("workorder size-spec contract: PASS");
