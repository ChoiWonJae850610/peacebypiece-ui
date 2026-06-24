#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

const version = read("lib/constants/version.ts");
const workerPage = read("app/(workspace)/worker/page.tsx");
const workordersPage = read("features/workorders/page/WorkordersWorkspacePage.tsx");
const materialOrdersRoute = read("app/(workspace)/workspace/material-orders/page.tsx");
const layoutMode = read("lib/responsive/useWorkspaceLayoutMode.ts");
const responsivePolicy = read("lib/responsive/responsiveLayoutPolicy.ts");
const workOrderLayout = read("components/workorder/WorkOrderLayout.tsx");
const materialEditor = read("features/material-orders/MaterialOrderDraftEditor.tsx");
const materialFeedback = read("features/material-orders/hooks/useMaterialOrderFeedback.ts");
const workOrderController = read("features/workorders/controllers/useWorkOrderWorkspaceController.ts");
const currentState = read("docs/codex-current-state.md");
const verifySafe = read("tools/pipeline/verify-safe.ps1");
const approvedWorkflow = read("tools/pipeline/approved-workflow.ps1");

assert.match(version, /APP_VERSION\s*=\s*"\d+\.\d+\.\d+(?:\.\d+)*"/);

assert.match(workerPage, /WorkspaceShell/);
assert.match(workerPage, /contentMode="fixed-md"/);
assert.match(workerPage, /hideTopbar/);
assert.match(workerPage, /APP_VERSION/);

for (const source of [workordersPage, materialOrdersRoute]) {
  assert.match(source, /WorkspacePageShell/);
  assert.match(source, /contentMode="fixed-md"/);
  assert.match(source, /hideTopbar/);
}

for (const token of [
  "tabletNarrowTwoPanelMin",
  "tabletThreePanelMin",
  "workspaceThreePanelListMin",
  "workspaceThreePanelDetailMin",
  "workspaceThreePanelSideMin",
]) {
  assert.ok(responsivePolicy.includes(token), `responsive policy missing ${token}`);
}

for (const token of [
  '"drawer"',
  '"tabletTwoPanel"',
  '"threePanel"',
  "useTabletTwoPanel",
  "useThreePanel",
  "useStackedProgress",
]) {
  assert.ok(layoutMode.includes(token), `workspace layout mode missing ${token}`);
}

assert.match(workOrderLayout, /layoutMode === "drawer"/);
assert.match(workOrderLayout, /layoutMode === "tabletTwoPanel"/);
assert.match(materialEditor, /useWorkspaceLayoutMode/);
assert.match(materialEditor, /MaterialOrderDesktopWorkspaceView/);
assert.match(materialEditor, /MaterialOrderTabletWorkspaceView/);
assert.match(materialEditor, /MaterialOrderMobileWorkspaceView/);

assert.match(materialFeedback, /runMutation/);
assert.match(materialFeedback, /isLockActive/);
assert.match(materialEditor, /materialOrderMutationLocked/);
assert.match(workOrderController, /workspaceWriteLockRef/);
assert.match(workOrderController, /workspaceWriteLockMessage/);

for (const token of [
  "Active execution gate",
  "Single active execution authority",
  "Applicable contract",
  "Pre-Codex Final Contract Gate",
  "PowerShell",
]) {
  assert.ok(currentState.includes(token), `current-state manifest missing ${token}`);
}

assert.ok(verifySafe.includes('"workspace-commonization"'));
assert.ok(verifySafe.includes("workspace commonization contract"));
assert.ok(approvedWorkflow.includes('"workspace-commonization"'));

console.log("workspace commonization contract: OK");
