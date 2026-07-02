#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const pipeline = fs.readFileSync("tools/pipeline/peacebypiece-auto-pipeline.ps1", "utf8");
const runner = fs.readFileSync("scripts/run-approved-db-migration.mjs", "utf8");
const readonlyRunner = fs.readFileSync("scripts/run-readonly-db-audit.mjs", "utf8");
const verifySafe = fs.readFileSync("tools/pipeline/verify-safe.ps1", "utf8");
const finishVersion = fs.readFileSync("tools/pipeline/finish-version.ps1", "utf8");
const approvedWorkflow = fs.readFileSync("tools/pipeline/approved-workflow.ps1", "utf8");

for (const switchName of [
  "RunWorkorderSizeSpecCompatibilityAudit",
  "ApplyWorkorderSizeSpecMigration",
  "RunWorkorderSizeSpecPostApplyAudit",
  "RunWorkorderSizeSpecIntegration",
  "RunWorkorderPdfVisualCheck",
  "RunWorkorderSizeSpecResidualAudit",
]) {
  assert.match(pipeline, new RegExp(`\\[switch\\]\\$${switchName}`), `missing switch ${switchName}`);
  assert.match(pipeline, new RegExp(`function ${switchName}`), `missing function ${switchName}`);
  assert.match(pipeline, new RegExp(`elseif \\(\\$${switchName}\\)`), `missing CLI branch ${switchName}`);
}

for (const number of [70, 71, 72, 73, 74, 75]) {
  const count = [...pipeline.matchAll(new RegExp(`Write-Host "${number}\\.`, "g"))].length;
  assert.equal(count, 1, `menu number ${number} must be unique`);
}

assert.match(pipeline, /70\. Workorder Size Spec Compatibility Audit/);
assert.match(pipeline, /71\. Workorder Size Spec Migration Apply/);
assert.match(pipeline, /72\. Workorder Size Spec Post-Apply Audit/);
assert.match(pipeline, /73\. Workorder Size Spec Integration/);
assert.match(pipeline, /74\. Workorder PDF Visual Static Check/);
assert.match(pipeline, /75\. Workorder Size Spec Final Residual Audit/);
assert.match(pipeline, /Mode 'workorder-size-spec-compatibility'/);
assert.match(pipeline, /Mode 'workorder-size-spec'/);
assert.match(pipeline, /Mode 'workorder-size-spec-post-apply'/);
assert.match(pipeline, /InvokeReadOnlyDbAudit/);
assert.match(pipeline, /InvokeApprovedDbMigrationCommand/);

assert.match(runner, /"workorder-size-spec": "db\/migrations\/patch_0_24_34_workorder_size_spec_and_pdf\.sql"/);
assert.match(runner, /workorder_size_specs/);
assert.match(readonlyRunner, /workorder-size-spec-compatibility/);
assert.match(readonlyRunner, /workorder-size-spec-post-apply/);
assert.match(verifySafe, /workorder-size-pdf/);
assert.match(verifySafe, /patch_0_24_34_workorder_size_spec_and_pdf\.sql/);
assert.match(finishVersion, /workorder-size-pdf/);
assert.match(finishVersion, /patch_0_24_34_workorder_size_spec_and_pdf\.sql/);
assert.match(approvedWorkflow, /workorder-size-pdf/);

console.log("workorder size/PDF PowerShell menu contract: OK");
