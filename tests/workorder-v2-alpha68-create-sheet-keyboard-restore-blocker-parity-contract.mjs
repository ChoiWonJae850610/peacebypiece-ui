#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { resolveWaflSheetKeyboardRestoreOffset } from "../apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts";
import {
  consumeCreateRecipeEntranceFocus,
  dismissCreateRecipeKeyboard,
  openCreateRecipeKeyboardFocus,
} from "../apps/mobile/features/work-orders/create/createRecipeKeyboardFocusPolicy.ts";
import { flushProductionCategorySwitch } from "../apps/mobile/features/work-orders/production/productionCategorySwitchPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");

for (let cycle = 0; cycle < 3; cycle += 1) {
  const restingOffset = 184;
  assert.equal(resolveWaflSheetKeyboardRestoreOffset({ settledOffset: restingOffset, userDragged: false }), restingOffset);
  assert.equal(resolveWaflSheetKeyboardRestoreOffset({ settledOffset: restingOffset, userDragged: true }), null);
  assert.equal(resolveWaflSheetKeyboardRestoreOffset(null), null);

  let focus = openCreateRecipeKeyboardFocus();
  const entrance = consumeCreateRecipeEntranceFocus(focus);
  assert.equal(entrance.shouldFocus, true);
  focus = dismissCreateRecipeKeyboard(entrance.state);
  assert.equal(consumeCreateRecipeEntranceFocus(focus).shouldFocus, false);
}

const feedback = [];
let switched = 0;
assert.equal(await flushProductionCategorySwitch({
  dirty: true,
  flush: async () => true,
  onProcessing: (message, helper) => feedback.push({ message, helper: helper ?? null }),
  onSwitch: () => { switched += 1; },
}), true);
assert.deepEqual(feedback, [
  { message: "변경사항을 저장 중입니다.", helper: "잠시만 기다려 주세요." },
  { message: null, helper: null },
]);
assert.equal(switched, 1);

feedback.length = 0;
assert.equal(await flushProductionCategorySwitch({
  dirty: false,
  flush: async () => true,
  onProcessing: (message, helper) => feedback.push({ message, helper: helper ?? null }),
  onSwitch: () => { switched += 1; },
}), true);
assert.deepEqual(feedback, []);
assert.equal(switched, 2);

feedback.length = 0;
assert.equal(await flushProductionCategorySwitch({
  dirty: true,
  flush: async () => false,
  onProcessing: (message, helper) => feedback.push({ message, helper: helper ?? null }),
  onSwitch: () => { switched += 1; },
}), false);
assert.deepEqual(feedback, [
  { message: "변경사항을 저장 중입니다.", helper: "잠시만 기다려 주세요." },
  { message: null, helper: null },
]);
assert.equal(switched, 2);

const inputSheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const createSheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
assert.match(inputSheet, /resolveWaflSheetKeyboardRestoreOffset/u);
assert.doesNotMatch(inputSheet, /keyboardSystemExpandedRef/u);
assert.match(inputSheet, /focusedTargetRef\.current = null/u);
assert.match(inputSheet, /<WaflActionProcessingBlocker[\s\S]{0,220}message=\{processingMessage\}/u);
assert.doesNotMatch(createSheet, /onBlur=|onKeyboardHide=/u, "shared direct-input session owns keyboard hide/confirm");
assert.match(inputSheet, /shouldRestoreDirectInputKeyboard/u);
assert.match(createSheet, /processingMessage=\{props\.pending \? "새 레시피를 생성 중입니다\." : null\}/u);
assert.match(createSheet, /processingHelper=\{props\.pending \? "잠시만 기다려 주세요\." : null\}/u);
assert.match(createSheet, /processingTestID="work-order-creation-blocker"/u);
assert.doesNotMatch(experience, /actionProcessingMessage \?\? \(createPending/u, "direct create blocker must be owned inside the native Modal");
assert.match(experience, /copyPending \|\| reorderPending \? "레시피를 생성 중입니다\."/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha68-create-sheet-keyboard-restore-blocker-parity",
  keyboard: { cycles: 3, nativeHideRestores: true, userDragPreserved: true, focusReacquire: false },
  production: { helperParity: true, dirtyOnly: true, failureSwitch: false },
  create: { modalOwnedBlocker: true, duplicateGlobalBlocker: false, exactCopy: true },
  physicalResultInferred: false,
}));
