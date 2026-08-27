import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveWorkOrderCopyProductName } from "../lib/domain/work-orders/command/copyProductNamePolicy.ts";
import { isInlineEditInputEditable } from "../apps/mobile/lib/inlineEditSavingPolicy.ts";
import {
  resolveWorkOrderSwipeIntent,
  WORK_ORDER_SWIPE_TRAILING_WIDTH,
  workOrderSwipeSnapOffset,
} from "../apps/mobile/features/work-orders/list/workOrderSwipePolicy.ts";
import { isExternalQaPathAllowed, isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";
import { MAKER_QA_APPROVAL } from "../lib/external-qa/makerQaCapabilities.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

// Preserve the owner-approved gesture decision behavior while proving the
// trailing action's canonical snap equals its complete panel width.
assert.equal(resolveWorkOrderSwipeIntent(7, 2), "pending");
assert.equal(resolveWorkOrderSwipeIntent(12, 24), "vertical");
assert.equal(resolveWorkOrderSwipeIntent(-24, 4), "delete");
assert.equal(workOrderSwipeSnapOffset("delete"), -WORK_ORDER_SWIPE_TRAILING_WIDTH);
const list = read("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx");
assert.match(list, /swipeActionsRight:\{alignItems:"stretch"/u);
assert.match(list, /deleteAction:\{backgroundColor:WAFL_THEME\.color\.error,height:"100%",width:WORK_ORDER_SWIPE_TRAILING_WIDTH\}/u);

// Background persistence is an explicit opt-in. Other inline editors retain
// their disabling behavior, while quantity cells remain native-editable.
assert.equal(isInlineEditInputEditable({ saving: true, allowEditingWhileSaving: false }), false);
assert.equal(isInlineEditInputEditable({ saving: true, allowEditingWhileSaving: true }), true);
const quantity = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
assert.match(quantity, /allowEditingWhileSaving/u);
assert.match(quantity, /editable\n/u);

const env = {
  NODE_ENV: "development",
  WAFL_SERVER_RUNTIME_MODE: "development",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA67_CURRENT,
  WAFL_V2_DOCUMENT_VIEWER_ENABLED: "1",
  WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA67_CURRENT,
  WAFL_EXTERNAL_QA_ALPHA67_NTH_REORDER_MUTATION_ENABLED: "true",
};
const id = "11111111-2222-4333-8444-555555555555";
const previewPath = `/api/v2/work-orders/${id}/documents/preview`;
assert.equal(isTailscaleServePathAllowed(previewPath, "GET", env), true);
assert.equal(isExternalQaPathAllowed(previewPath, "GET", env), true);
assert.equal(isTailscaleServePathAllowed(previewPath, "POST", env), false);
assert.equal(isExternalQaPathAllowed(`/api/v2/work-orders/${id}/documents/private`, "GET", env), false);

const materialRepository = read("lib/domain/work-orders/command/materialCommandRepository.ts");
const materialTransition = materialRepository.slice(materialRepository.indexOf("export async function transitionMaterialOrderV2"), materialRepository.indexOf("export async function transitionMaterialLifecycleV2"));
assert.match(materialTransition, /assertCurrentDraft\(target, input\.expectedVersion, true\)/u);
const materialUi = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
assert.match(materialUi, /canManageOrder/u);
assert.match(materialUi, /canManageStructure && orderPolicy\.canEdit && line\.deletable/u);

const processRepository = read("lib/domain/work-orders/command/processCommandRepository.ts");
const processTransition = processRepository.slice(processRepository.indexOf("export async function transitionProductionProcessOrderV2"));
assert.match(processTransition, /lockTarget\(client, context, input, true\)/u);

assert.equal(resolveWorkOrderCopyProductName("테스트67"), "(복사본) 테스트67");
assert.equal(resolveWorkOrderCopyProductName("(복사본) 테스트67"), "(복사본) 테스트67");
assert.equal(resolveWorkOrderCopyProductName("(복사본) (복사본) 테스트67"), "(복사본) 테스트67");
const copyRepository = read("lib/domain/work-orders/command/copyCommandRepository.ts");
assert.match(copyRepository, /const copyProductName = resolveWorkOrderCopyProductName/u);
assert.equal((copyRepository.match(/copyProductName\]\); statementCount \+= 1/gu) ?? []).length, 2);

const mobile = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const copyFlow = mobile.slice(mobile.indexOf("async function createCopyFromList"), mobile.indexOf("function requestDeleteWorkOrder"));
assert.equal((copyFlow.match(/createCopy\(item\.workOrderId/gu) ?? []).length, 1);
assert.ok(copyFlow.indexOf("setCopyPending(true)") < copyFlow.indexOf("createCopy(item.workOrderId"));
assert.ok(copyFlow.indexOf('setPhase("detail-ready")') < copyFlow.indexOf("reconcileOpenChildren(createdWorkOrderId, loadWorkOrderChildHydration(copiedDetail)"));
assert.match(mobile, /레시피를 생성 중입니다\./u);
assert.match(mobile, /<WaflActionProcessingBlocker/u);
assert.match(mobile, /copyPending \|\| reorderPending \? "레시피를 생성 중입니다\."/u);
const processingBlocker = read("apps/mobile/features/feedback/WaflActionProcessingBlocker.tsx");
const actionCard = read("apps/mobile/features/feedback/WaflActionConfirmationCard.tsx");
assert.match(processingBlocker, /WaflActionConfirmationCard/u);
assert.match(actionCard, /pointerEvents="auto"/u);
assert.match(actionCard, /accessibilityRole="progressbar"/u);

const attachment = read("apps/mobile/features/work-orders/images/WaflNativeAttachmentViewer.tsx");
assert.match(attachment, /isPdf \? <View style=\{styles\.pdfFooter\}/u);
assert.match(attachment, /accessibilityLabel="첨부 PDF 보기 닫기"/u);
assert.match(attachment, /onPress=\{onClose\}/u);
assert.doesNotMatch(attachment.slice(attachment.indexOf("<ScrollView"), attachment.indexOf("</ScrollView>")), /pdfFooter/u);

console.log(JSON.stringify({ contract: "workorder-v2-alpha68-reorder-order-preview-copy-focus-polish", status: "PASS" }));
