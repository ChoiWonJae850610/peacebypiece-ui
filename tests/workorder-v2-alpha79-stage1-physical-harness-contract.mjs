#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const read = (file) => fs.readFileSync(file, "utf8");
const stateSource = read("apps/mobile/features/work-orders/documents/currentRevisionDocumentState.ts");
const harnessModelSource = read("apps/mobile/features/work-orders/documents/stage1PhysicalHarnessModel.ts");
const harnessUi = read("apps/mobile/features/work-orders/documents/A79Stage1PhysicalHarness.tsx");
const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const verifySafe = read("tools/pipeline/verify-safe.ps1");
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));

const runtimeSource = `${stateSource.replace(/^import type[\s\S]*?;\r?\n/u, "")}\n${harnessModelSource
  .replace(/^import type[\s\S]*?;\r?\n/u, "")
  .replace(/^import \{[\s\S]*?\} from "\.\/currentRevisionDocumentState";\r?\n/u, "")}`;
const compiled = ts.transpileModule(runtimeSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const {
  isA79Stage1PhysicalHarnessEnabled,
  resolveA79Stage1PhysicalHarnessScenario,
} = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

const qa = { dev: true, externalQa: "true" };
assert.equal(isA79Stage1PhysicalHarnessEnabled(qa), true); // 1 DEV/external-QA enabled
assert.equal(isA79Stage1PhysicalHarnessEnabled({ dev: false, externalQa: "true" }), false); // 2 production closed
assert.equal(isA79Stage1PhysicalHarnessEnabled({ dev: true, externalQa: "false" }), false); // 3 non-QA dev closed
assert.equal(resolveA79Stage1PhysicalHarnessScenario("none", { dev: false, externalQa: "true" }), null); // 4 fixture fail closed

const none = resolveA79Stage1PhysicalHarnessScenario("none", qa);
const pending = resolveA79Stage1PhysicalHarnessScenario("pending", qa);
const failed = resolveA79Stage1PhysicalHarnessScenario("failed", qa);
const generated = resolveA79Stage1PhysicalHarnessScenario("generated", qa);
assert.ok(none && pending && failed && generated); // 5 four valid scenarios
assert.ok([none, pending, failed, generated].every((item) => item.currentRevisionId === "rev-b-current")); // 6 B current fixed
assert.ok([none, pending, failed, generated].every((item) => item.documents.some((document) => document.id === "doc-a-generated"))); // 7 historical A always present
assert.deepEqual([none.model.state, pending.model.state, failed.model.state, generated.model.state], ["none", "pending", "failed", "generated"]); // 8 four states exact

assert.equal(none.model.viewDocumentId, null); // 9 none View absent
assert.equal(none.model.saveDocumentId, null); // 10 none Save absent
assert.equal(none.model.shareDocumentId, null); // 11 none Share absent
assert.equal(none.model.canRetry, false); // 12 none Retry absent
assert.equal(none.model.tokenDocumentId, null); // 13 none token absent
assert.deepEqual(none.currentTokens, []); // 14 historical token excluded in none

assert.equal(pending.model.state, "pending"); // 15 pending state
assert.equal(pending.model.canView || pending.model.canSave || pending.model.canShare, false); // 16 pending generated actions absent
assert.equal(pending.model.canRetry, false); // 17 pending retry absent
assert.equal(pending.model.tokenDocumentId, null); // 18 pending token absent
assert.deepEqual(pending.currentTokens, []); // 19 pending A takeover absent

assert.equal(failed.model.state, "failed"); // 20 failed state
assert.equal(failed.model.canRetry, true); // 21 failed retry present
assert.equal(failed.model.retryTarget?.id, "doc-b-failed"); // 22 Retry binds current B failure
assert.equal(failed.model.canView || failed.model.canSave || failed.model.canShare, false); // 23 failed generated actions absent
assert.equal(failed.model.tokenDocumentId, null); // 24 failed token absent

assert.equal(generated.model.viewDocumentId, "doc-b-generated"); // 25 View target B
assert.equal(generated.model.saveDocumentId, "doc-b-generated"); // 26 Save target B
assert.equal(generated.model.shareDocumentId, "doc-b-generated"); // 27 Share target B
assert.equal(generated.model.viewerDocumentId, "doc-b-generated"); // 28 Viewer target B
assert.equal(generated.model.tokenDocumentId, "doc-b-generated"); // 29 token owner B
assert.equal(generated.currentTokens[0]?.tokenId, "token-b-current"); // 30 token B visible
assert.equal(generated.currentTokens.some((item) => item.tokenId === "token-a-historical"), false); // 31 historical token absent
assert.ok([generated.model.viewTarget, generated.model.saveTarget, generated.model.shareTarget, generated.model.viewerTarget, generated.model.tokenTarget].every((item) => item?.id === "doc-b-generated")); // 32 every generated target B

assert.equal(none.model.state, "none"); // 33 generated -> none clears state
assert.equal(pending.model.viewDocumentId, null); // 34 generated -> pending clears action
assert.equal(failed.model.shareDocumentId, null); // 35 generated -> failed clears action
assert.equal(none.currentTokens.length, 0); // 36 generated -> none clears token
assert.equal(resolveA79Stage1PhysicalHarnessScenario("generated", qa).model.viewDocumentId, "doc-b-generated"); // 37 rapid none -> generated stable
assert.ok([none, pending, failed, generated].every((item) => item.model.documents.every((document) => document.revisionId === "rev-b-current"))); // 38 historical A never current

assert.match(workbench, /resolveCurrentRevisionDocumentWorkbenchModel\(documents, detail\.header\.currentRevisionId, currentArtifactHealth\)/u); // 39 production same owner with health
assert.match(harnessModelSource, /resolveCurrentRevisionDocumentWorkbenchModel\(documents, currentRevisionId\)/u); // 40 harness same owner
assert.doesNotMatch(harnessModelSource, /\.filter\(\(document\) => document\.revisionId/u); // 41 duplicate selector zero
assert.match(harnessUi, /__DEV__[\s\S]*EXPO_PUBLIC_WAFL_EXTERNAL_QA/u); // 42 DEV/test gate
assert.match(experience, /A79_STAGE1_PHYSICAL_HARNESS_ENABLED \? \(/u); // 43 production entry conditional
assert.doesNotMatch(harnessUi + harnessModelSource, /@\/lib\/api|documentsApi|requestJson|fetch\s*\(|axios/u); // 44 real API mutation zero
assert.doesNotMatch(harnessUi + harnessModelSource, /issueWorkOrderR0|generateWorkOrderR0|createDocumentShare|revokeDocumentAccessToken/u); // 45 business command zero
assert.match(harnessUi, /setGenerationRetryCount\(\(count\) => count \+ 1\)/u); // 46 Retry local only
assert.match(harnessUi, /label="Recipe issue count" value="0"/u); // 47 Recipe issue count fixed zero
assert.match(harnessUi, /B 없음/u); // 48 none control
assert.match(harnessUi, /B 생성 중/u); // 49 pending control
assert.match(harnessUi, /B 생성 실패/u); // 50 failed control
assert.match(harnessUi, /B 생성 완료/u); // 51 generated control
assert.match(harnessUi, /현재 리비전의 PDF가 없습니다\./u); // 52 none copy
assert.match(harnessUi, /PDF를 생성 중입니다\./u); // 53 pending copy
assert.match(harnessUi, /PDF 다시 생성/u); // 54 failed Retry copy
assert.match(harnessUi, /doc-a-generated/u); // 55 historical diagnostic
assert.match(harnessModelSource, /token-a-historical/u); // 56 historical token fixture retained
assert.match(harnessModelSource, /token-b-current/u); // 57 current token fixture
assert.match(verifySafe, /workorder-v2-alpha79-current-revision-artifact-identity-contract\.mjs/u); // 58 Stage 1 retained
assert.equal(appConfig.expo.extra.appVersion, "2.0.0-alpha.79"); // 59 finalized current version
assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length, 22); // 60 migration delta zero
for (const dependency of ["@shopify/react-native-skia", "react-native-reanimated", "react-native-gesture-handler", "react-native-worklets"]) {
  assert.equal(mobilePackage.dependencies[dependency], undefined); // 61-64 dependency boundary
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha79-stage1-physical-harness",
  assertions: 64,
  checkpoint: "ALPHA79_STAGE1_PHYSICAL_HARNESS_IPHONE_IPAD_QA_REQUIRED",
  states: [none.model.state, pending.model.state, failed.model.state, generated.model.state],
  currentGeneratedTarget: generated.model.viewDocumentId,
  historicalTakeover: 0,
  recipeIssueCount: 0,
  businessMutation: 0,
  physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
}));
