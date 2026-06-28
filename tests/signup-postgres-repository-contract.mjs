import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("lib/signup/signupApplicationRepository.ts", "utf8");

for (const token of [
  "createPostgresSignupApplicationRepository",
  "DbTransactionClient",
  "queryDb",
  "createDraft",
  "updateDraft",
  "submitDraft",
  "findById",
  "findApplicantOwnedApplication",
  "findActiveByEmail",
  "findActiveByGoogleSub",
  "findActiveByBusinessRegistrationNormalized",
  "listReviewQueue",
  "transitionStatus",
  "markProvisioningStarted",
  "markProvisioningCompleted",
  "markProvisioningFailed",
  "retryFailedProvisioning",
  "SignupApplicationDuplicateError",
  "SignupApplicationConflictError",
  "SIGNUP_APPLICATION_DUPLICATE_CONSTRAINTS",
]) {
  assert.ok(source.includes(token), `signup repository missing ${token}`);
}

for (const token of [
  "VALUES ($1, $2, $3, true, $4, $5, $6, $7, $8, $9, $10)",
  "WHERE id = $1",
  "AND google_sub = $2",
  "AND email_normalized = $3",
  "AND status = $5",
  "AND status = ANY($5::text[])",
  "WHERE ($1::text IS NULL OR status = $1)",
  "AND provisioning_status = 'not_started'",
  "AND provisioning_status = 'in_progress'",
  "AND provisioning_status = $4",
  "RETURNING ${SIGNUP_APPLICATION_RETURNING_COLUMNS}",
]) {
  assert.ok(source.includes(token), `signup repository parameterized/CAS token missing ${token}`);
}

assert.doesNotMatch(source, /clientProvided|companyId.*input|role.*input|systemUserId.*input\.company/i);
assert.doesNotMatch(source, /DATABASE_URL|console\.log|console\.error|signedUrl|rawToken/i);
assert.doesNotMatch(source, /query\([^,]+`[^`]*\$\{input\./);
assert.match(source, /code === "23505"/);
assert.match(source, /mapSignupApplicationDuplicateConstraint\(error\.constraint \?\? ""\)/);
assert.match(source, /existing\?\.status === "approved" && existing\.provisioningStatus === "completed"/);

console.log("signup postgres repository contract: OK");
