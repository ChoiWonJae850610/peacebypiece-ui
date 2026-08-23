#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const documentSource = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
const styles = read("components/workorder/preview/IssuedWorkOrderPreview.module.css");
const orientation = read("lib/generated-documents/work-order-pdf/pdfPageOrientation.mjs");
const evidence = read("lib/generated-documents/work-order-pdf/sampleRedesignEvidence.ts");

assert.match(orientation, /const expectedOrientation = "portrait"/u);
assert.doesNotMatch(orientation, /pageIndex === 0[^\n]*landscape/u);
assert.match(styles, /@page cover \{\s*size: A4 portrait;/u);
assert.match(styles, /\.coverPage \{[\s\S]*width: 210mm;[\s\S]*min-height: 297mm;/u);

for (const label of ["기본 공정 업체", "납기일", "총 수량", "장당 공임비", "시즌", "대상", "대분류", "세부품목", "문서 번호", "총 공임비"]) {
  assert.match(documentSource, new RegExp(`label="${label}"`, "u"));
}
assert.match(documentSource, /<CoverFact[^>]+label="문서 번호"/u);
for (const label of ["공장 전달 메모", "원단", "부자재", "색상·사이즈 수량", "완성 스펙", "추가 공정", "첨부 이미지"]) {
  assert.match(documentSource, new RegExp(label));
}
for (const chip of ["01", "02", "03", "04", "05", "06"]) assert.match(documentSource, new RegExp(`"${chip}"`, "u"));

assert.match(styles, /\.coverFactGrid \{[\s\S]*grid-template-columns: repeat\(2,\s*minmax\(0,\s*1fr\)\)/u);
assert.match(styles, /grid-template-rows: repeat\(5,minmax\(0,1fr\)\)/u);
assert.match(styles, /\.coverSummary \{[\s\S]*grid-template-columns: repeat\(5,\s*minmax\(0,\s*1fr\)\)/u);
assert.match(styles, /--pdf-cover-title-size: 46px/u);
assert.match(styles, /\.coverProductHeading h1 \{[\s\S]*font-size: var\(--pdf-cover-title-size\);/u);
assert.match(styles, /\.page th, \.page td \{[\s\S]*text-align: center;/u);
assert.match(styles, /\.textCell \{[\s\S]*text-align: left/u);
assert.match(documentSource, /paginateWeightedRows\(rows,[\s\S]*, 5, 7\)/u);
assert.match(documentSource, /for \(let index = 0; index < images\.length; index \+= 2\)/u);
assert.match(documentSource, /continued=\{index > 0\}/u);
assert.match(documentSource, /DocumentFooter/u);

assert.doesNotMatch(documentSource, /진행 중|개정차수|QRCode|QrCode|data-wafl-embedded-qr/u);
assert.doesNotMatch(styles, /@page cover \{\s*size: A4 landscape/u);
for (const scenario of ["normal", "rich", "sparse"]) assert.match(evidence, new RegExp(`"${scenario}"`, "u"));

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha67-portrait-pdf-visual-fidelity",
  previousPermanentInventoryRetained: 175,
  addedPermanentChecks: 1,
  finalPermanentInventory: 176,
  physicalResultInferred: false,
}));
