#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflDirectInputKeyboardDetent,
  resolveWaflDirectInputNavigation,
  shouldRestoreDirectInputKeyboard,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import { createWaflInputCommitGuard } from "../apps/mobile/features/inputs/waflInputCommitGuard.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const restoreBase = {
  appActive: true,
  hasEditableTarget: true,
  keyboardMode: "directInput",
  mounted: true,
  restoreAlreadyAttempted: false,
  visible: true,
};
assert.equal(shouldRestoreDirectInputKeyboard({ ...restoreBase, sessionState: "editing" }), true);
for (const sessionState of ["confirming", "cancelling", "closing"]) {
  assert.equal(shouldRestoreDirectInputKeyboard({ ...restoreBase, sessionState }), false, sessionState);
}
assert.equal(shouldRestoreDirectInputKeyboard({ ...restoreBase, appActive: false, sessionState: "editing" }), false);
assert.equal(shouldRestoreDirectInputKeyboard({ ...restoreBase, restoreAlreadyAttempted: true, sessionState: "editing" }), false);
assert.equal(shouldRestoreDirectInputKeyboard({ ...restoreBase, visible: false, sessionState: "editing" }), false);

const geometry = {
  currentOffset: 236,
  expandedHeight: 800,
  headerHeight: 72,
  keyboardInset: 320,
  keyboardMode: "directInput",
  keyboardVisible: true,
  minimumBodyViewport: 180,
  restingOffset: 236,
  safeBottom: 20,
  semanticGap: 16,
};
const shortForm = resolveWaflDirectInputKeyboardDetent({ ...geometry, intrinsicBodyHeight: 112 });
const recipeForm = resolveWaflDirectInputKeyboardDetent({ ...geometry, intrinsicBodyHeight: 230 });
const colorForm = resolveWaflDirectInputKeyboardDetent({ ...geometry, intrinsicBodyHeight: 620 });
const quickDelivery = resolveWaflDirectInputKeyboardDetent({ ...geometry, intrinsicBodyHeight: 920 });
assert.ok(shortForm > 0 && shortForm < geometry.restingOffset);
assert.ok(recipeForm > 0 && recipeForm < shortForm);
assert.ok(colorForm > 0 && colorForm < recipeForm);
assert.equal(quickDelivery, colorForm, "long forms share the bounded viewport and scroll internally");
const smallDevice = resolveWaflDirectInputKeyboardDetent({
  ...geometry,
  expandedHeight: 520,
  headerHeight: 76,
  intrinsicBodyHeight: 700,
  keyboardInset: 310,
  restingOffset: 130,
});
assert.equal(smallDevice, 0, "only insufficient small-device geometry clamps to expanded");

assert.equal(resolveWaflDirectInputNavigation({ action: "done", fieldKeys: ["field"], focusedKey: "field" }).confirm, true);
assert.equal(resolveWaflDirectInputNavigation({ action: "next", fieldKeys: ["a", "b"], focusedKey: "a" }).targetKey, "b");

const guard = createWaflInputCommitGuard();
let commandCount = 0;
let release;
const pending = new Promise((resolve) => { release = resolve; });
const first = guard.submit(async () => { commandCount += 1; await pending; });
const duplicate = await guard.submit(async () => { commandCount += 1; });
assert.equal(duplicate.accepted, false);
release();
await first;
assert.equal(commandCount, 1, "accessory/native/footer convergence remains exactly once");

const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const textInput = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const reusable = read("apps/mobile/features/inputs/WaflReusableCreateForm.tsx");
const create = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
assert.match(sheet, /directInputSessionStateRef/u);
assert.match(sheet, /shouldRestoreDirectInputKeyboard/u);
assert.match(sheet, /directInputConfirmRef\.current/u);
assert.match(sheet, /registeredOwner \?\? onConfirm/u);
assert.match(sheet, /directInputSessionStateRef\.current = "confirming"/u);
assert.match(sheet, /resolveWaflSheetClosePlan/u);
assert.match(sheet, /prepareSheetClose\(plan\.sessionState, plan\.blurAndDismissKeyboard\)/u);
assert.match(sheet, /appStateRef\.current === "active"/u);
assert.match(sheet, /minimumBodyViewport: WAFL_THEME\.sheet\.initialBodyViewportMinHeight/u);
assert.match(sheet, /intrinsicBodyHeight: intrinsicBodyContentHeightRef\.current/u);
assert.match(textInput, /registerFormConfirm/u);
assert.match(reusable, /useWaflSheetDirectInputConfirm\(props\.onCreate, disabled\)/u);
assert.doesNotMatch(create, /onSubmitEditing=|onKeyboardHide=/u);

const directCallsites = [
  "apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx",
  "apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx",
  "apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx",
  "apps/mobile/features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx",
  "apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx",
  "apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx",
  "apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx",
];
for (const file of directCallsites) assert.match(read(file), /keyboardMode=(?:"directInput"|\{props\.reusableCreate \? "directInput" : "default"\})/u, file);

const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
assert.match(quick, /keyboardType="phone-pad"/u);
assert.match(textInput, /if \(directInput !== null && !props\.multiline\)/u, "multiline inputs retain newline semantics");

console.log(JSON.stringify({
  contract: "workorder-v2-alpha68-direct-input-locked-session-confirm-detent",
  sessionStates: 4,
  restoreAttempts: 1,
  shortFormOffset: shortForm,
  recipeOffset: recipeForm,
  colorOffset: colorForm,
  quickDeliveryOffset: quickDelivery,
  smallDeviceOffset: smallDevice,
  convergedCommandCount: commandCount,
  directInputCallsites: directCallsites.length,
  physicalResultInferred: false,
}));
