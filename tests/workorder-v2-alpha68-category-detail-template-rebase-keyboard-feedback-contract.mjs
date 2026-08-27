#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  consumeCreateRecipeEntranceFocus,
  dismissCreateRecipeKeyboard,
  openCreateRecipeKeyboardFocus,
} from "../apps/mobile/features/work-orders/create/createRecipeKeyboardFocusPolicy.ts";
import { flushProductionCategorySwitch } from "../apps/mobile/features/work-orders/production/productionCategorySwitchPolicy.ts";
import { measurementProjectionImpact } from "../apps/mobile/features/work-orders/size-color/measurementProjectionImpactPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");

for (let cycle = 0; cycle < 3; cycle += 1) {
  let focus = openCreateRecipeKeyboardFocus();
  const entrance = consumeCreateRecipeEntranceFocus(focus);
  assert.equal(entrance.shouldFocus, true);
  focus = entrance.state;
  focus = dismissCreateRecipeKeyboard(focus);
  assert.equal(consumeCreateRecipeEntranceFocus(focus).shouldFocus, false, "Done must suppress entrance focus reacquisition");
}

const processing = [];
let switchCount = 0;
assert.equal(await flushProductionCategorySwitch({
  dirty: true,
  flush: async () => true,
  onProcessing: (message) => processing.push(message),
  onSwitch: () => { switchCount += 1; },
}), true);
assert.deepEqual(processing, ["변경사항을 저장 중입니다.", null]);
assert.equal(switchCount, 1);

processing.length = 0;
assert.equal(await flushProductionCategorySwitch({ dirty: false, flush: async () => true, onProcessing: (message) => processing.push(message), onSwitch: () => { switchCount += 1; } }), true);
assert.deepEqual(processing, [], "clean subsection transition shows no blocker");
assert.equal(switchCount, 2);

processing.length = 0;
assert.equal(await flushProductionCategorySwitch({ dirty: true, flush: async () => false, onProcessing: (message) => processing.push(message), onSwitch: () => { switchCount += 1; } }), false);
assert.deepEqual(processing, ["변경사항을 저장 중입니다.", null]);
assert.equal(switchCount, 2, "failed flush cannot switch subsection");

for (const kind of ["save-company-template", "update-company-template"]) {
  const impact = measurementProjectionImpact(kind);
  assert.equal(impact.specifications, "targeted-refresh");
  assert.equal(impact.workOrderSizeSpecGets, 1);
}

const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const categoryConfirm = experience.slice(experience.indexOf('title: "대분류를 변경합니다"'), experience.indexOf('return "confirmation" as const'));
assert.match(categoryConfirm, /categoryDetail: ""/u, "category confirmation immediately clears the local detail projection");
assert.doesNotMatch(categoryConfirm, /updateOverview|flushSection/u, "category confirmation remains local-only");
assert.match(experience, /if \(patch\.resetCategoryDependents\)[\s\S]{0,2600}expectedVersion: saved\.nextVersion,[\s\S]{0,220}patch: \{ itemCode: desiredItemCode \}/u, "boundary serializes reset then detail patch");
assert.match(experience, /resetApplied: true/u, "a failed second command retains a retryable post-reset intent");

const repository = read("lib/domain/work-orders/measurement/measurementCommandRepository.ts");
assert.match(repository, /UPDATE work_order_size_specs SET source_template_id=\$3,source_template_version=\$4/u);
assert.match(repository, /"templateBaseline"/u);
const detail = read("lib/domain/work-orders/read/detailRepository.ts");
assert.match(detail, /MEASUREMENT_SOURCE_BASELINE_COMMAND_CODES_SQL/u);
assert.match(detail, /saveCompanyTemplate/u);
assert.match(detail, /updateCompanyTemplate/u);

const createSheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
assert.match(createSheet, /consumeCreateRecipeEntranceFocus/u);
assert.doesNotMatch(createSheet, /dismissCreateRecipeKeyboard|Keyboard\.dismiss|onSubmitEditing=/u);
assert.match(read("apps/mobile/features/inputs/WaflInputSheet.tsx"), /directInputSessionStateRef/u);
assert.match(createSheet, /processingMessage=\{props\.pending \? "새 레시피를 생성 중입니다\." : null\}/u);
assert.match(experience, /copyPending \|\| reorderPending \? "레시피를 생성 중입니다\."/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha68-category-detail-template-rebase-keyboard-feedback",
  category: { immediateDetailClear: true, serializedBoundary: true, retryIntent: true },
  templateRebase: { saveAndUpdate: true, targetedRefresh: true },
  keyboardCycles: 3,
  production: { dirtyBlocker: true, cleanBlocker: false, failureSwitch: false },
  physicalResultInferred: false,
}));
