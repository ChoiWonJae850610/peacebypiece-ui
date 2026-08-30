#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  ISSUED_PDF_ATTACHMENT_COLUMNS,
  ISSUED_PDF_ATTACHMENT_IMAGES_PER_PAGE,
  ISSUED_PDF_ATTACHMENT_ROWS_PER_PAGE,
  paginateIssuedPdfAttachmentImages,
} from "../lib/generated-documents/work-order-pdf/paginationPolicy.ts";

const documentSource = fs.readFileSync("components/workorder/preview/IssuedWorkOrderDocument.tsx", "utf8");
const styles = fs.readFileSync("components/workorder/preview/IssuedWorkOrderPreview.module.css", "utf8");
const versionSource = fs.readFileSync("lib/constants/version.ts", "utf8");

assert.match(versionSource, /2\.0\.0-alpha\.(?:69|70|71)/);
assert.equal(ISSUED_PDF_ATTACHMENT_COLUMNS, 2);
assert.equal(ISSUED_PDF_ATTACHMENT_ROWS_PER_PAGE, 5);
assert.equal(ISSUED_PDF_ATTACHMENT_IMAGES_PER_PAGE, 10);
for (const count of [1, 2, 5, 10]) {
  const pages = paginateIssuedPdfAttachmentImages(Array.from({ length: count }, (_, index) => index));
  assert.equal(pages.length, 1, `${count} supplemental images must stay on one page`);
  assert.equal(pages[0].length, count);
}
const elevenPages = paginateIssuedPdfAttachmentImages(Array.from({ length: 11 }, (_, index) => index));
assert.deepEqual(elevenPages.map((page) => page.length), [10, 1]);
assert.deepEqual(paginateIssuedPdfAttachmentImages([]), []);

assert.match(styles, /\.coverMain\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*58fr\)\s+minmax\(0,\s*42fr\)/s);
assert.doesNotMatch(styles, /grid-template-columns:\s*minmax\(0,\s*43fr\)\s+minmax\(0,\s*57fr\)/);
for (const token of [
  ["--pdf-cover-title-size", 46],
  ["--pdf-fact-label-size", 9.6],
  ["--pdf-fact-value-size", 13.2],
  ["--pdf-summary-label-size", 9],
  ["--pdf-summary-value-size", 17],
  ["--pdf-summary-detail-size", 8],
  ["--pdf-detail-heading-size", 14],
  ["--pdf-table-size", 10.8],
  ["--pdf-footer-size", 8.5],
]) {
  assert.match(styles, new RegExp(`${token[0]}:\\s*${String(token[1]).replace(".", "\\.")}px`));
}
assert.match(styles, /\.coverFact:nth-child\(1\) dd\s*\{[^}]*font-size:\s*12px/s);
assert.match(styles, /\.coverFact:nth-child\(9\) dd\s*\{[^}]*font-size:\s*9\.4px/s);
assert.match(styles, /\.representativeImage\s*\{[^}]*object-fit:\s*contain/s);
assert.doesNotMatch(styles.match(/\.representativeImage\s*\{[^}]*\}/s)?.[0] ?? "", /filter\s*:/);
assert.match(styles, /\.attachmentGrid\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
assert.match(styles, /\.includedAttachmentImage\s*\{[^}]*height:\s*35mm[^}]*object-fit:\s*contain/s);
assert.doesNotMatch(documentSource, /index\s*\+=\s*2/);
assert.match(documentSource, /paginateIssuedPdfAttachmentImages\(images\)/);

const factLabels = [
  "기본 공정 업체",
  "납기일",
  "총 수량",
  "장당 공임비",
  "시즌",
  "대상",
  "대분류",
  "세부품목",
  "문서 번호",
  "총 공임비",
];
let previousIndex = -1;
for (const label of factLabels) {
  const index = documentSource.indexOf(`label=\"${label}\"`);
  assert.ok(index > previousIndex, `cover fact missing or reordered: ${label}`);
  previousIndex = index;
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha70-pdf-first-page-image-balance-readability",
  previousPermanentInventoryRetained: 212,
  addedPermanentChecks: 1,
  finalPermanentInventory: 213,
  coverImageFactRatio: "58/42",
  supplementalImagesPerPage: ISSUED_PDF_ATTACHMENT_IMAGES_PER_PAGE,
  physicalResultInferred: false,
}));
