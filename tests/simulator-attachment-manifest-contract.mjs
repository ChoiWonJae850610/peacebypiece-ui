#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const manifestPath = path.join("tools", "simulator", "fixtures", "attachments", "canonical-lifecycle-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const requiredFields = [
  "fixture_id",
  "company_id",
  "workorder_id",
  "attachment_id",
  "attachment_kind",
  "original_filename",
  "mime_type",
  "exact_size_bytes",
  "canonical_r2_key",
  "preview_mode",
  "is_representative_design",
  "lifecycle_status",
  "trashed_at",
  "expected_company_active_bytes",
  "expected_company_trash_bytes",
  "expected_company_total_bytes",
];

assert.equal(manifest.schemaVersion, "1.0");
assert.equal(manifest.testPrefix, "wafl-fn");
assert.equal(manifest.storageUsagePolicy.includeTrashInUsage, true);
assert.ok(Array.isArray(manifest.normalLifecycleFixtures));
assert.ok(Array.isArray(manifest.capacityBoundaryFixtures));
assert.ok(Array.isArray(manifest.faultFixtures));

const normalScenarios = new Set(manifest.normalLifecycleFixtures.map((item) => item.scenario_code));
for (const code of ["A", "B", "C", "D", "E", "F", "G"]) {
  assert.ok(normalScenarios.has(code), `normal scenario ${code} must exist`);
}

const capacityScenarios = new Set(manifest.capacityBoundaryFixtures.map((item) => item.scenario_code));
for (const code of ["H", "I", "J"]) {
  assert.ok(capacityScenarios.has(code), `capacity boundary scenario ${code} must exist`);
}

const attachmentIds = new Set();
const r2Keys = new Set();
const representativeByWorkOrder = new Map();
const companyTotals = new Map();

for (const item of manifest.normalLifecycleFixtures) {
  for (const field of requiredFields) {
    assert.ok(Object.hasOwn(item, field), `${item.fixture_id} missing ${field}`);
  }
  assert.match(item.company_id, /^wafl-fn-company-[a-j]$/);
  assert.ok(["none", "design", "file"].includes(item.attachment_kind));
  assert.ok(Number.isSafeInteger(item.exact_size_bytes));
  assert.ok(item.exact_size_bytes >= 0);

  if (item.attachment_id) {
    assert.ok(!attachmentIds.has(item.attachment_id), `duplicate attachment_id ${item.attachment_id}`);
    attachmentIds.add(item.attachment_id);
  }

  if (item.canonical_r2_key && item.lifecycle_status !== "fault_reference_only") {
    assert.ok(!item.canonical_r2_key.includes(".."));
    assert.ok(item.canonical_r2_key.startsWith(`companies/${item.company_id}/workorders/${item.workorder_id}/`));
    assert.match(item.canonical_r2_key, /\/(design|attachments)\//);
    assert.ok(!r2Keys.has(item.canonical_r2_key), `duplicate key ${item.canonical_r2_key}`);
    r2Keys.add(item.canonical_r2_key);
  }

  if (item.is_representative_design) {
    assert.equal(item.attachment_kind, "design");
    assert.equal(item.lifecycle_status === "trashed", false, "trashed item must not be representative");
    assert.ok(!representativeByWorkOrder.has(item.workorder_id), `duplicate representative for ${item.workorder_id}`);
    representativeByWorkOrder.set(item.workorder_id, item.attachment_id);
  }

  const totals = companyTotals.get(item.company_id) || { active: 0, trash: 0 };
  if (["active", "restored"].includes(item.lifecycle_status)) totals.active += item.exact_size_bytes;
  if (item.lifecycle_status === "trashed") totals.trash += item.exact_size_bytes;
  companyTotals.set(item.company_id, totals);
}

for (const item of manifest.normalLifecycleFixtures) {
  const totals = companyTotals.get(item.company_id);
  assert.equal(item.expected_company_active_bytes, totals.active, `${item.fixture_id} active bytes`);
  assert.equal(item.expected_company_trash_bytes, totals.trash, `${item.fixture_id} trash bytes`);
  assert.equal(item.expected_company_total_bytes, totals.active + totals.trash, `${item.fixture_id} total bytes`);
}

for (const item of manifest.capacityBoundaryFixtures) {
  assert.equal(item.source, "capacity_boundary_contract_only");
  assert.ok(item.expected_company_total_bytes >= item.expected_company_active_bytes);
  assert.ok(item.quota_bytes > 0);
}

for (const expectedFault of [
  "db_only_attachment",
  "r2_only_object",
  "size_mismatch",
  "orphan_object",
  "duplicate_key",
  "duplicate_representative_design",
  "trash_attachment_mismatch",
  "r2_delete_failure",
]) {
  assert.ok(manifest.faultFixtures.includes(expectedFault), `fault fixture missing: ${expectedFault}`);
}

console.log(`simulator attachment manifest contract passed: normal=${manifest.normalLifecycleFixtures.length} capacity=${manifest.capacityBoundaryFixtures.length} keys=${r2Keys.size}`);
