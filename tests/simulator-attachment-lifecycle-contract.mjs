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
  "WAFL_SIMULATOR_APPROVED_R2_FINGERPRINT",
  "WAFL_FUNCTIONS_TEST_PREFIX",
  "ACTUAL_DB_R2_MUTATION_REQUIRES_SEPARATE_USER_APPROVAL_AND_RUNTIME_EXECUTION",
]) {
  assert.match(source, new RegExp(token), `command must include ${token}`);
}

assert.match(source, /runtime === "production"/);
assert.match(source, /companies\/\$\{manifest\.testPrefix\}-/);
assert.match(source, /cleanupRange/);
assert.match(source, /resumeRollbackCompensation/);
assert.match(source, /MUTATING_MODES/);
assert.match(source, /mode === "generate"/);
assert.match(source, /exact_size_bytes/);
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

assert.match(pipeline, /ApprovedR2Fingerprint/);
assert.match(pipeline, /WAFL_SIMULATOR_APPROVED_R2_FINGERPRINT/);
assert.match(pipeline, /0~41/);
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

console.log("simulator attachment lifecycle contract passed: guard, menu, preflight, verify profile");
