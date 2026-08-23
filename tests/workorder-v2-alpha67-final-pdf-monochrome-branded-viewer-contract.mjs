#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { formatMeasurementFromCm } from "../apps/mobile/domain/measurementPolicy.ts";
import { resolveIssuedPdfCostPresentation } from "../lib/generated-documents/work-order-pdf/costPresentation.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const source = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
const styles = read("components/workorder/preview/IssuedWorkOrderPreview.module.css");

const coverLabels = [
  "기본 공정 업체", "납기일",
  "총 수량", "장당 공임비",
  "시즌", "대상",
  "대분류", "세부품목",
  "문서 번호", "총 공임비",
];
const positions = coverLabels.map((label) => source.indexOf(`label="${label}"`));
assert.ok(positions.every((position) => position >= 0));
assert.deepEqual([...positions].sort((a, b) => a - b), positions);
assert.equal((source.match(/<CoverFact /gu) ?? []).length, 10);
assert.doesNotMatch(source, /label="공임비"|label="총 예상금액"/u);

const cost = resolveIssuedPdfCostPresentation({
  processes: [
    { role: "additional", unitPrice: "250.00", amount: "25000.00" },
    { role: "factory", unitPrice: "9800.00", amount: "1411200.00" },
  ],
});
assert.deepEqual(cost, { basicProcessUnitPrice: "9800.00", basicProcessLaborAmount: "1411200.00" });
assert.equal(BigInt(cost.basicProcessUnitPrice.replace(".00", "")) * 144n, BigInt(cost.basicProcessLaborAmount.replace(".00", "")));
assert.doesNotMatch(read("lib/generated-documents/work-order-pdf/costPresentation.ts"), /estimatedTotal|\*|Number\([^)]*unitPrice/u);

assert.match(source, /createLucideIcon\("WaflFourHoleButton"[\s\S]*hole-1[\s\S]*hole-2[\s\S]*hole-3[\s\S]*hole-4/u);
assert.match(source, /fabric: Spool,[\s\S]*accessory: AccessoryButtonIcon/u);
assert.doesNotMatch(source, /CircleDotDashed/u);

assert.equal(formatMeasurementFromCm(64.5, "cm"), "64.5");
assert.equal(formatMeasurementFromCm(64.5, "inch"), "25 3/8");
assert.match(source, /for \(const unit of \["cm", "inch"\] as const\)/u);
assert.match(source, /startsNewPage: index === 0/u);
assert.match(source, /formatMeasurementFromCm\(centimeters, unit\)/u);
assert.doesNotMatch(source, /title=\{`완성 스펙 \(\$\{spec\.measurementUnit\}\)`\}/u);

const documentStyles = styles.slice(styles.indexOf(".document"), styles.indexOf(".message"));
const hexColors = [...documentStyles.matchAll(/#[0-9a-f]{6}\b/giu)].map((match) => match[0].slice(1));
assert.ok(hexColors.length > 0);
for (const color of hexColors) {
  assert.equal(color.slice(0, 2), color.slice(2, 4), `non-neutral red/green channels in #${color}`);
  assert.equal(color.slice(2, 4), color.slice(4, 6), `non-neutral green/blue channels in #${color}`);
}
assert.match(styles, /--pdf-page: #ffffff/u);
assert.match(styles, /--pdf-card: #ffffff/u);
assert.doesNotMatch(documentStyles, /#102747|#a94b28|#fffdf8|#fff0e2|#f3eee6/u);
assert.doesNotMatch(styles, /\.representativeImage[^}]*filter:/u);
assert.doesNotMatch(styles, /\.includedAttachmentImage[^}]*filter:/u);

const branded = read("tests/workorder-v2-alpha67-branded-public-viewer-domain-contract.mjs");
for (const token of ["share.wafl.co.kr", "isPublicDocumentViewerPathAllowed", "WAFL_PUBLIC_DOCUMENT_VIEWER_ORIGIN"]) {
  assert.match(branded, new RegExp(token.replaceAll(".", "\\."), "u"));
}

const runtimeCommon = read("tools/dev/wafl-external-qa-common.ps1");
const runtimeStart = read("tools/dev/start-wafl-external-qa.ps1");
assert.match(runtimeStart, /publicDocumentViewerOrigin = \$publicDocumentViewerOriginNormalized/u);
assert.match(runtimeCommon, /approved-shared-public-viewer/u);
assert.match(runtimeCommon, /signed-foreign-service-and-exact-branded-viewer-ingress/u);
assert.match(runtimeCommon, /routeOriginIsLoopback[\s\S]*routeOriginPort -eq \[int\]\$State\.nextPort/u);
assert.match(runtimeCommon, /hostname\.Equals\(\$publicViewerHostname/u);
assert.match(runtimeCommon, /Ready = \$waflOwnedCount -eq 0 -and \$forbiddenCount -eq 0 -and \$unverifiedCount -eq 0/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha67-final-pdf-monochrome-branded-viewer",
  previousPermanentInventoryRetained: 178,
  addedPermanentChecks: 1,
  finalPermanentInventory: 179,
  physicalResultInferred: false,
}));
