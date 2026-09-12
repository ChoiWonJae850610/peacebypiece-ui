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
const guardrails = read("docs/project/app-v2/drawing-architecture-guardrails.md");
const apiTestPlan = read("docs/project/app-v2/17-v2-api-contract-test-plan.md");
const outputContract = read("tests/workorder-v2-alpha78-sketch-pdf-output-fidelity-contract.mjs");
const aspectContract = read("tests/workorder-v2-alpha78-sketch-frame-world-aspect-correction-contract.mjs");
const sketch = read("components/workorder/preview/IssuedWorkOrderSketch.tsx");
const styles = read("components/workorder/preview/IssuedWorkOrderPreview.module.css");
const drawingContracts = read("lib/domain/drawing/contracts.ts");
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const verifySafe = read("tools/pipeline/verify-safe.ps1");
const finishVersion = read("tools/pipeline/finish-version.ps1");
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const migrationFiles = fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).sort();
const ALPHA78_FINALIZED_APP_VERSION = "2.0.0-alpha.78";

assert.ok([ALPHA78_FINALIZED_APP_VERSION, "2.0.0-alpha.79"].includes(version));
for (const owner of [currentState, roadmap, devicePlan]) {
  assert.match(owner, /ALPHA78_COMPLETE/u);
  assert.match(owner, /ALPHA78_FINALIZATION_COMPLETE/u);
  assert.match(owner, /Owner[\s\S]{0,80}(?:iPhone[\s\S]{0,240}`PASS`|`PASS`[\s\S]{0,240}iPhone)/iu);
  assert.match(owner, /Owner[\s\S]{0,80}(?:iPad(?:-| )mini[\s\S]{0,240}`PASS`|`PASS`[\s\S]{0,260}iPad(?:-| )mini)/iu);
  assert.match(owner, /Print[\s\S]{0,260}`NOT_RUN`/u);
  assert.match(owner, /Regular\/Large iPad[\s\S]{0,280}`NOT_RUN`/u);
  assert.match(owner, /Android[\s\S]{0,280}`NOT_RUN`/u);
}

assert.match(expoEnvironment, /Alpha\.78 finalization runtime boundary/u);
assert.match(expoEnvironment, /Internal APP_VERSION is `2\.0\.0-alpha\.78`/u);
assert.match(guardrails, /Final alpha\.78 boundary/u);
assert.match(apiTestPlan, /Alpha\.78 finalization contract/u);
assert.match(outputContract, /width:\s*1_500,\s*height:\s*2_100/u);
assert.match(aspectContract, /outputBox:\s*"1500x2100"/u);
assert.match(sketch, /width:\s*1_500,\s*height:\s*2_100/u);
assert.match(styles, /width:\s*min\(100%,\s*150mm\)[\s\S]*aspect-ratio:\s*5\s*\/\s*7/u);
assert.match(styles, /@media print\s*\{[\s\S]*width:\s*150mm[\s\S]*height:\s*210mm/u);
assert.match(drawingContracts, /DRAWING_SCENE_SCHEMA_VERSION\s*=\s*1\s+as const/u);
assert.equal(migrationFiles.length, 22);
assert.equal(migrationFiles.at(-1), "022_v2_work_order_drawings.sql");
assert.match(gallery, /props\.sketchAuthoringEnabled \? "스케치" : "스케치\(준비 중\)"/u);
assert.equal(appConfig.expo.version, "2.0.0");
assert.ok([ALPHA78_FINALIZED_APP_VERSION, "2.0.0-alpha.79"].includes(appConfig.expo.extra.appVersion));
assert.equal(appConfig.expo.ios.requireFullScreen, true);
assert.equal(mobilePackage.dependencies["@shopify/react-native-skia"], undefined);
assert.equal(mobilePackage.dependencies["react-native-reanimated"], undefined);
assert.equal(mobilePackage.dependencies["react-native-gesture-handler"], undefined);
assert.equal(mobilePackage.dependencies["react-native-worklets"], undefined);

for (const contractName of [
  "workorder-v2-alpha72-drawing-foundation-contract.mjs",
  "workorder-v2-alpha73-product-sketch-persistence-contract.mjs",
  "workorder-v2-alpha74-sketch-responsive-shape-authoring-contract.mjs",
  "workorder-v2-alpha75-selection-hit-test-object-eraser-contract.mjs",
  "workorder-v2-alpha75-finalization-contract.mjs",
  "workorder-v2-alpha76-selection-object-move-contract.mjs",
  "workorder-v2-alpha76-raw-multitouch-camera-acquisition-contract.mjs",
  "workorder-v2-alpha76-zoom-percent-hud-contract.mjs",
  "workorder-v2-alpha76-finalization-contract.mjs",
  "workorder-v2-alpha77-selection-resize-endpoints-contract.mjs",
  "workorder-v2-alpha77-finalization-contract.mjs",
  "workorder-v2-alpha78-sketch-pdf-output-fidelity-contract.mjs",
  "workorder-v2-alpha78-sketch-frame-world-aspect-correction-contract.mjs",
  "workorder-v2-alpha78-finalization-contract.mjs",
]) {
  assert.match(verifySafe, new RegExp(contractName.replaceAll(".", "\\."), "u"));
}

assert.match(
  finishVersion,
  /ExpectedAppVersion -in @\("2\.0\.0-alpha\.73", "2\.0\.0-alpha\.74", "2\.0\.0-alpha\.75", "2\.0\.0-alpha\.76", "2\.0\.0-alpha\.77", "2\.0\.0-alpha\.78", "2\.0\.0-alpha\.79"\)[\s\S]*db\/v2\/migrations\/022_v2_work_order_drawings\.sql/u,
);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha78-finalization",
  previousPermanentInventoryRetained: 292,
  addedPermanentChecks: 1,
  finalPermanentInventory: 293,
  productCheckpoint: "ALPHA78_COMPLETE",
  finalizationCheckpoint: "ALPHA78_FINALIZATION_COMPLETE",
  ownerIphonePhysicalResult: "PASS",
  ownerIpadMiniPhysicalResult: "PASS",
  printPhysicalResult: "NOT_RUN",
  regularLargeIpadPhysicalResult: "NOT_RUN",
  androidPhysicalResult: "NOT_RUN",
  sceneSchemaVersion: 1,
  world: "1000x1400",
  outputBox: "1500x2100",
  scale: 1.5,
  offset: "0,0",
  migrationLedgerExpected: "22/22",
  tagRelease: [0, 0],
  finalizationBehaviorDelta: 0,
}));
