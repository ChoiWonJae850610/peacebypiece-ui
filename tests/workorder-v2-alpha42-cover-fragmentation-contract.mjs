import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync("components/workorder/preview/IssuedWorkOrderPreview.module.css", "utf8");
const renderer = fs.readFileSync("lib/generated-documents/work-order-pdf/localChromiumRenderer.mts", "utf8");
const readiness = fs.readFileSync("scripts/run-wafl-v2-alpha42-pending-pdf-render-readiness.mjs", "utf8");

const measuredBefore = {
  coverHeightPx: 821.344,
  minHeightPx: 793.701,
  basePaddingEachPx: 45.3543,
};
const printPaddingEachPx = 8 * 96 / 25.4;
const intrinsicContentHeightPx = measuredBefore.coverHeightPx - (2 * measuredBefore.basePaddingEachPx);
const naturalAfterPx = intrinsicContentHeightPx + (2 * printPaddingEachPx);
const computedAfterPx = Math.max(measuredBefore.minHeightPx, naturalAfterPx);
const overflowBeforePx = measuredBefore.coverHeightPx - measuredBefore.minHeightPx;
const recoveredPx = 2 * (measuredBefore.basePaddingEachPx - printPaddingEachPx);

assert.ok(overflowBeforePx > 27 && overflowBeforePx < 28);
assert.ok(recoveredPx > overflowBeforePx);
assert.ok((recoveredPx - overflowBeforePx) / (96 / 25.4) < 0.7);
assert.equal(computedAfterPx, measuredBefore.minHeightPx);
assert.match(css, /@media print \{[\s\S]*?\.coverPage \{ width: 297mm; min-height: 210mm; padding-block: 8mm; \}/);
assert.match(css, /\.pageNumberFooter \{ position: absolute;/);
assert.doesNotMatch(css, /@media print \{[\s\S]*?\.coverPage[^}]*overflow:\s*hidden/);
assert.doesNotMatch(css, /@media print \{[\s\S]*?\.coverPage[^}]*transform:/);
assert.match(renderer, /coverFragmentationOverflowPx/);
assert.match(renderer, /coverFragmentationViolationCount: coverFragmentationOverflowPx > 2 \? 1 : 0/);
assert.match(readiness, /assert\.equal\(pdf\.pageCount, 3\)/);
assert.match(readiness, /pdf\.coverFragmentationOverflowPx <= 2/);
assert.match(readiness, /pdf-page-footer-count-mismatch/);
assert.doesNotMatch(readiness, /skip.*blank|ignore.*blank/i);

console.log(JSON.stringify({
  result: "workorder v2 alpha.42 cover fragmentation contract: PASS",
  overflowBeforePx: Number(overflowBeforePx.toFixed(3)),
  recoveredPx: Number(recoveredPx.toFixed(3)),
  printPaddingBlockMm: 8,
  computedAfterPx: Number(computedAfterPx.toFixed(3)),
}));
