#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { filterMakerVisibleMeasurementTemplates } from "../lib/domain/work-orders/measurement/measurementTemplateVisibilityPolicy.ts";
import { resolveIssuedPdfProcessPresentation } from "../lib/generated-documents/work-order-pdf/processPresentation.ts";
import { formatIssuedDocumentQuantity } from "../lib/generated-documents/work-order-pdf/quantityFormatter.ts";
import { returnToWorkOrderDocument } from "../apps/mobile/features/work-orders/documents/pdfViewerInteractionPolicy.ts";

const read = (path) => fs.readFileSync(path, "utf8");

const overviewPickers = read("apps/mobile/features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx");
const reelOwner = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
assert.match(overviewPickers, /WaflPairedOptionReelPickerSheet|WaflReelPickerSheet/u);
assert.doesNotMatch(overviewPickers, /FlatList|VirtualizedList/u);
assert.match(reelOwner, /export function WaflStaticOptionList/u);
assert.match(reelOwner, /<Pressable/u);
const staticOptionOwner = reelOwner.slice(reelOwner.indexOf("export function WaflStaticOptionList"), reelOwner.indexOf("export default function WaflReelPickerSheet"));
assert.doesNotMatch(staticOptionOwner, /FlatList|ScrollView|VirtualizedList/u);

const visibleTemplates = filterMakerVisibleMeasurementTemplates([
  { id: "current", sourceKind: "system" },
  { id: "qa-a62", sourceKind: "system" },
  { id: "company", sourceKind: "company" },
], "current");
assert.deepEqual(visibleTemplates.map((template) => template.id), ["current", "company"]);

let closeCount = 0;
returnToWorkOrderDocument(() => { closeCount += 1; });
assert.equal(closeCount, 1);
const viewer = read("apps/mobile/features/work-orders/documents/WaflAuthenticatedPdfViewer.tsx");
assert.match(viewer, /WaflPrimaryActionButton/u);
assert.match(viewer, /accessibilityLabel="작업지시서 보기 닫기"/u);
assert.match(viewer, /testID="authenticated-pdf-viewer-footer"/u);
assert.match(viewer, /testID="authenticated-pdf-viewer-close"/u);
assert.match(viewer, /onPress=\{handleReturnToDocument\}/u);
assert.match(viewer, /horizontal=\{false\}/u);
assert.match(viewer, /enableDoubleTapZoom/u);
assert.match(viewer, /\$\{page\} \/ \$\{pageCount\}/u);
assert.doesNotMatch(viewer, /문서로 돌아가기|이전 페이지|다음 페이지|PdfRef|pdfRef\.current|\.setPage\(/u);

const basic = { role: "factory", partnerName: "  한강 봉제 공장  ", id: "basic" };
const additional = { role: "additional", partnerName: "성수 나염 업체", id: "additional" };
assert.deepEqual(resolveIssuedPdfProcessPresentation([basic]), {
  basicProcessPartnerName: "한강 봉제 공장",
  additionalProcesses: [],
});
assert.deepEqual(resolveIssuedPdfProcessPresentation([basic, additional]), {
  basicProcessPartnerName: "한강 봉제 공장",
  additionalProcesses: [additional],
});
assert.equal(resolveIssuedPdfProcessPresentation([]).basicProcessPartnerName, "미지정");

const document = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
assert.match(document, /label="기본 공정 업체"/u);
assert.match(document, /title="추가 공정"/u);
assert.match(document, /additionalProcesses/u);
assert.doesNotMatch(document, /<dt>개정차수<\/dt>|title="제작 공정·추가 공정"/u);
for (const [input, expected] of [["1.000", "1"], ["0.000", "0"], ["1.500", "1.5"]]) {
  assert.equal(formatIssuedDocumentQuantity(input), expected);
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha67-viewer-close-pdf-process-picker-cleanup",
  previousPermanentInventoryRetained: 172,
  addedPermanentChecks: 1,
  finalPermanentInventory: 173,
  physicalResultInferred: false,
}));
