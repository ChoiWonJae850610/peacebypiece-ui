import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const workflowPath = path.join(root, "tools", "pipeline", "approved-workflow.ps1");
const verifyPath = path.join(root, "tools", "pipeline", "verify-safe.ps1");
const finishPath = path.join(root, "tools", "pipeline", "finish-version.ps1");
const workflow = fs.readFileSync(workflowPath, "utf8");
const verify = fs.readFileSync(verifyPath, "utf8");
const finish = fs.readFileSync(finishPath, "utf8");

for (const token of [
  "InvokeWaflV2Alpha26CompletionEvidenceCheck",
  "READ_ONLY_COMPLETION_PASS",
  "NO_PARTIAL_MUTATION",
  "V2 Alpha.26 Completion Log:",
  "approved retained alpha.26 synthetic fabric 2, accessory 1, receipts 9, events 11, version transitions 11",
]) {
  if (!verify.includes(token)) throw new Error(`alpha.26 verification evidence contract missing ${token}`);
}

const requiredWorkflowTokens = [
  '[ValidateSet("Verify", "Handoff", "Plan", "Finish")]',
  '"system-admin-storage"',
  '"id-control-roadmap"',
  '"roadmap-development-contract"',
  '"system-admin-internal-access"',
  '"repository-cleanup"',
  '"automation-infrastructure"',
  '"workspace-commonization"',
  '"billing-foundation"',
  '"billing-operations"',
  '"public-signup-e2e"',
  '"public-signup-authenticated-e2e"',
  '"product-ui-runtime-verification"',
  "function SelectMatchingVerificationResult",
  "VERIFY_SAFE_RESULT:\\s*PASS",
  "ChangedFingerprint",
  "CheckOnly",
  "HeadHash",
  "Branch",
  "GetWorkflowChangedFiles",
  "GetWorkflowChangedFingerprint",
  "& $verifyScript -Profile $Profile",
  "& $pipelineScript -CreateLocalRepoHandoff",
  "SkipHandoff",
  "Finish PASS. Creating 4. Newest handoff artifacts.",
  "& $finishScript",
  "-Execute",
  "Finish is allowed only on master",
  "No matching PASS verification result found",
];

for (const token of requiredWorkflowTokens) {
  if (!workflow.includes(token)) {
    throw new Error(`Missing approved workflow contract token: ${token}`);
  }
}

const forbiddenWorkflowTokens = [
  "Invoke-Expression",
  "cmd /c",
  "git add .",
  "git add -A",
  "git commit -am",
  "git reset",
  "git clean",
  "git checkout",
  "git rebase",
  "git merge",
  "stash drop",
  "npm install",
  "npm ci",
];

for (const token of forbiddenWorkflowTokens) {
  if (workflow.includes(token)) {
    throw new Error(`Forbidden approved workflow token remains: ${token}`);
  }
}

const requiredVerifyTokens = [
  '"automation-infrastructure"',
  '"workspace-commonization"',
  '"billing-foundation"',
  '"billing-operations"',
  '"public-signup-e2e"',
  '"public-signup-authenticated-e2e"',
  '"product-ui-runtime-verification"',
  '"roadmap-development-contract"',
  '"system-admin-internal-access"',
  "tools/pipeline/approved-workflow.ps1",
  "targeted ESLint",
  "tsc --noEmit",
  "approved workflow contract",
  "roadmap development contract",
  "tests/approved-workflow-contract.mjs",
  "workorder v2 API contract",
  "tests/workorder-v2-api-contract.mjs",
  "workorder v2 migration schema contract",
  "tests/workorder-v2-migration-schema-contract.mjs",
  'GetProjectAppVersion) -in @("2.0.0-alpha.21", "2.0.0-alpha.22")',
  "workorder v2 alpha.22 dev/test runner contract",
  "tests/workorder-v2-alpha22-dev-test-runner-contract.mjs",
  "workorder v2 alpha.23 list API contract",
  "tests/workorder-v2-alpha23-list-api-contract.mjs",
  "workorder v2 alpha.24 detail/lazy API contract",
  "tests/workorder-v2-alpha24-detail-api-contract.mjs",
  "tests/workorder-v2-alpha25-command-api-contract.mjs",
  "tests/workorder-v2-alpha26-material-command-api-contract.mjs",
  "app-v2 document links and Mermaid contract",
  "tests/app-v2-document-links-contract.mjs",
  "mobile typecheck",
  "mobile Expo config",
  "WAFL v2 alpha.22 DB runtime evidence",
  "WAFL v2 alpha.23 WorkOrder list API runtime evidence",
  "WAFL v2 alpha.24 WorkOrder detail/lazy API runtime evidence",
  '$null -ne $script:WaflV2Alpha23Evidence -and (GetProjectAppVersion) -eq "2.0.0-alpha.23"',
  "function GetLatestAlpha23EvidenceText",
  "db/v2/migrations/001_v2_tenant_document_number_foundation.sql",
  "db/v2/migrations/006_v2_deferred_constraints_indexes.sql",
  "db/v2/migrations/007_v2_work_order_list_material_lookup_index.sql",
];

for (const token of requiredVerifyTokens) {
  if (!verify.includes(token)) {
    throw new Error(`Missing verify-safe automation contract token: ${token}`);
  }
}

for (const token of [
  '"billing-operations"',
  "patch_0_24_32_billing_operations.sql",
  '"public-signup-e2e"',
  "patch_0_24_33_public_signup_e2e.sql",
  "unexpectedMigrationChanges",
  "DB migration/schema changes allowed for profile",
  '$ExpectedAppVersion -in @("2.0.0-alpha.21", "2.0.0-alpha.22")',
  "db/v2/migrations/001_v2_tenant_document_number_foundation.sql",
  "db/v2/migrations/006_v2_deferred_constraints_indexes.sql",
  '$ExpectedAppVersion -eq "2.0.0-alpha.23"',
  "db/v2/migrations/007_v2_work_order_list_material_lookup_index.sql",
  '$ExpectedAppVersion -in @("2.0.0-alpha.26", "2.0.0-alpha.27")',
  "db/v2/migrations/008_v2_tenant_document_number_settings_function.sql",
  '$ExpectedAppVersion -eq "2.0.0-alpha.38"',
  "db/v2/migrations/010_v2_generated_document_receipt_link.sql",
  '$ExpectedAppVersion -eq "2.0.0-alpha.39"',
  "db/v2/migrations/011_v2_document_access_viewer_functions.sql",
]) {
  if (!finish.includes(token)) {
    throw new Error(`Missing finish-version billing migration safety token: ${token}`);
  }
}

function runPowerShell(args) {
  return spawnSync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", workflowPath, ...args],
    {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
    },
  );
}

const invalidAction = runPowerShell(["-Action", "Deploy"]);
if (invalidAction.status === 0) {
  throw new Error("Invalid Action must be rejected.");
}

const invalidProfile = runPowerShell(["-Action", "Verify", "-Profile", "automation-infrastructure; Write-Host HACK"]);
if (invalidProfile.status === 0) {
  throw new Error("Invalid Profile injection string must be rejected.");
}

console.log("approved workflow contract OK");
