import assert from "node:assert/strict";
import fs from "node:fs";

const repository = fs.readFileSync("lib/signup/signupConsentRepository.ts", "utf8");
const migration = fs.readFileSync("db/migrations/patch_0_24_26_signup_application_consents.sql", "utf8");

for (const token of [
  "withDbTransaction",
  "createPostgresSignupConsentRepository(transactionClient).createCurrentConsent(input)",
  "SignupApplicationLockRow",
  "FOR UPDATE",
  "isUniqueViolation",
  "code === \"23505\"",
  "findActiveSameType",
  "isCurrentPolicy",
  "SIGNUP_CONSENT_POLICY_CONFLICT",
  "SIGNUP_CONSENT_NOT_ALLOWED",
  "signup_applications.google_sub",
  "signup_applications.email_normalized",
  "signup_applications.status IN ('draft', 'changes_requested')",
]) {
  assert.ok(repository.includes(token), `signup consent idempotency missing ${token}`);
}

assert.match(repository, /const existing = await findActiveSameType\(\);[\s\S]*if \(existing\) \{[\s\S]*if \(isCurrentPolicy\(existing\)\) return existing/);
assert.match(repository, /SELECT id[\s\S]*FROM signup_applications[\s\S]*google_sub = \$2[\s\S]*email_normalized = \$3[\s\S]*status IN \('draft', 'changes_requested'\)[\s\S]*FOR UPDATE/);
assert.match(repository, /catch \(error\) \{[\s\S]*if \(!isUniqueViolation\(error\)\) throw error;[\s\S]*throw new SignupConsentConflictError\("SIGNUP_CONSENT_POLICY_CONFLICT"\)/);
assert.doesNotMatch(repository, /catch \(error\) \{[\s\S]*const concurrent = await findActiveSameType\(\)/);
assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS signup_application_consents_active_type_unique[\s\S]*ON signup_application_consents \(application_id, consent_type\)[\s\S]*WHERE revoked_at IS NULL/);
assert.doesNotMatch(`${repository}\n${migration}`, /signup_application_consents_active_version_unique/);
assert.doesNotMatch(repository, /error\.message|constraint.*message|detail|hint/i);

console.log("signup consent idempotency/race contract passed");
