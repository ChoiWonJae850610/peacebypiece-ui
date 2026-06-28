import assert from "node:assert/strict";
import fs from "node:fs";

const trial = fs.readFileSync("lib/billing/companyTrialPolicy.ts", "utf8");
const service = fs.readFileSync("lib/signup/signupApplicationService.ts", "utf8");
const provisioning = fs.readFileSync("lib/signup/signupApplicationProvisioning.ts", "utf8");

assert.ok(trial.includes("COMPANY_TRIAL_DAYS = 7"), "Trial duration must be 7 days");
assert.ok(trial.includes("TRIAL_STORAGE_LIMIT_BYTES = 100 * 1024 * 1024"), "Trial storage must be 100MB");
assert.ok(trial.includes("TRIAL_MEMBER_LIMIT = 3"), "Trial member limit must be 3");

for (const token of [
  "TRIAL_STORAGE_LIMIT_BYTES",
  "TRIAL_MEMBER_LIMIT",
  "startedAt",
  "approvedAt",
  "input.startedAt.getTime() !== approvedAt.getTime()",
  "getTrialEndsAt(input.startedAt)",
]) {
  assert.ok(`${service}\n${provisioning}`.includes(token), `approval Trial contract missing ${token}`);
}

assert.doesNotMatch(`${service}\n${provisioning}`, /1\s*\*\s*1024\s*\*\s*1024\s*\*\s*1024|memberLimit:\s*5/);

console.log("signup application trial policy contract passed");
