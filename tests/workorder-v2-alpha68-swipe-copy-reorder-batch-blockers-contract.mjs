import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encodeDestinationQuantityCells } from "../lib/domain/work-orders/command/sizeColorQuantityBatchPolicy.ts";
import {
  resolveWorkOrderSwipeIntent,
  settleWorkOrderSwipe,
  WORK_ORDER_SWIPE_LEADING_WIDTH,
  WORK_ORDER_SWIPE_TRAILING_WIDTH,
  workOrderSwipeSnapOffset,
} from "../apps/mobile/features/work-orders/list/workOrderSwipePolicy.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const swipe = read("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx");
assert.equal(resolveWorkOrderSwipeIntent(0, 0), "pending");
assert.equal(resolveWorkOrderSwipeIntent(8, 2), "pending");
assert.equal(resolveWorkOrderSwipeIntent(12, 24), "vertical");
assert.equal(resolveWorkOrderSwipeIntent(30, 3), "copy");
assert.equal(resolveWorkOrderSwipeIntent(-30, 3), "delete");
assert.equal(settleWorkOrderSwipe({ start: 0, dx: 4 }), null);
assert.equal(workOrderSwipeSnapOffset("copy"), WORK_ORDER_SWIPE_LEADING_WIDTH);
assert.equal(workOrderSwipeSnapOffset("delete"), -WORK_ORDER_SWIPE_TRAILING_WIDTH);
assert.match(swipe, /resolveWorkOrderSwipeIntent/u);
assert.match(swipe, /swipeActionsHidden/u);
assert.match(swipe, /cardPressed/u);
assert.doesNotMatch(swipe, /pressed&&styles\.pressed\]\}>\{children\}/u);
assert.match(swipe, /onGestureStart/u);
assert.match(swipe, /setOpenRow\(\(current\)=>current\?\.id===item\.workOrderId\?current:null\)/u);
assert.match(swipe, /onScrollBeginDrag=\{\(\)=>\{Keyboard\.dismiss\(\);setOpenRow\(null\);\}\}/u);
assert.match(swipe, /pointerEvents=\{openSide==="copy"\?"auto":"none"\}/u);
assert.match(swipe, /reorderAction:\{backgroundColor:WAFL_THEME\.color\.brickOrange\}/u);
assert.match(swipe, /width:WORK_ORDER_SWIPE_ACTION_WIDTH/u);

const mobile = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
assert.match(mobile, /const createdWorkOrderId = created\.result\.workOrderId/u);
assert.match(mobile, /hydrateAuthoritativeCreatedCopy\(createdWorkOrderId, \(workOrderId\) => workOrderQueryController\.detail\(workOrderId\)\)/u);
assert.match(mobile, /reconcileOpenChildren\(createdWorkOrderId, loadWorkOrderChildHydration\(copiedDetail\), "복사본"\)/u);
assert.ok(mobile.indexOf("setPhase(\"detail-ready\")") < mobile.indexOf("reconcileOpenChildren(createdWorkOrderId"));
assert.ok(mobile.indexOf("createCopy(item.workOrderId") < mobile.indexOf("hydrateAuthoritativeCreatedCopy(createdWorkOrderId"));
assert.doesNotMatch(mobile.slice(mobile.indexOf("async function createCopyFromList"), mobile.indexOf("function requestDeleteWorkOrder")), /find\(|filter\(/u);
assert.match(mobile, /cancelActionLabel="변경 취소 후 나가기"/u);
assert.match(mobile, /confirmActionLabel="다시 저장"/u);

const encoded = JSON.parse(encodeDestinationQuantityCells([
  { colorId: "destination-color", sizeRowId: "destination-size", quantity: 17 },
]));
assert.deepEqual(encoded, [{ color_id: "destination-color", size_row_id: "destination-size", quantity: 17 }]);
const repository = read("lib/domain/work-orders/command/sizeColorStructureCommandRepository.ts");
assert.match(repository, /encodeDestinationQuantityCells\(input\.cells\)/u);
assert.match(repository, /revision_id=\$2::uuid AND c\.id=requested\.color_id/u);
assert.match(repository, /revision_id=\$2::uuid AND s\.id=requested\.size_id/u);
assert.match(repository, /throw new SizeColorStructureRepositoryError\("not_found"\)/u);

const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const material = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const policy = read("apps/mobile/domain/workOrderPolicy.ts");
const controller = read("apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts");
assert.match(policy, /REORDER_MATERIAL_EDITABLE_FIELDS = \["requiredQuantity", "allowanceQuantity", "inventoryUsageQuantity", "unitPrice"\]/u);
assert.match(overview, /canManageStructure=\{props\.canEditMaterials && !reorderDraft\}/u);
assert.match(overview, /editableFields=\{reorderDraft \? REORDER_MATERIAL_EDITABLE_FIELDS : undefined\}/u);
assert.match(material, /const editable = canEdit && \(!editableFields \|\| editableFields\.includes\(field\)\)/u);
assert.match(material, /canManageOrder/u);
assert.match(material, /canManageStructure && orderPolicy\.canEdit && line\.deletable/u);
assert.match(controller, /REORDER_MATERIAL_EDITABLE_FIELDS/u);

const size = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
assert.match(size, /edit\?\.canEditStructure \? <Pressable accessibilityLabel="스펙 불러오기"/u);
assert.match(size, /edit\?\.canEditStructure \? <Pressable accessibilityLabel="스펙 저장"/u);
assert.match(size, /setReadOnlyMeasurementUnit\(\{ identity: sectionIdentity, unit \}\)/u);
assert.match(size, /읽기 화면의 표시 단위만 변경합니다/u);

const viewer = read("apps/mobile/features/work-orders/images/WaflNativeAttachmentViewer.tsx");
assert.match(viewer, /body:\{backgroundColor:WAFL_THEME\.color\.paperMuted/u);
assert.doesNotMatch(viewer, /#080b10/u);

console.log(JSON.stringify({ contract: "workorder-v2-alpha68-swipe-copy-reorder-batch-blockers", status: "PASS" }));
