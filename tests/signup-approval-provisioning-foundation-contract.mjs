#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const repository = fs.readFileSync("lib/signup/signupApplicationProvisioningRepository.ts", "utf8");
const policy = fs.readFileSync("lib/signup/signupApplicationProvisioningPolicy.ts", "utf8");
const approveRoute = fs.readFileSync("app/api/system/signup/applications/[applicationId]/approve/route.ts", "utf8");
const planRoute = fs.readFileSync("app/api/system/signup/applications/[applicationId]/provisioning-plan/route.ts", "utf8");
const service = fs.readFileSync("lib/signup/signupApplicationService.ts", "utf8");
const actions = fs.readFileSync("components/system/signup/SystemSignupReviewDetailActions.tsx", "utf8");

assert.match(repository, /withDbTransaction\(async \(client\) => \{/);
assert.match(repository, /FOR UPDATE/, "approval provisioning must lock the application row");
assert.match(repository, /selectApplicationForUpdate/, "approval must use a dedicated FOR UPDATE lookup");
assert.match(repository, /status === "approved"[\s\S]*provisioning_status === "completed"[\s\S]*created_company_id/, "already completed provisioning must be idempotent");
assert.match(repository, /INSERT INTO companies/, "provisioning must create the company");
assert.match(repository, /INSERT INTO users/, "provisioning must create the first admin user when Google sub is new");
assert.match(repository, /WHERE google_sub = \$1/, "existing user reuse must be by Google sub");
assert.match(repository, /lower\(email\) = \$1[\s\S]*google_sub IS NULL OR google_sub <> \$2/, "email-only merge must be denied");
const existingUserUpdate = repository.slice(
  repository.indexOf("if (existing) {"),
  repository.indexOf("return { userId: existing.id, reused: true };"),
);
assert.doesNotMatch(existingUserUpdate, /company_id\s*=\s*\$\d|role\s*=\s*\$\d/, "existing Google-sub user reuse must not overwrite users.company_id or users.role");
assert.match(repository, /hasCompanyIdentityConflict/, "existing company identity conflicts must be checked before provisioning");
assert.match(repository, /regexp_replace\(COALESCE\(business_registration_number/, "business-registration duplicate checks must normalize digits");
assert.match(repository, /SIGNUP_APPROVAL_IDENTITY_CONFLICT/, "identity conflicts must use a safe code");
assert.match(repository, /INSERT INTO company_members/, "provisioning must create company membership");
assert.match(repository, /getCompanyAdminMemberRoleTemplateCode\(\)/, "company-admin role template must come from the canonical helper");
assert.match(repository, /getMemberRoleTemplatePermissions\(getCompanyAdminMemberRoleTemplateCode\(\)\)/, "company-admin permissions must come from the canonical helper");
assert.match(repository, /INSERT INTO member_permissions/, "company-admin permissions must be assigned");
assert.match(repository, /INSERT INTO company_subscriptions/, "Trial subscription must be created");
assert.match(repository, /TRIAL_PLAN_CODE/, "subscription must use the canonical Trial plan code");
assert.match(repository, /TRIAL_STORAGE_LIMIT_BYTES/, "Trial storage must use the canonical constant");
assert.match(repository, /TRIAL_MEMBER_LIMIT/, "Trial member limit must use the canonical constant");
assert.match(repository, /getTrialEndsAt\(input\.approvedAt\)|getTrialEndsAt\(approvedAt\)/, "Trial end must derive from approval time");
assert.match(repository, /provisionCompanyCatalog/, "approval provisioning must create company catalog defaults");
assert.match(repository, /SYSTEM_CATALOG_VERSION_CODE/, "approval audit must record the system catalog version");
assert.match(repository, /wouldProvisionCatalog/, "dry-run plan must report catalog provisioning readiness");
assert.match(repository, /INSERT INTO company_files/, "certificate ownership must link through company_files");
assert.match(repository, /UPDATE signup_application_files[\s\S]*approved_company_file_id/, "signup certificate metadata must record the company file link");
assert.doesNotMatch(repository, /putR2Object|deleteR2Object|uploadObject|R2_WORKER|signed URL|storage_key.*console/i, "provisioning must not mutate R2 or expose raw storage details");
assert.match(repository, /INSERT INTO audit_logs/, "approval provisioning must write an audit trace in the transaction");
assert.match(repository, /event_type[\s\S]*signup\.approved/, "audit event must be signup.approved");
assert.match(repository, /status = 'approved'[\s\S]*provisioning_status = 'completed'[\s\S]*created_company_id/, "application must be marked approved with created ids");
assert.match(repository, /started\.rowCount !== 1/, "provisioning start must require CAS rowCount 1");
assert.match(repository, /created_company_id = \$2[\s\S]*status = 'reviewing'[\s\S]*provisioning_status = 'in_progress'/, "provisioning must prepare created ids before final approved transition");
assert.match(repository, /completed\.rowCount !== 1/, "provisioning completion must require CAS rowCount 1");
assert.match(repository, /SIGNUP_PROVISIONING_START_CONFLICT/);
assert.match(repository, /SIGNUP_PROVISIONING_COMPLETE_CONFLICT/);
assert.match(repository, /markProvisioningFailedOutsideTransaction/, "transaction rollback failure must use a safe out-of-transaction failure marker");
assert.match(repository, /SIGNUP_APPROVAL_EMAIL_NOT_VERIFIED/);
assert.match(repository, /SIGNUP_APPROVAL_CONSENT_INCOMPLETE/);
assert.match(repository, /SIGNUP_APPROVAL_CONSENT_OUTDATED/);
assert.match(repository, /SIGNUP_APPROVAL_CERTIFICATE_MISSING/);
assert.match(repository, /SIGNUP_APPROVAL_STATUS_CONFLICT/);
assert.match(repository, /SIGNUP_APPROVAL_PLAN_INVALID/);

assert.match(repository, /getSignupProvisioningPlan/, "dry-run provisioning plan must exist");
assert.match(repository, /selectApplicationSnapshot/, "dry-run plan must not lock or mutate");
const planFunction = repository.slice(
  repository.indexOf("export async function getSignupProvisioningPlan"),
  repository.indexOf("export class PostgresSignupApprovalProvisioningRepository"),
);
assert.doesNotMatch(planFunction, /INSERT INTO|UPDATE signup_applications|DELETE FROM|CREATE TABLE|ALTER TABLE/i, "dry-run plan must not mutate DB");

assert.match(policy, /WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING/, "actual execution must require a server-only env gate");
assert.match(policy, /RUN_SIGNUP_APPROVAL_PROVISIONING_DEV_TEST/, "actual execution must require an explicit confirmation phrase");
assert.match(policy, /isServerDevTestRuntime\(\)/, "actual execution must be dev/test runtime only");
assert.match(policy, /SIGNUP_PROVISIONING_CONFIRMATION_REQUIRED/, "missing confirmation must block execution");

for (const source of [approveRoute, planRoute]) {
  assert.match(source, /requireSystemAdminScope/, "provisioning routes must require actual active system-admin");
  assert.match(source, /Cache-Control": "no-store"/, "provisioning routes must be no-store");
}
assert.match(approveRoute, /isSameOrigin/, "approve route must enforce same-origin mutation guard");
assert.match(approveRoute, /getSignupApprovalProvisioningExecutionGate/, "approve route must check the execution gate before mutation");
assert.match(approveRoute, /SIGNUP_PROVISIONING_EXECUTION_BLOCKED/, "default blocked execution must return a safe code");
assert.match(approveRoute, /createSignupApplicationService/, "approve route must call the service/port instead of inline SQL");
assert.match(approveRoute, /createPostgresSignupApprovalProvisioningRepository/, "approve route must use the concrete PostgreSQL provisioning port");
assert.doesNotMatch(approveRoute, /INSERT INTO companies|INSERT INTO users|INSERT INTO company_subscriptions/i, "route must not contain provisioning SQL");
assert.doesNotMatch(approveRoute, /error\.message|String\(error\)|JSON\.stringify\(error\)/, "approve route must not expose raw DB errors");

assert.doesNotMatch(service, /markProvisioningStarted[\s\S]*provisionApprovedSignup[\s\S]*markProvisioningCompleted/, "service must not split provisioning across multiple transactions");
assert.match(service, /provisionApprovedSignup/, "service must call the provisioning port");
assert.match(actions, /provisioning-plan/, "UI must expose dry-run plan");
assert.match(actions, /\/approve/, "UI must connect to the approve gate endpoint");
assert.match(actions, /RUN_SIGNUP_APPROVAL_PROVISIONING_DEV_TEST/, "0.24.33 QA UI must send the explicit dev/test mutation confirmation phrase");

console.log("signup approval provisioning foundation contract: OK");
