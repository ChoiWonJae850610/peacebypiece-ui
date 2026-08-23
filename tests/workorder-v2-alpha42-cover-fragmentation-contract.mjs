import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync("components/workorder/preview/IssuedWorkOrderPreview.module.css", "utf8");
const renderer = fs.readFileSync("lib/generated-documents/work-order-pdf/localChromiumRenderer.mts", "utf8");
const readiness = fs.readFileSync("scripts/run-wafl-v2-alpha42-pending-pdf-render-readiness.mjs", "utf8");

assert.match(css, /\.coverPage \{ page: cover; width: min\(100%, 210mm\); min-height: 297mm; padding: 10mm 12mm 15mm; overflow: hidden; \}/);
assert.match(css, /\.coverMain \{ height: 146mm;/);
assert.match(css, /\.deliveryMemo \{ min-height: 28mm;/);
assert.match(css, /\.coverSummary \{ height: 27mm;/);
assert.match(css, /@media print \{[\s\S]*?\.coverPage \{ width: 210mm; height: 297mm; min-height: 297mm; \}/);
assert.match(css, /\.pageNumberFooter \{ position: absolute;/);
assert.match(css, /\.coverImageFrame \{ min-height: 0;[\s\S]*?overflow: hidden; \}/);
assert.match(css, /\.representativeImage \{ display: block; width: 100%; height: 100%; object-fit: contain;/);
assert.doesNotMatch(css, /@media print \{[\s\S]*?\.coverPage[^}]*transform:/);
assert.match(renderer, /coverFragmentationOverflowPx/);
assert.match(renderer, /coverFragmentationViolationCount: coverFragmentationOverflowPx > 2 \? 1 : 0/);
assert.match(readiness, /assert\.equal\(pdf\.pageCount, 3\)/);
assert.match(readiness, /pdf\.coverFragmentationOverflowPx <= 2/);
assert.match(readiness, /pdf-page-footer-count-mismatch/);
assert.doesNotMatch(readiness, /skip.*blank|ignore.*blank/i);

console.log(JSON.stringify({
  result: "workorder v2 alpha.42 cover fragmentation contract: PASS",
  coverOrientation: "portrait",
  coverMainHeightMm: 146,
  coverSummaryHeightMm: 27,
}));
