#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const mobile = read("apps/mobile/components/ProductionCardMock.tsx");
const inline = read("apps/mobile/components/InlineEditableFields.tsx");
const preview = read("components/workorder/preview/IssuedWorkOrderPreview.tsx");
const renderer = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
const samplePage = read("app/dev/workorder-preview-sample/page.tsx");
const pipeline = read("tools/pipeline/peacebypiece-auto-pipeline.ps1");

const currentVersion = read("lib/constants/version.ts").match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
assert.ok(["2.0.0-alpha.38", "2.0.0-alpha.39", "2.0.0-alpha.40", "2.0.0-alpha.41", "2.0.0-alpha.42", "2.0.0-alpha.43", "2.0.0-alpha.44", "2.0.0-alpha.45", "2.0.0-alpha.46", "2.0.0-alpha.47", "2.0.0-alpha.48", "2.0.0-alpha.49", "2.0.0-alpha.50", "2.0.0-alpha.51", "2.0.0-alpha.52", "2.0.0-alpha.53"].includes(currentVersion));
assert.match(read("apps/mobile/constants/version.ts"), new RegExp(currentVersion.replaceAll(".", "\\.")));
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const publicVersion = currentVersion.replace(/-.+$/, "");
assert.match(publicVersion, /^\d+\.\d+\.\d+$/);
assert.equal(appConfig.expo.version, publicVersion);
assert.equal(appConfig.expo.extra.appVersion, currentVersion);
assert.equal(JSON.parse(read("apps/mobile/package.json")).version, currentVersion);
assert.equal(JSON.parse(read("apps/mobile/package-lock.json")).version, currentVersion);

const materialRow = mobile.match(/function MaterialRow\([\s\S]*?\n\}\n\ntype MaterialEditValues/)?.[0] ?? "";
const coreRows = materialRow.match(/<View testID="material-core-row"[\s\S]*?<\/View>/g) ?? [];
assert.equal(coreRows.length, 2);
assert.deepEqual(coreRows.map((row) => (row.match(/<CompactInlineEditableField/g) ?? []).length), [3, 3]);
assert.equal((coreRows.join("\n").match(/placeholder=""/g) ?? []).length, 6);
assert.doesNotMatch(coreRows.join("\n"), /placeholder="(?:미입력|0|입력)"/);
assert.match(materialRow, /styles\.materialHeaderUnit[\s\S]*?placeholder=""/);
assert.equal((materialRow.match(/placeholder="사용 부위를 알려주세요"/g) ?? []).length, 1);
assert.equal((materialRow.match(/placeholder="메모를 입력하세요"/g) ?? []).length, 1);

const summary = materialRow.match(/<Text testID="material-order-summary"[\s\S]*?<\/Text>/)?.[0] ?? "";
for (const label of ["발주", "단가", "금액"]) assert.ok(summary.includes(label));
assert.match(summary, /발주 \{orderQuantitySummary\} · 단가 \{unitPriceSummary\} · 금액 \{amountSummary\}/);
assert.match(materialRow, /const orderQuantitySummary = orderQuantityReady[\s\S]*?: "—"/);
assert.match(materialRow, /const unitPriceSummary = unitPriceReady[\s\S]*?: "—"/);
assert.match(materialRow, /const amountSummary = orderQuantityReady && unitPriceReady[\s\S]*?: "—"/);
assert.doesNotMatch(summary, /formatMaterialQuantity\(String\(orderQuantity\)|formatMaterialCurrency\(String\(amount\)/);
assert.match(mobile, /return `\$\{formatMaterialNumber\(parseMaterialNumber\(value\)\)\}\$\{unit \? ` \$\{unit\}` : ""\}`/);

assert.match(inline, /props\.invalid && styles\.invalidLabel/);
assert.match(inline, /props\.invalid && styles\.invalidUnderline/);
assert.match(inline, /compactCell:[\s\S]*?height: COMPACT_FIELD_ROW_HEIGHT/);
assert.doesNotMatch(inline, /compactCell:[\s\S]*?backgroundColor|compactCell:[\s\S]*?borderRadius/);

const cardStyle = mobile.match(/materialDataRow: \{[\s\S]*?\n  \},\n  materialDraftRow:/)?.[0] ?? "";
assert.match(cardStyle, /backgroundColor: "#fffdf8"/);
assert.match(cardStyle, /borderRadius: 8/);
assert.match(cardStyle, /marginBottom: 10/);
assert.match(cardStyle, /paddingVertical: 9/);
assert.doesNotMatch(cardStyle, /shadow|elevation|borderWidth: [2-9]/);
assert.match(mobile, /materialDraftRow:[\s\S]*?borderLeftColor/);
assert.match(mobile, /materialRequestedRow:[\s\S]*?borderLeftColor/);
assert.match(mobile, /materialCompletedRow:[\s\S]*?borderLeftColor/);

assert.equal((materialRow.match(/testID="material-order-action-row"/g) ?? []).length, 1);
const footerIndex = materialRow.indexOf('testID="material-order-action-row"');
assert.ok(footerIndex > materialRow.indexOf("styles.materialFactoryFields"));
assert.doesNotMatch(materialRow.slice(footerIndex), /material-core-row|materialFactoryFields|InlineEditableValue/);
assert.match(mobile, /materialOrderActions:[\s\S]*?flexWrap: "nowrap"/);

assert.match(samplePage, /assertLocalOnlyRouteHost\(\)/);
assert.doesNotMatch(`${preview}\n${renderer}`, /issuedWorkOrderPreviewSample|dev-samples/);
for (const forbidden of ["fetch(", "POST", "PATCH", "PUT", "DELETE", "DATABASE_URL", "storageObjectKey", "tokenHash"]) {
  assert.ok(!`${materialRow}\n${inline}`.includes(forbidden), `material mock contains forbidden ${forbidden}`);
}

assert.match(pipeline, /function AddAlpha36MaterialCardSeparationRepoStateSections/);
assert.equal((pipeline.match(/AddAlpha36MaterialCardSeparationRepoStateSections -Lines \$lines -Version \$Version/g) ?? []).length, 2);
for (const field of [
  "Alpha.36 Product Verification:",
  "Alpha.36 Summary Row Result:",
  "Alpha.36 Core Placeholder Removal:",
  "Alpha.36 Missing State Result:",
  "Alpha.36 Card Separation Result:",
  "Alpha.36 Card Height Before / After:",
  "Alpha.36 Responsive QA:",
  "Alpha.36 PDF / Preview Regression:",
  "Alpha.36 DB / API / R2 / Worker / PDF Lifecycle / Production Mutation:",
]) {
  assert.ok(pipeline.includes(field), `alpha.36 repo-state field missing: ${field}`);
}

console.log("workorder v2 alpha.36 material card separation and summary contract: PASS");
