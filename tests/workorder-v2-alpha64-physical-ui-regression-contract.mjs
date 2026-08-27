#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const theme = read("apps/mobile/constants/theme.ts");
const metric = read("apps/mobile/features/layout/WaflMetricField.tsx");
const tabBody = read("apps/mobile/features/layout/WaflWorkOrderTabBody.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const intent = read("apps/mobile/features/work-orders/overview/workOrderSectionIntent.ts");
const alpha65ProductionAuthoring = fs.existsSync("tests/workorder-v2-alpha65-production-factory-process-authoring-contract.mjs");
const production = read(alpha65ProductionAuthoring
  ? "apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx"
  : "apps/mobile/features/work-orders/production/WorkOrderProductionReadOnly.tsx");
const api = read("apps/mobile/lib/api/workOrdersApi.ts");
const sizeColor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const templates = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
const mock = read("apps/mobile/components/ProductionCardMock.tsx");

assert.doesNotMatch(sheet, /PanResponder/u, "the failed late-capture PanResponder path must not remain");
for (const marker of ["onStartShouldSetResponderCapture", "onResponderGrant", "onResponderMove", "onResponderRelease", "nativeEvent.pageY", "resolveWaflSheetDragOffset"]) assert.match(sheet, new RegExp(marker));
assert.match(sheet, /onStartShouldSetResponderCapture=\{\(\) => draggable && openReady && !actionPending && !dismissingRef\.current\}/u, "dedicated header must capture from touch-down after entrance but never interrupt close");
assert.match(sheet, /testID=\{draggable \? "wafl-sheet-header-drag-zone" : "wafl-sheet-fixed-header"\}/u);
assert.match(sheet, /\{draggable \? <View style=\{styles\.handle\} \/> : null\}/u);
assert.match(theme, /dragZoneMinHeight:\s*44/u);
for (const sizing of ["contentFit", "adaptiveExpandable", "expandable", "fullView"]) assert.match(sheet, new RegExp(`"${sizing}"`));
assert.match(templates, /sizing="adaptiveExpandable"[\s\S]*title="스펙 불러오기"/u);
assert.match(sheet, /onContentSizeChange=\{\(_width, height\) => measureBody\(height\)\}/u);
assert.match(sheet, /contentFit\.overflow/u);

assert.match(metric, /testID="wafl-metric-value-surface"/u);
assert.match(metric, /backgroundColor:\s*WAFL_THEME\.color\.paper/u);
assert.match(overview, /<WaflMetricField editable=\{false\} label="총 수량"/u);
assert.equal((overview.match(/<WaflMetricField/g) ?? []).length, 6);

for (const label of ["이미지·첨부", "사이즈·색상", "원부자재", "제작", "문서"]) assert.match(overview, new RegExp(`label: "${label}"`));
assert.match(intent, /"production"/u);
assert.match(overview, alpha65ProductionAuthoring
  ? /<WorkOrderProductionAuthoring[\s\S]*workOrderId=\{detail\.header\.id\}/u
  : /<WorkOrderProductionReadOnly workOrderId=\{detail\.header\.id\} \/>/u);
assert.match(api, /\/processes/u);
assert.match(production, alpha65ProductionAuthoring
  ? /testID="work-order-production-authoring"/u
  : /testID="work-order-production-read-only"/u);
assert.doesNotMatch(`${overview}\n${production}`, /ProductionCardMock/u);
assert.ok(mock.length > 0, "historical mock remains preserved");

assert.match(overview, /<WaflWorkOrderTabBody testID=\{`work-order-tab-body-\$\{activeSection\}`\}>/u);
assert.match(tabBody, /tabBodyTopInset/u);
assert.doesNotMatch(sizeColor, /paddingTop:\s*CONTENT_INSET|sectionCard:\s*\{[^}]*marginTop/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-physical-ui-regression",
  retainedPermanentChecks: 116,
  addedPermanentChecks: 1,
  physicalGestureInferred: false,
}));
