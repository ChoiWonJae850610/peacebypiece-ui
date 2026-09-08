#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  resolveWorkOrderMajorCategoryTransition,
  resolveWorkOrderTargetAudienceTransition,
} from "../lib/domain/work-orders/catalog/workOrderCategoryPolicy.ts";
import {
  applyWaflSheetSystemRevealBodyDelta,
  beginWaflSheetFocusRevealCycle,
  observeWaflSheetUserBodyOffset,
  resolveWaflSheetFocusRevealRestore,
} from "../apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

assert.deepEqual(resolveWorkOrderMajorCategoryTransition({
  categoryDetail: "티셔츠",
  currentCategoryMajor: "상의",
  nextCategoryMajor: "하의",
}), { categoryDetail: "", categoryMajor: "하의" });
assert.deepEqual(resolveWorkOrderTargetAudienceTransition({
  categoryDetail: "티셔츠",
  categoryMajor: "상의",
  currentTargetAudience: "여성",
  nextTargetAudience: "남성",
}), { categoryDetail: "티셔츠", categoryMajor: "상의", targetAudience: "남성" });
assert.deepEqual(resolveWorkOrderTargetAudienceTransition({
  categoryDetail: "드레스",
  categoryMajor: "원피스",
  currentTargetAudience: "여성",
  nextTargetAudience: "남성",
}), { categoryDetail: "", categoryMajor: "", targetAudience: "남성" });

let restingBody = 12;
for (let generation = 1; generation <= 10; generation += 1) {
  let cycle = beginWaflSheetFocusRevealCycle({
    bodyOffset: restingBody,
    focusGeneration: generation,
  });
  cycle = applyWaflSheetSystemRevealBodyDelta(cycle, 36);
  const restore = resolveWaflSheetFocusRevealRestore({ cycle });
  assert.deepEqual(restore, { bodyOffset: 12 });
  restingBody = restore.bodyOffset;
}
assert.equal(restingBody, 12, "ten system reveal cycles must have zero cumulative body drift");
let userCycle = beginWaflSheetFocusRevealCycle({ bodyOffset: 10, focusGeneration: 11 });
userCycle = applyWaflSheetSystemRevealBodyDelta(userCycle, 30);
userCycle = observeWaflSheetUserBodyOffset(userCycle, 58);
assert.deepEqual(resolveWaflSheetFocusRevealRestore({ cycle: userCycle }), {
  bodyOffset: 28,
}, "restore removes only system reveal while preserving user body ownership; root rest is separately derived");

const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
assert.match(overview, /onCancel=\{props\.onCancelDateEdit\}/u);
assert.match(experience, /function cancelBasicInfoFieldEdit\(field: keyof BasicInfoDraft\)/u);
const localCancel = experience.slice(experience.indexOf("function cancelBasicInfoFieldEdit"), experience.indexOf("function nextClientRequestId"));
assert.doesNotMatch(localCancel, /basicInfoDraftFromDetail|setBasicInfoDraft|discardSection|flush/u, "date child cancel must not rollback or autosave the Overview draft");
assert.match(overview, /resolveWorkOrderTargetAudienceTransition/u);
assert.match(overview, /resolveWorkOrderMajorCategoryTransition/u);
assert.doesNotMatch(overview, /value === "남성" && props\.draft\.categoryMajor === "원피스"/u);

const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const input = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const create = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
assert.match(sheet, /capturePreparedDirectInputGeometry/u, "manual sheets publish geometry without focus");
assert.match(sheet, /capturePreparedDirectInputGeometry\(generation\);[\s\S]{0,120}if \(!coordinatedEntrance\.prepared\)/u);
assert.match(sheet, /beginWaflSheetFocusRevealCycle/u);
assert.match(sheet, /applySystemBodyScroll/u);
assert.match(sheet, /resolveWaflSheetFocusRevealRestore/u);
assert.match(sheet, /bodyScrollUserOwnedRef/u);
assert.match(sheet, /keyboardMode === "directInput"\) return;[\s\S]{0,180}scrollResponderScrollNativeHandleToKeyboard/u, "untracked native fallback cannot own direct-input reveal");
assert.match(sheet, /resolveWaflDirectInputFinalReconciliation/u, "didShow stays a semantic safety check");
assert.match(input, /WaflSheetSemanticFocusScope/u);
assert.match(create, /new-recipe-product-semantic-reveal-scope/u);
assert.match(create, /<WaflSheetSemanticFocusScope[\s\S]*?<WaflSheetValueField[\s\S]*?<WorkOrderCharacterChoice[\s\S]*?<\/WaflSheetSemanticFocusScope>/u);

const material = read("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx");
assert.match(material, /<WaflSheetFocusBlock[\s\S]*?<WaflSheetTextInput[\s\S]*?<WaflCharacterCounter/u);
assert.match(overview, /footerPolicy="always"[\s\S]{0,100}keyboardAutoExpand[\s\S]{0,100}keyboardMode="directInput"/u);

const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const search = read("apps/mobile/features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx");
assert.match(quick, /footerPolicy="always"/u);
assert.doesNotMatch(quick, /requestAnimationFrame|onPreparedForAutoFocus/u);
assert.match(search, /canPublishQuickDeliveryAddressSearchResult/u);
assert.match(search, /resolveQuickDeliveryAddressSearchLifecycle/u);

assert.equal(fs.readdirSync(path.join(root, "db", "v2", "migrations")).filter((name) => name.endsWith(".sql")).length, 22);
assert.match(read("lib/constants/version.ts"), /2\.0\.0-alpha\.(?:72|73|74|75)/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73c-phase3-reveal-geometry-overview-state-integrity",
  overviewCalendarWholeDraftRollback: 0,
  repeatedRevealCycles: 10,
  cumulativeSystemRevealDrift: 0,
  semanticNewRecipeScope: true,
  physicalResultInferred: false,
}));
