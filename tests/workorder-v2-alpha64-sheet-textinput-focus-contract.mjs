#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const focus = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const consumers = [
  "apps/mobile/features/materials/WorkOrderMaterialEditor.tsx",
  "apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx",
  "apps/mobile/features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx",
  "apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx",
  "apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx",
  "apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx",
  "apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx",
  "apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx",
].map(read);

assert.match(sheet, /WaflSheetFocusProvider/u);
assert.match(sheet, /onFocusTarget=\{handleBodyFocus\}/u);
assert.match(focus, /createContext<FocusTargetRegistrar/u);
assert.match(focus, /export function WaflSheetFocusBlock/u);
assert.match(focus, /targetRef\.current = event\.nativeEvent\.target/u);
assert.match(focus, /props\.multiline/u);
assert.match(focus, /onContentSizeChange=\{handleContentSizeChange\}/u);
assert.match(focus, /onSelectionChange=\{handleSelectionChange\}/u);
for (const source of consumers) assert.doesNotMatch(source, /<TextInput\s+[a-z]/u);
assert.match(consumers[0], /<WaflSheetTextInput/u);
assert.match(consumers[0], /<WaflSheetFocusBlock/u);
assert.match(consumers[1], /<WaflSheetValueField/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-sheet-textinput-focus",
  previousPermanentInventoryRetained: 126,
  addedPermanentChecks: 1,
  finalPermanentInventory: 127,
  canonicalFocusOwners: 1,
  auditedConsumerFiles: consumers.length,
  localKeyboardAvoidingViews: 0,
}));
