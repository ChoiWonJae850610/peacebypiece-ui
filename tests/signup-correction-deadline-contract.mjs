#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const policy = fs.readFileSync("lib/signup/signupCorrectionPolicy.ts", "utf8");
const repository = fs.readFileSync("lib/system/signupReviewRepository.ts", "utf8");

assert.match(repository, /correction_due_at = now\(\) \+ interval '3 days'/);
assert.match(policy, /SIGNUP_CORRECTION_DEADLINE_DAYS = 3/);
assert.match(policy, /status === "changes_requested"/);
assert.match(policy, /statusTo: "rejected"/);
assert.match(policy, /SIGNUP_CORRECTION_DEADLINE_EXPIRED/);
assert.match(policy, /signup_correction_deadline_soon/);
assert.match(policy, /idempotencyKey/);
assert.match(policy, /scheduler_approval/);

console.log("signup correction deadline contract passed");
