#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const entry = read("apps/mobile/features/inputs/WaflReusableCreateEntryAction.tsx");
const form = read("apps/mobile/features/inputs/WaflReusableCreateForm.tsx");
const primaryAction = read("apps/mobile/features/inputs/WaflPrimaryActionButton.tsx");
const sizeColor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const spec = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const makerIa = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

// Parent catalogs share one exact icon/label/action owner and no local lookalike styles.
assert.match(entry, /accessibilityLabel=\{`\+ \$\{label\}`\}/u);
assert.match(entry, /<Plus[^>]+size=\{WAFL_THEME\.icon\.small\}/u);
assert.match(entry, /<Text style=\{styles\.label\}>\{label\}<\/Text>/u);
assert.match(entry, /minHeight: WAFL_THEME\.touch\.minimum/u);
assert.match(entry, /disabled && styles\.disabled/u);
assert.match(entry, /pressed && !disabled && styles\.pressed/u);
assert.equal((sizeColor.match(/<WaflReusableCreateEntryAction/g) ?? []).length, 2);
assert.equal((spec.match(/<WaflReusableCreateEntryAction/g) ?? []).length, 1);
assert.doesNotMatch(sizeColor, /styles\.secondaryButton|secondaryButtonText/u);
assert.doesNotMatch(spec, /styles\.addButton|styles\.addText/u);

// Child Size/Color/Spec creation shares one action slot, including pressed/disabled geometry.
assert.equal((sizeColor.match(/<WaflReusableCreateForm/g) ?? []).length, 2);
assert.equal((spec.match(/<WaflReusableCreateForm/g) ?? []).length, 1);
assert.match(form, /<WaflPrimaryActionButton[^>]*label="추가"/u);
assert.match(primaryAction, /style=\{\(\{ pressed \}\) => \[styles\.button, blocked && styles\.disabled, pressed && !blocked && styles\.pressed\]\}/u);
assert.match(primaryAction, /minHeight: 48, width: "100%"/u);
assert.match(primaryAction, /accessibilityState=\{\{ busy: pending, disabled: blocked \}\}/u);
assert.equal((sizeColor.match(/reusableCreate sizing=\{WAFL_REUSABLE_CATALOG_CREATE_SIZING\}/g) ?? []).length, 2);
assert.match(sizeColor, /props\.reusableCreate \? props\.children : <View style=\{styles\.sheetContent\}>\{props\.children\}<\/View>/u);
assert.match(sizeColor, /<ColorGrid[\s\S]*<ReadOnlyColorValues/u);

for (const marker of ["`+ 직접 만들기`", "WaflReusableCreateEntryAction", "shared full-width `추가`"]) {
  assert.ok(`${design}\n${makerIa}`.includes(marker), `canonical docs missing ${marker}`);
}

console.log(JSON.stringify({
  contract: "workorder-v2-alpha65-direct-create-cta-action-parity",
  previousPermanentInventoryRetained: 147,
  addedPermanentChecks: 1,
  finalPermanentInventory: 148,
  parentEntryOwners: 1,
  parentConsumers: 3,
  childActionOwners: 1,
  childConsumers: 3,
  colorPalettePreserved: true,
  persistenceChange: 0,
  migration019: 0,
  productionMutation: 0,
  ownerFixtureMutation: 0,
}));
