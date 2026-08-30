#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { assertCanonicalWaflVersionConsistency } from "./helpers/wafl-v2-current-version.mjs";

const read = (file) => fs.readFileSync(file, "utf8");
const version = assertCanonicalWaflVersionConsistency();
const currentState = read("docs/codex-current-state.md");
const roadmap = read("docs/project/app-v2/08-roadmap-2.0.md");
const devicePlan = read("docs/project/app-v2/05-device-test-plan.md");
const expoEnvironment = read("docs/project/app-v2/06-expo-environment-setup.md");

assert.equal(version, "2.0.0-alpha.71");
for (const owner of [currentState, roadmap]) {
  assert.match(owner, /ALPHA71_PRE_DRAWING_COMPLETE/u);
  assert.match(owner, /ALPHA71_FINALIZATION_COMPLETE/u);
  assert.match(owner, /Owner physical (?:iPhone )?(?:result[^\n]*PASS|QA[^\n]*PASS)/iu);
  assert.match(owner, /Drawing implementation[^\n]*zero|Drawing implementation[^\n]*0/iu);
}

assert.match(devicePlan, /## Alpha\.71 final device result/u);
assert.match(devicePlan, /rotate-after-entry|rotated after entry/iu);
assert.match(devicePlan, /already landscape|enter-while-landscape/iu);
assert.match(expoEnvironment, /Internal APP_VERSION \| `2\.0\.0-alpha\.71`/u);
assert.match(expoEnvironment, /Owner[^\n]*accepted[^\n]*PASS/iu);

for (const forbidden of ["@shopify/react-native-skia", "perfect-freehand"]) {
  assert.equal(read("apps/mobile/package.json").includes(forbidden), false, `Drawing dependency must remain absent: ${forbidden}`);
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha71-finalization",
  previousPermanentInventoryRetained: 219,
  addedPermanentChecks: 1,
  finalPermanentInventory: 220,
  ownerPhysicalResult: "PASS",
  productCheckpoint: "ALPHA71_PRE_DRAWING_COMPLETE",
  finalizationCheckpoint: "ALPHA71_FINALIZATION_COMPLETE",
  drawingImplementation: 0,
  drawingLibrarySelection: 0,
  behaviorDelta: 0,
}));
