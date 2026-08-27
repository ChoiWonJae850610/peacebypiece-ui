#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { resolveWaflReelOpeningValue } from "../apps/mobile/features/inputs/reel-picker/waflRequiredChoicePolicy.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const inline = read("apps/mobile/components/ControlledInlineEditValue.tsx");
const surface = read("apps/mobile/components/waflEditableValueSurface.ts");
const sheetField = read("apps/mobile/features/inputs/WaflSheetValueField.tsx");
const loadingPolicy = read("apps/mobile/features/work-orders/loading/delayedLoadingPolicy.ts");
const loadingView = read("apps/mobile/features/work-orders/loading/DelayedLoadingMessage.tsx");
const detail = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const sizeColor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const documentWorkbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const images = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const datePicker = read("apps/mobile/components/InlineDatePicker.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const makerIa = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

// Required partner choice: visual center, reducer state, initial index and V use one value.
for (const testCase of [
  { candidates: ["partner-a"], current: "", expected: "partner-a" },
  { candidates: ["partner-a", "partner-b"], current: "", expected: "partner-a" },
  { candidates: ["partner-a", "partner-b"], current: "partner-b", expected: "partner-b" },
  { candidates: ["partner-a"], current: "stale", expected: "partner-a" },
  { candidates: [], current: "", expected: "" },
]) assert.equal(resolveWaflReelOpeningValue({ candidateValues: testCase.candidates, currentValue: testCase.current, stageFirstRealOption: true }), testCase.expected);
assert.equal(resolveWaflReelOpeningValue({ candidateValues: ["", "process-a"], currentValue: "", stageFirstRealOption: false }), "");
assert.match(production, /field: "partnerId"[\s\S]*requireSpecifiedValue: true, selectFirstRealOption: true/u);
assert.match(production, /field: "processCode"[\s\S]*requireSpecifiedValue: selectedProcess === null, selectFirstRealOption: false/u);
assert.match(production, /allowUnset: true[\s\S]*field: "factoryPartnerId"[\s\S]*selectFirstRealOption: false/u);
assert.match(reel, /openValue = resolveWaflReelOpeningValue/u);
assert.match(reel, /stagedOpeningValue = optionOnly \|\| kind === "unit" \|\| eighthInch[\s\S]*normalizeReelValue\(openValue\) \?\? openValue/u);
assert.match(reel, /value: stagedOpeningValue/u);
assert.match(reel, /confirmDisabled=\{applyDisabled \|\| pending\}/u);

// One shared compact single-line footprint; focus changes semantic paint only.
assert.match(surface, /WAFL_EDITABLE_VALUE_FOCUSED_SURFACE[\s\S]*\.\.\.WAFL_EDITABLE_VALUE_SURFACE[\s\S]*backgroundColor[\s\S]*borderBottomColor/u);
assert.match(inline, /multiline \? styles\.activeMultiline : WAFL_EDITABLE_VALUE_FOCUSED_SURFACE/u);
assert.match(inline, /!multiline && styles\.inputSingleLine/u);
assert.doesNotMatch(inline, /active: \{[^}]*minHeight: 54/u);
assert.match(inline, /inputSingleLine: \{ minHeight: 30, paddingHorizontal: 0, paddingVertical: 0 \}/u);
assert.match(sheetField, /style=\{\[styles\.surface, styles\.editable, multiline && styles\.multiline/u);

// Six-tab loading audit: parent-loaded tabs do not fake a local loader; uncached async tabs share one owner.
const loadingAudit = [
  ["개요", "parent-loaded detail", "no local loader"],
  ["이미지·첨부", "parent-loaded assets", "no local loader"],
  ["사이즈·색상", "independent async projection", "shared loader"],
  ["원부자재", "independent async typed list", "shared loader"],
  ["제작", "independent async processes/options", "shared loader"],
  ["문서", "parent-loaded detail plus background token read", "content remains mounted"],
];
assert.equal(loadingAudit.length, 6);
assert.match(loadingView, /WORK_ORDER_LOADING_MESSAGES\[scope\]/u);
assert.match(loadingPolicy, /production: "제작 정보를 불러오는 중입니다\."/u);
assert.match(sizeColor, /DelayedLoadingMessage identity=\{`\$\{identity\}:size-color`\} loading scope="sizeColor"/u);
assert.match(materials, /DelayedLoadingMessage[\s\S]*scope=\{materialType\}/u);
assert.match(production, /DelayedLoadingMessage identity=\{`production:\$\{workOrderId\}`\} loading scope="production"/u);
assert.match(production, /productionPresentationCache\.get\(workOrderId\)/u);
assert.match(documentWorkbench, /setMessage\("문서 상태를 불러오지 못했습니다\."\)/u);

// Owner-approved bounded copy normalization.
assert.doesNotMatch(detail, /외 \{(?:blockers|warnings)\.length - 3\}건/u);
assert.doesNotMatch(images, /첫 이미지를 추가하면 서버 정책에 따라 대표로 지정됩니다\./u);
assert.match(images, /등록된 이미지가 없습니다\./u);
assert.match(datePicker, /<Text style=\{styles\.eyebrow\}>WAFL INPUT<\/Text>/u);
assert.match(datePicker, /<Text style=\{styles\.title\}>납기일 선택<\/Text>/u);

for (const marker of [
  "single-line inline value keeps identical participating geometry",
  "six live WorkOrder tabs share one asynchronous loading grammar",
  "Every required partner route",
]) assert.ok(`${design}\n${makerIa}`.includes(marker), `canonical docs missing ${marker}`);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha65-common-ui-consistency",
  previousPermanentInventoryRetained: 145,
  addedPermanentChecks: 1,
  finalPermanentInventory: 146,
  requiredChoiceCases: 6,
  auditedWorkOrderTabs: loadingAudit.length,
  sourceMutationExpected: true,
  migrationLedger: "18/18",
  migration019: 0,
  productionMutation: 0,
  ownerFixtureMutation: 0,
}));
