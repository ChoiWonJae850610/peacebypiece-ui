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
const inputSheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const pipeline = read("tools/pipeline/peacebypiece-auto-pipeline.ps1");
const finishVersion = read("tools/pipeline/finish-version.ps1");
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const migrationFiles = fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).sort();

assert.match(version, /^2\.0\.0-alpha\.\d+$/u);
for (const owner of [currentState, roadmap, devicePlan]) {
  assert.match(owner, /ALPHA73_COMPLETE/u);
  assert.match(owner, /ALPHA73_FINALIZATION_COMPLETE/u);
  assert.match(owner, /다 잘된다\. 이제 키보드는 다 되는거같다/u);
}
assert.match(currentState, /OWNER_IPHONE_PHYSICAL_PASS[\s\S]{0,220}(?:A73D|Keyboard|Static Sheet)/u);
assert.match(devicePlan, /Address Search provider-result[\s\S]{0,120}NOT_RUN/u);
assert.match(expoEnvironment, /Internal APP_VERSION \| `2\.0\.0-alpha\.\d+`/u);
assert.match(expoEnvironment, /Alpha\.73 finalization runtime boundary/u);

assert.match(guardrails, /Final alpha\.73 boundary/u);
assert.match(guardrails, /authenticated DEV\/TEST Product Sketch vertical slice/u);
assert.match(guardrails, /Release\/production remains intentionally disabled as `스케치\(준비 중\)`/u);
assert.match(gallery, /props\.sketchAuthoringEnabled \? "스케치" : "스케치\(준비 중\)"/u);
assert.match(inputSheet, /resolveWaflStaticSheetRestingOffset/u);
assert.match(inputSheet, /owner: "systemKeyboard"/u);
assert.doesNotMatch(inputSheet, /PanResponder\.create/u);

assert.equal(migrationFiles.length, 22);
assert.equal(migrationFiles.at(-1), "022_v2_work_order_drawings.sql");
assert.equal(mobilePackage.dependencies["@shopify/react-native-skia"], undefined);
assert.equal(mobilePackage.dependencies["react-native-reanimated"], undefined);
assert.equal(mobilePackage.dependencies["react-native-gesture-handler"], undefined);
assert.equal(mobilePackage.dependencies["react-native-worklets"], undefined);

assert.match(pipeline, /\$existingWaflArtifacts/u);
assert.match(pipeline, /\.Name -like "peacebypiece-ui-\*"/u);
assert.match(pipeline, /\.Name -like "repo-state-2\.0\.0-\*"/u);
assert.doesNotMatch(pipeline, /Get-ChildItem -LiteralPath \$NewestResultDIr -Force[^\n]*\| ForEach-Object \{[\s\S]{0,120}Remove-Item/u);
assert.match(
  finishVersion,
  /ExpectedAppVersion -in @\("2\.0\.0-alpha\.73", "2\.0\.0-alpha\.74", "2\.0\.0-alpha\.75"\)[\s\S]*db\/v2\/migrations\/022_v2_work_order_drawings\.sql/u,
);
assert.match(roadmap, /ALPHA74_SKETCH_RESPONSIVE_SHAPE_AUTHORING_IPHONE_IPAD_QA_REQUIRED/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73-finalization",
  previousPermanentInventoryRetained: 264,
  addedPermanentChecks: 1,
  finalPermanentInventory: 265,
  ownerKeyboardStaticSheetPhysicalResult: "PASS",
  productCheckpoint: "ALPHA73_COMPLETE",
  finalizationCheckpoint: "ALPHA73_FINALIZATION_COMPLETE",
  migrationLedgerExpected: "22/22",
  productionSketchEnabled: false,
  finalizationBehaviorDelta: 0,
}));
