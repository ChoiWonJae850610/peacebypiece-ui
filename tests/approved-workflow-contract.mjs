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
