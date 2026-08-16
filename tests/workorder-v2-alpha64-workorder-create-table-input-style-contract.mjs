#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  WAFL_TEXT_ENTRY_FORM_SIZING,
  resolveWaflSheetEntranceReadiness,
  resolveWaflSheetMeasurementIdentity,
} from "../apps/mobile/domain/waflSheetDetentPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const createSheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const inputSheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const inline = read("apps/mobile/components/ControlledInlineEditValue.tsx");
const surface = read("apps/mobile/components/waflEditableValueSurface.ts");
const sizeColor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const theme = read("apps/mobile/constants/theme.ts");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

assert.equal(WAFL_TEXT_ENTRY_FORM_SIZING, "adaptiveExpandable");
assert.match(createSheet, /sizing=\{WAFL_TEXT_ENTRY_FORM_SIZING\}/u);
assert.match(createSheet, /inputRef=\{productNameInputRef\}/u);
assert.match(createSheet, /onAfterOpen=\{\(\) => productNameInputRef\.current\?\.focus\(\)\}/u);
assert.doesNotMatch(createSheet, /\bautoFocus\b/u);
assert.doesNotMatch(createSheet, /sizing="contentFit"/u);
assert.match(createSheet, /onCancel=\{props\.onCancel\}/u);
assert.match(createSheet, /onConfirm=\{props\.onConfirm\}/u);

const generations = Array.from({ length: 3 }, (_, index) => resolveWaflSheetMeasurementIdentity({
  hasActions: true,
  openSessionGeneration: index + 1,
  sizing: WAFL_TEXT_ENTRY_FORM_SIZING,
  title: "새 작업지시서",
}));
assert.equal(new Set(generations).size, 3);
for (const generation of generations) {
  assert.equal(resolveWaflSheetEntranceReadiness({
    currentGenerationBodyMeasured: true,
    deterministicBodyHeight: 0,
    footerMeasured: true,
    hasActions: true,
    headerMeasured: true,
    sizing: WAFL_TEXT_ENTRY_FORM_SIZING,
  }).ready, true, `presentation ${generation} must wait for its measured compact target`);
}
assert.match(inputSheet, /finished && generation === openGenerationRef\.current/u);
assert.match(inputSheet, /setOpenReady\(true\);\s*onAfterOpen\?\.\(\);/u);

for (const marker of [
  "WAFL_TABLE_EDITABLE_CELL_SURFACE",
  "WAFL_TABLE_EDITABLE_CELL_FOCUSED_SURFACE",
  'alignItems: "stretch"',
  "borderBottomWidth: WAFL_THEME.border.hairline",
  "minHeight: WAFL_THEME.layout.frozenTableEditableValueHeight",
  'paddingHorizontal: WAFL_THEME.spacing.xs',
  "width: WAFL_THEME.layout.frozenTableEditableValueWidth",
]) assert.ok(surface.includes(marker), `shared inch-baseline table surface missing ${marker}`);
assert.match(theme, /frozenTableCellWidth: 82/u);
assert.match(theme, /frozenTableEditableValueWidth: 60/u);
assert.match(theme, /frozenTableEditableValueHeight: 34/u);
assert.match(theme, /tightGap: 4/u);
assert.match(theme, /frozenTableRowHeight: 44/u);
assert.match(inline, /presentation === "tableCell" \? WAFL_TABLE_EDITABLE_CELL_SURFACE/u);
assert.match(inline, /presentation === "tableCell" \? WAFL_TABLE_EDITABLE_CELL_FOCUSED_SURFACE/u);
assert.equal((sizeColor.match(/presentation="tableCell"/gu) ?? []).length, 2);
assert.match(sizeColor, /style=\{\(\{ pressed \}\) => \[WAFL_TABLE_EDITABLE_CELL_SURFACE, styles\.measurementPressable/u);
const focusedStart = surface.indexOf("WAFL_TABLE_EDITABLE_CELL_FOCUSED_SURFACE");
const focusedEnd = surface.indexOf("};", focusedStart);
assert.ok(focusedStart >= 0 && focusedEnd > focusedStart);
for (const geometryProperty of ["minHeight", "paddingHorizontal", "paddingVertical", "width", "borderBottomWidth"]) {
  assert.doesNotMatch(surface.slice(focusedStart, focusedEnd), new RegExp(`${geometryProperty}:`, "u"), `focus must inherit unchanged ${geometryProperty}`);
}
assert.doesNotMatch(surface.slice(focusedStart, focusedEnd), /borderWidth:/u);

for (const marker of [
  "Every live WAFL TextInput form sheet",
  "raw mount-time `autoFocus` must not race",
  "earlier owner-approved Finished Spec inch cell is the visual baseline",
  "earlier owner-approved Finished Spec inch underline is the canonical frozen-table numeric baseline",
]) assert.ok(`${design}\n${ia}`.includes(marker), `canonical docs missing ${marker}`);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-workorder-create-table-input-style",
  previousPermanentInventoryRetained: 134,
  addedPermanentChecks: 1,
  finalPermanentInventory: 135,
  createSizing: WAFL_TEXT_ENTRY_FORM_SIZING,
  presentationReadyFocus: true,
  rawMountAutoFocus: false,
  repeatedOpenCycles: 3,
  inchBaseline: { cellWidth: 82, valueSurfaceWidth: 60, rowHeight: 44, underlineWidth: 1 },
  tableFocusGeometryShift: 0,
  productionMutation: 0,
}));
