#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  composeWorkOrderSeason,
  parseWorkOrderSeason,
  workOrderDetailItemOptions,
  workOrderSeasonYearOptions,
} from "../lib/domain/work-orders/catalog/workOrderOverviewPickerPolicy.ts";
import { evaluateWorkOrderIssueReadiness } from "../lib/domain/work-orders/issueReadiness.ts";
import { formatMeasurementFromCm } from "../apps/mobile/domain/measurementPolicy.ts";
import {
  getWaflBasicSpecTemplate,
  projectWaflBasicSpecValues,
  WAFL_BASIC_SPEC_V1_VERSION,
} from "../lib/domain/work-orders/measurement/waflBasicSpecV1.ts";

const read = (path) => fs.readFileSync(path, "utf8");

assert.deepEqual(workOrderSeasonYearOptions(2026), ["2025", "2026", "2027", "2028"]);
assert.equal(composeWorkOrderSeason("2026", "SS"), "26SS");
assert.equal(composeWorkOrderSeason("2026", "FW"), "26FW");
assert.deepEqual(parseWorkOrderSeason("26상시", 2026), { year: "2026", term: "상시" });
assert.equal(parseWorkOrderSeason("legacy-season", 2026), null);

assert.deepEqual(workOrderDetailItemOptions("T"), ["티셔츠", "셔츠", "블라우스", "니트", "맨투맨", "후드", "탑·나시", "폴로"]);
assert.deepEqual(workOrderDetailItemOptions("B"), ["팬츠", "슬랙스", "데님", "쇼츠", "스커트", "레깅스"]);
assert.deepEqual(workOrderDetailItemOptions("O"), ["재킷", "코트", "점퍼", "패딩", "가디건", "베스트"]);
assert.deepEqual(workOrderDetailItemOptions("D"), ["원피스", "점프수트", "셔츠원피스", "니트원피스"]);

assert.equal(WAFL_BASIC_SPEC_V1_VERSION, "WAFL_BASIC_SPEC_V1");
const expectedNames = ["WAFL 기본 상의 스펙", "WAFL 기본 하의 스펙", "WAFL 기본 아우터 스펙", "WAFL 기본 원피스 스펙"];
const templates = ["T", "B", "O", "D"].map((category) => getWaflBasicSpecTemplate(category));
assert.deepEqual(templates.map((template) => template?.name), expectedNames);
for (const template of templates) {
  assert.ok(template);
  assert.deepEqual(template.sizes, ["XS", "S", "M", "L", "XL", "2XL", "FREE", "44", "55", "66", "77", "88"]);
  assert.ok(template.poms.every((pom) => pom.code && pom.name));
  assert.deepEqual(Object.keys(projectWaflBasicSpecValues(template, ["S", "M"])), ["S", "M"]);
  assert.deepEqual(Object.keys(projectWaflBasicSpecValues(template, ["CUSTOM-01"])), []);
}
assert.equal(getWaflBasicSpecTemplate("T", "셔츠").poms.some((pom) => pom.name === "카라너비"), false);
assert.equal(getWaflBasicSpecTemplate("O", "패딩").poms.some((pom) => pom.name === "지퍼길이"), false);
assert.equal(formatMeasurementFromCm(50, "inch"), "19 5/8");

const readyFacts = {
  productName: "QA", productTypeCode: "wafl-c1|M|T", seasonCode: "26SS", itemCode: "티셔츠", dueDate: "2026-09-01",
  companyDocumentCode: "WAFL", workOrderTotal: 10, revisionTotal: 10, matrixTotal: 10, representativeImageCount: 1,
  fabricCount: 0, accessoryCount: 0, materialOptionalDetailIncompleteCount: 0, includedAttachmentCount: 1,
  basicProcessCount: 1, basicProcessStatus: "in_progress",
};
const readiness = evaluateWorkOrderIssueReadiness(readyFacts);
assert.equal(readiness.canIssue, true);
assert.deepEqual(readiness.hardBlockers, []);
assert.deepEqual(readiness.warnings.map((issue) => issue.code), ["MATERIAL_MISSING_WARNING", "ACCESSORY_MISSING_WARNING"]);

const sampleRoute = read("lib/domain/work-orders/command/sampleCommandRoute.ts");
assert.match(sampleRoute, /status = 'draft'/u);
assert.match(sampleRoute, /r\.revision_status = 'draft'/u);
assert.match(sampleRoute, /IDENTITY_LOCKED/u);
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
assert.match(overview, /header\.identity\.reorderRound === 0 && specificationEditable/u);
assert.match(overview, /identityFixed/u);
assert.match(overview, /WorkOrderSeasonPickerSheet/u);
assert.match(overview, /WorkOrderDetailItemPickerSheet/u);

const command = read("lib/domain/work-orders/measurement/measurementCommandRepository.ts");
assert.match(command, /findWaflBasicSpecTemplateById/u);
assert.match(command, /work_order_size_spec_sizes/u);
assert.match(command, /jsonb_to_recordset/u);
assert.match(command, /measurement_unit='cm'/u);

const publicViewer = read("app/v/DocumentViewerClient.tsx");
const canvasViewer = read("app/v/PublicPdfCanvasViewer.tsx");
assert.match(publicViewer, /PublicPdfCanvasViewer/u);
assert.doesNotMatch(publicViewer, /<object|<embed/u);
assert.match(canvasViewer, /pdfjs-dist\/legacy\/build\/pdf\.mjs/u);
assert.match(canvasViewer, /pdf\.worker\.min\.mjs/u);
assert.match(canvasViewer, /public-document-pdf-page-/u);
assert.match(canvasViewer, /data-rendered/u);
const browserQa = read("scripts/run-wafl-v2-alpha67-viewer-browser-qa.mjs");
assert.match(browserQa, /chromium, webkit/u);
assert.match(browserQa, /CHROMIUM_PDF_CANVAS_EMPTY/u);
assert.match(browserQa, /WEBKIT_PDF_CANVAS_EMPTY/u);

const nativeViewer = read("apps/mobile/features/work-orders/documents/WaflAuthenticatedPdfViewer.tsx");
assert.match(nativeViewer, /작업지시서 보기 닫기/u);
assert.match(nativeViewer, /authenticated-pdf-viewer-footer/u);
assert.doesNotMatch(nativeViewer, /authenticated-pdf-viewer-previous-page|authenticated-pdf-viewer-next-page/u);

console.log(JSON.stringify({ result: "ALPHA67_IDENTITY_PICK_BASIC_SPEC_READINESS_PUBLIC_VIEWER_CONTRACT_PASS", templateNames: expectedNames, publicRenderers: ["chromium", "webkit"] }));
