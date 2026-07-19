#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const mobile = read("apps/mobile/components/ProductionCardMock.tsx");
const inline = read("apps/mobile/components/InlineEditableFields.tsx");
const uiCatalog = read("app/ui/WaflUiCatalogPage.tsx");
const samplePage = read("app/dev/workorder-preview-sample/page.tsx");
const sampleComponent = read("components/workorder/preview/SampleIssuedWorkOrderPreview.tsx");
const actualPreview = read("components/workorder/preview/IssuedWorkOrderPreview.tsx");
const renderer = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
const sample = read("lib/internal/samples/issuedWorkOrderPreviewSample.ts");
const svg = read("public/dev-samples/linen-round-dress-sketch.svg");
const css = read("components/workorder/preview/IssuedWorkOrderPreview.module.css");

const currentVersion = read("lib/constants/version.ts").match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
assert.ok(["2.0.0-alpha.38", "2.0.0-alpha.39", "2.0.0-alpha.40", "2.0.0-alpha.41", "2.0.0-alpha.42", "2.0.0-alpha.43", "2.0.0-alpha.44", "2.0.0-alpha.45", "2.0.0-alpha.46", "2.0.0-alpha.47", "2.0.0-alpha.48", "2.0.0-alpha.49"].includes(currentVersion));
assert.match(read("apps/mobile/constants/version.ts"), new RegExp(currentVersion.replaceAll(".", "\\.")));
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const publicVersion = currentVersion.replace(/-.+$/, "");
assert.match(publicVersion, /^\d+\.\d+\.\d+$/);
assert.equal(appConfig.expo.version, publicVersion);
assert.equal(appConfig.expo.extra.appVersion, currentVersion);
assert.equal(JSON.parse(read("apps/mobile/package.json")).version, currentVersion);

assert.match(samplePage, /assertLocalOnlyRouteHost\(\)/);
assert.match(uiCatalog, /href="\/dev\/workorder-preview-sample"/);
assert.match(uiCatalog, />\s*실무 샘플 보기\s*</);
assert.match(sampleComponent, /실무형 샘플 작업지시서/);
assert.doesNotMatch(actualPreview, /issuedWorkOrderPreviewSample|SampleIssuedWorkOrderPreview|dev-samples/);
assert.doesNotMatch(renderer, /issuedWorkOrderPreviewSample|linen-round-dress-sketch/);
assert.match(renderer, /"apparel\.top": "상의"/);
assert.match(renderer, /PRODUCT_TYPE_LABELS\[code\] \?\? code/);

for (const token of [
  "리넨 라운드 셔츠 원피스",
  "여성 원피스 / 여름 1차 생산",
  "WAFN-26FW-O-LNDRS-260713-001-R0",
  "성수 어패럴",
  "김생산",
  "동대문 패브릭랩",
  "서울 안감상사",
  "천연 자개 단추",
  "케어라벨",
  "행택끈",
  "플리백",
  "성수 재단실",
  "한강 봉제",
  "성수 워싱",
  "본사 검품팀",
]) assert.ok(`${sample}\n${sampleComponent}`.includes(token), `realistic sample missing ${token}`);
for (const forbidden of ["alpha.25", "alpha.26", "Command runtime", "synthetic", "approved dev/test", "apparel.top"]) {
  assert.ok(!`${sample}\n${sampleComponent}\n${svg}`.includes(forbidden), `user-facing sample contains ${forbidden}`);
}
for (const token of ["앞면", "뒷면", "실무형 제품 도식"]) assert.ok(svg.includes(token), `product board missing ${token}`);
assert.doesNotMatch(svg, />IVORY<|>NAVY<|>BLACK<|색상 기준/);
assert.doesNotMatch(svg, /(?:href|src)=["']https?:\/\//i);
assert.doesNotMatch(svg, /DEV SAMPLE|A4 PREVIEW SAMPLE/);
for (const triplet of ["[0, 0, 8]", "[0, 1, 16]", "[0, 2, 8]", "[1, 0, 12]", "[1, 1, 24]", "[1, 2, 12]", "[2, 0, 16]", "[2, 1, 32]", "[2, 2, 16]"]) assert.ok(sample.includes(triplet));
assert.match(sample, /matrixTotal: "144"/);
assert.match(sample, /expectedTotal: "144"/);
assert.match(sample, /totalsMatch: true/);
assert.ok((sample.match(/material\("4/g) ?? []).length >= 2);
assert.ok((sample.match(/material\("5/g) ?? []).length >= 4);
assert.ok((sample.match(/displayName:/g) ?? []).length >= 8);
assert.ok((sample.match(/\["(?:재단|봉제|워싱|검품·포장)"/g) ?? []).length >= 4);

const processHeader = renderer.match(/<table className=\{styles\.processTable\}[\s\S]*?<\/thead>/)?.[0] ?? "";
assert.equal((processHeader.match(/<th>/g) ?? []).length, 6);
assert.doesNotMatch(processHeader, /적용 부위|적용 색상|적용 대상/);
assert.match(css, /@page cover \{ size: A4 landscape/);
assert.match(css, /@page content \{ size: A4 portrait/);

const materialRow = mobile.match(/function MaterialRow\([\s\S]*?\n\}\n\ntype MaterialEditValues/)?.[0] ?? "";
const orderedMarkers = [
  "styles.rowHead",
  "styles.materialCoreRow",
  "styles.materialFactoryFields",
  'label="사용 부위"',
  'label="메모"',
  "styles.materialOrderActionRow",
];
let previous = -1;
for (const marker of orderedMarkers) {
  const index = materialRow.indexOf(marker);
  assert.ok(index > previous, `material card order failed at ${marker}`);
  previous = index;
}
const afterFooter = materialRow.slice(materialRow.indexOf("styles.materialOrderActionRow"));
assert.doesNotMatch(afterFooter, /InlineEditableValue|materialCoreRow/);
assert.doesNotMatch(materialRow, /materialActionInline|materialMetaLine|position:\s*["']absolute/);
assert.match(mobile, /materialOrderActionRow:[\s\S]*?borderTopWidth: 1/);
assert.match(inline, /height: COMPACT_FIELD_ROW_HEIGHT/);
assert.match(inline, /multiline=\{false\}/);
assert.match(inline, /if \(cancelledRef\.current \|\| completedRef\.current\) return/);
assert.match(inline, /if \(!props\.editable\) return <ReadOnlyInlineValue/);

for (const forbidden of ["fetch(", "POST", "PATCH", "PUT", "DELETE", "DATABASE_URL", "storageObjectKey", "tokenHash"]) {
  assert.ok(!`${sample}\n${samplePage}\n${sampleComponent}`.includes(forbidden), `sample route contains forbidden ${forbidden}`);
}

console.log("workorder v2 alpha.33 realistic Preview and material card flow contract: PASS");
