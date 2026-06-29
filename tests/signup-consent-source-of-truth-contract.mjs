import assert from "node:assert/strict";
import fs from "node:fs";

const policy = fs.readFileSync("lib/signup/signupConsentPolicy.ts", "utf8");
const service = fs.readFileSync("lib/signup/signupConsentApiService.ts", "utf8");
const repository = fs.readFileSync("lib/signup/signupConsentRepository.ts", "utf8");
const applicationService = fs.readFileSync("lib/signup/signupApplicationApiService.ts", "utf8");
const dashboard = fs.readFileSync("components/signup/SignupApplicationDashboard.tsx", "utf8");
const migration = fs.readFileSync("db/migrations/patch_0_24_26_signup_application_consents.sql", "utf8");

for (const token of [
  "SIGNUP_REQUIRED_CONSENT_TYPES",
  "terms_of_service",
  "privacy_policy",
  "SIGNUP_CONSENT_POLICIES",
  "policyVersion: \"0.24.26\"",
  "parseSignupConsentType",
  "SIGNUP_PAYLOAD_INVALID",
  "policy: SIGNUP_CONSENT_POLICIES[input.consentType]",
  "now: new Date()",
  "revoked_at IS NULL",
  "assertOwnedSignupRequiredConsents",
  "SIGNUP_CONSENT_REQUIRED",
  "consent.policyCode === policy.policyCode",
  "consent.policyVersion === policy.policyVersion",
]) {
  assert.ok(`${policy}\n${service}\n${repository}\n${applicationService}\n${dashboard}`.includes(token), `signup consent source-of-truth missing ${token}`);
}

assert.doesNotMatch(`${service}\n${repository}`, /policyVersion.*payload|policyCode.*payload|agreedAt.*payload|agreedEmail.*payload|agreedGoogleSub.*payload/i);
assert.doesNotMatch(`${policy}\n${service}\n${repository}\n${dashboard}\n${migration}`, /marketing/i);
assert.doesNotMatch(`${service}\n${repository}`, /DELETE FROM signup_application_consents|hard delete|DROP TABLE signup_application_consents/i);
assert.match(applicationService, /await assertOwnedSignupRequiredConsents\(input\.session\)/);
assert.match(repository, /const activeKeys = new Set\(active\.map/);
assert.match(repository, /if \(missing\) throw new SignupConsentConflictError\("SIGNUP_CONSENT_REQUIRED"\)/);
assert.match(repository, /revoked_at IS NULL/);

console.log("signup consent source-of-truth contract passed");
