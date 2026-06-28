import assert from "node:assert/strict";
import fs from "node:fs";

const status = fs.readFileSync("lib/signup/signupApplicationStatus.ts", "utf8");
const types = fs.readFileSync("lib/signup/signupApplicationTypes.ts", "utf8");

for (const transition of [
  'draft: ["submitted", "canceled"]',
  'submitted: ["reviewing", "changes_requested", "rejected", "canceled"]',
  'reviewing: ["changes_requested", "approved", "rejected", "canceled"]',
  'changes_requested: ["submitted", "rejected", "canceled"]',
  "approved: []",
  "rejected: []",
  "canceled: []",
  'provisioning_failed: ["rejected", "canceled"]',
]) {
  assert.ok(status.includes(transition), `status transition missing ${transition}`);
}

assert.doesNotMatch(status, /submitted: \[[^\]]*provisioning_failed/);
assert.doesNotMatch(status, /reviewing: \[[^\]]*provisioning_failed/);
assert.doesNotMatch(status, /provisioning_failed: \[[^\]]*"reviewing"/);
assert.match(status, /canStartSignupProvisioning/);
assert.ok(types.includes('["approved", "rejected", "canceled"]'), "final statuses must be terminal");
assert.match(status, /canTransitionSignupApplicationStatus/);
assert.match(status, /assertSignupApplicationStatusTransition/);
assert.match(status, /Invalid signup application status transition/);

console.log("signup application status transition contract passed");
