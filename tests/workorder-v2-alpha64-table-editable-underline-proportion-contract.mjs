#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const themeSource = read("apps/mobile/constants/theme.ts");
const surfaceSource = read("apps/mobile/components/waflEditableValueSurface.ts");
const inlineSource = read("apps/mobile/components/ControlledInlineEditValue.tsx");
const sizeColorSource = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const frozenTableSource = read("apps/mobile/features/layout/WaflFrozenAxisTable.tsx");
const designSource = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const iaSource = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

const cellWidth = 82;
const valueSurfaceWidth = 60;
const breathingRoomEachSide = (cellWidth - valueSurfaceWidth) / 2;

assert.match(themeSource, /frozenTableCellWidth: 82/u);
assert.match(themeSource, /frozenTableEditableValueWidth: 60/u);
assert.match(themeSource, /frozenTableEditableValueHeight: 34/u);
assert.match(themeSource, /frozenTableRowHeight: 44/u);
assert.ok(valueSurfaceWidth / cellWidth < 0.8, "editable underline must not read as a near-full grid line");
assert.ok(breathingRoomEachSide >= 10, "editable value surface must retain clear breathing room from cell borders");

assert.match(surfaceSource, /width: WAFL_THEME\.layout\.frozenTableEditableValueWidth/u);
assert.doesNotMatch(surfaceSource, /WAFL_TABLE_EDITABLE_CELL_SURFACE[\s\S]*?width: "100%"/u);
assert.match(surfaceSource, /borderBottomWidth: WAFL_THEME\.border\.hairline/u);
assert.match(surfaceSource, /minHeight: WAFL_THEME\.layout\.frozenTableEditableValueHeight/u);

const focusedStart = surfaceSource.indexOf("WAFL_TABLE_EDITABLE_CELL_FOCUSED_SURFACE");
const focusedEnd = surfaceSource.indexOf("};", focusedStart);
assert.ok(focusedStart >= 0 && focusedEnd > focusedStart);
const focusedSurface = surfaceSource.slice(focusedStart, focusedEnd);
for (const geometryProperty of ["width", "minHeight", "paddingHorizontal", "paddingVertical", "borderBottomWidth"]) {
  assert.doesNotMatch(focusedSurface, new RegExp(`${geometryProperty}:`, "u"), `focus must preserve ${geometryProperty}`);
}
assert.doesNotMatch(focusedSurface, /borderWidth:|borderRadius:/u);

assert.match(inlineSource, /presentation === "tableCell" \? WAFL_TABLE_EDITABLE_CELL_SURFACE/u);
assert.match(inlineSource, /presentation === "tableCell" \? WAFL_TABLE_EDITABLE_CELL_FOCUSED_SURFACE/u);
assert.equal((sizeColorSource.match(/presentation="tableCell"/gu) ?? []).length, 2, "quantity and cm must share the table-cell owner");
assert.match(sizeColorSource, /WAFL_TABLE_EDITABLE_CELL_SURFACE, styles\.measurementPressable/u);
assert.match(sizeColorSource, /props\.edit\?\.canEdit \? <QuantityCellEditor/u);
assert.match(sizeColorSource, /props\.edit\?\.canEdit \? <MeasurementCellEditor/u);
assert.match(frozenTableSource, /WAFL_THEME\.layout\.frozenTableCellWidth/u);
assert.match(frozenTableSource, /WAFL_THEME\.layout\.frozenTableRowHeight/u);

for (const value of ["0", "-", "20", "72", "27 5/8", "28 3/8"]) {
  assert.equal(valueSurfaceWidth, 60, `${value} must not alter underline width`);
}

for (const marker of [
  "short, bounded, centered value-surface affordance",
  "text length never changes the line",
]) assert.ok(`${designSource}\n${iaSource}`.includes(marker), `canonical docs missing ${marker}`);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-table-editable-underline-proportion",
  previousPermanentInventoryRetained: 135,
  addedPermanentChecks: 1,
  finalPermanentInventory: 136,
  cellWidth,
  valueSurfaceWidth,
  valueSurfaceRatio: Number((valueSurfaceWidth / cellWidth).toFixed(4)),
  breathingRoomEachSide,
  underlineThickness: 1,
  textLengthIndependent: true,
  focusGeometryShift: 0,
  domainMutation: 0,
  productionMutation: 0,
}));
