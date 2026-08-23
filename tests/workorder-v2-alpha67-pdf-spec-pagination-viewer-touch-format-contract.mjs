#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { returnToWorkOrderDocument } from "../apps/mobile/features/work-orders/documents/pdfViewerInteractionPolicy.ts";
import {
  ISSUED_PDF_CONTENT_PAGE_CAPACITY,
  issuedPdfSizeSpecWeight,
  packIssuedPdfBlocks,
  paginateIssuedPdfSizeSpecRows,
} from "../lib/generated-documents/work-order-pdf/paginationPolicy.ts";
import { formatIssuedDocumentQuantity } from "../lib/generated-documents/work-order-pdf/quantityFormatter.ts";

const read = (path) => fs.readFileSync(path, "utf8");

let closeCount = 0;
returnToWorkOrderDocument(() => { closeCount += 1; });
assert.equal(closeCount, 1, "the wired return action must invoke the Document-context close callback exactly once");

const viewer = read("apps/mobile/features/work-orders/documents/WaflAuthenticatedPdfViewer.tsx");
assert.match(viewer, /accessibilityLabel="작업지시서 보기 닫기"/u);
assert.match(viewer, /accessibilityRole="button"/u);
assert.match(viewer, /onPress=\{handleReturnToDocument\}/u);
assert.match(viewer, /returnToWorkOrderDocument\(onClose\)/u);
assert.match(viewer, /WaflPrimaryActionButton/u);
assert.match(viewer, /authenticated-pdf-viewer-footer/u);
assert.doesNotMatch(viewer, /문서로 돌아가기|이전 페이지|다음 페이지/u);

const smallRows = Array.from({ length: 5 }, (_, index) => index);
const ownerLikeRows = Array.from({ length: 16 }, (_, index) => index);
const oversizedRows = Array.from({ length: 30 }, (_, index) => index);
assert.deepEqual(paginateIssuedPdfSizeSpecRows(smallRows).map((rows) => rows.length), [5]);
assert.deepEqual(paginateIssuedPdfSizeSpecRows(ownerLikeRows).map((rows) => rows.length), [16]);
assert.deepEqual(paginateIssuedPdfSizeSpecRows(oversizedRows).map((rows) => rows.length), [15, 15]);

const preceding = { key: "materials-and-quantity", weight: 20 };
const ownerSpec = { key: "size-spec", startsNewPage: true, weight: issuedPdfSizeSpecWeight(ownerLikeRows.length) };
assert.ok(ownerSpec.weight <= ISSUED_PDF_CONTENT_PAGE_CAPACITY);
assert.deepEqual(
  packIssuedPdfBlocks([preceding, ownerSpec]).map((page) => page.map((block) => block.key)),
  [["materials-and-quantity"], ["size-spec"]],
  "a section that fits a clean page must move as a whole when the current remainder is insufficient",
);
const oversizedGroups = paginateIssuedPdfSizeSpecRows(oversizedRows);
const oversizedBlocks = oversizedGroups.map((rows, index) => ({
  key: `size-spec-${index}`,
  startsNewPage: index === 0,
  weight: issuedPdfSizeSpecWeight(rows.length),
}));
assert.deepEqual(
  packIssuedPdfBlocks([preceding, ...oversizedBlocks]).map((page) => page.map((block) => block.key)),
  [["materials-and-quantity"], ["size-spec-0"], ["size-spec-1"]],
);

for (const [input, expected] of [
  ["1.000", "1"],
  ["0.000", "0"],
  ["1.500", "1.5"],
  ["1.250", "1.25"],
  ["0.125", "0.125"],
]) assert.equal(formatIssuedDocumentQuantity(input), expected);

const document = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
assert.match(document, /formatIssuedDocumentQuantity\(quantity\)/u);
assert.match(document, /paginateIssuedPdfSizeSpecRows/u);
assert.match(document, /continued=\{index > 0\}/u);
assert.doesNotMatch(document, /chunk\(data\.sizeSpecifications\.pomColumns,\s*7\)/u);

const fullView = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const frozenTable = read("apps/mobile/features/layout/WaflFrozenAxisTable.tsx");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
assert.match(fullView, /bodyScrollable=\{fullView === "spec"\}/u);
assert.match(fullView, /총 \{currentSpecifications\.pomColumns\.length\}개 항목/u);
assert.match(fullView, /아래 항목 더 있음/u);
assert.match(fullView, /parentOwnsVerticalScroll/u);
assert.match(frozenTable, /fullViewVerticalOwner === "parent"/u);
assert.match(frozenTable, /fillSingleColumn/u);
assert.match(frozenTable, /expandedSingleDataCell/u);
assert.match(sheet, /canScrollFurther/u);
assert.match(sheet, /contentHeight - WAFL_THEME\.spacing\.lg/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha67-pdf-spec-pagination-viewer-touch-format",
  ownerLikePomPages: [16],
  oversizedPomPages: oversizedGroups.map((rows) => rows.length),
  viewerReturnInvocations: closeCount,
  previousPermanentInventoryRetained: 171,
  addedPermanentChecks: 1,
  finalPermanentInventory: 172,
  physicalResultInferred: false,
}));
