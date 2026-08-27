#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { assertCanonicalWaflVersionConsistency } from "./helpers/wafl-v2-current-version.mjs";

const read = (file) => fs.readFileSync(file, "utf8");

const version = assertCanonicalWaflVersionConsistency();
const currentState = read("docs/codex-current-state.md");
const roadmap = read("docs/project/app-v2/08-roadmap-2.0.md");
const devicePlan = read("docs/project/app-v2/05-device-test-plan.md");
const normalizedRoadmap = roadmap.replace(/\s+/gu, " ");

assert.equal(version, "2.0.0-alpha.68");
for (const source of [currentState, roadmap]) {
  assert.match(source, /ALPHA68_COMPLETE/u);
  assert.match(source, /ALPHA68_FINALIZATION_COMPLETE/u);
  assert.ok(source.includes("Owner physical result: `PASS`"));
  assert.match(source, /alpha\.69 implementation (?:has not started|0)/u);
}

assert.match(devicePlan, /## Alpha\.68 final device result/u);
assert.match(devicePlan, /Owner physical iPhone QA is explicitly accepted as PASS/u);
assert.match(devicePlan, /ALPHA68_FINALIZATION_COMPLETE/u);

for (const deferred of [
  "category/detail-specific recommended size presets",
  "PDF first-page image balance",
  ".waflspec",
  "drawing/sketch",
  "organization/account/permission",
  "production partner/contact management",
  "universal credit billing",
  "service/pilot readiness",
]) {
  assert.ok(normalizedRoadmap.includes(deferred), `deferred alpha.68 boundary missing: ${deferred}`);
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha68-finalization",
  previousPermanentInventoryRetained: 205,
  addedPermanentChecks: 1,
  finalPermanentInventory: 206,
  ownerPhysicalResult: "PASS",
  productCheckpoint: "ALPHA68_COMPLETE",
  finalizationCheckpoint: "ALPHA68_FINALIZATION_COMPLETE",
  alpha69Implementation: 0,
}));
