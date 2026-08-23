#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { reconcileWorkOrderListItemFromDetail, workOrderListWorkflowChanged } from "../apps/mobile/domain/workOrderListReconciliation.ts";
import { resolveExpectedNextReorderRound } from "../apps/mobile/domain/workOrderReorderConfirmationPolicy.ts";
import { matchesWorkOrderStatusFilter } from "../apps/mobile/features/work-orders/list/workOrderListStatusPolicy.ts";

const read = (path) => fs.readFileSync(path, "utf8");

const pickers = read("apps/mobile/features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx");
assert.match(pickers, /WaflPairedOptionReelPickerSheet/u);
assert.match(pickers, /WaflReelPickerSheet/u);
assert.match(pickers, /leftAccessibilityLabel="시즌 연도 선택 릴"/u);
assert.match(pickers, /rightAccessibilityLabel="시즌 구분 선택 릴"/u);
assert.match(pickers, /field="categoryDetail"[\s\S]*kind="option"/u);
assert.equal((pickers.match(/WaflInputModeSwitch mode="picker"/gu) ?? []).length, 2);
assert.match(pickers, /season-direct-input-action/u);
assert.match(pickers, /detail-item-direct-input-action/u);
assert.doesNotMatch(pickers, /WaflStaticOptionList|FlatList|VirtualizedList|WORK_ORDER_DIRECT_INPUT_SENTINEL/u);
assert.doesNotMatch(pickers, /WaflOptionGrid|WaflReusableCreateEntryAction/u);

const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
assert.match(production, /cancel: \{ label: "발주 취소", caption: "취소", Icon: RotateCcw, emphasized: false, danger: true \}/u);
assert.match(production, /WaflCompactCardAction/u);

const draftItem = {
  workOrderId: "wo-1", status: "draft", latestDocumentStatus: null,
  displayDocumentNumber: null, productName: "old", dueDate: null, totalQuantity: 10,
  estimatedAmountSummary: { currency: "KRW", estimatedTotal: "0" }, representativeThumbnail: null,
  incompleteMaterialSummary: { incompleteFabricCount: 0, incompleteAccessoryCount: 0 }, processCount: 1,
  updatedAt: "old", identity: { isSample: false, derivationKind: "original", reorderRound: 0, sourceWorkOrderId: null, sourceRevisionId: null, seriesRootWorkOrderId: null },
};
const issuedDetail = {
  header: {
    id: "wo-1", status: "issued", productName: "current", dueDate: "2026-09-01", totalQuantity: 10,
    representativeImage: null, updatedAt: "new", identity: draftItem.identity,
    document: { status: "issued", displayDocumentNumber: "WO-1" },
  },
  amounts: { currency: "KRW", estimatedTotal: "100" },
};
assert.equal(workOrderListWorkflowChanged(draftItem, issuedDetail), true);
const issuedItem = reconcileWorkOrderListItemFromDetail(draftItem, issuedDetail);
assert.equal(issuedItem.status, "issued");
assert.equal(issuedItem.latestDocumentStatus, "issued");
assert.equal(matchesWorkOrderStatusFilter(issuedItem.status, "progress"), true);
assert.equal(matchesWorkOrderStatusFilter(issuedItem.status, "draft"), false);
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const documents = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
assert.match(experience, /reconcileWorkOrderListItemFromDetail/u);
assert.match(experience, /listReconcileRequired\.current = true/u);
assert.match(experience, /loadListFor\(listQuery, listStatusFilter, listCharacterFilter, listLineageFilters, "search"\)/u);
assert.match(experience, /async function reloadLatestBasicInfo/u);
assert.match(documents, /await onRefresh\(\)/u);

const reorderSheet = read("apps/mobile/features/work-orders/reorder/WorkOrderReorderSheets.tsx");
const reorderValidation = read("lib/domain/work-orders/command/validation.ts");
const reorderApi = read("apps/mobile/lib/api/workOrdersApi.ts");
const reorderRepository = read("lib/domain/work-orders/command/reorderCommandRepository.ts");
assert.match(reorderSheet, /\{props\.expectedRound\}차 리오더 작업지시서를 작성하시겠습니까\?/u);
assert.match(reorderSheet, /cancelActionLabel="아니오"/u);
assert.match(reorderSheet, /confirmActionLabel="예"/u);
assert.doesNotMatch(reorderSheet, /WaflSheetValueField|총수량|납기 \(선택\)/u);
assert.equal(resolveExpectedNextReorderRound([0, 1, 3, 2]), 4);
assert.equal(resolveExpectedNextReorderRound([]), 1);
assert.match(experience, /totalQuantity: 0,[\s\S]{0,80}dueDate: null/u);
assert.doesNotMatch(experience, /reorderTotalQuantity|reorderDueDate|changeReorderTotal|changeReorderDueDate/u);
assert.match(reorderValidation, /parseRequiredNonNegativeQuantity/u);
assert.match(reorderApi, /result\.totalQuantity < 0/u);
assert.match(reorderRepository, /COALESCE\(max\(reorder_round\),0\)\+1/u);
assert.match(reorderRepository, /input\.command\.dueDate \?\? null[\s\S]{0,100}input\.command\.totalQuantity/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha67-picker-action-list-reorder-ux",
  previousPermanentInventoryRetained: 173,
  addedPermanentChecks: 1,
  finalPermanentInventory: 174,
  physicalResultInferredForNewChanges: false,
}));
