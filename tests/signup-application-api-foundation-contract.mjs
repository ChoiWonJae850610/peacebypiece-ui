import assert from "node:assert/strict";
import fs from "node:fs";

const service = fs.readFileSync("lib/signup/signupApplicationApiService.ts", "utf8");
const error = fs.readFileSync("lib/signup/signupApplicationApiError.ts", "utf8");
const index = fs.readFileSync("lib/signup/index.ts", "utf8");
const route = fs.readFileSync("app/api/signup/application/route.ts", "utf8");
const submit = fs.readFileSync("app/api/signup/application/submit/route.ts", "utf8");
const status = fs.readFileSync("app/api/signup/application/status/route.ts", "utf8");
const cancel = fs.readFileSync("app/api/signup/application/cancel/route.ts", "utf8");
const consents = fs.readFileSync("app/api/signup/application/consents/route.ts", "utf8");
const consentService = fs.readFileSync("lib/signup/signupConsentApiService.ts", "utf8");
const all = `${service}\n${error}\n${index}\n${route}\n${submit}\n${status}\n${cancel}\n${consents}\n${consentService}`;

for (const token of [
  "parseSignupApplicationCompanyInput",
  "createSignupApplicationDraft",
  "getOwnedSignupApplication",
  "updateOwnedSignupApplicationDraft",
  "submitOwnedSignupApplication",
  "cancelOwnedSignupApplication",
  "findApplicantOwnedApplication",
  "createSignupApplicantOwner",
  "SIGNUP_APPLICANT_SESSION_REQUIRED",
  "SIGNUP_APPLICATION_ID_REQUIRED",
  "SIGNUP_APPLICATION_NOT_FOUND",
  "SIGNUP_APPLICATION_CONFLICT",
  "SIGNUP_PAYLOAD_INVALID",
  "SIGNUP_DUPLICATE_EMAIL",
  "SIGNUP_DUPLICATE_GOOGLE_SUB",
  "SIGNUP_DUPLICATE_BUSINESS_REGISTRATION",
  "SIGNUP_CONSENT_REQUIRED",
  "Cache-Control",
  "no-store",
]) {
  assert.ok(all.includes(token), `signup application API foundation missing ${token}`);
}

for (const forbidden of [
  "PutObjectCommand",
  "createSignedUploadUrl",
  "completeProvisioning",
  "approveApplication",
  "rejectApplication",
  "captchaSecret",
  "payment_reference",
  "card",
]) {
  assert.ok(!all.includes(forbidden), `signup API foundation must not include ${forbidden}`);
}

assert.match(service, /if \(!input\.session\.applicationId\)/);
assert.match(service, /if \(input\.session\.applicationId\)/);
assert.match(service, /application\.status !== "draft" && application\.status !== "changes_requested"/);
assert.match(service, /assertOwnedSignupRequiredConsents\(input\.session\)/);
assert.match(service, /\["draft", "submitted", "changes_requested"\]/);
assert.match(route, /request\.json\(\)\.catch\(\(\) => null\)/);
assert.match(route, /setApplicantSessionApplicationId/);
assert.match(submit, /getCurrentSignupApplicantSession/);
assert.match(cancel, /getCurrentSignupApplicantSession/);
assert.match(status, /getOwnedSignupApplication/);

console.log("signup application API foundation contract: OK");
