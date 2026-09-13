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
const finalizationEvidence = read("docs/project/app-v2/96-alpha80-finalization-evidence.md");
const verifySafe = read("tools/pipeline/verify-safe.ps1");
const finishVersion = read("tools/pipeline/finish-version.ps1");
const constants = read("lib/generated-documents/document-access/constants.ts");
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const migrationFiles = fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).sort();

assert.equal(version, "2.0.0-alpha.80");
for (const owner of [currentState, roadmap, devicePlan, finalizationEvidence]) {
  assert.match(owner, /ALPHA80_COMPLETE/u);
  assert.match(owner, /ALPHA80_FINALIZATION_COMPLETE/u);
  assert.match(owner, /(?:iPhone[\s\S]{0,220}`PASS`|`PASS`[\s\S]{0,220}iPhone)/iu);
  assert.match(owner, /(?:iPad(?:-| )mini[\s\S]{0,220}`PASS`|`PASS`[\s\S]{0,220}iPad(?:-| )mini)/iu);
  assert.match(owner, /Regular\/Large iPad[\s\S]{0,320}`NOT_RUN`/u);
  assert.match(owner, /Android[\s\S]{0,320}`NOT_RUN`/u);
}

assert.match(expoEnvironment, /Alpha\.80 finalization runtime boundary/u);
assert.match(expoEnvironment, /Internal APP_VERSION is `2\.0\.0-alpha\.80`/u);
assert.match(apiTestPlan, /Alpha\.80 finalization contract/u);
assert.equal(appConfig.expo.version, "2.0.0");
assert.equal(appConfig.expo.extra.appVersion, "2.0.0-alpha.80");
assert.equal(appConfig.expo.ios.requireFullScreen, true);
assert.equal(mobilePackage.dependencies["@shopify/react-native-skia"], undefined);
assert.equal(mobilePackage.dependencies["react-native-reanimated"], undefined);
assert.equal(mobilePackage.dependencies["react-native-gesture-handler"], undefined);
assert.equal(mobilePackage.dependencies["react-native-worklets"], undefined);
assert.equal(migrationFiles.length, 22);
assert.equal(migrationFiles.at(-1), "022_v2_work_order_drawings.sql");
assert.match(constants, /DOCUMENT_ACCESS_DEFAULT_EXPIRY_DAYS = 3/u);

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
  "workorder-v2-alpha80-stage1-canonical-share-binding-contract.mjs",
  "workorder-v2-alpha80-stage2-share-expiry-revoke-replacement-contract.mjs",
  "workorder-v2-alpha80-stage2-current-share-link-actions-contract.mjs",
  "workorder-v2-alpha80-stage3-public-share-security-isolation-contract.mjs",
  "workorder-v2-alpha80-finalization-contract.mjs",
]) {
  assert.match(verifySafe, new RegExp(contractName.replaceAll(".", "\\."), "u"));
}

for (const contract of [
  read("tests/workorder-v2-alpha80-stage1-canonical-share-binding-contract.mjs"),
  read("tests/workorder-v2-alpha80-stage2-share-expiry-revoke-replacement-contract.mjs"),
  read("tests/workorder-v2-alpha80-stage2-current-share-link-actions-contract.mjs"),
  read("tests/workorder-v2-alpha80-stage3-public-share-security-isolation-contract.mjs"),
]) {
  assert.match(contract, /alpha80/iu);
}

assert.match(currentState, /one\s+canonical Maker-current Share lineage/u);
assert.match(currentState, /three-day\s+TTL is unchanged/iu);
assert.match(currentState, /alpha\.79 document[\s\S]{0,120}authority remains superior/iu);
assert.match(finalizationEvidence, /hash-only at rest/u);
assert.match(finalizationEvidence, /Production\/Owner\/ambiguous business mutation: `0\/0\/0`/u);
assert.match(
  finishVersion,
  /ExpectedAppVersion -in @\([\s\S]*"2\.0\.0-alpha\.80"\)[\s\S]*db\/v2\/migrations\/022_v2_work_order_drawings\.sql/u,
);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha80-finalization",
  previousPermanentInventoryRetained: 304,
  addedPermanentChecks: 1,
  finalPermanentInventory: 305,
  productCheckpoint: "ALPHA80_COMPLETE",
  finalizationCheckpoint: "ALPHA80_FINALIZATION_COMPLETE",
  ownerIphoneFinalCombinedSmoke: "PASS",
  ownerIpadMiniFinalCombinedSmoke: "PASS",
  regularLargeIpadPhysicalResult: "NOT_RUN",
  androidPhysicalResult: "NOT_RUN",
  migrationLedgerExpected: "22/22",
  shareTtlDays: 3,
  finalizationBehaviorDelta: 0,
  tagRelease: [0, 0],
}));
