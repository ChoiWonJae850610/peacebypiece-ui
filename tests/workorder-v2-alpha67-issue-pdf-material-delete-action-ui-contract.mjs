#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  normalizeWorkOrderDocumentCodeSegment,
  resolveWorkOrderDocumentItemSegment,
} from "../lib/domain/work-orders/documentNumberSegmentPolicy.mjs";
import { evaluateWorkOrderIssueReadiness } from "../lib/domain/work-orders/issueReadiness.ts";
import { resolveMaterialRemovalMode } from "../lib/domain/work-orders/materialRemovalPolicy.ts";
import {
  isMakerQaCapabilityEnabled,
  MAKER_QA_APPROVAL,
  MAKER_QA_CAPABILITY,
} from "../lib/external-qa/makerQaCapabilities.mjs";

const read = (file) => fs.readFileSync(file, "utf8");

assert.equal(normalizeWorkOrderDocumentCodeSegment(" 26ss "), "26SS");
assert.equal(resolveWorkOrderDocumentItemSegment({ itemCode: "TS01", productTypeCode: "wafl-c1|U|T" }), "TS01");
assert.equal(resolveWorkOrderDocumentItemSegment({ itemCode: "티셔츠", productTypeCode: "wafl-c1|U|T" }), "T");
assert.equal(resolveWorkOrderDocumentItemSegment({ itemCode: "", productTypeCode: "wafl-c1|U|T" }), null);

const readyFacts = {
  productName: "검증",
  productTypeCode: "wafl-c1|U|T",
  seasonCode: "26SS",
  itemCode: "티셔츠",
  dueDate: "2026-08-31",
  companyDocumentCode: "WAFL",
  workOrderTotal: 10,
  revisionTotal: 10,
  matrixTotal: 10,
  representativeImageCount: 1,
  fabricCount: 1,
  accessoryCount: 1,
  includedAttachmentCount: 0,
};
assert.equal(evaluateWorkOrderIssueReadiness(readyFacts).canIssue, true, "Korean detail item uses stable category segment");

assert.equal(resolveMaterialRemovalMode({ status: "editing", lifecycle: "active", requestedAt: null, cancelledAt: null, completedAt: null, hasOrderHistory: false }), "hard_delete");
assert.equal(resolveMaterialRemovalMode({ status: "editing", lifecycle: "active", requestedAt: "2026-08-20", cancelledAt: "2026-08-20", completedAt: null, hasOrderHistory: true }), "history_preserving_remove");
assert.equal(resolveMaterialRemovalMode({ status: "requested", lifecycle: "active", requestedAt: "2026-08-20", cancelledAt: null, completedAt: null, hasOrderHistory: true }), "not_allowed");
assert.equal(resolveMaterialRemovalMode({ status: "completed", lifecycle: "active", requestedAt: "2026-08-20", cancelledAt: null, completedAt: "2026-08-20", hasOrderHistory: true }), "not_allowed");

const approvedAlpha67 = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA67_CURRENT,
  WAFL_V2_DOCUMENT_VIEWER_ENABLED: "1",
  WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA67_CURRENT,
  WAFL_EXTERNAL_QA_ALPHA67_NTH_REORDER_MUTATION_ENABLED: "true",
};
assert.equal(isMakerQaCapabilityEnabled(approvedAlpha67, MAKER_QA_CAPABILITY.DOCUMENT_R0), true);
assert.equal(isMakerQaCapabilityEnabled({}, MAKER_QA_CAPABILITY.DOCUMENT_R0), false);

const issueRepository = read("lib/domain/work-orders/command/issueRepository.ts");
const issueService = read("lib/domain/work-orders/command/issueService.ts");
const generation = read("lib/generated-documents/work-order-pdf/generationService.ts");
const runtimeGuard = read("lib/domain/work-orders/command/runtimeGuard.ts");
const readRepository = read("lib/domain/work-orders/read/detailRepository.ts");
const materialRepository = read("lib/domain/work-orders/command/materialCommandRepository.ts");
const materialController = read("apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts");
const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");

assert.match(issueRepository, /resolveWorkOrderDocumentItemSegment/);
assert.match(issueRepository, /const documentNumberBase = `\$\{companyCode\}-\$\{seasonCode\}-\$\{itemCode\}/);
assert.match(runtimeGuard, /getWorkOrderV2DocumentR0MutationRuntimeGuard/);
assert.match(issueService, /getWorkOrderV2DocumentR0MutationRuntimeGuard/);
assert.match(generation, /getWorkOrderV2DocumentR0MutationRuntimeGuard/);
assert.doesNotMatch(generation, /ALPHA64_DOCUMENT_R0|alpha\.64 문서 runtime/);

assert.match(workbench, /레시피는 확정되었습니다\. 작업지시서 PDF만 만들지 못했습니다\./);
assert.match(workbench, /label="PDF 다시 생성"/);
assert.match(workbench, /retryGeneration[\s\S]*generateAndReconcile\("retry-generation"\)/);
assert.doesNotMatch(workbench.match(/async function retryGeneration[\s\S]*?\n  }/)?.[0] ?? "", /issueWorkOrderR0/);
assert.match(workbench, /title: "레시피를 확정합니다"/);
assert.match(workbench, /helper: "최종 생성 후에는 주요 생산정보를 수정할 수 없습니다\."/);
assert.match(workbench, /confirmAccessibilityLabel: "레시피 확정 실행"/);
assert.doesNotMatch(workbench, /이 R0은/);

assert.match(readRepository, /resolveMaterialRemovalMode/);
assert.match(readRepository, /has_order_history/);
assert.match(materialRepository, /removalMode !== "hard_delete"/);
assert.match(materialController, /history_preserving_remove/);
assert.match(materialController, /workOrderMutationController\.archiveMaterial/);
assert.match(materialController, /workOrderMutationController\.deleteMaterial/);
assert.match(materialController, /발주요청과 취소 이력은 그대로 보존됩니다/);

assert.doesNotMatch(production, /complete: \{ label: "완료", caption: undefined/);
assert.match(production, /cancel: \{ label: "발주 취소", caption: "취소"/);
assert.match(production, /WaflCompactCardAction/);

console.log("workorder-v2-alpha67-issue-pdf-material-delete-action-ui-contract: PASS");
