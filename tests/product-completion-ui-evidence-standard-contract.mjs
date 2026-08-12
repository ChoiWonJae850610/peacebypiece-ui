#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  assertCanonicalWaflVersionConsistency,
  nextWaflAlphaVersion,
} from "./helpers/wafl-v2-current-version.mjs";

const read = (file) => fs.readFileSync(file, "utf8");

const agents = read("AGENTS.md");
const standard = read("docs/project/32-product-completion-and-ui-evidence-standard.md");
const current = read("docs/codex-current-state.md");
const appFirstRoadmap = read("docs/project/app-v2/08-roadmap-2.0.md");
const historicalRoadmap = read("docs/productization-roadmap.md");
const detail = read("lib/internal/roadmap/roadmap-0.24.34.3.1.ts");
const index = read("lib/internal/roadmap/index.ts");

const canonicalVersion = assertCanonicalWaflVersionConsistency();
const nextVersion = nextWaflAlphaVersion(canonicalVersion);
const alphaNumber = canonicalVersion.match(/alpha\.(\d+)$/)?.[1];
assert.ok(alphaNumber, "canonical alpha number must be available");

const currentStatus = current.match(/^Status: `([^`]+)`$/m)?.[1];
const roadmapCurrentSection = appFirstRoadmap.match(
  new RegExp(
    `## Current result — ${canonicalVersion.replaceAll(".", "\\.")}\\n([\\s\\S]*?)(?=\\n## )`,
  ),
)?.[1];
assert.ok(currentStatus, "Current Baseline must declare its current status");
assert.ok(roadmapCurrentSection, "App-first roadmap must declare the canonical current result section");
assert.match(
  currentStatus,
  new RegExp(`^ALPHA${alphaNumber}_[A-Z0-9_]+_COMPLETE$`),
  "Current Baseline status must be a completed checkpoint for the canonical alpha",
);
assert.ok(
  roadmapCurrentSection.includes(`Status: \`${currentStatus}\``),
  "roadmap current result status must match the Current Baseline",
);
assert.ok(
  current.includes(`Candidate: \`${nextVersion}\``),
  "Current Baseline next candidate must be the next canonical alpha",
);
assert.ok(
  appFirstRoadmap.includes(`## Next candidate — ${nextVersion}`),
  "App-first roadmap next candidate must be the next canonical alpha",
);
for (const semanticToken of ["NOT_STARTED", "product scope"]) {
  assert.ok(
    current.includes(semanticToken) && appFirstRoadmap.includes(semanticToken),
    `Current Baseline and roadmap must share next-candidate meaning: ${semanticToken}`,
  );
}

assert.match(agents, /LEVEL_4_PRODUCT_VERIFIED/);
assert.match(agents, /docs\/project\/32-product-completion-and-ui-evidence-standard\.md/);
assert.match(agents, /Full Reset/);

for (const token of [
  "LEVEL_1_CODED",
  "LEVEL_2_STATIC_VERIFIED",
  "LEVEL_3_RUNTIME_VERIFIED",
  "LEVEL_4_PRODUCT_VERIFIED",
  "components/common/ui/WaflModal.tsx",
  "components/common/ui/WaflButton.tsx",
  "desktop screenshot",
  "mobile screenshot",
  "console error count 0",
  "unexpected failed request count 0",
  "storageState",
  "Full Reset",
]) {
  assert.match(standard, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.match(standard, /디자인[\s\S]*첨부 파일[\s\S]*공장 전달사항[\s\S]*사이즈·치수/);
assert.match(standard, /fixed inset-0/);
assert.match(standard, /0\.24\.34\.4/);
assert.match(detail, /version: "0\.24\.34\.3\.1"/);
assert.match(detail, /status: "completed"/);
assert.match(index, /ROADMAP_0_24_34_3_1/);
const historicalCurrentVersion = index.match(/currentWorkVersion: "([^"]+)"/)?.[1];
const historicalNextVersion = index.match(/nextWorkVersion: "([^"]+)"/)?.[1];
assert.ok(historicalCurrentVersion, "historical roadmap registry must declare its current work version");
assert.ok(historicalNextVersion, "historical roadmap registry must declare its next work version");
assert.ok(
  fs.existsSync(`lib/internal/roadmap/roadmap-${historicalCurrentVersion}.ts`),
  "historical roadmap registry current detail must remain registered",
);
assert.ok(
  historicalRoadmap.includes(historicalNextVersion),
  "historical roadmap document must preserve the registry next-version boundary",
);
assert.match(historicalRoadmap, /0\.24\.34\.4 - Workorder Runtime Recovery/);
assert.match(historicalRoadmap, /0\.24\.35.*Company-wide Export Execution/);
assert.match(
  `${historicalRoadmap}\n${detail}`,
  /0\.24\.35 must not start|0\.24\.35.*before|0\.24\.35.*후 시작/i,
);

console.log("product completion UI evidence standard contract: PASS");
