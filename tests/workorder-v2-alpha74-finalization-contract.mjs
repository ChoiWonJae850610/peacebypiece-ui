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
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const drawingContracts = read("lib/domain/drawing/contracts.ts");
const orientationPolicy = read("apps/mobile/domain/mobileOrientationPolicy.ts");
const rootLayout = read("apps/mobile/app/_layout.tsx");
const nativePlugin = read("apps/mobile/plugins/withWaflNativeOrientationPolicy.js");
const responsivePolicy = read("apps/mobile/domain/workOrderResponsiveWorkspacePolicy.ts");
const verifySafe = read("tools/pipeline/verify-safe.ps1");
const finishVersion = read("tools/pipeline/finish-version.ps1");
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const migrationFiles = fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).sort();

assert.match(version, /^2\.0\.0-alpha\.(?:74|75|76|77|78|79)$/u);
for (const owner of [currentState, roadmap, devicePlan]) {
  assert.match(owner, /ALPHA74_COMPLETE/u);
  assert.match(owner, /ALPHA74_FINALIZATION_COMPLETE/u);
  assert.match(owner, /iPhone[\s\S]{0,300}(?:physical|actual)[\s\S]{0,180}PASS/iu);
  assert.match(owner, /iPad(?:-| )mini[\s\S]{0,360}PASS/iu);
  assert.match(owner, /Regular\/Large iPad[\s\S]{0,220}NOT_RUN/u);
  assert.match(owner, /Android[\s\S]{0,220}NOT_RUN/u);
}
assert.match(expoEnvironment, /Alpha\.74 finalization runtime boundary[\s\S]{0,180}Internal APP_VERSION is `2\.0\.0-alpha\.74`/u);
assert.match(expoEnvironment, /Alpha\.74 finalization runtime boundary/u);
assert.match(apiTestPlan, /Alpha\.74 finalization contract/u);
assert.match(guardrails, /Final alpha\.74 boundary/u);

assert.match(sketchEditor, /type SketchTool = "pen" \| "line" \| "arrow" \| "rectangle" \| "ellipse" \| "text" \| "selection" \| "eraser"/u);
for (const label of ["펜", "선", "화살표", "사각형", "타원", "텍스트"]) {
  assert.match(sketchEditor, new RegExp(`"${label}"`, "u"), `${label} remains available after alpha.75 compact-toolbar migration`);
}
for (const deferredLabel of ["이동", "확대", "이미지", "연필"]) {
  assert.doesNotMatch(sketchEditor, new RegExp(`label="${deferredLabel}"`, "u"));
}
assert.match(drawingContracts, /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u);
assert.equal(migrationFiles.length, 22);
assert.equal(migrationFiles.at(-1), "022_v2_work_order_drawings.sql");
assert.match(gallery, /props\.sketchAuthoringEnabled \? "스케치" : "스케치\(준비 중\)"/u);

assert.equal(appConfig.expo.ios.requireFullScreen, true);
assert.match(orientationPolicy, /deviceClass === "handset" \|\| deviceClass === "compact-tablet" \? "portrait_up" : "default"/u);
assert.match(orientationPolicy, /scope === "product-sketch"[\s\S]{0,100}"lock-portrait-up"/u);
assert.match(rootLayout, /orientation: rootStackOrientation/u);
assert.match(nativePlugin, /supportedInterfaceOrientationsFor window/u);
assert.match(nativePlugin, /shortSidePoints >= Self\.waflRegularTabletShortSidePoints/u);
assert.match(nativePlugin, /return \.portrait/u);
assert.match(nativePlugin, /return super\.application/u);
assert.match(nativePlugin, /UIInterfaceOrientationLandscapeLeft/u);
assert.match(nativePlugin, /UIInterfaceOrientationLandscapeRight/u);
assert.match(responsivePolicy, /work-order-responsive-detail-host/u);
assert.match(responsivePolicy, /input\.deviceClass === "handset" \|\| input\.deviceClass === "compact-tablet"/u);

for (const contractName of [
  "workorder-v2-alpha74-sketch-responsive-shape-authoring-contract.mjs",
  "workorder-v2-alpha74-ipad-sketch-orientation-lifecycle-correction-contract.mjs",
  "workorder-v2-alpha74-ipad-responsive-detail-subtree-continuity-contract.mjs",
  "workorder-v2-alpha74-compact-tablet-sketch-portrait-policy-contract.mjs",
  "workorder-v2-alpha74-ios-fullscreen-orientation-native-prerequisite-contract.mjs",
  "workorder-v2-alpha74-compact-tablet-zero-rotation-motion-contract.mjs",
  "workorder-v2-alpha74-ios-compact-native-orientation-mask-contract.mjs",
  "workorder-v2-alpha74-finalization-contract.mjs",
]) {
  assert.match(verifySafe, new RegExp(contractName.replaceAll(".", "\\."), "u"));
}

assert.equal(mobilePackage.dependencies["@shopify/react-native-skia"], undefined);
assert.equal(mobilePackage.dependencies["react-native-reanimated"], undefined);
assert.equal(mobilePackage.dependencies["react-native-gesture-handler"], undefined);
assert.equal(mobilePackage.dependencies["react-native-worklets"], undefined);
assert.match(
  finishVersion,
  /ExpectedAppVersion -in @\("2\.0\.0-alpha\.73", "2\.0\.0-alpha\.74", "2\.0\.0-alpha\.75", "2\.0\.0-alpha\.76", "2\.0\.0-alpha\.77", "2\.0\.0-alpha\.78", "2\.0\.0-alpha\.79"\)[\s\S]*db\/v2\/migrations\/022_v2_work_order_drawings\.sql/u,
);
assert.match(currentState, /tag, or release/u);
assert.match(roadmap, /tag\/release `0\/0`/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha74-finalization",
  previousPermanentInventoryRetained: 272,
  addedPermanentChecks: 1,
  finalPermanentInventory: 273,
  productCheckpoint: "ALPHA74_COMPLETE",
  finalizationCheckpoint: "ALPHA74_FINALIZATION_COMPLETE",
  ownerIphonePhysicalResult: "PASS",
  ownerIpadMiniPhysicalResult: "PASS",
  regularLargeIpadPhysicalResult: "NOT_RUN",
  androidPhysicalResult: "NOT_RUN",
  drawingSceneSchemaVersion: 1,
  migrationLedgerExpected: "22/22",
  tagRelease: [0, 0],
  finalizationBehaviorDelta: 0,
}));
