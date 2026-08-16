#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  resolveWaflSheetDragOffset,
  resolveWaflContentFitHeight,
  resolveWaflSheetOpeningOffset,
  resolveWaflSheetRelease,
} from "../apps/mobile/domain/waflSheetDetentPolicy.ts";
import {
  WORK_ORDER_CATEGORY_MAJORS,
  WORK_ORDER_MAJOR_CATEGORY_CODE_BY_LABEL,
  decodeWorkOrderMajorCategoryCode,
} from "../apps/mobile/domain/workOrderCategoryPolicy.ts";
import { WAFL_SYSTEM_SPEC_ITEM_CATALOG } from "../lib/domain/work-orders/catalog/systemSpecItemCatalog.ts";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const theme = read("apps/mobile/constants/theme.ts");
const editor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const selector = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const selectionPolicy = read("apps/mobile/domain/specItemSelectionPolicy.ts");
const measurementRepository = read("lib/domain/work-orders/measurement/measurementCommandRepository.ts");
const optionRepository = read("lib/domain/work-orders/catalog/structureOptionRepository.ts");
const migration = read("db/v2/migrations/018_v2_company_spec_item_category_scope.sql");
const mobileMetroConfig = read("apps/mobile/metro.config.js");

assert.match(theme, /dragZoneMinHeight:\s*44/u);
assert.match(theme, /entranceDurationMs:\s*2[2-9]0/u);
assert.match(theme, /exitDurationMs:\s*2\d\d/u);
assert.match(sheet, /testID=\{draggable \? "wafl-sheet-header-drag-zone" : "wafl-sheet-fixed-header"\}/u);
assert.doesNotMatch(sheet, /PanResponder|panResponder\.panHandlers/u);
assert.doesNotMatch(sheet, /pointerEvents=/u);
for (const token of [
  "onStartShouldSetResponderCapture",
  "onMoveShouldSetResponderCapture",
  "onResponderGrant",
  "onResponderMove",
  "onResponderRelease",
  "resolveWaflSheetDragOffset({ dragStartOffset",
  "translateY.setValue(offset)",
  "layoutOffset.setValue(offset)",
  "resolveWaflSheetOpeningOffset(expandedHeight)",
  "requestAnimationFrame",
  "toValue: mediumOffset",
  "animateDown",
  "setRendered(false)",
  'visible={rendered}',
  'animationType="none"',
]) assert.ok(sheet.includes(token), `mounted sheet path missing ${token}`);
assert.ok(sheet.indexOf("animateDown(() =>") < sheet.indexOf("setRendered(false)"), "close must animate down before unmount");
assert.ok(sheet.indexOf("onStartShouldSetResponderCapture") < sheet.indexOf("bodyScrollable ?"), "header responder must not depend on bodyScrollable");
assert.match(sheet, /\{draggable \? <View style=\{styles\.handle\} \/> : null\}/u, "fixed sheets must not expose a fake handle");

const expandedHeight = 700;
const mediumOffset = 190;
assert.equal(resolveWaflSheetOpeningOffset(expandedHeight), 700);
assert.equal(resolveWaflSheetDragOffset({ dragStartOffset: mediumOffset, dy: -37, expandedHeight }), 153);
assert.equal(resolveWaflSheetDragOffset({ dragStartOffset: 0, dy: 55, expandedHeight }), 55);
assert.deepEqual(resolveWaflContentFitHeight({ windowHeight: 800, headerHeight: 74, bodyHeight: 118, footerHeight: 56, safeBottom: 20, minHeight: 220, maxRatio: 0.72, verticalChrome: 16 }), { bodyViewportHeight: 118, height: 284, overflow: false });
assert.deepEqual(resolveWaflContentFitHeight({ windowHeight: 800, headerHeight: 74, bodyHeight: 700, footerHeight: 56, safeBottom: 20, minHeight: 220, maxRatio: 0.72, verticalChrome: 16 }), { bodyViewportHeight: 410, height: 576, overflow: true });
assert.deepEqual(resolveWaflSheetRelease({ dragStartOffset: mediumOffset, dy: -120, vy: -0.2, maxSettleOffset: mediumOffset, dismissDistance: 96, dismissVelocity: 1.15, flickVelocity: 0.45, velocityProjectionMs: 72, maxVelocityProjection: 88 }), { kind: "settle", offset: mediumOffset - 120 });
assert.equal(resolveWaflSheetRelease({ dragStartOffset: mediumOffset, dy: 105, vy: 0.2, maxSettleOffset: mediumOffset, dismissDistance: 96, dismissVelocity: 1.15, flickVelocity: 0.45, velocityProjectionMs: 72, maxVelocityProjection: 88 }).kind, "dismiss");

assert.deepEqual(WORK_ORDER_CATEGORY_MAJORS, ["상의", "하의", "아우터", "원피스", "셋업", "기타"]);
assert.equal(decodeWorkOrderMajorCategoryCode("wafl-c1|U|T"), "T");
assert.equal(decodeWorkOrderMajorCategoryCode("apparel.bottom"), "B");
assert.equal(decodeWorkOrderMajorCategoryCode(null), null);
for (const label of WORK_ORDER_CATEGORY_MAJORS) {
  const code = WORK_ORDER_MAJOR_CATEGORY_CODE_BY_LABEL[label];
  const items = WAFL_SYSTEM_SPEC_ITEM_CATALOG[code];
  assert.ok(items.length >= 10, `${label} must have a practical WAFL-provided set`);
  assert.equal(new Set(items.map((item) => item.key)).size, items.length);
  assert.equal(new Set(items.map((item) => item.displayName)).size, items.length);
  assert.ok(items.every((item) => item.categoryCode === code && item.key.startsWith(`${code}:`)));
}
const topCodes = new Set(WAFL_SYSTEM_SPEC_ITEM_CATALOG.T.map((item) => item.code));
const bottomCodes = new Set(WAFL_SYSTEM_SPEC_ITEM_CATALOG.B.map((item) => item.code));
for (const forbidden of ["front_rise", "back_rise", "thigh_width", "inseam"]) assert.equal(topCodes.has(forbidden), false, `tops polluted by ${forbidden}`);
for (const forbidden of ["shoulder_width", "armhole_depth", "sleeve_length", "neck_width"]) assert.equal(bottomCodes.has(forbidden), false, `bottoms polluted by ${forbidden}`);

assert.match(editor, /onEditSpecItems=\{\(\) => \{ edit\.onBegin\(\); setChooser\("spec_item"\)/u);
assert.match(editor, /edit\.canEdit && chooser === "spec_item"/u);
assert.match(editor, /recommendationAvailable=\{categoryCode !== null\}/u);
assert.match(selector, /"WAFL 제공"/u);
assert.match(selector, /"우리 회사"/u);
assert.match(selector, /직접 만들기/u);
assert.doesNotMatch(selector, /항목 추가|새 스펙 항목 추가/u);
assert.match(selectionPolicy, /sourceKind: "system"/u);
assert.match(selectionPolicy, /sourceKind: "company"/u);
assert.match(selectionPolicy, /"system" \| "company" \| "current"/u);
assert.match(measurementRepository, /systemSpecItemKey/u);
assert.match(measurementRepository, /wafl_system_spec_item:/u);
assert.match(measurementRepository, /category_code IS NULL OR category_code=\$3/u);
assert.match(optionRepository, /category_code = \$2/u);
assert.match(optionRepository, /category_code IS NOT DISTINCT FROM \$4/u);
assert.match(migration, /ADD COLUMN category_code text/u);
assert.match(migration, /category_code IN \('T', 'B', 'O', 'D', 'S', 'X'\)/u);
assert.doesNotMatch(migration, /UPDATE\s+company_work_order_structure_options|DELETE\s+FROM|TRUNCATE/iu);
assert.match(mobileMetroConfig, /repositoryRoot/u, "Metro must name the shared repository domain-owner root");
assert.match(mobileMetroConfig, /watchFolders/u, "Metro must bundle the same pure domain owner used by Node and Next");

const consumers = [
  "apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx",
  "apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx",
  "apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx",
  "apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx",
  "apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx",
  "apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx",
  "apps/mobile/features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx",
  "apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx",
  "apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx",
  "apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx",
];
for (const consumer of consumers) assert.match(read(consumer), /WaflInputSheet/u, `${consumer} must use the canonical draggable owner`);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-real-sheet-category-spec",
  previousPermanentInventoryRetained: 115,
  addedPermanentChecks: 1,
  sheetEvidence: "mounted-owner-wiring-plus-continuous-translation-policy",
  physicalGestureInferred: false,
  categories: Object.fromEntries(Object.entries(WAFL_SYSTEM_SPEC_ITEM_CATALOG).map(([code, items]) => [code, items.length])),
}));
