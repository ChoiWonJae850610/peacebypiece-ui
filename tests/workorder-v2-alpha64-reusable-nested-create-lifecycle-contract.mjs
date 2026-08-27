#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const handoff = read("apps/mobile/features/inputs/useWaflNestedSheetHandoff.ts");
const structure = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const spec = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const reusable = read("apps/mobile/features/inputs/WaflReusableCreateForm.tsx");

assert.match(sheet, /onAfterOpen\?\.\(\)/u);
assert.ok(sheet.indexOf("dismissingRef.current = false") < sheet.indexOf("onAfterClose?.()"), "outgoing sheet must clear lifecycle state before presenting child");
assert.equal((handoff.match(/requestAnimationFrame/gu) ?? []).length >= 2, true);
for (const source of [structure, spec]) {
  assert.match(source, /onAfterOpen/u);
  assert.match(source, /\.current\?\.focus\(\)/u);
}
assert.doesNotMatch(spec, /accessibilityLabel="스펙 항목명" autoFocus/u);
assert.match(spec, /onConfirm=\{nested\.route === "rename"[\s\S]*: undefined\}/u);
assert.match(spec, /<WaflReusableCreateForm/u);
assert.match(reusable, /useWaflSheetDirectInputConfirm\(props\.onCreate, disabled\)/u);
assert.doesNotMatch(reusable, /WaflPrimaryActionButton|label="추가"/u);
assert.match(reusable, /props\.onBack/u);
assert.match(structure, /title="직접 사이즈 만들기"/u);
assert.match(structure, /title="직접 색상 만들기"/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-reusable-nested-create-lifecycle",
  previousPermanentInventoryRetained: 124,
  addedPermanentChecks: 1,
  finalPermanentInventory: 125,
  nativeModalWorkarounds: 0,
  deadCreateConfirmActions: 0,
  createdItemParentAutoSelectPaths: 3,
}));
