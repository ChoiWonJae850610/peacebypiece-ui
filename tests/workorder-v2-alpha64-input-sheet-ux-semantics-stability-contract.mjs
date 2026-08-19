#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { resolveWaflAdaptiveInitialHeight, WAFL_REUSABLE_CATALOG_CREATE_SIZING } from "../apps/mobile/domain/waflSheetDetentPolicy.ts";
import {
  exceedsMaterialQuantityPrecision,
  MATERIAL_QUANTITY_SCALE,
  materialQuantityPrecisionMessage,
  parseMaterialQuantityScaled,
} from "../lib/domain/work-orders/materialQuantityPrecision.mjs";

const read = (file) => fs.readFileSync(file, "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const nested = read("apps/mobile/features/inputs/useWaflNestedSheetHandoff.ts");
const structure = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const spec = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const reusableCreate = read("apps/mobile/features/inputs/WaflReusableCreateForm.tsx");
const saved = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const mobileValidation = read("apps/mobile/domain/workOrderValidation.ts");
const serverValidation = read("lib/domain/work-orders/command/materialValidation.ts");
const readiness = read("lib/domain/work-orders/command/materialOrderReadiness.ts");
const migration003 = read("db/v2/migrations/003_v2_revision_content.sql");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const quickPresentation = read("apps/mobile/features/work-orders/documents/quickDeliveryLocationPresentation.ts");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

assert.match(sheet, /const hasActions = Boolean\(onConfirm\)/u);
assert.match(sheet, /\{hasActions \? <View[\s\S]*testID="wafl-sheet-actions"[\s\S]*<Check/u);
assert.match(sheet, /scrollResponderScrollNativeHandleToKeyboard/u);
assert.match(sheet, /effectiveFocusRevealContext/u);
assert.match(sheet, /keyboardAutoExpand/u);
assert.match(sheet, /const adaptiveSizing = sizing === "adaptiveExpandable" \|\| sizing === "reelAdaptive"[\s\S]*!adaptiveSizing[\s\S]*currentOffset <= mediumOffset/u);
assert.match(sheet, /settledOffsetRef/u);

assert.match(nested, /pendingRouteRef/u);
assert.match(nested, /setVisible\(false\)/u);
assert.match(nested, /requestAnimationFrame[\s\S]*setVisible\(true\)/u);

for (const copy of ["직접 사이즈 만들기", "기본 사이즈", "직접 색상 만들기", "기본 색상"]) assert.ok(structure.includes(copy));
assert.equal(WAFL_REUSABLE_CATALOG_CREATE_SIZING, "adaptiveExpandable");
assert.equal((structure.match(/sizing=\{WAFL_REUSABLE_CATALOG_CREATE_SIZING\}/gu) ?? []).length, 2);
assert.match(structure, /setSelectedKeys[\s\S]*structureSelectionKey\(created\.displayName\)/u);
assert.match(structure, /return created\.item \?\? null/u);

for (const copy of ["직접 스펙 만들기", "기본 스펙"]) assert.ok(spec.includes(copy));
assert.ok(reusableCreate.includes("추가"));
assert.match(spec, /onConfirm=\{nested\.route === "rename"[\s\S]*: undefined\}/u);
assert.match(spec, /`catalog:\$\{created\.id\}`/u);
assert.match(spec, /nested\.transition\("add"\)/u);

assert.equal((saved.match(/sizing="adaptiveExpandable"/gu) ?? []).length, 2);
const shortInitial = resolveWaflAdaptiveInitialHeight({ windowHeight: 844, headerHeight: 76, bodyHeight: 80, footerHeight: 56, safeBottom: 34, minHeight: 220, maxRatio: 0.68, verticalChrome: 16 });
const longInitial = resolveWaflAdaptiveInitialHeight({ windowHeight: 844, headerHeight: 76, bodyHeight: 1200, footerHeight: 56, safeBottom: 34, minHeight: 220, maxRatio: 0.68, verticalChrome: 16 });
assert.equal(shortInitial, 262);
assert.equal(longInitial, 574);

assert.match(migration003, /required_quantity numeric\(14, 3\)/u);
assert.match(migration003, /allowance_quantity numeric\(14, 3\)/u);
assert.equal(MATERIAL_QUANTITY_SCALE, 3);
assert.equal(materialQuantityPrecisionMessage(), "소수점 셋째 자리까지만 입력할 수 있어요.");
assert.equal(exceedsMaterialQuantityPrecision("1.2345"), true);
assert.equal(exceedsMaterialQuantityPrecision("1.234"), false);
assert.equal(parseMaterialQuantityScaled("1.2345"), null);
assert.equal(parseMaterialQuantityScaled("1.234"), 1234n);
for (const source of [mobileValidation, serverValidation, readiness, reel]) assert.match(source, /materialQuantityPrecision|MATERIAL_QUANTITY|parseMaterialQuantityScaled/u);
assert.match(reel, /quantityPrecisionError[\s\S]*validationError/u);
assert.match(reel, /bodyScrollable=\{renderPath === "numeric-keypad"\}/u);

assert.doesNotMatch(quick, /<DraftField label="장소"/u);
assert.match(quick, /label="상세주소 \(선택\)"/u);
assert.match(quick, /place: ""/u);
assert.match(quickPresentation, /primary: address \?\? unsetLabel/u);

for (const required of ["one explicit `추가`", "adaptiveExpandable", "Focus reveal", "Numeric precision"]) assert.ok(design.includes(required), `Design System missing ${required}`);
for (const required of ["Direct Size, Color, and Spec Item", "address-first"]) assert.ok(ia.includes(required), `Maker IA missing ${required}`);
assert.equal(fs.existsSync("db/v2/migrations/019_input_sheet_ux.sql"), false);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-input-sheet-ux-semantics-stability",
  previousPermanentInventoryRetained: 121,
  addedPermanentChecks: 1,
  finalPermanentInventory: 122,
  directCreateDeadV: 0,
  adaptiveSavedSpecSurfaces: 2,
  materialQuantityScale: MATERIAL_QUANTITY_SCALE,
  focusRevealOwnerCount: 1,
  quickDirectPlaceInputs: 0,
  ownerFixtureMutation: 0,
  productionMutation: 0,
}));
