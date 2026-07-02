#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const runner = fs.readFileSync("scripts/run-signup-approval-provisioning-integration.mjs", "utf8");
const pipeline = fs.readFileSync("tools/pipeline/peacebypiece-auto-pipeline.ps1", "utf8");

for (const token of [
  "RUN_SIGNUP_APPROVAL_PROVISIONING_DEV_TEST",
  "WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING",
  "WAFL_SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION",
  "WAFL_DB_AUDIT_APPROVED",
  "WAFL_APPROVED_DB_FINGERPRINT",
  "runtime-not-dev-test",
  "db-fingerprint-mismatch",
  "dev-test-db-fixture-only",
  "r2Mutation: \"none\"",
  "FIXTURE_PREFIX = \"signup-approval-it\"",
  "SIGNUP_APPROVAL_PROVISIONING_RESULT",
  "residualDbRows: manifest.residualRows",
  "residualR2Objects: 0",
  "productionMutation: false",
  "schemaMigrationThisRun: false",
]) {
  assert.ok(runner.includes(token), `runner guard/result missing ${token}`);
}

assert.match(runner, /INSERT INTO signup_applications/);
assert.match(runner, /INSERT INTO signup_application_consents/);
assert.match(runner, /INSERT INTO signup_application_files/);
assert.match(runner, /INSERT INTO signup_payment_method_references/);
assert.match(runner, /SIGNUP_APPROVAL_PAYMENT_READINESS_REQUIRED/);
assert.match(runner, /INSERT INTO company_payment_method_references/);
assert.match(runner, /FOR UPDATE/);
assert.match(runner, /started\.rowCount !== 1/);
assert.match(runner, /created_company_id = \$2[\s\S]*status = 'reviewing'[\s\S]*provisioning_status = 'in_progress'/);
assert.match(runner, /completed\.rowCount !== 1/);
assert.match(runner, /CLEANUP_ONLY/);
assert.match(runner, /SCHEMA_DIAGNOSTIC/);
assert.match(runner, /cleanupFixtureRowsByPrefix/);
assert.match(runner, /SIGNUP_APPROVAL_PROVISIONING_SCHEMA_DIAGNOSTIC/);
assert.match(runner, /existingUserReuse = "PASS"/);
assert.match(runner, /EXISTING_USER_TENANT_OVERWRITE_DETECTED/);
assert.match(runner, /IDENTITY_CONFLICT_ROLLBACK_FAILED/);
assert.match(runner, /IDEMPOTENCY_FAILED/);
assert.match(runner, /TRIAL_STORAGE_LIMIT_BYTES = 100 \* 1024 \* 1024/);
assert.match(runner, /TRIAL_MEMBER_LIMIT = 3/);
assert.match(runner, /DELETE FROM audit_logs/);
assert.match(runner, /DELETE FROM company_files/);
assert.match(runner, /DELETE FROM company_subscriptions/);
assert.match(runner, /DELETE FROM member_permissions/);
assert.match(runner, /DELETE FROM company_members/);
assert.match(runner, /DELETE FROM users/);
assert.match(runner, /DELETE FROM companies/);
assert.doesNotMatch(runner, /R2_WORKER_UPLOAD_URL|R2_WORKER_UPLOAD_SECRET|putR2Object|deleteR2Object|fetch\(/, "approval provisioning runner must not call R2/Worker");
assert.doesNotMatch(runner, /SMTP|sendMail|resend|nodemailer|billing_key|cardNumber|cvc|cvv|cardPassword|providerSecret|webhookSecret/i, "approval provisioning runner must not send email or store raw payment secrets");

assert.match(pipeline, /\[switch\]\$RunSignupApprovalProvisioningIntegration/);
assert.match(pipeline, /\[switch\]\$CleanupSignupApprovalProvisioningFixtures/);
assert.match(pipeline, /\[switch\]\$DiagnoseSignupApprovalProvisioningSchema/);
assert.match(pipeline, /function RunSignupApprovalProvisioningIntegration/);
assert.match(pipeline, /function CleanupSignupApprovalProvisioningFixtures/);
assert.match(pipeline, /function DiagnoseSignupApprovalProvisioningSchema/);
assert.match(pipeline, /Signup Approval Provisioning Integration/);
assert.match(pipeline, /DEV\/TEST DB/);
assert.match(pipeline, /46 \{ RunSignupApprovalProvisioningIntegration \| Out-Null \}/);
assert.match(pipeline, /node scripts\/run-signup-approval-provisioning-integration\.mjs/);
assert.match(pipeline, /node scripts\/run-signup-approval-provisioning-integration\.mjs --cleanup-leftovers/);
assert.match(pipeline, /node scripts\/run-signup-approval-provisioning-integration\.mjs --schema-diagnostic/);
assert.match(pipeline, /WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING = '1'/);
assert.match(pipeline, /WAFL_SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION = 'RUN_SIGNUP_APPROVAL_PROVISIONING_DEV_TEST'/);
assert.match(pipeline, /WAFL_SIGNUP_APPROVAL_PROVISIONING_CLEANUP_ONLY = '1'/);
assert.match(pipeline, /WAFL_SIGNUP_APPROVAL_PROVISIONING_SCHEMA_DIAGNOSTIC = '1'/);
assert.match(pipeline, /ResultDirectory \$approvalLogDir/);

console.log("signup approval provisioning integration runner contract: OK");
