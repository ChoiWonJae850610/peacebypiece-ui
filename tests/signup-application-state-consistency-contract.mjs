import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("db/migrations/patch_0_24_26_signup_applications.sql", "utf8");
const status = fs.readFileSync("lib/signup/signupApplicationStatus.ts", "utf8");
const repository = fs.readFileSync("lib/signup/signupApplicationRepository.ts", "utf8");

for (const token of [
  "signup_applications_status_provisioning_consistency_check",
  "status IN ('draft', 'submitted', 'changes_requested', 'rejected', 'canceled') AND provisioning_status = 'not_started'",
  "status = 'reviewing' AND provisioning_status IN ('not_started', 'in_progress')",
  "status = 'approved' AND provisioning_status = 'completed'",
  "status = 'provisioning_failed' AND provisioning_status = 'failed'",
]) {
  assert.ok(migration.includes(token), `state/provisioning check missing ${token}`);
}

assert.doesNotMatch(migration, /status = 'draft'[\s\S]{0,160}provisioning_status = 'completed'/);
assert.doesNotMatch(migration, /status = 'submitted'[\s\S]{0,160}provisioning_status = 'failed'/);
assert.doesNotMatch(migration, /status = 'rejected'[\s\S]{0,160}provisioning_status = 'in_progress'/);
assert.doesNotMatch(migration, /status = 'canceled'[\s\S]{0,160}provisioning_status = 'completed'/);

assert.ok(status.includes("canStartSignupProvisioning"));
assert.ok(repository.includes('expectedStatus: "reviewing"'));

console.log("signup application state consistency contract passed");
