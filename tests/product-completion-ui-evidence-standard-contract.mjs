#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const agents = read("AGENTS.md");
const standard = read("docs/project/32-product-completion-and-ui-evidence-standard.md");
const current = read("docs/codex-current-state.md");
const roadmap = read("docs/productization-roadmap.md");
const detail = read("lib/internal/roadmap/roadmap-0.24.34.3.1.ts");
const index = read("lib/internal/roadmap/index.ts");
const version = read("lib/constants/version.ts");

assert.match(version, /APP_VERSION = "0\.24\.34\.3\.1"/);
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
assert.match(index, /currentWorkVersion: "0\.24\.34\.3\.1"/);
assert.match(index, /nextWorkVersion: "0\.24\.34\.4"/);
assert.match(current, /Next mandatory work: `0\.24\.34\.4`/);
assert.match(roadmap, /0\.24\.34\.4 - Workorder Runtime Recovery/);
assert.match(roadmap, /0\.24\.35.*Company-wide Export Execution/);
assert.match(`${current}\n${roadmap}\n${detail}`, /0\.24\.35 must not start|0\.24\.35.*before|0\.24\.35.*후 시작/i);

console.log("product completion UI evidence standard contract: PASS");
