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
const apiTestPlan = read("docs/project/app-v2/17-v2-api-contract-test-plan.md");
const verifySafe = read("tools/pipeline/verify-safe.ps1");
const finishVersion = read("tools/pipeline/finish-version.ps1");
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const migrationFiles = fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).sort();

assert.equal(version, "2.0.0-alpha.79");
for (const owner of [currentState, roadmap, devicePlan]) {
  assert.match(owner, /ALPHA79_COMPLETE/u);
  assert.match(owner, /ALPHA79_FINALIZATION_COMPLETE/u);
  assert.match(owner, /(?:iPhone[\s\S]{0,160}`PASS`|`PASS`[\s\S]{0,160}iPhone)/iu);
  assert.match(owner, /(?:iPad(?:-| )mini[\s\S]{0,160}`PASS`|`PASS`[\s\S]{0,160}iPad(?:-| )mini)/iu);
  assert.match(owner, /Regular\/Large iPad[\s\S]{0,280}`NOT_RUN`/u);
  assert.match(owner, /Android[\s\S]{0,280}`NOT_RUN`/u);
}

assert.match(expoEnvironment, /Alpha\.79 finalization runtime boundary/u);
assert.match(expoEnvironment, /Internal APP_VERSION is `2\.0\.0-alpha\.79`/u);
assert.match(apiTestPlan, /Alpha\.79 finalization contract/u);
assert.equal(appConfig.expo.version, "2.0.0");
assert.equal(appConfig.expo.extra.appVersion, "2.0.0-alpha.79");
assert.equal(appConfig.expo.ios.requireFullScreen, true);
assert.equal(mobilePackage.dependencies["@shopify/react-native-skia"], undefined);
assert.equal(mobilePackage.dependencies["react-native-reanimated"], undefined);
assert.equal(mobilePackage.dependencies["react-native-gesture-handler"], undefined);
assert.equal(mobilePackage.dependencies["react-native-worklets"], undefined);
assert.equal(migrationFiles.length, 22);
assert.equal(migrationFiles.at(-1), "022_v2_work_order_drawings.sql");

for (const contractName of [
  "workorder-v2-alpha67-pdf-generation-retry-public-viewer-contract.mjs",
  "workorder-v2-alpha72-drawing-foundation-contract.mjs",
  "workorder-v2-alpha73-finalization-contract.mjs",
  "workorder-v2-alpha74-finalization-contract.mjs",
  "workorder-v2-alpha75-finalization-contract.mjs",
  "workorder-v2-alpha76-finalization-contract.mjs",
  "workorder-v2-alpha77-finalization-contract.mjs",
  "workorder-v2-alpha78-finalization-contract.mjs",
  "workorder-v2-alpha79-current-revision-artifact-identity-contract.mjs",
  "workorder-v2-alpha79-stage1-physical-harness-contract.mjs",
  "workorder-v2-alpha79-stage2a-failure-retry-r2-cleanup-contract.mjs",
  "workorder-v2-alpha79-stage2b-missing-corrupt-recovery-contract.mjs",
  "workorder-v2-alpha79-stage3a-revoke-access-invalidation-contract.mjs",
  "workorder-v2-alpha79-stage3b-revoked-artifact-purge-deleted-contract.mjs",
  "workorder-v2-alpha79-finalization-contract.mjs",
]) {
  assert.match(verifySafe, new RegExp(contractName.replaceAll(".", "\\."), "u"));
}

for (const contract of [
  read("tests/workorder-v2-alpha79-current-revision-artifact-identity-contract.mjs"),
  read("tests/workorder-v2-alpha79-stage1-physical-harness-contract.mjs"),
  read("tests/workorder-v2-alpha79-stage2a-failure-retry-r2-cleanup-contract.mjs"),
  read("tests/workorder-v2-alpha79-stage2b-missing-corrupt-recovery-contract.mjs"),
  read("tests/workorder-v2-alpha79-stage3a-revoke-access-invalidation-contract.mjs"),
  read("tests/workorder-v2-alpha79-stage3b-revoked-artifact-purge-deleted-contract.mjs"),
]) {
  assert.match(contract, /alpha79/iu);
}

assert.match(currentState, /historical fallback or automatic regeneration/u);
assert.match(currentState, /same-Revision N\+1 recovery/u);
assert.match(currentState, /exact absence proof/u);
assert.match(currentState, /Drawing Scene v1/u);
assert.match(currentState, /1500×2100/u);
assert.match(
  finishVersion,
  /ExpectedAppVersion -in @\("2\.0\.0-alpha\.73", "2\.0\.0-alpha\.74", "2\.0\.0-alpha\.75", "2\.0\.0-alpha\.76", "2\.0\.0-alpha\.77", "2\.0\.0-alpha\.78", "2\.0\.0-alpha\.79"\)[\s\S]*db\/v2\/migrations\/022_v2_work_order_drawings\.sql/u,
);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha79-finalization",
  previousPermanentInventoryRetained: 299,
  addedPermanentChecks: 1,
  finalPermanentInventory: 300,
  productCheckpoint: "ALPHA79_COMPLETE",
  finalizationCheckpoint: "ALPHA79_FINALIZATION_COMPLETE",
  ownerIphoneFinalCombinedSmoke: "PASS",
  ownerIpadMiniFinalCombinedSmoke: "PASS",
  regularLargeIpadPhysicalResult: "NOT_RUN",
  androidPhysicalResult: "NOT_RUN",
  migrationLedgerExpected: "22/22",
  sceneSchemaVersion: 1,
  world: "1000x1400",
  outputBox: "1500x2100",
  finalizationBehaviorDelta: 0,
  tagRelease: [0, 0],
}));
