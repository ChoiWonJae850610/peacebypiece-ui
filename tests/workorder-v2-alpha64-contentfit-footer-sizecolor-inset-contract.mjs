#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { resolveWaflContentFitHeight } from "../apps/mobile/domain/waflSheetDetentPolicy.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const editor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const readOnly = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const tabBody = read("apps/mobile/features/layout/WaflWorkOrderTabBody.tsx");
const templates = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

const oneCard = resolveWaflContentFitHeight({
  windowHeight: 844,
  headerHeight: 52,
  bodyHeight: 178,
  footerHeight: 48,
  safeBottom: 34,
  minHeight: 220,
  maxRatio: 0.72,
  verticalChrome: 16,
});
assert.deepEqual(oneCard, { bodyViewportHeight: 178, height: 328, overflow: false });
assert.ok(oneCard.height < Math.round(844 * 0.68), "one-card contentFit must stay substantially below the expandable medium detent");

const overflow = resolveWaflContentFitHeight({
  windowHeight: 844,
  headerHeight: 52,
  bodyHeight: 700,
  footerHeight: 48,
  safeBottom: 34,
  minHeight: 220,
  maxRatio: 0.72,
  verticalChrome: 16,
});
assert.deepEqual(overflow, { bodyViewportHeight: 458, height: 608, overflow: true });

assert.match(sheet, /sizing === "contentFit" && !contentFit\.overflow/u);
assert.match(sheet, /style=\{\[styles\.contentFitBody, contentStyle\]\}/u);
assert.match(sheet, /style=\{\[styles\.contentFitBody, \{ height: Math\.max\(0, expandedBodyViewportHeight\) \}\]\}/u);
assert.match(sheet, /style=\{\[styles\.bodyViewport, \{ height: animatedBodyViewportHeight \}\]\}/u);
assert.match(sheet, /contentFitBody:\s*\{\s*flexGrow:\s*0,\s*flexShrink:\s*0/u);
assert.match(sheet, /onLayout=\{\(event\) => measureFooter\(event\.nativeEvent\.layout\.height\)\}/u);
assert.match(sheet, /testID="wafl-sheet-actions"/u);
assert.ok(sheet.indexOf("sizing === \"contentFit\" && !contentFit.overflow") < sheet.indexOf('testID="wafl-sheet-actions"'), "contentFit body must precede the measured footer");
assert.match(sheet, /content:\s*\{\s*flex:\s*1/u, "expandable/fullView body remains flexible");
assert.match(sheet, /scrollBodyContent:\s*\{\s*flexGrow:\s*1/u, "expandable/fullView scroll fill remains unchanged");
for (const gestureMarker of ["onStartShouldSetResponderCapture", "onResponderMove", "resolveWaflSheetDragOffset", "animateDown"]) assert.match(sheet, new RegExp(gestureMarker));
assert.match(templates, /sizing="adaptiveExpandable"[\s\S]*title="스펙 불러오기"/u);
assert.match(templates, /CompanyTemplateSaveSheet[\s\S]*sizing="adaptiveExpandable"[\s\S]*title="스펙 저장"/u);

assert.match(overview, /<WaflWorkOrderTabBody testID=\{`work-order-tab-body-\$\{activeSection\}`\}>/u);
assert.equal((overview.match(/<WaflWorkOrderTabBody/g) ?? []).length, 1, "the common outer body frame is applied once");
assert.match(tabBody, /body:\s*\{\s*paddingTop:\s*WAFL_THEME\.layout\.tabBodyTopInset\s*\}/u);
assert.match(editor, /const editorSurfaceVisible = Boolean\(edit\.errorMessage \|\| catalogError \|\| \(edit\.canEdit && chooser\)\)/u);
assert.match(editor, /matrix && editorSurfaceVisible \? <View style=\{styles\.cards\}>/u);
assert.ok(editor.indexOf("editorSurfaceVisible ?") < editor.indexOf("<WorkOrderSizeColorReadOnly"), "normal Size/Color must mount its first card directly after the conditional editor surface");
assert.doesNotMatch(`${editor}\n${readOnly}`, /marginTop:\s*-|top:\s*-/u, "Size/Color must not use a negative-offset workaround");
assert.doesNotMatch(readOnly, /sectionCard:\s*\{[^}]*marginTop/u);
for (const label of ["개요", "이미지·첨부", "사이즈·색상", "원부자재", "제작", "문서"]) assert.match(overview, new RegExp(label));

assert.match(design, /contentFit[\s\S]*actions immediately follow measured body content/u);
assert.match(ia, /Size\/Color[\s\S]*does not mount an empty editor wrapper/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-contentfit-footer-sizecolor-inset",
  previousPermanentInventoryRetained: 117,
  addedPermanentChecks: 1,
  oneCardHeight: oneCard.height,
  expandableMediumHeight: Math.round(844 * 0.68),
  physicalSheetDragPassPreserved: true,
}));
