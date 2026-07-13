#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const mobile = read("apps/mobile/components/ProductionCardMock.tsx");
const inline = read("apps/mobile/components/InlineEditableFields.tsx");
const loader = read("components/workorder/preview/IssuedWorkOrderPreview.tsx");
const renderer = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
const css = read("components/workorder/preview/IssuedWorkOrderPreview.module.css");
const sample = read("lib/internal/samples/issuedWorkOrderPreviewSample.ts");
const samplePage = read("app/dev/workorder-preview-sample/page.tsx");

for (const name of ["InlineEditableValue", "ReadOnlyInlineValue"]) assert.match(inline, new RegExp(`export function ${name}`));
assert.match(inline, /borderStyle: "dotted"/);
assert.match(inline, /COMPACT_FIELD_VALUE_TEXT/);
assert.match(inline, /numberOfLines=\{1\}/);
assert.match(inline, /event\.nativeEvent\.key === "Escape"/);
assert.doesNotMatch(inline, /ExpandableInlineNote|noteEditingRow|noteInput/);
assert.doesNotMatch(inline, /borderRadius|backgroundColor/);
assert.match(mobile, /<InlineEditableValue[\s\S]*label="사용 부위"/);
assert.match(mobile, /<InlineEditableValue[\s\S]*label="작업 메모"/);
assert.doesNotMatch(mobile, /label="적용 부위"|label="적용 색상·대상"/);
assert.doesNotMatch(mobile, /compactInstructionInput|instructionSummary|factoryInstructionInput/);

assert.match(loader, /<IssuedWorkOrderDocument data=\{data\}/);
assert.doesNotMatch(loader, /<table|documentHeader|MaterialTable/);
assert.match(renderer, /export function formatRevisionLabel/);
assert.match(renderer, /return `\$\{revisionNumber\}차`/);
assert.match(renderer, /packBlocks\(buildBlocks\(data\)\)/);
assert.match(renderer, /factoryDeliveryMemo[\s\S]*header\.memo/);
assert.doesNotMatch(renderer, /통합 작업 지침|주의사항|penSpace|R\{data\.document\.revisionNumber\}/);
assert.match(renderer, /quantityUnit \? `\$\{number\.format\(data\.header\.totalQuantity\)\}\$\{quantityUnit\}` : number\.format/);
assert.match(css, /@page cover \{ size: A4 landscape/);
assert.match(css, /@page content \{ size: A4 portrait/);
assert.match(css, /grid-template-columns: minmax\(0,58fr\) minmax\(300px,42fr\)/);
assert.match(css, /thead \{ display: table-header-group/);
assert.match(css, /tr \{ break-inside: avoid/);
assert.doesNotMatch(css, /penSpace/);

for (const token of ["리넨 라운드 셔츠 원피스", "144", "IVORY", "NAVY", "BLACK", "천연 자개 단추", "케어라벨", "행택끈", "플리백", "재단", "봉제", "워싱", "검품·포장"]) assert.ok(sample.includes(token), `sample missing ${token}`);
for (const triplet of ["[0, 0, 8]", "[0, 1, 16]", "[0, 2, 8]", "[1, 0, 12]", "[1, 1, 24]", "[1, 2, 12]", "[2, 0, 16]", "[2, 1, 32]", "[2, 2, 16]"]) assert.ok(sample.includes(triplet));
assert.match(samplePage, /assertLocalOnlyRouteHost\(\)/);
assert.doesNotMatch(`${sample}\n${samplePage}`, /fetch\(|\/api\/v2|storage_object_key|token_hash|DATABASE_URL/);
assert.ok(fs.existsSync(path.join(root, "public/dev-samples/linen-round-dress-sketch.svg")));

console.log("workorder v2 alpha.31 inline Preview layout contract: PASS");
