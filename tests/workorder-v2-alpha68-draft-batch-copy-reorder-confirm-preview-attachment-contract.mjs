#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { createWorkOrderDraftBatchCoordinator } from "../apps/mobile/application/draftBatchCoordinator.ts";
import { REORDER_DRAFT_BASIC_EDIT_FIELDS, REORDER_DRAFT_MATERIAL_EDIT_FIELDS, reorderDraftPatchAllowed } from "../lib/domain/work-orders/command/reorderDraftEditPolicy.ts";

const read = (path) => fs.readFileSync(path, "utf8");

const statuses = [];
const calls = [];
const coordinator = createWorkOrderDraftBatchCoordinator({
  onStatus: (section, status) => statuses.push(`${section}:${status}`),
});
coordinator.register("overview", async (input) => { calls.push(input); return true; });
coordinator.stage("overview", { productName: "A" });
coordinator.stage("overview", { productName: "AB" });
assert.equal(coordinator.isDirty("overview"), true);
await new Promise((resolve) => setTimeout(resolve, 25));
assert.equal(calls.length, 0, "editing must remain local until an explicit persistence boundary");
assert.equal(await coordinator.flushAll("tab-change"), true);
assert.equal(calls.length, 1);
assert.equal(calls[0].generation, 2);
assert.deepEqual(calls[0].payload, { productName: "AB" });
assert.ok(statuses.includes("overview:dirty"));
assert.ok(statuses.includes("overview:saving"));
assert.ok(statuses.includes("overview:saved"));
coordinator.reset();

const coordinatorSource = read("apps/mobile/application/draftBatchCoordinator.ts");
assert.match(coordinatorSource, /"overview" \| "sizes" \| "materials" \| "production" \| "finished-spec"/u);
assert.match(coordinatorSource, /"tab-change" \| "detail-exit" \| "app-background" \| "confirm"/u);
assert.doesNotMatch(coordinatorSource, /setTimeout|WORK_ORDER_DRAFT_AUTOSAVE_DELAY_MS|flushSection\(section, "idle"\)/u);
assert.match(coordinatorSource, /state\.generation === generation \? "saved" : "dirty"/u);

const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
assert.match(experience, /intent === "feature" \? "tab-change"/u);
assert.match(experience, /intent === "list" \|\| intent === "work-order" \? "detail-exit"/u);
assert.match(experience, /draftBatch\.flushAll\(reason\)/u);
assert.match(experience, /draftBatch\.flushAll\("app-background"\)/u);
assert.match(experience, /workOrderMutationController\.createCopy/u);
assert.match(experience, /deleteDraftWorkOrder/u);

const sizeController = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
const sizeApi = read("apps/mobile/lib/api/sizeColorApi.ts");
const sizeRepository = read("lib/domain/work-orders/command/sizeColorStructureCommandRepository.ts");
assert.match(sizeController, /draftBatch\.stage\("sizes"/u);
assert.match(sizeController, /workOrderMutationController\.batchQuantities/u);
assert.doesNotMatch(sizeController, /setWorkOrderSizeColorQuantityCell/u);
assert.match(sizeApi, /quantities\/batch/u);
assert.match(sizeRepository, /jsonb_to_recordset/u);
assert.match(sizeRepository, /total_quantity|totalQuantity/u);

const copyRepository = read("lib/domain/work-orders/command/copyCommandRepository.ts");
const copyService = read("lib/domain/work-orders/command/copyService.ts");
assert.match(copyRepository, /'original',0/u);
assert.match(copyRepository, /source_revision_id[^\n]+NULL/u);
assert.match(copyRepository, /input\.assets\.images/u);
assert.match(copyRepository, /input\.assets\.attachments/u);
assert.doesNotMatch(copyRepository, /generated_documents|document_access_tokens|domain_events[\s\S]*SELECT/u);
assert.match(copyService, /WORK_ORDER_COPY_CREATE_COMMAND_CODE/u);
assert.match(copyService, /idempotentReplay/u);

assert.equal(reorderDraftPatchAllowed(["dueDate", "totalQuantity"], REORDER_DRAFT_BASIC_EDIT_FIELDS), true);
assert.equal(reorderDraftPatchAllowed(["productName"], REORDER_DRAFT_BASIC_EDIT_FIELDS), false);
assert.equal(reorderDraftPatchAllowed(["requiredQuantity", "unitPrice"], REORDER_DRAFT_MATERIAL_EDIT_FIELDS), true);
assert.equal(reorderDraftPatchAllowed(["partnerId"], REORDER_DRAFT_MATERIAL_EDIT_FIELDS), false);
const measurementRepository = read("lib/domain/work-orders/measurement/measurementCommandRepository.ts");
const materialRepository = read("lib/domain/work-orders/command/materialCommandRepository.ts");
const processRepository = read("lib/domain/work-orders/command/processCommandRepository.ts");
assert.match(measurementRepository, /row\.derivation_kind==="reorder"&&Number\(row\.reorder_round\)>0/u);
assert.match(materialRepository, /REORDER_DRAFT_MATERIAL_EDIT_FIELDS/u);
assert.match(processRepository, /derivation_kind==="reorder"/u);
assert.match(processRepository, /confirmedMemoMutation/u);
assert.match(processRepository, /확정 WorkOrder 공장 전달 메모 수정/u);

const commandRepository = read("lib/domain/work-orders/command/commandRepository.ts");
const workOrderPolicy = read("apps/mobile/domain/workOrderPolicy.ts");
const productionAuthoring = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
const generationService = read("lib/generated-documents/work-order-pdf/generationService.ts");
assert.match(commandRepository, /confirmedMutable[\s\S]*changedFields\.every\(\(field\) => field === "dueDate"\)/u);
assert.match(workOrderPolicy, /canEditConfirmedWorkOrderMutableFields/u);
assert.match(productionAuthoring, /confirmedMemoEditable[\s\S]*confirmed-memo-/u);
assert.match(generationService, /refreshActive[\s\S]*status='pending'[\s\S]*snapshot=\$6::jsonb/u);

const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const previewService = read("lib/generated-documents/work-order-pdf/previewService.ts");
assert.match(workbench, /await onFlushDraft\(\)/u);
assert.match(workbench, /레시피를 확정합니다/u);
assert.match(workbench, /최종 생성 후에는 주요 생산정보를 수정할 수 없습니다\./u);
assert.match(workbench, /PDF 미리보기/u);
assert.match(workbench, /createDocumentShare\(generated\.id, 3,/u);
assert.doesNotMatch(workbench, /1일|7일|30일|selectedDays/u);
assert.match(previewService, /mode: "draft_preview"/u);
assert.match(previewService, /removeLocalIssuedPdfRenderInput/u);
assert.doesNotMatch(previewService, /generated_documents|document_access_tokens|putPdf/u);

const accessConstants = read("lib/generated-documents/document-access/constants.ts");
assert.match(accessConstants, /DOCUMENT_ACCESS_DEFAULT_EXPIRY_DAYS = 3/u);
assert.match(accessConstants, /DOCUMENT_MANUAL_SHARE_EXPIRY_DAY_CHOICES = \[3\]/u);

const attachmentController = read("apps/mobile/features/work-orders/images/useWorkOrderAssetAuthoringController.ts");
const attachmentViewer = read("apps/mobile/features/work-orders/images/WaflNativeAttachmentViewer.tsx");
const imageGallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
assert.doesNotMatch(attachmentController, /Linking\.openURL/u);
assert.match(attachmentViewer, /ReactNativeBlobUtil\.fetch/u);
assert.match(attachmentViewer, /Pdf/u);
assert.match(attachmentViewer, /ScrollView/u);
assert.match(imageGallery, /maximumZoomScale/u);

const list = read("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx");
assert.match(list, /workOrderSwipeSnapOffset\(openSide\)/u);
assert.match(list, /WORK_ORDER_SWIPE_LEADING_WIDTH/u);
assert.match(list, /WORK_ORDER_SWIPE_TRAILING_WIDTH/u);
assert.match(list, /onScrollBeginDrag/u);
assert.match(list, /레시피 복사/u);
assert.match(list, /리오더 만들기/u);
assert.match(list, /레시피 삭제/u);
assert.doesNotMatch(list, /onPanResponderRelease:[^\n]+onDelete/u);

const runtimeStart = read("tools/dev/start-wafl-external-qa.ps1");
const runtimeStatus = read("tools/dev/status-wafl-external-qa.ps1");
const runtimeContract = read("tests/wafl-external-qa-tailscale-transport-contract.mjs");
assert.match(runtimeStart, /"start", "--clear", "--lan", "--dev-client"/u);
assert.match(runtimeStatus, /Unable to deserialize cloned data/u);
assert.match(runtimeContract, /"start", "--clear", "--lan", "--dev-client"/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha68-draft-batch-copy-reorder-confirm-preview-attachment",
  preexistingRuntimeHardeningDelta: "verified-and-absorbed",
  physicalResultInferred: false,
}));
