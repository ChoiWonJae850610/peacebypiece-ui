#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflDirectInputAccessoryMode,
  resolveWaflDirectInputMinimalAccessoryAction,
  resolveWaflDirectInputNavigation,
  resolveWaflDirectInputSubmitBehavior,
  resolveWaflDirectInputTapPersistence,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");

assert.deepEqual(resolveWaflDirectInputTapPersistence("directInput"), {
  keyboardDismissMode: "none",
  keyboardShouldPersistTaps: "always",
});
assert.deepEqual(resolveWaflDirectInputTapPersistence("default"), {
  keyboardDismissMode: null,
  keyboardShouldPersistTaps: "handled",
});

for (const keyboardType of [undefined, "default", "email-address", "url", "web-search", "visible-password"]) {
  assert.equal(
    resolveWaflDirectInputAccessoryMode({ keyboardType, multiline: false }),
    "none",
    `normal native-return keyboard must not own an accessory: ${keyboardType}`,
  );
}
for (const keyboardType of ["phone-pad", "name-phone-pad", "number-pad", "decimal-pad", "numeric", "ascii-capable-number-pad"]) {
  assert.equal(
    resolveWaflDirectInputAccessoryMode({ keyboardType, multiline: false }),
    "singleAction",
    `native-no-return keyboard needs the minimal accessory: ${keyboardType}`,
  );
}
assert.equal(resolveWaflDirectInputAccessoryMode({ keyboardType: "phone-pad", multiline: true }), "none", "multiline newline semantics remain native");

const fields = ["name", "phone", "memo"];
assert.equal(resolveWaflDirectInputMinimalAccessoryAction({ fieldKeys: fields, focusedKey: "phone" }), "next");
assert.equal(resolveWaflDirectInputMinimalAccessoryAction({ fieldKeys: fields, focusedKey: "memo" }), "done");
assert.equal(resolveWaflDirectInputMinimalAccessoryAction({ fieldKeys: fields, focusedKey: "missing" }), null);
assert.equal(resolveWaflDirectInputNavigation({ action: "next", fieldKeys: fields, focusedKey: "phone" }).targetKey, "memo");
assert.equal(resolveWaflDirectInputNavigation({ action: "done", fieldKeys: fields, focusedKey: "memo" }).confirm, true);
assert.equal(resolveWaflDirectInputSubmitBehavior({ directInput: true, multiline: false }), "submit", "202 submit-before-blur remains canonical");

const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const textInput = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const accessory = read("apps/mobile/features/inputs/WaflDirectInputKeyboardAccessory.tsx");
const create = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const sizeColor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const spec = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx");
const companyTemplate = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");

assert.equal((sheet.match(/keyboardShouldPersistTaps=\{directInputTapPersistence\.keyboardShouldPersistTaps\}/gu) ?? []).length, 2);
assert.equal((sheet.match(/keyboardDismissMode=\{directInputTapPersistence\.keyboardDismissMode \?\? undefined\}/gu) ?? []).length, 2);
assert.match(sheet, /resolveWaflDirectInputTapPersistence\(keyboardMode\)/u);
assert.match(sheet, /directInputMinimalAccessoryAction !== null/u);
assert.match(sheet, /onPress=\{\(\) => runDirectInputNavigation\(directInputMinimalAccessoryAction\)\}/u);

assert.match(textInput, /resolveWaflDirectInputAccessoryMode/u);
assert.match(textInput, /directInput !== null && accessoryMode === "singleAction"/u);
assert.doesNotMatch(textInput, /props\.inputAccessoryViewID \?\? directInput\?\.accessoryNativeID/u);
assert.match(accessory, /InputAccessoryView/u);
assert.match(accessory, /Platform\.OS !== "ios"/u);
assert.doesNotMatch(accessory, /이전 입력|previousDisabled|onPrevious/u);
assert.match(accessory, /done \? "입력 완료" : "다음 입력"/u);
assert.match(accessory, /done \? "완료" : "다음"/u);

for (const [name, source] of [
  ["New Recipe", create],
  ["Size/Color", sizeColor],
  ["Spec/POM", spec],
  ["Overview", overview],
  ["Company Template", companyTemplate],
]) {
  assert.doesNotMatch(source, /inputAccessoryViewID/u, `${name} must not wire a normal-input accessory locally`);
}
assert.match(quick, /keyboardType="phone-pad"/u);
assert.doesNotMatch(quick, /inputAccessoryViewID/u, "Quick Delivery uses keyboard capability metadata, not a screen-name override");

assert.doesNotMatch(create, /Keyboard\.dismiss|\.blur\(/u, "New Recipe internal helper/control taps do not dismiss focus");
assert.doesNotMatch(sizeColor, /Keyboard\.dismiss|\.blur\(/u, "Size/Color internal taps do not dismiss focus");
assert.doesNotMatch(spec, /Keyboard\.dismiss|\.blur\(/u, "Spec/POM internal taps do not dismiss focus");

console.log(JSON.stringify({
  contract: "workorder-v2-alpha68-direct-input-tap-persist-minimal-accessory",
  directInputTapPersistence: "always/none",
  nonDirectInputTapPersistence: "handled/inherited",
  normalAccessoryRender: 0,
  phonePadMinimalAccessoryRender: 1,
  minimalAccessoryActions: ["next", "done"],
  previousActionRender: 0,
  nativeSubmitBeforeBlur: true,
  physicalResultInferred: false,
}));
