#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const mobile = read("apps/mobile/components/ProductionCardMock.tsx");
const inline = read("apps/mobile/components/InlineEditableFields.tsx");
const typography = read("apps/mobile/constants/compactFieldTypography.ts");
const mock = read("apps/mobile/constants/mockProductionCard.ts");
const preview = read("components/workorder/preview/IssuedWorkOrderPreview.tsx");
const renderer = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
const samplePage = read("app/dev/workorder-preview-sample/page.tsx");
const pipeline = read("tools/pipeline/peacebypiece-auto-pipeline.ps1");

const currentVersion = read("lib/constants/version.ts").match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
assert.ok(["2.0.0-alpha.38", "2.0.0-alpha.39", "2.0.0-alpha.40", "2.0.0-alpha.41"].includes(currentVersion));
assert.match(read("apps/mobile/constants/version.ts"), new RegExp(currentVersion.replaceAll(".", "\\.")));
const appConfig = JSON.parse(read("apps/mobile/app.json"));
assert.equal(appConfig.expo.version, currentVersion);
assert.equal(appConfig.expo.extra.appVersion, currentVersion);
assert.equal(JSON.parse(read("apps/mobile/package.json")).version, currentVersion);
assert.equal(JSON.parse(read("apps/mobile/package-lock.json")).version, currentVersion);

const materialRow = mobile.match(/function MaterialRow\([\s\S]*?\n\}\n\ntype MaterialEditValues/)?.[0] ?? "";
assert.equal((materialRow.match(/testID="material-core-row"/g) ?? []).length, 2);
const coreRows = materialRow.match(/<View testID="material-core-row"[\s\S]*?<\/View>/g) ?? [];
assert.equal(coreRows.length, 2);
assert.equal((coreRows[0].match(/<CompactInlineEditableField/g) ?? []).length, 3);
assert.equal((coreRows[1].match(/<CompactInlineEditableField/g) ?? []).length, 3);
for (const label of ["거래처", "색상·옵션", "단가"]) assert.ok(coreRows[0].includes(`label="${label}"`));
for (const label of ["필요", "로스·여유", "재고"]) assert.ok(coreRows[1].includes(`label="${label}"`));
assert.match(materialRow, /styles\.materialHeaderUnit[\s\S]*?label="단위"/);
assert.doesNotMatch(materialRow, /거래처·수량 확인|발주 정보 고정/);

assert.match(inline, /export function CompactInlineEditableField/);
assert.match(inline, /<TextInput[\s\S]*?multiline=\{false\}/);
assert.match(inline, /if \(cancelledRef\.current \|\| completedRef\.current\) return/);
assert.match(inline, /if \(nextValue !== startValueRef\.current\.trim\(\)\)/);
assert.match(inline, /props\.onChange\(startValueRef\.current\)/);
assert.match(inline, /props\.editable \? \(/);
assert.match(typography, /COMPACT_FIELD_ROW_HEIGHT = 22/);
assert.match(typography, /fontSize: 12/);
assert.match(typography, /lineHeight: 17/);
assert.match(inline, /compactCell:[\s\S]*?height: COMPACT_FIELD_ROW_HEIGHT/);
assert.doesNotMatch(inline, /compactCell:[\s\S]*?borderRadius|compactCell:[\s\S]*?backgroundColor/);

assert.match(materialRow, /parseMaterialNumber\(values\.required\) \+ parseMaterialNumber\(values\.allowance\) - parseMaterialNumber\(values\.stockUse\)/);
assert.match(materialRow, /Math\.max\([\s\S]*?,\s*0\s*\)/);
assert.match(materialRow, /const amount = orderQuantity \* parseMaterialNumber\(values\.unitPrice\)/);
assert.match(materialRow, /formatMaterialQuantity\(values\.required, unit\)/);
assert.match(materialRow, /formatMaterialQuantity\(String\(orderQuantity\), unit\)/);
assert.equal(Math.max(420 + 42 - 80, 0), 382);
assert.equal(382 * 12_800, 4_889_600);
assert.equal(Math.max(430 + 42 - 80, 0), 392);
assert.equal(392 * 12_800, 5_017_600);

for (const placeholder of ["사용 부위를 알려주세요", "메모를 입력하세요"]) assert.match(materialRow, new RegExp(`placeholder="${placeholder}"`));
assert.match(inline, /invalidLabel/);
assert.match(inline, /invalidUnderline/);
assert.doesNotMatch(materialRow, /row\.leftover|row\.warning|materialReference|materialWarning/);
for (const forbidden of ["materialOrderSummary", "materialFooterBand", "materialFooterMessages", "materialFooterActions", "materialSummaryStrip"]) {
  assert.ok(!mobile.includes(forbidden), `obsolete material block remains: ${forbidden}`);
}

assert.equal((materialRow.match(/testID="material-order-action-row"/g) ?? []).length, 1);
const footer = materialRow.slice(materialRow.indexOf('testID="material-order-action-row"'));
assert.match(footer, /testID="material-order-summary"/);
assert.match(footer, /testID="material-order-actions"/);
assert.doesNotMatch(footer, /materialCoreRow|materialFactoryFields|InlineEditableValue/);
assert.match(mobile, /materialOrderActionRow:[\s\S]*?flexDirection: "row"[\s\S]*?justifyContent: "space-between"/);
assert.match(mobile, /materialOrderActions:[\s\S]*?flexWrap: "nowrap"/);
assert.match(materialRow, /caption=\{compactActions \? undefined : action\.caption\}/);

for (const state of ["입력중", "발주요청", "완료"]) assert.match(mock, new RegExp(`status: "${state}"`));
assert.match(materialRow, /const editable = row\.status === "입력중"/);
assert.match(materialRow, /statusBadgeStyle\(row\.status\)/);
assert.match(mobile, /if \(row\.status === "완료"\)[\s\S]*?return \[\]/);

assert.match(samplePage, /assertLocalOnlyRouteHost\(\)/);
assert.doesNotMatch(`${preview}\n${renderer}`, /issuedWorkOrderPreviewSample|dev-samples/);
for (const forbidden of ["fetch(", "POST", "PATCH", "PUT", "DELETE", "DATABASE_URL", "storageObjectKey", "tokenHash"]) {
  assert.ok(!`${mobile}\n${inline}`.includes(forbidden), `mobile mock contains forbidden ${forbidden}`);
}

assert.match(pipeline, /function AddAlpha35MaterialCompactInputRepoStateSections/);
assert.equal((pipeline.match(/AddAlpha35MaterialCompactInputRepoStateSections -Lines \$lines -Version \$Version/g) ?? []).length, 2);
for (const field of [
  "Alpha.35 Product Verification:",
  "Alpha.35 Core Input Row Count:",
  "Alpha.35 Fields Per Core Row:",
  "Alpha.35 Unit Propagation:",
  "Alpha.35 Order Quantity Calculation:",
  "Alpha.35 Warning Text Count:",
  "Alpha.35 Summary / Action Row:",
  "Alpha.35 Card Height Before / After:",
  "Alpha.35 PDF / Preview Regression:",
  "Alpha.35 DB / API / R2 / Worker / PDF Lifecycle / Production Mutation:",
]) {
  assert.ok(pipeline.includes(field), `alpha.35 repo-state field missing: ${field}`);
}

console.log("workorder v2 alpha.35 material compact input contract: PASS");
