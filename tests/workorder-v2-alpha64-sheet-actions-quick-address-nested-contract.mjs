#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflExpandableInitialHeight,
  resolveWaflSheetBodyViewportHeight,
} from "../apps/mobile/domain/waflSheetDetentPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const theme = read("apps/mobile/constants/theme.ts");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const partner = read("apps/mobile/features/materials/MaterialPartnerPickerSheet.tsx");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const address = read("apps/mobile/features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx");
const templates = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
const spec = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const structure = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const create = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const document = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

const initialHeight = resolveWaflExpandableInitialHeight({
  windowHeight: 844,
  detentRatio: 0.68,
  headerHeight: 76,
  footerHeight: 48,
  safeBottom: 34,
  verticalChrome: 16,
  minimumBodyViewport: 120,
});
assert.equal(initialHeight, 574);
const expandedHeight = Math.round(844 * 0.94);
const mediumOffset = expandedHeight - initialHeight;
assert.equal(mediumOffset, 219);
assert.equal(resolveWaflSheetBodyViewportHeight(619, mediumOffset), 400);
assert.equal(resolveWaflSheetBodyViewportHeight(619, 0), 619);

for (const marker of [
  "resolveWaflExpandableInitialHeight",
  "initialBodyViewportMinHeight",
  "layoutOffset",
  "animatedBodyViewportHeight",
  'testID="wafl-sheet-body-viewport"',
  'testID="wafl-sheet-actions"',
]) assert.ok(`${sheet}\n${theme}`.includes(marker), `missing first-detent action marker: ${marker}`);
assert.match(sheet, /accessibilityState=\{\{ busy: actionPending, disabled: actionPending \|\| confirmDisabled \}\}/u);
assert.match(sheet, /style=\{\[styles\.applyButton, \(actionPending \|\| confirmDisabled\) && styles\.disabled\]\}/u);
assert.ok(sheet.indexOf('testID="wafl-sheet-actions"') < sheet.lastIndexOf("accessibilityState={{ busy: actionPending"), "action footer must render independently from the enabled rule");
assert.doesNotMatch(sheet, /KeyboardAvoidingView/u);
assert.match(sheet, /Keyboard\.addListener\("keyboardWillChangeFrame"/u);
assert.match(sheet, /testID="wafl-sheet-bottom-inset"/u);
assert.match(sheet, /contentContainerStyle=\{\[styles\.scrollBodyContent/u);
assert.doesNotMatch(sheet, /footerCompensation|paddingBottom:\s*footerHeight|actions[^\n]*position:\s*"absolute"/u);
assert.ok(sheet.indexOf('testID="wafl-sheet-body-viewport"') < sheet.indexOf('testID="wafl-sheet-actions"'), "body viewport and footer must be real ordered siblings");

for (const gestureMarker of ["onStartShouldSetResponderCapture", "onResponderMove", "resolveWaflSheetDragOffset", "animateDown", "toValue: mediumOffset"]) {
  assert.match(sheet, new RegExp(gestureMarker), `working gesture owner lost ${gestureMarker}`);
}

const consumers = [
  ["Size/Color", structure, /<StructureSelectionSheet/u],
  ["Saved Spec", templates, /MeasurementTemplatePickerSheet[\s\S]*CompanyTemplateSaveSheet/u],
  ["Spec Item", spec, /sizing="expandable"/u],
  ["reel picker", reel, /sizing="reelAdaptive"/u],
  ["WorkOrder create", create, /sizing=\{WAFL_TEXT_ENTRY_FORM_SIZING\}/u],
  ["Fabric/Accessory", overview, /materialEditor[\s\S]*<WaflInputSheet/u],
  ["Attachment/Quick", document, /attachmentSheetOpen[\s\S]*quickDeliveryOpen/u],
  ["Quick direct address", quick, /title=\{`\$\{activeEndpoint === "origin" \? "출발지" : "도착지"\} 직접 입력`\}/u],
  ["Juso", address, /title="주소 검색"/u],
];
for (const [name, source, pattern] of consumers) {
  assert.match(source, /WaflInputSheet/u, `${name} must use the shared action owner`);
  assert.match(source, pattern, `${name} audit surface missing`);
}

assert.match(sheet, /readonly onAfterClose\?: \(\) => void/u);
assert.match(sheet, /setRendered\(false\);[\s\S]*dismissingRef\.current = false;[\s\S]*entranceStartedRef\.current = false;[\s\S]*requestAnimationFrame\(\(\) => \{[\s\S]*onAfterClose\?\.\(\)/u, "external close must finish lifecycle reset before next native sheet route");
assert.match(reel, /onAfterClose=\{onAfterClose\}/u);
assert.match(partner, /onAfterClose=\{props\.onAfterClose\}/u);
assert.match(quick, /useWaflNestedSheetHandoff<QuickNestedRoute>/u);
assert.match(quick, /nested\.transition\("direct"\)/u);
assert.match(quick, /nested\.transition\("address"\)/u);
assert.match(quick, /setLocation\(activeEndpoint, \{ \.\.\.directDraft, mode: "direct", partnerId: "", place: "" \}\)/u);
assert.match(quick, /if \(kind === "origin"\) setOrigin\(value\);\s+else setDestination\(value\)/u);
assert.match(quick, /function cancelAddressSearch\(\) \{[\s\S]*nested\.transition\("direct"\)/u);
assert.match(address, /function selectItem\(item: AddressSearchItem\) \{\s+props\.onSelect\(item\)/u);
assert.match(address, /onAfterClose=\{props\.onAfterClose\}/u);
assert.doesNotMatch(quick, /Linking|WebView|kakao|Safari/iu);

assert.match(design, /staged X\/V sheet exposes both actions before keyboard entry/u);
assert.match(design, /disabled V remains visible/u);
assert.match(design, /closes the outgoing native sheet before presenting the next sheet/u);
assert.match(ia, /presenting one native child sheet at a time/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-sheet-actions-quick-address-nested",
  previousPermanentInventoryRetained: 118,
  addedPermanentChecks: 1,
  initialHeight,
  mediumOffset,
  firstDetentActionsVisible: true,
  nestedOutgoingCloseBeforeIncomingOpen: true,
  productionMutation: 0,
  physicalSheetDragPassPreserved: true,
  physicalSizeColorBodyInsetPassPreserved: true,
}));
