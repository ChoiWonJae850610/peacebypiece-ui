#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { assertCanonicalWaflVersionConsistency } from "./helpers/wafl-v2-current-version.mjs";

const read = (file) => fs.readFileSync(file, "utf8");

const coreState = read("lib/hooks/workorder/useWorkOrderCoreState.ts");
const useWorkOrder = read("lib/hooks/useWorkOrder.ts");
const controller = read("features/workorders/controllers/useWorkOrderWorkspaceController.ts");
const layoutTypes = read("components/workorder/layout/types.ts");
const detailErrorState = read("components/workorder/WorkOrderDetailErrorState.tsx");
const desktopLayout = read("components/workorder/layout/WorkOrderDesktopWorkspaceView.tsx");
const tabletLayout = read("components/workorder/layout/WorkOrderTabletWorkspaceView.tsx");
const mobileLayout = read("components/workorder/layout/WorkOrderMobileWorkspaceView.tsx");
const factoryPanel = read("components/workorder/factoryInstruction/WorkOrderFactoryInstructionPanel.tsx");
const factoryClient = read("lib/workorder/factoryInstruction/apiClient.ts");
const roadmap = read("lib/internal/roadmap/roadmap-0.24.34.5.ts");
const roadmapIndex = read("lib/internal/roadmap/index.ts");

assertCanonicalWaflVersionConsistency();
assert.match(roadmapIndex, /ROADMAP_0_24_34_5/);
assert.match(roadmapIndex, /currentWorkVersion:\s*"0\.24\.34\.14"/);
assert.match(roadmapIndex, /nextWorkVersion:\s*"0\.24\.35"/);
assert.match(roadmap, /PRODUCT_QA_INCOMPLETE/);

for (const token of [
  "detailErrorsById",
  "selectedWorkOrderDetailError",
  "!selectedWorkOrderDetailError",
  "reloadWorkOrderDetail",
  "작업지시서 상세 정보를 불러오지 못했습니다",
]) {
  assert.ok(coreState.includes(token), `core state missing ${token}`);
}

assert.doesNotMatch(coreState, /saveWorkspaceSessionAsync[\s\S]{0,280}setRepositoryStatus\("error"\)/);
assert.match(useWorkOrder, /selectedWorkOrderDetailError/);
assert.match(useWorkOrder, /retrySelectedWorkOrderDetail/);
assert.match(controller, /selectedDetailErrorState/);
assert.match(controller, /다시 시도/);
assert.match(layoutTypes, /WorkOrderWorkspaceDetailErrorState/);
assert.match(detailErrorState, /WaflErrorState/);
assert.match(detailErrorState, /WaflButton/);

for (const layout of [desktopLayout, tabletLayout, mobileLayout]) {
  assert.match(layout, /WorkOrderDetailErrorState/);
  assert.match(layout, /detailErrorState/);
}

for (const token of [
  "getSafeFactoryInstructionMessage",
  "WaflApiError",
  "WORKORDER_NOT_FOUND",
  "작업지시서를 찾을 수 없습니다",
  "공장 전달사항을 불러오지 못했습니다",
  "공장 전달사항을 저장하지 못했습니다",
]) {
  assert.ok(factoryPanel.includes(token) || factoryClient.includes(token), `factory instruction missing ${token}`);
}

assert.doesNotMatch(factoryPanel, /error instanceof Error\s*\?\s*error\.message/);

console.log("workorder 0.24.34.5 runtime remediation contract: PASS");
