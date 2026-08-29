#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { resolveReadinessIssueDestination } from "../apps/mobile/domain/workOrderReadinessNavigation.ts";
import { reconcileSizeColorTotals } from "../apps/mobile/features/work-orders/size-color/sizeColorReconciliation.ts";
import { workOrderProductClassificationSummary } from "../lib/domain/work-orders/catalog/workOrderCategoryPolicy.ts";
import { resolveFactoryDeliveryMemo } from "../lib/domain/work-orders/factoryDeliveryMemoPolicy.ts";
import { evaluateWorkOrderIssueReadiness } from "../lib/domain/work-orders/issueReadiness.ts";
import {
  MATERIAL_MEMO_MAX_LENGTH,
  MATERIAL_USAGE_AREA_MAX_LENGTH,
} from "../lib/domain/work-orders/materialTextPolicy.mjs";

const read = (path) => fs.readFileSync(path, "utf8");

const readyFacts = {
  productName: "테스트 티셔츠",
  productTypeCode: "wafl-c1|M|T",
  seasonCode: "26FW",
  itemCode: "티셔츠",
  dueDate: "2026-09-30",
  companyDocumentCode: "WAFL",
  workOrderTotal: 20,
  revisionTotal: 20,
  matrixTotal: 20,
  representativeImageCount: 1,
  fabricCount: 1,
  accessoryCount: 1,
  includedAttachmentCount: 0,
  basicProcessCount: 1,
  basicProcessStatus: "in_progress",
};

const missingBasic = evaluateWorkOrderIssueReadiness({ ...readyFacts, basicProcessCount: 0, basicProcessStatus: null });
assert.equal(missingBasic.canIssue, false);
assert.equal(missingBasic.hardBlockers.find((issue) => issue.code === "BASIC_PROCESS_REQUIRED")?.message, "기본 공정을 추가해 주세요.");
const unorderedBasic = evaluateWorkOrderIssueReadiness({ ...readyFacts, basicProcessStatus: "ready" });
assert.equal(unorderedBasic.canIssue, false);
assert.equal(unorderedBasic.hardBlockers.find((issue) => issue.code === "BASIC_PROCESS_ORDER_REQUIRED")?.message, "기본 공정 발주요청을 완료해 주세요.");
assert.equal(evaluateWorkOrderIssueReadiness(readyFacts).canIssue, true);
assert.equal(evaluateWorkOrderIssueReadiness({ ...readyFacts, basicProcessStatus: "completed" }).canIssue, true);
assert.equal(resolveReadinessIssueDestination("BASIC_PROCESS_REQUIRED")?.intent, "production");
assert.equal(resolveReadinessIssueDestination("BASIC_PROCESS_ORDER_REQUIRED")?.intent, "production");

assert.equal(resolveFactoryDeliveryMemo({ basicProcessMemo: "  현재 기본 공정 메모  ", legacyFactoryDeliveryMemo: "legacy" }), "현재 기본 공정 메모");
assert.equal(resolveFactoryDeliveryMemo({ basicProcessMemo: " ", legacyFactoryDeliveryMemo: " legacy fallback " }), "legacy fallback");
assert.equal(workOrderProductClassificationSummary({ productTypeCode: "wafl-c1|M|T", itemCode: "티셔츠" }), "남성 · 상의 · 티셔츠");

const reconciled = reconcileSizeColorTotals({
  matrix: {
    quantityCells: [
      { colorId: "color-1", sizeRowId: "size-xs", quantity: "10" },
    ],
    matrixTotal: "20",
    expectedTotal: "20",
    workOrderTotal: "20",
    revisionTotal: "20",
    projectionsMatch: false,
    totalsMatch: false,
  },
  specifications: {},
});
assert.deepEqual(
  [reconciled.matrix.matrixTotal, reconciled.matrix.expectedTotal, reconciled.matrix.workOrderTotal, reconciled.matrix.revisionTotal],
  ["10", "10", "10", "10"],
);
assert.equal(reconciled.matrix.projectionsMatch, true);
assert.equal(reconciled.matrix.totalsMatch, true);

assert.equal(MATERIAL_USAGE_AREA_MAX_LENGTH, 30);
assert.equal(MATERIAL_MEMO_MAX_LENGTH, 100);
const materialEditor = read("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx");
const materialReadOnly = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const materialValidation = read("lib/domain/work-orders/command/materialValidation.ts");
for (const source of [materialEditor, materialReadOnly, materialValidation]) {
  assert.match(source, /MATERIAL_USAGE_AREA_MAX_LENGTH/u);
  assert.match(source, /MATERIAL_MEMO_MAX_LENGTH/u);
}
assert.match(materialEditor, /WaflCharacterCounter/u);
assert.match(materialReadOnly, /WaflCharacterCounter/u);

const imageApi = read("apps/mobile/lib/api/assetsApi.ts");
const imageController = read("apps/mobile/features/work-orders/images/useWorkOrderAssetAuthoringController.ts");
const imageRoute = read("lib/domain/work-orders/command/imageCommandRoute.ts");
const imageRepository = read("lib/domain/work-orders/command/imageCommandRepository.ts");
assert.match(imageApi, /timeoutMs:\s*90_000/u);
assert.match(imageApi, /reconcileWorkOrderImageUpload/u);
assert.match(imageController, /const uploadIdentity = input\.nextIdentity\("upload"\)/u);
assert.match(imageController, /isAmbiguousUploadCompletion/u);
assert.match(imageController, /reconcileImageUpload\(workOrderId, identity\)/u);
assert.equal((imageController.match(/completeImageUpload\(/gu) ?? []).length, 1, "ambiguity reconciliation must not rerun derivative completion");
assert.match(imageRoute, /handleReconcileWorkOrderImageUpload/u);
assert.match(imageRepository, /reconcileCompletedWorkOrderImageUploadV2/u);
assert.match(imageRepository, /work_order_command_receipts/u);
assert.match(imageRepository, /image\.id = \$4::uuid/u);

const structureController = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
const structureRepository = read("lib/domain/work-orders/command/sizeColorStructureCommandRepository.ts");
assert.match(structureController, /reconcileSizeColorTotals/u);
assert.match(structureController, /reconcileFinishedSpecSizes/u);
assert.match(structureRepository, /synchronizeFinishedSpecSizes/u);
assert.match(structureRepository, /canonicalTotalQuantity/u);

const issueRepository = read("lib/domain/work-orders/command/issueRepository.ts");
assert.match(issueRepository, /process_type_code = '\$\{WORK_ORDER_FACTORY_PROCESS_CODE\}'/u);
assert.match(issueRepository, /status = 'in_progress'/u);
assert.match(issueRepository, /SET status = 'completed'/u);
assert.match(issueRepository, /completed_basic_process_id/u);
assert.match(issueRepository, /trigger: WORK_ORDER_ISSUE_COMMAND_CODE/u);
assert.match(issueRepository, /factory_delivery_memo = \$12/u);
assert.doesNotMatch(issueRepository, /process_type_code\s*<>\s*'\$\{WORK_ORDER_FACTORY_PROCESS_CODE\}'[\s\S]*status\s*=\s*'completed'/u);

const detailRepository = read("lib/domain/work-orders/read/detailRepository.ts");
const previewRepository = read("lib/domain/work-orders/read/previewRepository.ts");
const pdf = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
assert.match(detailRepository, /resolveFactoryDeliveryMemo/u);
assert.match(previewRepository, /resolveFactoryDeliveryMemo/u);
assert.match(pdf, /formatProductClassification/u);
assert.doesNotMatch(pdf, /const memos = \[data\.header\.factoryDeliveryMemo, data\.header\.memo\]/u);

const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
assert.doesNotMatch(workbench, /Linking\.openURL\(target\.viewerUrl\)/u, "View must not fall back to Safari");
assert.match(workbench, /openInAppDocumentViewer/u);
assert.equal(Boolean(mobilePackage.dependencies["react-native-webview"]), false);
assert.equal(mobilePackage.dependencies["react-native-pdf"], "7.0.4");

const runtimeQa = read("scripts/run-wafl-v2-alpha67-post-cleanbase-corrections-runtime-qa.mjs");
assert.match(runtimeQa, /BASIC_PROCESS_REQUIRED/u);
assert.match(runtimeQa, /BASIC_PROCESS_ORDER_REQUIRED/u);
assert.match(runtimeQa, /SIZE_DELETE_FAILED/u);
assert.match(runtimeQa, /usage31/u);
assert.match(runtimeQa, /memo101/u);
assert.match(runtimeQa, /ISSUE_REPLAY_FAILED/u);
assert.match(runtimeQa, /complete_events/u);
assert.match(runtimeQa, /FIXTURE_RESIDUAL/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha67-post-cleanbase-physical-corrections",
  previousPermanentInventoryRetained: 167,
  addedPermanentChecks: 1,
  finalPermanentInventory: 168,
  inAppPdfViewer: "NATIVE_INSTALLED_OWNER_VIEW_PASS_PRESERVED",
  productionMutation: 0,
  ownerFixtureMutation: 0,
  physicalResultInferred: false,
}));
