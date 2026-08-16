#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { resolveWaflAdaptiveInitialHeight } from "../apps/mobile/domain/waflSheetDetentPolicy.ts";
import { resolveWaflReelAdaptiveBodyHeight } from "../apps/mobile/features/inputs/reel-picker/waflReelSheetSizingPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const reelModel = read("apps/mobile/features/inputs/reel-picker/reelPickerModel.ts");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const field = read("apps/mobile/features/inputs/WaflSheetValueField.tsx");
const create = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const templates = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
const spec = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const material = read("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx");
const liveInline = read("apps/mobile/components/ControlledInlineEditValue.tsx");
const historicalInline = read("apps/mobile/components/InlineEditableFields.tsx");
const numeric = read("apps/mobile/lib/mobileDisplay.ts");
const materialPrecision = read("apps/mobile/domain/materialQuantityPrecision.ts");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const start = read("docs/project/app-v2/00-start-here.md");
const permanent = read("docs/project/app-v2/09a-codex-execution-lifecycle.md");

const singleChoiceBody = resolveWaflReelAdaptiveBodyHeight({
  renderPath: "single-choice-reel",
  hasModeSwitch: false,
  hasSupplementaryControl: false,
  hasValidationMessage: false,
});
const dualNumericBody = resolveWaflReelAdaptiveBodyHeight({
  renderPath: "numeric-reel",
  hasModeSwitch: true,
  hasSupplementaryControl: false,
  hasValidationMessage: false,
});
assert.equal(singleChoiceBody, 234);
assert.equal(dualNumericBody, 302);
assert.ok(dualNumericBody > singleChoiceBody);

const sharedGeometry = {
  windowHeight: 844,
  headerHeight: 76,
  footerHeight: 48,
  safeBottom: 34,
  minHeight: 220,
  maxRatio: 0.68,
  verticalChrome: 16,
};
const singleChoiceHeight = resolveWaflAdaptiveInitialHeight({ ...sharedGeometry, bodyHeight: singleChoiceBody });
const dualNumericHeight = resolveWaflAdaptiveInitialHeight({ ...sharedGeometry, bodyHeight: dualNumericBody });
assert.equal(singleChoiceHeight, 408);
assert.equal(dualNumericHeight, 476);
assert.ok(singleChoiceHeight < Math.round(844 * 0.68));
assert.ok(dualNumericHeight < Math.round(844 * 0.68));

for (const marker of [
  'sizing="reelAdaptive"',
  "adaptiveMinimumBodyHeight={reelAdaptiveBodyHeight}",
  "measurementVariant={renderPath}",
  'bodyScrollable={renderPath === "numeric-keypad"}',
  "WaflInputModeSwitch",
]) assert.ok(reel.includes(marker), `reel canonical path missing ${marker}`);
assert.doesNotMatch(reel, /sizing="expandable"/u);
for (const marker of ["adaptiveMinimumBodyHeight", 'sizing === "reelAdaptive"', "styles.intrinsicBody"]) {
  assert.ok(sheet.includes(marker), `shared sheet adaptive owner missing ${marker}`);
}

for (const marker of ["errorMessage", "helpText", "WaflSheetFocusBlock", "WaflSheetTextInput", "styles.readOnly"]) {
  assert.ok(field.includes(marker), `canonical sheet field missing ${marker}`);
}
for (const [name, source] of [["WorkOrder create", create], ["Saved Spec", templates], ["Spec Item", spec]]) {
  assert.match(source, /WaflSheetValueField/u, `${name} must reuse the canonical sheet field`);
}
assert.match(material, /function EditorField/u, "Material field remains an intentional domain composition");
assert.match(material, /normalizeNumericDraft/u);

for (const marker of ["normalizeNumericDraft", "normalizeNumericCommitValue"]) {
  assert.ok(numeric.includes(marker), `numeric canonical owner missing ${marker}`);
  assert.ok(liveInline.includes(marker), `live inline path must reuse ${marker}`);
}
assert.match(reel, /normalizeNumericDraft/u);
assert.match(reelModel, /canonicalizeNumericInput/u);
assert.match(materialPrecision, /materialQuantityPrecision/u);

const sourceFiles = [];
function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(target);
    else if (/\.(?:ts|tsx)$/u.test(entry.name)) sourceFiles.push(target);
  }
}
collect("apps/mobile");
const legacyImports = sourceFiles.filter((file) => /from ["']@\/components\/InlineEditableFields["']/u.test(read(file)));
assert.deepEqual(legacyImports.map((file) => file.replaceAll("\\", "/")), ["apps/mobile/components/ProductionCardMock.tsx"]);
assert.match(historicalInline, /Historical showroom\/mock primitives/u);

for (const marker of [
  "Mobile input component routing",
  "WaflSheetValueField",
  "ControlledInlineEditValue",
  "ProductionCardMock",
  "reelAdaptive",
]) assert.ok(`${design}\n${start}\n${permanent}`.includes(marker), `canonical routing docs missing ${marker}`);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-mobile-input-architecture-consolidation",
  previousPermanentInventoryRetained: 132,
  addedPermanentChecks: 1,
  singleChoiceBody,
  dualNumericBody,
  singleChoiceHeight,
  dualNumericHeight,
  liveLegacyImports: 0,
  productionMutation: 0,
}));
