#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const pipeline = fs.readFileSync("tools/pipeline/peacebypiece-auto-pipeline.ps1", "utf8");

for (const entry of [
  "51. PDF/R2 Lifecycle Compatibility Audit",
  "52. PDF Fixture Generate",
  "53. PDF/R2 Lifecycle Integration",
  "54. PDF/R2 Reconciliation Dry Run",
  "55. PDF/R2 Exact Cleanup Plan",
]) {
  assert.ok(pipeline.includes(entry), `${entry} menu entry must exist`);
}

assert.match(pipeline, /RunPdfR2LifecycleCompatibilityAudit/);
assert.match(pipeline, /RunPdfR2FixtureGenerate/);
assert.match(pipeline, /RunPdfR2LifecycleIntegration/);
assert.match(pipeline, /RunPdfR2ReconciliationDryRun/);
assert.match(pipeline, /RunPdfR2ExactCleanupPlan/);
assert.match(pipeline, /node scripts\/run-pdf-r2-lifecycle-audit\.mjs --compatibility/);
assert.match(pipeline, /node scripts\/generate-pdf-r2-fixtures\.mjs/);
assert.match(pipeline, /node scripts\/run-pdf-r2-lifecycle-integration\.mjs/);
assert.match(pipeline, /node scripts\/run-pdf-r2-reconciliation-dry-run\.mjs/);
assert.match(pipeline, /node scripts\/run-pdf-r2-exact-cleanup-plan\.mjs/);

const developerMenu = pipeline.slice(
  pipeline.indexOf("function ShowDeveloperToolsMenu"),
  pipeline.indexOf("function GetDownloadWatcherProcess"),
);
const menuNumbers = [...developerMenu.matchAll(/Write-Host "\s*(\d+)\./g)].map((match) => Number(match[1]));
const duplicates = menuNumbers.filter((value, index) => menuNumbers.indexOf(value) !== index);
assert.deepEqual(duplicates, [], "PowerShell menu numbers must be unique");

assert.doesNotMatch(pipeline, /git add \.|git add -A|prefix delete|bucket-wide/);
assert.match(pipeline, /DB Migration Applied:[\s\S]*VerificationSummary\.DbMigrationApplyResult/);
assert.match(pipeline, /WAFL_PDF_R2_LIFECYCLE_INTEGRATION_APPROVED|RunPdfR2LifecycleIntegration/);
assert.match(pipeline, /PDF\/R2 Lifecycle Integration Result:[\s\S]*VerificationSummary\.PdfR2LifecycleIntegrationResult/);
assert.match(pipeline, /PDF\/R2 Worker Version:[\s\S]*VerificationSummary\.PdfR2WorkerVersion/);
assert.match(pipeline, /PDF Generator Worker Version:[\s\S]*VerificationSummary\.PdfGeneratorWorkerVersion/);
assert.match(pipeline, /PDF Exact Cleanup Plan:[\s\S]*VerificationSummary\.PdfExactCleanupPlan/);

console.log("PDF/R2 pipeline menu contract passed");
