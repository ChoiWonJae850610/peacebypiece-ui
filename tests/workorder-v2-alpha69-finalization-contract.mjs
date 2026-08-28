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

assert.equal(version, "2.0.0-alpha.69");
for (const source of [currentState, roadmap]) {
  assert.match(source, /ALPHA69_COMPLETE/u);
  assert.match(source, /ALPHA69_FINALIZATION_COMPLETE/u);
  assert.ok(source.includes("Owner physical result: `PASS`"));
}

assert.match(devicePlan, /## Alpha\.69 final device result/u);
assert.match(devicePlan, /Owner physical iPhone QA is explicitly accepted as PASS/u);
assert.match(devicePlan, /ALPHA69_FINALIZATION_COMPLETE/u);

for (const deferred of [
  "PDF first-page image balance",
  ".waflspec",
  "drawing/sketch",
  "organization/account/permission",
  "universal credit billing",
]) {
  assert.ok(normalizedRoadmap.includes(deferred), `deferred post-alpha.69 boundary missing: ${deferred}`);
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha69-finalization",
  previousPermanentInventoryRetained: 211,
  addedPermanentChecks: 1,
  finalPermanentInventory: 212,
  ownerPhysicalResult: "PASS",
  productCheckpoint: "ALPHA69_COMPLETE",
  finalizationCheckpoint: "ALPHA69_FINALIZATION_COMPLETE",
  alpha70Implementation: 0,
}));
