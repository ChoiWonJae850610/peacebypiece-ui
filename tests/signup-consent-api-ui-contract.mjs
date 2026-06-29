import assert from "node:assert/strict";
import fs from "node:fs";

const policy = fs.readFileSync("lib/signup/signupConsentPolicy.ts", "utf8");
const repository = fs.readFileSync("lib/signup/signupConsentRepository.ts", "utf8");
const service = fs.readFileSync("lib/signup/signupConsentApiService.ts", "utf8");
const applicationService = fs.readFileSync("lib/signup/signupApplicationApiService.ts", "utf8");
const route = fs.readFileSync("app/api/signup/application/consents/route.ts", "utf8");
const revokeRoute = fs.readFileSync("app/api/signup/application/consents/revoke/route.ts", "utf8");
const dashboard = fs.readFileSync("components/signup/SignupApplicationDashboard.tsx", "utf8");
const index = fs.readFileSync("lib/signup/index.ts", "utf8");

for (const token of [
  "SIGNUP_REQUIRED_CONSENT_TYPES",
  "terms_of_service",
  "privacy_policy",
  "wafl_terms_of_service",
  "wafl_privacy_policy",
  "policyVersion: \"0.24.26\"",
  "createPostgresSignupConsentRepository",
  "listActiveConsents",
  "createCurrentConsent",
  "revokeActiveConsent",
  "assertRequiredActiveConsents",
  "agreed_email_normalized",
  "agreed_google_sub",
  "signup_applications.google_sub",
  "signup_applications.email_normalized",
  "SIGNUP_CONSENT_REQUIRED",
  "summarizeSignupConsentPolicies",
  "parseSignupConsentType",
  "isSameOriginSignupMutation",
  "assertSignupRateLimitExtensionPoint",
  "Cache-Control",
  "no-store",
]) {
  assert.ok(`${policy}\n${repository}\n${service}\n${route}\n${revokeRoute}\n${dashboard}\n${applicationService}\n${index}`.includes(token), `signup consent foundation missing ${token}`);
}

assert.match(applicationService, /await assertOwnedSignupRequiredConsents\(input\.session\)/);
assert.match(dashboard, /fetch\("\/api\/signup\/application\/consents"/);
assert.match(dashboard, /fetch\("\/api\/signup\/application\/consents\/revoke"/);
assert.match(dashboard, /await saveApplicationDraft\(\);\s+await ensureSelectedConsents\(\);/s);
assert.doesNotMatch(`${route}\n${revokeRoute}\n${service}`, /policyVersion.*payload|agreedAt.*payload|googleSub.*payload|emailNormalized.*payload/i);
assert.doesNotMatch(`${repository}\n${route}\n${revokeRoute}`, /PutObjectCommand|createSignedUploadUrl|raw_card|payment_reference/i);

console.log("signup consent API/UI contract passed");
