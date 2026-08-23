#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const pickers = read("apps/mobile/features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx");
const reelOwner = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
assert.match(pickers, /WaflPairedOptionReelPickerSheet/u);
assert.match(pickers, /leftLabel="연도"[\s\S]*rightLabel="시즌"/u);
assert.match(pickers, /WORK_ORDER_SEASON_TERMS\.map/u);
assert.match(pickers, /field="categoryDetail"[\s\S]*kind="option"/u);
assert.equal((pickers.match(/WaflInputModeSwitch mode="picker"/gu) ?? []).length, 2);
assert.equal((pickers.match(/WaflInputModeSwitch mode="direct"/gu) ?? []).length, 2);
assert.doesNotMatch(pickers, /WaflOptionGrid|FlatList|VirtualizedList/u);
assert.match(reelOwner, /export function WaflPairedOptionReelPickerSheet/u);
assert.match(reelOwner, /sizing="reelAdaptive"/u);
assert.match(reelOwner, /<WaflOptionReel[\s\S]*<WaflOptionReel/u);

const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
assert.match(production, /cancel: \{ label: "발주 취소", caption: "취소", Icon: RotateCcw, emphasized: false, danger: true \}/u);

const pdf = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
const pdfStyles = read("components/workorder/preview/IssuedWorkOrderPreview.module.css");
for (const token of ["coverPage", "coverImageFrame", "coverFactGrid", "deliveryMemo", "coverSummary", "SectionHeading", "IncludedAttachmentGrid", "DocumentFooter"]) assert.match(pdf, new RegExp(token));
for (const icon of ["CalendarDays", "AccessoryButtonIcon", "Factory", "ImageIcon", "Layers3", "Package", "Palette", "Ruler", "Shirt", "Spool"]) assert.match(pdf, new RegExp(icon));
for (const token of ["납기일", "총 수량", "대상", "시즌", "대분류", "세부품목", "기본 공정 업체", "문서 번호", "장당 공임비", "총 공임비", "공장 전달 메모"]) assert.match(pdf, new RegExp(token));
for (const token of ["원단", "부자재", "색상", "사이즈", "추가 공정"]) assert.match(pdf, new RegExp(`label: "${token}"`));
assert.match(pdf, /if \(identity\.reorderRound > 0\) return \[`\$\{identity\.reorderRound\}차 리오더`\]/u);
assert.doesNotMatch(pdf, /진행 중|개정차수|data-wafl-embedded-qr|QRCode|QrCode/u);
assert.doesNotMatch(pdfStyles, /qr|statusBadge/u);
assert.match(pdfStyles, /grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/u);
assert.match(pdfStyles, /--pdf-ink: #111111/u);
assert.match(pdfStyles, /--pdf-page: #ffffff/u);
assert.match(pdfStyles, /--pdf-card: #ffffff/u);
assert.match(pdfStyles, /--pdf-table-head: #f3f3f3/u);
assert.match(pdf, /if \(data\.sizeColors\.colors\.length && data\.sizeColors\.sizes\.length\)/u);
assert.match(pdf, /paginateWeightedRows/u);
assert.match(pdf, /textRowWeight/u);
assert.match(pdf, /continued=\{index > 0\}/u);
assert.match(pdf, /for \(let index = 0; index < images\.length; index \+= 2\)/u);

const generation = read("lib/generated-documents/work-order-pdf/generationService.ts");
const generationRepository = read("lib/generated-documents/work-order-pdf/generationRepository.ts");
const accessRepository = read("lib/generated-documents/document-access/repository.ts");
const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
for (const source of [generation, generationRepository]) assert.doesNotMatch(source, /createEmbeddedQrAccessToken|embeddedQrPolicy|embeddedQrContext|token_purpose\s*,\s*'embedded_qr'/u);
assert.match(accessRepository, /token_purpose = 'embedded_qr'/u);
assert.match(workbench, /tokenPurpose === "manual_share"/u);
assert.doesNotMatch(workbench, />PDF QR<|title="PDF QR"/u);

const evidence = read("lib/generated-documents/work-order-pdf/sampleRedesignEvidence.ts");
for (const scenario of ["normal", "rich", "sparse"]) assert.match(evidence, new RegExp(`"${scenario}"`));
assert.match(evidence, /reorderRound: 3/u);
assert.match(evidence, /fabrics: \[\], accessories: \[\]/u);
assert.match(evidence, /identity: \{ isSample: true, derivationKind: "original", reorderRound: 0 \}/u);
assert.match(evidence, /봉제 디테일\.jpg/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha67-final-pdf-redesign-picker-reel-polish",
  previousPermanentInventoryRetained: 174,
  addedPermanentChecks: 1,
  finalPermanentInventory: 175,
  physicalResultInferred: false,
}));
