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
  "Mutation Audit Finding Count:",
  "DB Migration Applied:",
  "DB Schema Mutation:",
  "Business Data Mutation:",
  "R2 Mutation:",
  "Production Migration:",
  "dev/test signup schema migrations applied once: db/migrations/patch_0_24_26_signup_applications.sql; db/migrations/patch_0_24_26_signup_application_consents.sql",
  "true - approved dev/test signup and consent schema migrations only",
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

const commitFunction = source.slice(
  source.indexOf("function CommitAndPush"),
  source.indexOf("function RenameBuildLogWithStatusAndLineCount"),
);
if (commitFunction.includes("SaveRepoStateSnapshot")) {
  throw new Error("Repo-state creation must not depend on the Git push branch.");
}

console.log("pipeline repo-state publication contract: OK");
