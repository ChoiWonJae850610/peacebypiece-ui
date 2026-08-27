#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflDirectInputAccessoryNativeID,
  resolveWaflDirectInputAccessoryMode,
  resolveWaflDirectInputMinimalAccessoryAction,
  resolveWaflDirectInputAccessoryState,
  resolveWaflDirectInputKeyboardDetent,
  resolveWaflDirectInputNavigation,
  resolveWaflDirectInputReturnKey,
  resolveWaflDirectInputSubmitBehavior,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import { resolveWaflSheetKeyboardRestoreOffset } from "../apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");

const detentInput = { expandedHeight: 800, headerHeight: 72, intrinsicBodyHeight: 128, keyboardInset: 320, minimumBodyViewport: 180, restingOffset: 236, safeBottom: 20, semanticGap: 16 };
const directDetent = resolveWaflDirectInputKeyboardDetent({ ...detentInput, keyboardMode: "directInput", keyboardVisible: true, currentOffset: 236 });
assert.ok(directDetent > 0 && directDetent < 236, "direct-input now owns a bounded intermediate detent");
assert.equal(resolveWaflDirectInputKeyboardDetent({ ...detentInput, keyboardMode: "default", keyboardVisible: true, currentOffset: 236 }), 236);

const idA = resolveWaflDirectInputAccessoryNativeID({ instanceId: 3, sessionGeneration: 1 });
const idB = resolveWaflDirectInputAccessoryNativeID({ instanceId: 3, sessionGeneration: 2 });
const idC = resolveWaflDirectInputAccessoryNativeID({ instanceId: 4, sessionGeneration: 1 });
assert.equal(new Set([idA, idB, idC]).size, 3);

const single = resolveWaflDirectInputAccessoryState({ fieldKeys: ["recipe"], focusedKey: "recipe" });
assert.equal(single.previousDisabled, true);
assert.equal(single.nextDisabled, true);
assert.equal(single.doneDisabled, false);
assert.equal(resolveWaflDirectInputReturnKey({ fieldIndex: 0, fieldCount: 1, multiline: false }), "done");

const fields = ["driver", "phone", "memo"];
assert.equal(resolveWaflDirectInputReturnKey({ fieldIndex: 0, fieldCount: fields.length, multiline: false }), "next");
assert.equal(resolveWaflDirectInputReturnKey({ fieldIndex: 1, fieldCount: fields.length, multiline: false }), "next");
assert.equal(resolveWaflDirectInputReturnKey({ fieldIndex: 2, fieldCount: fields.length, multiline: false }), "done");
assert.equal(resolveWaflDirectInputReturnKey({ fieldIndex: 1, fieldCount: fields.length, multiline: true }), null);
assert.equal(resolveWaflDirectInputNavigation({ action: "previous", fieldKeys: fields, focusedKey: "phone" }).targetKey, "driver");
assert.equal(resolveWaflDirectInputNavigation({ action: "next", fieldKeys: fields, focusedKey: "phone" }).targetKey, "memo");

const done = resolveWaflDirectInputNavigation({ action: "done", fieldKeys: ["recipe"], focusedKey: "recipe" });
assert.equal(done.confirm, true);
assert.equal(done.targetKey, null);

for (let cycle = 0; cycle < 3; cycle += 1) {
  assert.equal(resolveWaflSheetKeyboardRestoreOffset({ settledOffset: 236, userDragged: false }), 236);
}
assert.equal(resolveWaflSheetKeyboardRestoreOffset({ settledOffset: 236, userDragged: true }), null);

const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const textInput = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const accessory = read("apps/mobile/features/inputs/WaflDirectInputKeyboardAccessory.tsx");
const reusable = read("apps/mobile/features/inputs/WaflReusableCreateForm.tsx");
assert.match(accessory, /InputAccessoryView/u);
assert.equal((accessory.match(/<InputAccessoryView/gu) ?? []).length, 1);
assert.match(accessory, /Platform\.OS !== "ios"/u);
assert.doesNotMatch(accessory, /이전 입력/u, "the compatibility owner is now a minimal single-action accessory");
assert.match(accessory, /done \? "입력 완료" : "다음 입력"/u);
assert.equal(resolveWaflDirectInputAccessoryMode({ keyboardType: "default", multiline: false }), "none");
assert.equal(resolveWaflDirectInputAccessoryMode({ keyboardType: "phone-pad", multiline: false }), "singleAction");
assert.equal(resolveWaflDirectInputMinimalAccessoryAction({ fieldKeys: ["phone", "memo"], focusedKey: "phone" }), "next");
assert.equal(resolveWaflDirectInputMinimalAccessoryAction({ fieldKeys: ["phone"], focusedKey: "phone" }), "done");
assert.match(textInput, /accessoryMode === "singleAction"/u);
assert.match(textInput, /registerEditableTarget/u);
assert.match(textInput, /props\.editable !== false/u);
assert.equal(resolveWaflDirectInputSubmitBehavior({ directInput: true, multiline: false }), "submit");
assert.equal(resolveWaflDirectInputSubmitBehavior({ directInput: true, multiline: true }), null);
assert.match(textInput, /resolveWaflDirectInputSubmitBehavior/u);
assert.match(sheet, /resolveWaflDirectInputKeyboardDetent/u);
assert.match(sheet, /completion: \(\) => revealFocusedTarget\(\)/u);
assert.match(sheet, /directInputConfirmRef\.current\(\)/u);
assert.match(sheet, /Keyboard\.dismiss\(\)/u);
assert.doesNotMatch(reusable, /InputAccessoryView|inputAccessoryViewID|keyboardMode/u, "reusable form must inherit the parent owner");

const directModeCallsites = [
  ["apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx", 1],
  ["apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx", 1],
  ["apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx", 1],
  ["apps/mobile/features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx", 2],
  ["apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx", 1],
  ["apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx", 1],
  ["apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx", 1],
];
for (const [file, expected] of directModeCallsites) {
  assert.equal((read(file).match(/keyboardMode=(?:"directInput"|\{props\.reusableCreate \? "directInput" : "default"\})/gu) ?? []).length, expected, file);
}
const createSheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
assert.doesNotMatch(createSheet, /onSubmitEditing=/u);
assert.doesNotMatch(createSheet, /returnKeyType="done"/u, "direct-input parent owns return-key selection");
assert.doesNotMatch(textInput, /directReturnKeyType === "next" \? "submit" : "blurAndSubmit"/u, "direct-input never blurs before final validation");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
assert.match(quick, /keyboardType="phone-pad"/u);
assert.match(quick, /keyboardMode="directInput"/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha68-direct-input-keyboard-system",
  accessoryOwnerCount: 1,
  accessoryNativeIdsUnique: 3,
  directInputInventory: 7,
  semanticCallsites: 8,
  deterministicDetent: directDetent,
  finalDoneConvergesToConfirm: true,
  keyboardCycles: 3,
  phonePadAccessory: true,
  normalInputAccessory: false,
  androidAccessoryRender: 0,
  physicalResultInferred: false,
}));
