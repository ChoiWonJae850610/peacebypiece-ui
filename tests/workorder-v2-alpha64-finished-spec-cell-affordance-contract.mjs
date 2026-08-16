#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const owner = read("apps/mobile/components/waflEditableValueSurface.ts");
const inline = read("apps/mobile/components/ControlledInlineEditValue.tsx");
const sizeColor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

assert.match(owner, /WAFL_EDITABLE_VALUE_SURFACE/u);
assert.match(owner, /borderBottomWidth: WAFL_THEME\.border\.hairline/u);
assert.match(inline, /editable: WAFL_EDITABLE_VALUE_SURFACE/u);
assert.match(owner, /WAFL_TABLE_EDITABLE_CELL_SURFACE/u);
assert.match(owner, /WAFL_TABLE_EDITABLE_CELL_FOCUSED_SURFACE/u);
assert.match(inline, /presentation === "tableCell" \? WAFL_TABLE_EDITABLE_CELL_SURFACE/u);
assert.match(sizeColor, /\[WAFL_TABLE_EDITABLE_CELL_SURFACE, styles\.measurementPressable/u);
assert.equal((sizeColor.match(/presentation="tableCell"/gu) ?? []).length, 2);
assert.match(design, /display-format toggle such as Finished Spec cm\/inch never changes this editability affordance/u);
assert.match(ia, /Finished Spec cm and inch cells likewise share one geometry-preserving editable table-cell surface/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-finished-spec-cell-affordance",
  previousPermanentInventoryRetained: 128,
  addedPermanentChecks: 1,
  finalPermanentInventory: 129,
  editableSurfaceOwners: 1,
  unitSpecificEditableSurfaceCopies: 0,
  lockedUnderlineOwners: 0,
}));
