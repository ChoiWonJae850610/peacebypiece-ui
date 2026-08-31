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
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const svgRenderer = read("apps/mobile/features/drawing-poc/SvgDrawingSceneRenderer.tsx");
const freehandPath = read("apps/mobile/features/drawing-poc/drawingFreehandPath.ts");

assert.equal(version, "2.0.0-alpha.72");
for (const owner of [currentState, roadmap, devicePlan]) {
  assert.match(owner, /ALPHA72_DRAWING_FOUNDATION_COMPLETE/u);
  assert.match(owner, /ALPHA72_FINALIZATION_COMPLETE/u);
  assert.match(owner, /Owner physical[\s\S]{0,180}(?:accepted as PASS|result: `PASS`|result[^\n]*PASS)/iu);
}

assert.match(expoEnvironment, /Internal APP_VERSION \| `2\.0\.0-alpha\.72`/u);
assert.match(expoEnvironment, /no dependency, plugin,[\s\S]*native source,[\s\S]*EAS/iu);
assert.match(guardrails, /customer-facing feature name is `스케치`/u);
assert.match(guardrails, /Renderer, SVG, Performance, and PoC labels[\s\S]*DEV lab only/iu);
assert.match(guardrails, /Production remains disabled as `스케치\(준비 중\)`/u);
assert.match(guardrails, /Alpha\.73 production editor work[\s\S]*not started/iu);

assert.equal(mobilePackage.dependencies["@shopify/react-native-skia"], undefined);
assert.equal(mobilePackage.dependencies["perfect-freehand"], undefined);
assert.equal(mobilePackage.dependencies["react-native-reanimated"], undefined);
assert.equal(mobilePackage.dependencies["react-native-gesture-handler"], undefined);
assert.equal(mobilePackage.dependencies["react-native-worklets"], undefined);
assert.equal(mobilePackage.dependencies["react-native-svg"], "15.15.3");

assert.match(gallery, /"스케치, 준비 중"/u);
assert.match(gallery, /: "스케치"/u);
assert.match(gallery, /disabled=\{!props\.drawingRendererPocEnabled\}/u);
assert.match(experience, /isDrawingRendererPocEnabled/u);
assert.match(svgRenderer, /CommittedSvgLayer/u);
assert.match(svgRenderer, /ActiveStrokeSvgLayer/u);
assert.match(freehandPath, /midpoint-quadratic-v1/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha72-finalization",
  previousPermanentInventoryRetained: 226,
  addedPermanentChecks: 1,
  finalPermanentInventory: 227,
  ownerPhysicalResult: "PASS",
  productCheckpoint: "ALPHA72_DRAWING_FOUNDATION_COMPLETE",
  finalizationCheckpoint: "ALPHA72_FINALIZATION_COMPLETE",
  renderer: "SVG",
  behaviorDelta: 0,
  alpha73Started: false,
}));
