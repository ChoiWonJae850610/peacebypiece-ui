#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const policy = read("apps/mobile/domain/waflSheetDetentPolicy.ts");
const structure = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const spec = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

assert.match(policy, /WAFL_REUSABLE_CATALOG_CREATE_SIZING[^=]*= "adaptiveExpandable"/u);
assert.equal((structure.match(/sizing=\{WAFL_REUSABLE_CATALOG_CREATE_SIZING\}/gu) ?? []).length, 2);
assert.equal((spec.match(/sizing=\{WAFL_REUSABLE_CATALOG_CREATE_SIZING\}/gu) ?? []).length, 1);
assert.equal((structure.match(/<WaflSheetTextInput/gu) ?? []).length, 2);
assert.equal((spec.match(/<WaflSheetValueField/gu) ?? []).length, 1);
for (const source of [structure, spec]) {
  assert.match(source, /useWaflNestedSheetHandoff/u);
  assert.match(source, /onAfterOpen/u);
  assert.match(source, /\.current\?\.focus\(\)/u);
}
assert.match(design, /Size, Color, and Spec Item reusable-create children share/u);
assert.match(ia, /three reusable-create children also share/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-reusable-create-input-family",
  previousPermanentInventoryRetained: 125,
  addedPermanentChecks: 1,
  finalPermanentInventory: 126,
  sharedSizingOwners: 1,
  draggableCreateConsumers: 3,
  fixedTextEntryCreateConsumers: 0,
}));
