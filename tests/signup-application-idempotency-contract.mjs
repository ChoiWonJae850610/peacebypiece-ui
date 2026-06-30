import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("db/migrations/patch_0_24_26_signup_applications.sql", "utf8");
const repository = fs.readFileSync("lib/signup/signupApplicationRepository.ts", "utf8");
const service = fs.readFileSync("lib/signup/signupApplicationService.ts", "utf8");
const provisioning = fs.readFileSync("lib/signup/signupApplicationProvisioning.ts", "utf8");
const provisioningRepository = fs.readFileSync("lib/signup/signupApplicationProvisioningRepository.ts", "utf8");
const session = fs.readFileSync("lib/signup/signupApplicationSession.ts", "utf8");

for (const indexName of [
  "signup_applications_active_email_idx",
  "signup_applications_active_google_sub_idx",
  "signup_applications_active_business_registration_idx",
  "signup_applications_created_company_idx",
  "signup_applications_created_user_idx",
  "signup_applications_created_member_idx",
  "signup_applications_created_subscription_idx",
]) {
  assert.ok(migration.includes(indexName), `migration missing duplicate/idempotency index ${indexName}`);
  assert.ok(repository.includes(indexName), `repository missing duplicate/idempotency index ${indexName}`);
}

for (const token of [
  "provisionApprovedSignup",
  "approvedBySystemUserId",
  "approvedAt",
  "FOR UPDATE",
  "provisioning_status = 'in_progress'",
  "provisioning_status = 'completed'",
  "started.rowCount !== 1",
  "completed.rowCount !== 1",
  "SIGNUP_PROVISIONING_START_CONFLICT",
  "SIGNUP_PROVISIONING_COMPLETE_CONFLICT",
  "markProvisioningFailedOutsideTransaction",
  "created_company_id",
  "SignupApprovalProvisioningPort",
]) {
  assert.ok(`${service}\n${provisioning}\n${provisioningRepository}`.includes(token), `provisioning contract missing ${token}`);
}

for (const token of [
  "PendingSignupApplicationSession",
  "emailVerified: true",
  "/workspace",
  "/api/workspace",
  "/api/workorders",
  "/api/files",
  "/api/members",
  "/api/admin/settings",
  "/api/admin/subscription",
]) {
  assert.ok(session.includes(token), `pending session contract missing ${token}`);
}

assert.doesNotMatch(`${migration}\n${service}\n${provisioning}\n${provisioningRepository}`, /createDefaultCatalog|size provisioning|POM/i);

console.log("signup application idempotency contract passed");
