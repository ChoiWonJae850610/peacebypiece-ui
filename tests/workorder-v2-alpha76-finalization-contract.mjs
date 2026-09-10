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
const sketchEditor = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const cameraGesture = read("lib/domain/drawing/cameraGesture.ts");
const zoomHelper = read("apps/mobile/features/work-orders/drawing/drawingZoomPercent.ts");
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const drawingContracts = read("lib/domain/drawing/contracts.ts");
const verifySafe = read("tools/pipeline/verify-safe.ps1");
const finishVersion = read("tools/pipeline/finish-version.ps1");
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const migrationFiles = fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).sort();

assert.match(version, /^2\.0\.0-alpha\.(?:76|77|78)$/u);
for (const owner of [currentState, roadmap, devicePlan]) {
  assert.match(owner, /ALPHA76_COMPLETE/u);
  assert.match(owner, /ALPHA76_FINALIZATION_COMPLETE/u);
  assert.match(owner, /Owner[\s\S]{0,40}actual[\s\S]{0,420}(?:iPhone[\s\S]{0,180}`PASS`|`PASS`[\s\S]{0,180}iPhone)/iu);
  assert.match(owner, /Owner[\s\S]{0,40}actual[\s\S]{0,460}(?:iPad(?:-| )mini[\s\S]{0,180}`PASS`|`PASS`[\s\S]{0,220}iPad(?:-| )mini)/iu);
  assert.match(owner, /Regular\/Large iPad[\s\S]{0,260}`NOT_RUN`/u);
  assert.match(owner, /Android[\s\S]{0,260}`NOT_RUN`/u);
  assert.match(owner, /Fresh[\s\S]{0,160}Cover[\s\S]{0,220}(?:above `100%`|`111%`)/iu);
  assert.match(owner, /Fit[\s\S]{0,180}`100%`/iu);
  assert.match(owner, /(?:Pan-only|Pan alone)[\s\S]{0,120}(?:stable|unchanged|leaves|cannot change)/iu);
  assert.match(owner, /orientation regression[\s\S]{0,80}`0`/iu);
}

assert.match(expoEnvironment, /Alpha\.76 finalization runtime boundary/u);
assert.match(expoEnvironment, /Internal APP_VERSION is `2\.0\.0-alpha\.76`/u);
assert.match(guardrails, /Final alpha\.76 boundary/u);
assert.match(apiTestPlan, /Alpha\.76 finalization contract/u);
assert.match(zoomHelper, /Math\.round\(zoom \* 100\)/u);
assert.match(cameraGesture, /zoom: clamp\(coverScale \/ fitScale, DRAWING_CAMERA_MIN_ZOOM, DRAWING_CAMERA_MAX_ZOOM\)/u);
assert.match(sketchEditor, /setCurrentCamera\(createDrawingCoverCamera\(nextViewport\)\)/u);
assert.match(sketchEditor, /formatDrawingZoomPercentLabel\(camera\.zoom\)/u);
assert.match(sketchEditor, /testID="work-order-sketch-zoom-percent-hud"/u);
assert.match(sketchEditor, /pointerEvents="none"[\s\S]*work-order-sketch-zoom-percent-hud/u);

assert.match(drawingContracts, /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u);
assert.equal(migrationFiles.length, 22);
assert.equal(migrationFiles.at(-1), "022_v2_work_order_drawings.sql");
assert.match(gallery, /props\.sketchAuthoringEnabled \? "스케치" : "스케치\(준비 중\)"/u);
assert.equal(appConfig.expo.version, "2.0.0");
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
  "workorder-v2-alpha75-partial-eraser-compact-toolbar-contract.mjs",
  "workorder-v2-alpha75-overlay-palette-stroke-partial-eraser-contract.mjs",
  "workorder-v2-alpha76-selection-object-move-contract.mjs",
  "workorder-v2-alpha76-selection-move-pickup-ux-contract.mjs",
  "workorder-v2-alpha76-visible-canvas-world-surface-contract.mjs",
  "workorder-v2-alpha76-sketch-workspace-compact-layout-contract.mjs",
  "workorder-v2-alpha76-fit-paper-pinch-zoom-pan-contract.mjs",
  "workorder-v2-alpha76-initial-cover-pinch-reliability-contract.mjs",
  "workorder-v2-alpha76-native-pinch-tracking-frame-coalescing-contract.mjs",
  "workorder-v2-alpha76-pinch-clamp-boundary-rebase-contract.mjs",
  "workorder-v2-alpha76-raw-multitouch-camera-acquisition-contract.mjs",
  "workorder-v2-alpha76-zoom-percent-hud-contract.mjs",
  "workorder-v2-alpha76-finalization-contract.mjs",
]) {
  assert.match(verifySafe, new RegExp(contractName.replaceAll(".", "\\."), "u"));
}

assert.match(
  finishVersion,
  /ExpectedAppVersion -in @\("2\.0\.0-alpha\.73", "2\.0\.0-alpha\.74", "2\.0\.0-alpha\.75", "2\.0\.0-alpha\.76", "2\.0\.0-alpha\.77", "2\.0\.0-alpha\.78"\)[\s\S]*db\/v2\/migrations\/022_v2_work_order_drawings\.sql/u,
);
assert.match(currentState, /tag, or release/u);
assert.match(roadmap, /tag\/release `0\/0`/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha76-finalization",
  previousPermanentInventoryRetained: 287,
  addedPermanentChecks: 1,
  finalPermanentInventory: 288,
  productCheckpoint: "ALPHA76_COMPLETE",
  finalizationCheckpoint: "ALPHA76_FINALIZATION_COMPLETE",
  ownerIphonePhysicalResult: "PASS",
  ownerIpadMiniPhysicalResult: "PASS",
  ipadMiniOrientationRegression: 0,
  regularLargeIpadPhysicalResult: "NOT_RUN",
  androidPhysicalResult: "NOT_RUN",
  freshOpenPresentation: "centered-cover-may-exceed-100-percent",
  fitPresentation: "zoom-1-equals-100-percent",
  drawingSceneSchemaVersion: 1,
  migrationLedgerExpected: "22/22",
  tagRelease: [0, 0],
  finalizationBehaviorDelta: 0,
}));
