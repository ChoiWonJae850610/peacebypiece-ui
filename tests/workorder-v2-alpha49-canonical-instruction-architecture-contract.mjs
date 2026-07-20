#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const sha256 = (relativePath) => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");

const agents = read("AGENTS.md");
const current = read("docs/codex-current-state.md");
const start = read("docs/project/app-v2/00-start-here.md");
const device = read("docs/project/app-v2/05-device-test-plan.md");
const environment = read("docs/project/app-v2/06-expo-environment-setup.md");
const roadmap = read("docs/project/app-v2/08-roadmap-2.0.md");
const rules = read("docs/project/app-v2/09-codex-working-rules.md");
const api = read("docs/project/app-v2/16-workorder-api-command-read-model-contracts.md");
const verification = read("docs/project/app-v2/17-v2-api-contract-test-plan.md");
const runbook = read("docs/project/app-v2/41-external-mobile-qa-runbook.md");
const evidence = read("docs/project/app-v2/48-canonical-codex-instruction-architecture-evidence.md");

assert.match(read("lib/constants/version.ts"), /APP_VERSION = "2\.0\.0-alpha\.50"/);
assert.equal(JSON.parse(read("apps/mobile/package.json")).version, "2.0.0-alpha.50");
assert.equal(JSON.parse(read("apps/mobile/package-lock.json")).packages[""].version, "2.0.0-alpha.50");
assert.equal(JSON.parse(read("apps/mobile/app.json")).expo.extra.appVersion, "2.0.0-alpha.50");
assert.equal(JSON.parse(read("apps/mobile/app.json")).expo.version, "2.0.0");

for (const [source, token] of [
  [agents, "WAFL v2 App-first canonical routing"],
  [start, "Document role: canonical index, responsibility matrix, and task routing"],
  [rules, "Document type: **Permanent Rules**"],
  [current, "Document type: **Current Baseline**"],
  [roadmap, "Document role: canonical owner for the current result, next candidate, and Version Delta boundary"],
]) assert.ok(source.includes(token), `missing canonical owner declaration: ${token}`);

for (const token of [
  "Responsibility matrix",
  "Permanent Rules",
  "Current Baseline",
  "Version Delta",
  "Immutable Evidence",
  "Core read order",
  "Conservative task-based additional routing",
  "Mobile UI or ProductionCard",
  "API Read",
  "Command or bounded dev/test mutation",
  "Migration/schema",
  "External Runtime/mobile QA",
  "PDF, R2, Viewer, or output/share",
  "Native, EAS, distribution, or deployment",
]) assert.ok(start.includes(token), `start-here routing missing ${token}`);

for (const token of [
  "Actual KST reporting",
  "Start-of-work baseline",
  "Security and sensitive information",
  "Tenant, company, permission, and production boundaries",
  "Standing authorization for an exact Version Delta",
  "Runtime transport",
  "Process ownership and stop safety",
  "Funnel semantic status",
  "Retry, correction, and failure preservation",
  "User and device QA",
  "Native and EAS",
  "Verification",
  "Source ZIP, repo-state, and `4. Newest`",
  "Version Delta contract",
]) assert.ok(rules.includes(token), `Permanent Rules missing ${token}`);

for (const token of [
  "production deploy, access, or mutation",
  "EAS Build or EAS Update",
  "native dependency/plugin",
  "force push, amend, history rewrite",
  "broad process kill",
  "wildcard cleanup/delete",
]) assert.ok(rules.includes(token), `separate approval boundary missing ${token}`);

for (const token of [
  "model, reasoning, and speed",
  "baseline version and HEAD",
  "result version",
  "target status",
  "included scope",
  "non-goals",
  "allowed mutation/effect budget",
  "required Runtime and QA",
  "required contracts and verification",
  "candidate commit message",
  "next-version boundary",
]) assert.ok(rules.includes(token), `Version Delta field missing ${token}`);

const permanentReference = "실행·보안·Git·Runtime·artifact·실패 정책은 `docs/project/app-v2/09-codex-working-rules.md`를 전부 따른다.";
assert.ok(rules.includes(permanentReference));
assert.ok(roadmap.includes(permanentReference));
assert.ok(start.includes(permanentReference));

assert.match(api, /normative owner for WorkOrder API DTO/);
assert.match(api, /17-v2-api-contract-test-plan\.md.*defines how those semantics are verified/);
assert.match(verification, /verification owner for the normative contracts/);
assert.match(verification, /does not redefine API semantics or authorize Runtime mutation/);

for (const [source, role] of [
  [device, "supported-device matrix"],
  [environment, "supported Expo/native environment"],
  [runbook, "external Runtime preflight, start, readiness, device handoff, status, and stop procedures"],
]) {
  assert.ok(source.includes(role), `specialist owner missing ${role}`);
  assert.ok(source.includes("09-codex-working-rules.md"), `${role} must route shared rules to 09`);
}

assert.doesNotMatch(current, /^# 2\.0\.0-alpha\.(?:[1-9]|[1-3][0-9]|4[0-8])\b/m);
assert.doesNotMatch(current, /\bPID\s*[:=]?\s*\d{2,}\b/i);
assert.doesNotMatch(current, /https:\/\/[a-z0-9-]{12,}\.trycloudflare\.com/i);
assert.doesNotMatch(current, /\b(?:session|cookie|connection code)\s*[:=]\s*[^\s`]+/i);
assert.doesNotMatch(current, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
assert.ok((current.match(/2\.0\.0-alpha\.49/g) ?? []).length <= 6, "Current Baseline must not become a repeated version history");

for (const token of [
  "merging or deleting evidence",
  "rewriting old PASS/FAIL",
  "replacing historical facts with the latest current state",
  "renumbering evidence",
]) assert.ok(start.includes(token), `immutable evidence rule missing ${token}`);

const immutableEvidenceHashes = {
  "19-v2-dev-test-migration-and-performance-evidence.md": "50d51524b185c4cc7fc8f741e9ab0052e426d18114fd721e2ef87be3d3b6f10f",
  "20-workorder-list-read-api-evidence.md": "38a44279458f8b0b09458d491f6ca2185993d2730a9856d850ac64787f01823a",
  "21-workorder-detail-lazy-read-api-evidence.md": "a99e24461e704ea0bad542fc1177853917fa4096ba983938130253e6b313b4ef",
  "22-workorder-create-basic-update-command-evidence.md": "35bf425a9339709d3b5a6d2508e1c2a47c02efcb87b33c0a755db4b6f0bdb073",
  "23-workorder-material-order-command-evidence.md": "f42b238d88d596daae3fcb54f373e3896a3d17e68872183cf04cc0c9fdf10b63",
  "24-workorder-revision-issue-command-evidence.md": "e1c94f92ac774018063051d6d867bebdae4e2b3fed79a29e4c26c96cd4e76bde",
  "25-workorder-issued-revision-preview-evidence.md": "07626589a93341a9e2f672a959dd6002248d2c02298ee6ecce26054c9c9e1075",
  "26-mobile-issued-preview-entry-evidence.md": "9bbb5ce3048d95480bab63fcef040c134e8e90613b5b00d37280c9cea7130718",
  "27-factory-workorder-input-and-preview-evidence.md": "50b10a0a41518aeb1e289ec3754275b3b85b82743846a988c44b4f50d70a0334",
  "28-inline-input-and-preview-layout-evidence.md": "9913f7fecc6d89de8f3496901d94225499bc069876e3af2de99126337989e036",
  "29-inline-density-and-realistic-sample-evidence.md": "2b90744fe12b3a779f9776036df60ed93869ac463955de4a646e458eef83086f",
  "30-realistic-preview-entry-and-material-card-flow-evidence.md": "046796b2f8b3e9656b43e88daf91d51e6d32507906b977426df381f29f4b33ce",
  "31-mobile-preview-sample-and-material-footer-evidence.md": "50155a511abae1723430b5e9d541d18b25d6e93c7a1b4e6d97ee95813485d265",
  "32-mobile-material-compact-input-evidence.md": "3355fd47e466841c0dc90f8369d375a2ca15cd08896d7bbbc6241a0b8557e977",
  "33-mobile-material-card-separation-and-summary-evidence.md": "b4f1e7995cb22a98a0701ec3f2e695fa562b42c630ae25f0172ca677c0363a42",
  "34-issued-revision-pdf-generation-foundation-evidence.md": "5c347b0e0710406dce6921645aa7afe049ac4dc1b7f25b669dc5536b662520c5",
  "35-generated-document-db-r2-runtime-evidence.md": "bfa7213d6f67b9b44eb2166f6b68706d70b99d44cf0b69b969f6126ac23094a3",
  "36-document-viewer-security-evidence.md": "877c9eb773ac5a988baf27ca1ecd230d93da7be60ed393f0e6afa3afd8b8c4b6",
  "37-preview-output-and-action-density-evidence.md": "51ad45c4fca128f85cf4a2a992dc947c39dd7d4da6a690ee7d44b0fdaaa81057",
  "38-mobile-order-summary-and-pdf-page-number-evidence.md": "442d2cddd026b1a47976db959d75298e082b20cc4d7fdaddbd29df8d33a3dd29",
  "39-realistic-issued-embedded-qr-pdf-evidence.md": "c6796830198f8be4ca12d0d4557319f31779202e984918b5d4c71a4a2f9b395c",
  "40-external-mobile-qa-foundation-evidence.md": "edbb428fdb9ebf19aab05d8aa5949a618645493eb082e57e66d0bdc6eb05e8b6",
  "42-ios-development-build-evidence.md": "dce283e319677cae4e5891f452e33d80913a1237b52725dbeabd09f4a3ae27b3",
  "43-mobile-real-data-read-only-evidence.md": "b18eeea00ec3de929cc5dedc55519745420754ff92561ba29125d2eeb50ea9fd",
  "44-mobile-production-card-core-overview-evidence.md": "c9951e8b8d70bf70a15ca5221105280179c5d4d69950526f42131d185d6284b1",
  "45-mobile-basic-info-update-evidence.md": "091ebe9b4cc569df975dab16dc465c1cef80f8dce6c6048b13a5e6e5dc328c00",
  "46-mobile-tailscale-serve-developer-auto-connect-evidence.md": "068c3edbfd55fbb1fca4ecc4263d47bf53b32b73e860064b40c88c6b532c4559",
  "47-mobile-materials-real-read-evidence.md": "f90d9281a6e88e3b6a545a731b61e3befa70ebbea153bcec107e597fc37e5456",
};

for (const [name, expected] of Object.entries(immutableEvidenceHashes)) {
  const relativePath = `docs/project/app-v2/${name}`;
  assert.equal(sha256(relativePath), expected, `historical evidence changed: ${name}`);
}

for (const relativePath of [
  "AGENTS.md",
  "docs/codex-current-state.md",
  "docs/project/app-v2/00-start-here.md",
  "docs/project/app-v2/05-device-test-plan.md",
  "docs/project/app-v2/06-expo-environment-setup.md",
  "docs/project/app-v2/08-roadmap-2.0.md",
  "docs/project/app-v2/09-codex-working-rules.md",
  "docs/project/app-v2/16-workorder-api-command-read-model-contracts.md",
  "docs/project/app-v2/17-v2-api-contract-test-plan.md",
  "docs/project/app-v2/41-external-mobile-qa-runbook.md",
  "docs/project/app-v2/48-canonical-codex-instruction-architecture-evidence.md",
]) assert.ok(fs.existsSync(path.join(root, relativePath)), `missing canonical owner: ${relativePath}`);

assert.match(evidence, /All evidence files that existed at the alpha\.48 baseline remain unmodified/);
assert.match(evidence, /mobile\/API\/Runtime behavior: unchanged/);
assert.match(evidence, /physical-device QA: not required/);

console.log("workorder v2 alpha.49 canonical instruction architecture contract: PASS");
