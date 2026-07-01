import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const patchProcessingFile = path.join(root, "tools", "pipeline", "pipeline-patch-processing.ps1");
const localHandoffFile = path.join(root, "tools", "pipeline", "peacebypiece-auto-pipeline.ps1");
const patchProcessingSource = fs.readFileSync(patchProcessingFile, "utf8");
const localHandoffSource = fs.readFileSync(localHandoffFile, "utf8");
const source = `${patchProcessingSource}\n${localHandoffSource}`;

const required = [
  "function SaveRepoStateSnapshot",
  "function ResolveLatestRepoStatePath",
  "SaveRepoStateSnapshot -Version $version | Out-Null",
  "$repoStatePath = ResolveLatestRepoStatePath",
  "CopyFileToNewestResultDir -SourcePath $repoStatePath",
  "function NewLocalRepoBuildResultFile",
  "function PublishLocalRepoHandoffNewestSet",
  "build-result-$safeVersion-$timestamp",
  "[System.IO.Path]::GetFileName($BuildResultPath)",
  "$newestFiles.Count -ne 2",
  "Verification Result Path:",
  "Verification Result:",
  "Targeted ESLint:",
  "Typecheck:",
  "Build Result:",
  "Build Result Path:",
  "Contract Test Summary:",
  "E2E/Smoke Summary:",
  "Signup/Provisioning Regression:",
  "Catalog Regression:",
  "PDF/R2 Regression:",
  "Vercel Readiness:",
  "Manual QA Status:",
  "Mutation Audit Finding Count:",
  "DB Migration Applied:",
  "DB Migration Apply Result:",
  "Post-Apply Audit Result:",
  "Rollback Smoke Result:",
  "Certificate Integration Result:",
  "PNG Upload:",
  "JPEG Replacement:",
  "PDF Replacement:",
  "Revoke:",
  "Final Residual DB Rows:",
  "Final Residual R2 Objects:",
  "Live Viewer Integration:",
  "Schema Migration This Run:",
  "Dev/Test DB Test-Data Mutation:",
  "Dev/Test Fixture Mutation:",
  "Dev/Test R2 Mutation:",
  "Production Mutation:",
  "Production Business Data Mutation:",
  "DB Schema Mutation:",
  "Business Data Mutation:",
  "R2 Mutation:",
  "Production Migration:",
  "DevTestDbTestDataMutation",
  "DevTestFixtureMutation",
  "BusinessDataMutation",
  "ProductionBusinessDataMutation",
  "DevTestR2Mutation",
  "SchemaMigrationThisRun",
  "contractGroupSummary",
  "E2ESmokeSummary",
  "SignupProvisioningRegression",
  "CatalogRegression",
  "PdfR2Regression",
  "VercelReadiness",
  "ManualQaStatus",
  "repo-state-$safeVersion-$timestamp",
  "any path segment named reports",
  "*.tsbuildinfo",
  "playwright-report",
  "test-results",
  "artifacts",
];

for (const token of required) {
  if (!source.includes(token)) {
    throw new Error(`Missing repo-state publication contract token: ${token}`);
  }
}

if (/R2 Mutation:" -Values @\("false"\)/.test(source)) {
  throw new Error("R2 Mutation must not be hardcoded false after actual R2 integration");
}

if (/Split\(":\"\)\[0\]/.test(source)) {
  throw new Error("Contract summary must not collapse every contract line to the literal word contract");
}

const commitFunction = source.slice(
  source.indexOf("function CommitAndPush"),
  source.indexOf("function RenameBuildLogWithStatusAndLineCount"),
);
if (commitFunction.includes("SaveRepoStateSnapshot")) {
  throw new Error("Repo-state creation must not depend on the Git push branch.");
}

console.log("pipeline repo-state publication contract: OK");
