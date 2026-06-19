import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "tools", "pipeline", "pipeline-patch-processing.ps1");
const source = fs.readFileSync(file, "utf8");

const required = [
  "function SaveRepoStateSnapshot",
  "function ResolveLatestRepoStatePath",
  "SaveRepoStateSnapshot -Version $version | Out-Null",
  "$repoStatePath = ResolveLatestRepoStatePath",
  "CopyFileToNewestResultDir -SourcePath $repoStatePath",
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
