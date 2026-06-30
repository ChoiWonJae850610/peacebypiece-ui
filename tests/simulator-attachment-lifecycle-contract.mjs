#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const commandPath = "tools/simulator/commands/attachment-lifecycle.mjs";
const pipelinePath = "tools/pipeline/peacebypiece-auto-pipeline.ps1";
const verifyPath = "tools/pipeline/verify-safe.ps1";
const r2ManifestPath = "tools/simulator/adapters/r2/manifest.mjs";
const dbManifestPath = "tools/simulator/adapters/db/manifest.mjs";

const source = fs.readFileSync(commandPath, "utf8");
const pipeline = fs.readFileSync(pipelinePath, "utf8");
const verify = fs.readFileSync(verifyPath, "utf8");
const r2Manifest = fs.readFileSync(r2ManifestPath, "utf8");
const dbManifest = fs.readFileSync(dbManifestPath, "utf8");

for (const token of [
  "WAFL_SIMULATOR_ATTACHMENT_ENABLE_MUTATION",
  "WAFL_SIMULATOR_ATTACHMENT_CONFIRM",
  "WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT",
  "WAFL_SIMULATOR_APPROVED_WORKER_URL_FINGERPRINT",
  "WAFL_FUNCTIONS_TEST_PREFIX",
  "ACTUAL_DB_R2_MUTATION_REQUIRES_SEPARATE_USER_APPROVAL_AND_RUNTIME_EXECUTION",
]) {
  assert.match(source, new RegExp(token), `command must include ${token}`);
}

assert.match(source, /runtime === "production"/);
assert.match(source, /companies\/\$\{manifest\.testPrefix\}-/);
assert.match(source, /cleanupRange/);
assert.match(source, /reconciliationScope/);
assert.match(source, /resumeRollbackCompensation/);
assert.match(source, /MUTATING_MODES/);
assert.match(source, /mode === "generate"/);
assert.match(source, /repair-e-to-g/);
assert.match(source, /REPAIR WAF-FN ATTACHMENTS E TO G/);
assert.match(source, /replace-valid-file-fixtures/);
assert.match(source, /REPLACE WAF-FN VALID FILE FIXTURES/);
assert.match(source, /replaceValidFileFixtures/);
assert.match(source, /VALID_FILE_FIXTURE_RECONCILIATION_FAILED/);
assert.match(source, /delete-exact-orphan-objects/);
assert.match(source, /DELETE WAF-FN A B EXACT ORPHAN OBJECTS/);
assert.match(source, /EXACT_ORPHAN_OBJECT_FIXTURES/);
assert.match(source, /expected_sha256/);
assert.match(source, /validateExactOrphanDeletePreconditions/);
assert.match(source, /EXACT_ORPHAN_DELETE_PREFLIGHT_FAILED/);
assert.match(source, /exactOrphanExpectedBytes/);
assert.match(source, /b9abf894-48b6-4ba6-ba1d-775849e8e2a1\.png/);
assert.match(source, /8030b36d458248011d3006b47915a580a629846bf5d6f84a1ecf5f6e67d5c5cf/);
assert.match(source, /LEGACY_E_ATTACHMENT_FIXTURES/);
assert.match(source, /deleteWorkerObjectAndVerifyMissing/);
assert.match(source, /exact_size_bytes/);
assert.match(source, /createValidPdfBytes/);
assert.match(source, /createValidPngBytes/);
assert.match(source, /createValidJpegBytes/);
assert.match(source, /validateFileBytesForItem/);
assert.match(source, /createR2WorkerSignedUrl/);
assert.match(source, /R2_WORKER_UPLOAD_URL/);
assert.match(source, /R2_WORKER_UPLOAD_SECRET/);
assert.match(source, /method: "PUT"/);
assert.match(source, /method: "GET"/);
assert.match(source, /orphanScanScope: "not_performed_manifest_scoped_only"/);
assert.doesNotMatch(source, /@aws-sdk\/client-s3/);
assert.doesNotMatch(source, /S3Client|HeadObjectCommand|ListObjectsV2Command|PutObjectCommand|GetObjectCommand/);
assert.doesNotMatch(source, /R2_ENDPOINT|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY/);
assert.doesNotMatch(source, /base = Buffer\.from\("%PDF-1\.4/);
assert.doesNotMatch(source, /console\.log\(.*DATABASE_URL/);
assert.doesNotMatch(source, /console\.log\(.*R2_SECRET/);
assert.doesNotMatch(source, /console\.log\(.*R2_WORKER_UPLOAD_SECRET/);

for (const menu of [
  "34. Simulator Attachment Plan",
  "35. Simulator Attachment Local Generate",
  "36. Simulator Attachment Upload+Seed",
  "37. Simulator Attachment Verify+Reconcile",
  "38. Simulator Attachment Lifecycle Test",
  "39. Simulator Attachment Cleanup",
  "40. Simulator Attachment Fault Plan",
  "41. Simulator Attachment Fault Execute",
]) {
  assert.ok(pipeline.includes(menu), `missing menu label: ${menu}`);
}

for (const confirmation of [
  "UPLOAD SEED WAF-FN ATTACHMENTS",
  "RUN WAF-FN ATTACHMENT LIFECYCLE",
  "CLEAN WAF-FN ATTACHMENTS",
  "CREATE WAF-FN ATTACHMENT FAULTS",
]) {
  assert.ok(pipeline.includes(confirmation), `missing confirmation ${confirmation}`);
  assert.ok(source.includes(confirmation), `command missing confirmation ${confirmation}`);
}
assert.ok(source.includes("REPAIR WAF-FN ATTACHMENTS E TO G"), "command missing E to G repair confirmation");
assert.ok(source.includes("REPLACE WAF-FN VALID FILE FIXTURES"), "command missing valid file fixture replacement confirmation");
assert.ok(source.includes("DELETE WAF-FN A B EXACT ORPHAN OBJECTS"), "command missing exact orphan delete confirmation");

assert.match(pipeline, /ApprovedWorkerUrlFingerprint|ApprovedWorkerHostFingerprint|ApprovedWorkerUrlAllowlist/);
assert.match(pipeline, /WAFL_SIMULATOR_APPROVED_WORKER_URL_FINGERPRINT/);
assert.doesNotMatch(pipeline, /WAFL_SIMULATOR_APPROVED_R2_FINGERPRINT/);
assert.match(pipeline, /0~45/);
assert.match(verify, /simulator attachment manifest contract/);
assert.match(verify, /simulator attachment lifecycle contract/);
assert.match(r2Manifest, /canonicalAttachmentManifest/);
assert.match(r2Manifest, /exact_size_bytes/);
assert.match(dbManifest, /attachment_trash_items/);

const plan = spawnSync(process.execPath, [commandPath, "--mode=plan"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
assert.equal(plan.status, 0, plan.stderr);
assert.match(plan.stdout, /No DB or R2 mutation was executed|mode=plan/);

const uploadPlan = spawnSync(process.execPath, [commandPath, "--mode=upload-seed"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
assert.equal(uploadPlan.status, 0, uploadPlan.stderr);
assert.match(uploadPlan.stdout, /No DB or R2 mutation was executed/);

const repairPlan = spawnSync(process.execPath, [commandPath, "--mode=repair-e-to-g"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
assert.equal(repairPlan.status, 0, repairPlan.stderr);
assert.match(repairPlan.stdout, /No DB or R2 mutation was executed/);

const replacePlan = spawnSync(process.execPath, [commandPath, "--mode=replace-valid-file-fixtures"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
assert.equal(replacePlan.status, 0, replacePlan.stderr);
assert.match(replacePlan.stdout, /No DB or R2 mutation was executed/);

const exactOrphanPlan = spawnSync(process.execPath, [commandPath, "--mode=delete-exact-orphan-objects"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
assert.equal(exactOrphanPlan.status, 0, exactOrphanPlan.stderr);
assert.match(exactOrphanPlan.stdout, /No DB or R2 mutation was executed/);
assert.match(exactOrphanPlan.stdout, /exactOrphanTargets=4/);
assert.match(exactOrphanPlan.stdout, /exactOrphanExpectedBytes=7803086/);

console.log("simulator attachment lifecycle contract passed: guard, menu, preflight, verify profile");
