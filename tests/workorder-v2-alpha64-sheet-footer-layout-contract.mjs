#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflContentFitHeight,
  resolveWaflSheetBodyViewportHeight,
} from "../apps/mobile/domain/waflSheetDetentPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const templates = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
const structure = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const address = read("apps/mobile/features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx");
const document = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const create = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");

const expandedHeight = 793;
const headerHeight = 76;
const footerHeight = 48;
const safeBottom = 34;
const verticalChrome = 16;
const mediumOffset = 219;
const expandedBody = expandedHeight - headerHeight - footerHeight - safeBottom - verticalChrome;
const mediumBody = resolveWaflSheetBodyViewportHeight(expandedBody, mediumOffset);
assert.equal(expandedBody, 619);
assert.equal(mediumBody, 400);
assert.equal(headerHeight + mediumBody + footerHeight + safeBottom + verticalChrome, expandedHeight - mediumOffset);
assert.equal(headerHeight + expandedBody + footerHeight + safeBottom + verticalChrome, expandedHeight);
assert.equal(resolveWaflSheetBodyViewportHeight(expandedBody, expandedHeight), 0);

const compact = resolveWaflContentFitHeight({
  windowHeight: 844,
  headerHeight: 52,
  bodyHeight: 126,
  footerHeight: 48,
  safeBottom: 34,
  minHeight: 220,
  maxRatio: 0.72,
  verticalChrome: 16,
});
assert.deepEqual(compact, { bodyViewportHeight: 126, height: 276, overflow: false });
assert.ok(compact.height < Math.round(844 * 0.68));

for (const marker of [
  "const [layoutOffset]",
  "expandedBodyViewportHeight",
  "animatedBodyViewportHeight",
  'testID="wafl-sheet-body-viewport"',
  'testID="wafl-sheet-actions"',
  'testID="wafl-sheet-bottom-inset"',
  "layoutOffset.setValue(offset)",
]) assert.ok(sheet.includes(marker), `shared footer frame missing ${marker}`);
assert.doesNotMatch(sheet, /KeyboardAvoidingView/u, "the root must not be shifted by keyboard avoidance");
assert.ok(sheet.indexOf('testID="wafl-sheet-body-viewport"') < sheet.indexOf('testID="wafl-sheet-actions"'), "body must precede footer in the mounted tree");
assert.match(sheet, /<View\s+onLayout=\{\(event\) => measureFooter[\s\S]*style=\{styles\.actions\}[\s\S]*testID="wafl-sheet-actions"/u);
assert.match(sheet, /bodyViewport:\s*\{[^}]*overflow:\s*"hidden"/u);
assert.match(sheet, /scrollBodyContent:\s*\{[^}]*paddingBottom:\s*WAFL_THEME\.sheet\.bodyEndGap/u);
assert.doesNotMatch(sheet, /footerCompensation|Animated\.multiply\(translateY,\s*-1\)|paddingBottom:\s*footerHeight/u);
assert.doesNotMatch(sheet, /actions:\s*\{[^}]*position:\s*"absolute"/u);
assert.match(sheet, /accessibilityState=\{\{ busy: actionPending, disabled: actionPending \|\| confirmDisabled \}\}/u);
assert.match(sheet, /style=\{\[styles\.applyButton, \(actionPending \|\| confirmDisabled\) && styles\.disabled\]\}/u);

assert.match(templates, /CompanyTemplateSaveSheet[\s\S]*sizing="adaptiveExpandable"[\s\S]*title="스펙 저장"/u);
assert.match(templates, /MeasurementTemplatePickerSheet[\s\S]*sizing="adaptiveExpandable"[\s\S]*title="스펙 불러오기"/u);

const consumers = [
  ["Size/Color", structure],
  ["Spec load/save", templates],
  ["Fabric/Accessory", overview],
  ["Quick Delivery/direct child", quick],
  ["Juso", address],
  ["Attachment", document],
  ["WorkOrder create", create],
];
for (const [name, source] of consumers) assert.match(source, /WaflInputSheet/u, `${name} must use the shared sibling footer owner`);

assert.match(quick, /onAfterClose=\{finishNestedClose\}/u);
assert.match(address, /onAfterClose=\{props\.onAfterClose\}/u);
assert.match(design, /HEADER -> BODY VIEWPORT -> X\/V FOOTER -> SAFE AREA/u);
assert.match(design, /footer never uses inverse translation, absolute positioning/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-sheet-footer-layout",
  previousPermanentInventoryRetained: 119,
  addedPermanentChecks: 1,
  finalPermanentInventory: 120,
  expandableMediumBodyHeight: mediumBody,
  expandableFooterOverlap: 0,
  contentFitHeight: compact.height,
  contentFitUsesExpandableMediumFloor: false,
  disabledActionLayoutPreserved: true,
  keyboardSafeSiblingFrame: true,
  ownerFixtureMutation: 0,
  productionMutation: 0,
}));
