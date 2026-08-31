#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { assertCanonicalWaflVersionConsistency } from "./helpers/wafl-v2-current-version.mjs";

const read = (file) => fs.readFileSync(file, "utf8");
assertCanonicalWaflVersionConsistency();
const currentState = read("docs/codex-current-state.md");
const roadmap = read("docs/project/app-v2/08-roadmap-2.0.md");
const devicePlan = read("docs/project/app-v2/05-device-test-plan.md");
const expoEnvironment = read("docs/project/app-v2/06-expo-environment-setup.md");

for (const owner of [currentState, roadmap]) {
  assert.match(owner, /ALPHA71_PRE_DRAWING_COMPLETE/u);
  assert.match(owner, /ALPHA71_FINALIZATION_COMPLETE/u);
  assert.match(owner, /Owner physical (?:iPhone )?(?:result[^\n]*PASS|QA[^\n]*PASS)/iu);
}
assert.match(currentState, /Alpha\.71 is finalized[\s\S]{0,500}adds no Scene, tool, renderer, gesture, export, or Drawing dependency/iu);

assert.match(devicePlan, /## Alpha\.71 final device result/u);
assert.match(devicePlan, /rotate-after-entry|rotated after entry/iu);
assert.match(devicePlan, /already landscape|enter-while-landscape/iu);
assert.match(expoEnvironment, /Internal APP_VERSION \| `2\.0\.0-alpha\.\d+`/u);
assert.match(expoEnvironment, /Alpha\.71A-2 orientation-module build/u);
assert.match(expoEnvironment, /Owner[^\n]*accepted[^\n]*PASS/iu);

const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
assert.equal(mobilePackage.dependencies["perfect-freehand"], undefined, "alpha.72 PoC must not add a stroke helper dependency");
assert.equal(mobilePackage.dependencies["@shopify/react-native-skia"], undefined, "selected alpha.72 SVG path removes the temporary Skia candidate");
assert.equal(mobilePackage.dependencies["react-native-svg"], "15.15.3", "selected alpha.72 SVG path reuses the existing renderer dependency");
assert.match(read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx"), /disabled=\{!props\.drawingRendererPocEnabled\}/u);
assert.match(read("apps/mobile/features/MobileWorkOrderExperience.tsx"), /isDrawingRendererPocEnabled/u);

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
