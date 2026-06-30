import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("db/migrations/patch_0_24_26_signup_applications.sql", "utf8");
const service = fs.readFileSync("lib/signup/signupApplicationService.ts", "utf8");
const status = fs.readFileSync("lib/signup/signupApplicationStatus.ts", "utf8");
const repository = fs.readFileSync("lib/signup/signupApplicationRepository.ts", "utf8");
const provisioningRepository = fs.readFileSync("lib/signup/signupApplicationProvisioningRepository.ts", "utf8");

assert.match(migration, /status <> 'provisioning_failed'[\s\S]*provisioning_status = 'failed'[\s\S]*provisioning_started_at IS NOT NULL[\s\S]*provisioning_error_code IS NOT NULL/);
assert.doesNotMatch(status, /submitted: \[[^\]]*provisioning_failed/);
assert.doesNotMatch(status, /reviewing: \[[^\]]*provisioning_failed/);
assert.ok(status.includes("assertCanStartSignupProvisioning"));

for (const token of [
  "try",
  "catch",
  "markProvisioningFailedOutsideTransaction",
  "sanitizeProvisioningErrorCode",
  "SignupProvisioningPersistedError",
  "SIGNUP_PROVISIONING_FAILED",
]) {
  assert.ok(`${service}\n${repository}\n${provisioningRepository}`.includes(token), `failure contract missing ${token}`);
}

assert.match(service, /throw new SignupProvisioningPersistedError\(input\.application\.id, errorCode\)/);
assert.doesNotMatch(service, /error\.message|String\(error\)|JSON\.stringify\(error\)/);
assert.match(provisioningRepository, /status = 'provisioning_failed'/);
assert.match(provisioningRepository, /provisioning_error_code = \$4/);
assert.match(provisioningRepository, /provisioning_started_at = COALESCE\(provisioning_started_at, \$3\)/);
assert.doesNotMatch(provisioningRepository, /error\.message|String\(error\)|JSON\.stringify\(error\)/);

console.log("signup application provisioning failure contract passed");
