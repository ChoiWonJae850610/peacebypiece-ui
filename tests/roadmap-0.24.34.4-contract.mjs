#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.34.4.ts", "utf8");
const index = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const currentState = fs.readFileSync("docs/codex-current-state.md", "utf8");
const productizationRoadmap = fs.readFileSync("docs/productization-roadmap.md", "utf8");

for (const token of [
  'version: "0.24.34.4"',
  "Workorder Runtime Recovery, Canonical WAFL Size Panel, and Signup Product E2E",
  "WorkOrderSidePanelSections.tsx",
  "ModalShell.tsx",
  "WaflButton",
  "WaflNumberInput",
  "WaflSelect",
  "WaflDataTable",
  "LEVEL_4_PRODUCT_VERIFIED",
  "Product Verified true",
  "Desktop/mobile/iPad browser matrix PASS",
  "Public signup browser verification 20/20 PASS",
  "HMR origin mismatch fixed by using localhost consistently",
  "Company-wide Export Execution",
]) {
  assert.ok(roadmap.includes(token), `roadmap 0.24.34.4 missing ${token}`);
}

assert.match(index, /import \{ ROADMAP_0_24_34_4 \}/);
assert.match(index, /currentWorkVersion:\s*"0\.24\.34\.4"/);
assert.match(index, /nextWorkVersion:\s*"0\.24\.35"/);
assert.match(index, /ROADMAP_0_24_34_4/);

assert.match(currentState, /Current version:\s*`0\.24\.34\.4`/);
assert.match(currentState, /Current detail:\s*`lib\/internal\/roadmap\/roadmap-0\.24\.34\.4\.ts`/);
assert.match(productizationRoadmap, /APP_VERSION:\s*`0\.24\.34\.4`/);

console.log("roadmap 0.24.34.4 contract: PASS");
