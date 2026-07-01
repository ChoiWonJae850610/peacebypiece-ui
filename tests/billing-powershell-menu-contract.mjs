import assert from "node:assert/strict";
import fs from "node:fs";

const pipeline = fs.readFileSync("tools/pipeline/peacebypiece-auto-pipeline.ps1", "utf8");

for (const token of [
  "RunBillingCompatibilityAudit",
  "ApplyBillingOperationsMigration",
  "RunBillingPostApplyAudit",
  "RunBillingOperationsIntegration",
  "billing-compatibility",
  "billing-operations",
  "billing-post-apply",
  "Billing Compatibility Audit",
  "Billing Migration Apply",
  "Billing Post-Apply Audit",
  "Billing Simulator Integration",
  "56 { RunBillingCompatibilityAudit",
  "57 { ApplyBillingOperationsMigration",
  "58 { RunBillingPostApplyAudit",
  "59 { RunBillingOperationsIntegration",
]) {
  assert.ok(pipeline.includes(token), `pipeline missing ${token}`);
}

assert.ok(pipeline.includes('"56. Billing Compatibility Audit'));
assert.ok(pipeline.includes('"57. Billing Migration Apply'));
assert.ok(pipeline.includes('"58. Billing Post-Apply Audit'));
assert.ok(pipeline.includes('"59. Billing Simulator Integration'));

console.log("billing PowerShell menu contract passed");
