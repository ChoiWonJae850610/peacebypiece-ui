#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  assertCanonicalWaflVersionConsistency,
  nextWaflAlphaVersion,
} from "./helpers/wafl-v2-current-version.mjs";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertIncludes(file, needle) {
  const text = read(file);
  if (!text.includes(needle)) {
    throw new Error(`${file} must include ${needle}`);
  }
}

function assertNotIncludes(file, needle) {
  const text = read(file);
  if (text.includes(needle)) {
    throw new Error(`${file} must not include ${needle}`);
  }
}

const canonicalVersion = assertCanonicalWaflVersionConsistency();
const nextVersion = nextWaflAlphaVersion(canonicalVersion);
const currentState = read("docs/codex-current-state.md");
const appFirstRoadmap = read("docs/project/app-v2/08-roadmap-2.0.md");
const historicalIndex = read("lib/internal/roadmap/index.ts");
const historicalCurrentVersion = historicalIndex.match(/currentWorkVersion: "([^"]+)"/)?.[1];
const historicalNextVersion = historicalIndex.match(/nextWorkVersion: "([^"]+)"/)?.[1];

if (!historicalCurrentVersion || !historicalNextVersion) {
  throw new Error("historical roadmap index must declare current and next work versions");
}
if (!fs.existsSync(path.join(root, `lib/internal/roadmap/roadmap-${historicalCurrentVersion}.ts`))) {
  throw new Error("historical roadmap current detail must remain registered");
}
if (!read("docs/productization-roadmap.md").includes(historicalNextVersion)) {
  throw new Error("historical productization roadmap must preserve its next-version boundary");
}
if (!currentState.includes(`Result version: \`${canonicalVersion}\``)) {
  throw new Error("Current Baseline must match the canonical APP_VERSION");
}
if (!appFirstRoadmap.includes(`## Next candidate — ${nextVersion}`)) {
  throw new Error("App-first roadmap must declare the next canonical alpha");
}

assertIncludes("README.md", "docs/qa/0.24.29-integrated-productization-checkpoint.md");
assertIncludes("README.md", "Vercel 배포본은 고객 운영 환경일 수 있으므로");
assertIncludes("docs/README.md", "docs/qa/0.24.29-integrated-productization-checkpoint.md");
assertIncludes("docs/README.md", "최종 정책 기준");
assertIncludes("docs/qa/0.24.29-integrated-productization-checkpoint.md", "PENDING_USER_QA");

assertIncludes("docs/audits/document-structure-cleanup-0.24.13.md", "0.24.14");
assertIncludes("docs/productization-roadmap.md", "0.24.30");
assertIncludes("lib/internal/roadmap/roadmap-0.24.30.ts", "Storage Capacity Profiles");

for (const file of ["README.md", "docs/README.md", "docs/codex-current-state.md", "docs/productization-roadmap.md"]) {
  assertNotIncludes(file, "?袁⑹삺");
  assertNotIncludes(file, "筌ㅼ뮇伊");
  assertNotIncludes(file, "甕곌쑴");
}

console.log("document-structure-contract PASS");
