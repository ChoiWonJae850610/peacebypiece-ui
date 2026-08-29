#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { assertCanonicalWaflVersionConsistency } from "./helpers/wafl-v2-current-version.mjs";

const read = (file) => fs.readFileSync(file, "utf8");

const version = assertCanonicalWaflVersionConsistency();
const currentState = read("docs/codex-current-state.md");
const roadmap = read("docs/project/app-v2/08-roadmap-2.0.md");
const devicePlan = read("docs/project/app-v2/05-device-test-plan.md");
const migration = read("db/v2/migrations/021_v2_work_order_image_output_include.sql");

assert.equal(version, "2.0.0-alpha.70");
for (const source of [currentState, roadmap]) {
  assert.match(source, /ALPHA70_COMPLETE/u);
  assert.match(source, /ALPHA70_FINALIZATION_COMPLETE/u);
  assert.ok(source.includes("Owner physical result: `PASS`"));
  assert.match(source, /58\/42/u);
  assert.match(source, /21\/21/u);
}

assert.match(devicePlan, /## Alpha\.70 final device result/u);
assert.match(devicePlan, /Owner physical iPhone QA is explicitly accepted as PASS/u);
assert.match(devicePlan, /ALPHA70_FINALIZATION_COMPLETE/u);
assert.match(migration, /output_include/u);

for (const preserved of [
  "500ms",
  "HEIC/HEIF",
  "PDF-only",
  "2048px",
  "attachment delivery selection",
]) {
  assert.ok(currentState.includes(preserved) || roadmap.includes(preserved), `final alpha.70 owner missing: ${preserved}`);
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha70-finalization",
  previousPermanentInventoryRetained: 216,
  addedPermanentChecks: 1,
  finalPermanentInventory: 217,
  ownerPhysicalResult: "PASS",
  productCheckpoint: "ALPHA70_COMPLETE",
  finalizationCheckpoint: "ALPHA70_FINALIZATION_COMPLETE",
  alpha71Implementation: 0,
}));
