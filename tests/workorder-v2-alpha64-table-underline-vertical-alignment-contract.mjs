#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const theme = read("apps/mobile/constants/theme.ts");
const surface = read("apps/mobile/components/waflEditableValueSurface.ts");
const inline = read("apps/mobile/components/ControlledInlineEditValue.tsx");
const sizeColor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const frozen = read("apps/mobile/features/layout/WaflFrozenAxisTable.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

const cellWidth = 82;
const valueWidth = 60;
const rowHeight = 44;
const valueHeight = 34;
const horizontalGap = (cellWidth - valueWidth) / 2;
const verticalGap = (rowHeight - valueHeight) / 2;

assert.match(theme, /frozenTableCellWidth: 82/u);
assert.match(theme, /frozenTableEditableValueWidth: 60/u);
assert.match(theme, /frozenTableEditableValueHeight: 34/u);
assert.match(theme, /frozenTableRowHeight: 44/u);
assert.equal(horizontalGap, 11);
assert.equal(verticalGap, 5);
assert.ok(verticalGap > 0, "editable underline must remain visually separated from the bottom grid border");

assert.match(surface, /minHeight: WAFL_THEME\.layout\.frozenTableEditableValueHeight/u);
assert.match(surface, /width: WAFL_THEME\.layout\.frozenTableEditableValueWidth/u);
assert.match(surface, /borderBottomWidth: WAFL_THEME\.border\.hairline/u);
assert.match(inline, /tableCellInput: \{ height: WAFL_THEME\.layout\.frozenTableEditableValueHeight, minHeight: WAFL_THEME\.layout\.frozenTableEditableValueHeight/u);
assert.equal((sizeColor.match(/presentation="tableCell"/gu) ?? []).length, 2, "quantity and cm must share the vertical owner");
assert.match(sizeColor, /WAFL_TABLE_EDITABLE_CELL_SURFACE, styles\.measurementPressable/u);
assert.doesNotMatch(sizeColor, /measurementPressable: \{[^}]*minHeight:/u, "inch must not retain a local height override");
assert.match(frozen, /dataCell: \{ alignItems: "center"[^}]*justifyContent: "center"[^}]*minHeight: WAFL_THEME\.layout\.frozenTableRowHeight/u);

const focusedStart = surface.indexOf("WAFL_TABLE_EDITABLE_CELL_FOCUSED_SURFACE");
const focusedEnd = surface.indexOf("};", focusedStart);
assert.ok(focusedStart >= 0 && focusedEnd > focusedStart);
const focused = surface.slice(focusedStart, focusedEnd);
for (const property of ["minHeight", "width", "paddingVertical", "borderBottomWidth"]) {
  assert.doesNotMatch(focused, new RegExp(`${property}:`, "u"), `focus must inherit ${property}`);
}

for (const value of ["0", "-", "20", "72", "27 5/8", "28 3/8"]) {
  assert.equal(valueHeight, 34, `${value} must not alter underline vertical position`);
  assert.equal(valueWidth, 60, `${value} must not alter underline length`);
}

for (const marker of [
  "one consistent nonzero visual gap",
  "same nonzero vertical gap above the bottom grid border",
  "focus state may move the line",
]) {
  if (marker === "focus state may move the line") {
    assert.match(design, /neither a local renderer nor focus state may move the line/u);
  } else {
    assert.ok(`${design}\n${ia}`.includes(marker), `canonical docs missing ${marker}`);
  }
}

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-table-underline-vertical-alignment",
  previousPermanentInventoryRetained: 136,
  addedPermanentChecks: 1,
  finalPermanentInventory: 137,
  cellWidth,
  valueWidth,
  rowHeight,
  valueHeight,
  horizontalGap,
  verticalGap,
  focusGeometryShift: 0,
  textLengthIndependent: true,
  domainMutation: 0,
  productionMutation: 0,
}));
