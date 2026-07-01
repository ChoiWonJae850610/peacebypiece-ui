import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const page = read("app/roadmap/page.tsx");
const types = read("lib/internal/roadmap/types.ts");
const index = read("lib/internal/roadmap/index.ts");
const roadmapDoc = read("docs/productization-roadmap.md");
const facade = read("lib/internal/productizationRoadmap.ts");
const workflow = read("tools/pipeline/approved-workflow.ps1");
const pipeline = read("tools/pipeline/peacebypiece-auto-pipeline.ps1");
const readme = read("tools/pipeline/README.md");

for (const field of [
  "version",
  "status",
  "title",
  "userSummary",
  "visibleChanges",
  "expectedUi",
  "developmentPurpose",
  "scope",
  "outOfScope",
  "implementationPrinciples",
  "successConditions",
  "failureConditions",
  "cautions",
  "stopConditions",
  "permissionImpact",
  "dbImpact",
  "r2Impact",
  "migrationRequired",
  "automaticTests",
  "manualTests",
  "expectedChangeAreas",
  "recommendedCommitMessage",
  "nextVersionBoundary",
  "completedSummary",
  "commitHash",
  "verificationResult",
  "remainingIssues",
  "userConfirmationRequired",
  "userConfirmationResult",
]) {
  assert.ok(types.includes(field), `roadmap schema missing ${field}`);
}

for (const version of [
  "0.24.12",
  "0.24.13",
  "0.24.14",
  "0.24.15",
  "0.24.16",
  "0.24.17",
  "0.24.18",
  "0.24.19",
  "0.24.20",
  "0.24.21",
  "0.24.22",
  "0.24.23",
  "0.24.24",
  "0.24.25",
  "0.24.26",
  "0.24.27",
  "0.24.28",
  "0.24.29",
  "0.24.30",
  "0.24.31",
]) {
  const roadmapFile = read(`lib/internal/roadmap/roadmap-${version}.ts`);
  assert.ok(index.includes(`ROADMAP_${version.replace(/\./g, "_")}`), `index missing ${version} import or registration`);
  assert.ok(roadmapFile.includes(`version: "${version}"`), `roadmap ${version} missing version`);
}

for (const token of [
  "ROADMAP_STATUS_LABELS",
  "currentWorkVersion: \"0.24.31\"",
  "nextWorkVersion: \"0.24.32\"",
  "ROADMAP_0_24_31",
]) {
  assert.ok(index.includes(token), `roadmap index missing ${token}`);
}

for (const token of [
  "PRODUCTIZATION_ROADMAP",
  "getRoadmapVersionAnchor",
  "WaflPageHero",
  "WaflSectionPanel",
  "AdminStatusBadge",
]) {
  assert.ok(page.includes(token), `roadmap page missing ${token}`);
}

assert.doesNotMatch(page, /method="post"|method='post'|onSubmit|onClick=\{|useState|useEffect|fetch\(|queryDb|localStorage|router\.push|searchParams/);
assert.match(facade, /from "\.\/roadmap"/);

for (const token of [
  "0.24.29",
  "Integrated Productization Checkpoint",
  "0.24.30",
  "0.24.31",
  "Storage Capacity Profiles",
  "0.24.31",
  "PG Billing and Subscription Operations",
]) {
  assert.ok(roadmapDoc.includes(token), `roadmap doc missing ${token}`);
}

for (const token of [
  "VerificationProfile",
  "ChangedFingerprint",
  "HeadHash",
  "CheckOnly",
  "SelectMatchingVerificationResult",
]) {
  assert.ok(workflow.includes(token), `approved workflow missing ${token}`);
}

for (const token of [
  "$CreateLocalRepoHandoff",
  "$VerificationResultPath",
  "$VerificationProfile",
  "NewLocalRepoBuildResultFile",
  "PublishLocalRepoHandoffNewestSet",
  "build-result-$safeVersion-$timestamp",
  "$newestFiles.Count -ne 2",
  "repo-state-$safeVersion-$timestamp",
  "peacebypiece-ui-$version",
]) {
  assert.ok(pipeline.includes(token), `pipeline missing ${token}`);
}

assert.ok(readme.includes("peacebypiece-auto-pipeline.ps1"), "pipeline README must document canonical entrypoint");

console.log("roadmap development contract passed");
