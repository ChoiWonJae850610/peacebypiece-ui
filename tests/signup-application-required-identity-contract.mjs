import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("db/migrations/patch_0_24_26_signup_applications.sql", "utf8");
const repository = fs.readFileSync("lib/signup/signupApplicationRepository.ts", "utf8");

for (const token of [
  "length(trim(google_sub)) > 0",
  "length(trim(applicant_name)) > 0",
  "length(trim(requested_company_name)) > 0",
  "length(trim(business_name)) > 0",
  "requested_plan_code IN ('lite', 'flow', 'studio', 'custom')",
]) {
  assert.ok(migration.includes(token), `required identity/company check missing ${token}`);
}

for (const token of [
  'assertNonEmpty("googleSub"',
  'assertNonEmpty("email"',
  'assertNonEmpty("applicantName"',
  'assertNonEmpty("requestedCompanyName"',
  'assertNonEmpty("businessName"',
]) {
  assert.ok(repository.includes(token), `repository required field contract missing ${token}`);
}

console.log("signup application required identity contract passed");
