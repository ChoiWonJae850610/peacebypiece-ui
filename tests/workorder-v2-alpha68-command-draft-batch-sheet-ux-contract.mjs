#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { createWorkOrderDraftBatchCoordinator } from "../apps/mobile/application/draftBatchCoordinator.ts";

const read = (path) => fs.readFileSync(path, "utf8");

const calls = [];
const coordinator = createWorkOrderDraftBatchCoordinator({
  onStatus: (section, status) => calls.push({ kind: "status", section, status }),
});
let overviewWrites = 0;
let materialWrites = 0;
let commandWrites = 0;
coordinator.register("overview", async ({ generation, payload, reason }) => {
  overviewWrites += 1;
  calls.push({ kind: "overview", generation, payload, reason });
  return true;
});
coordinator.register("materials", async ({ generation, payload, reason }) => {
  materialWrites += 1;
  calls.push({ kind: "materials", generation, payload, reason });
  return true;
});

coordinator.stage("overview", { productName: "처음" });
coordinator.stage("overview", { productName: "최신" });
coordinator.stage("materials", { tempId: "local-material-1", quantity: "12" });
await new Promise((resolve) => setTimeout(resolve, 40));
assert.equal(overviewWrites, 0, "draft fields must not write on an idle timer");
assert.equal(materialWrites, 0, "new local rows must not write before a boundary");
assert.equal(coordinator.status("overview"), "dirty");
assert.equal(await coordinator.flushAll("tab-change"), true);
assert.equal(overviewWrites, 1);
assert.equal(materialWrites, 1);
assert.deepEqual(calls.find((call) => call.kind === "overview")?.payload, { productName: "최신" });

coordinator.stage("overview", { dueDate: "2026-09-01" });
if (await coordinator.flushAll("explicit")) commandWrites += 1;
assert.equal(commandWrites, 1, "business command runs exactly once after a successful boundary flush");

const failed = createWorkOrderDraftBatchCoordinator();
let failedCommandWrites = 0;
failed.register("production", async () => false);
failed.stage("production", { processId: "local-process-1" });
if (await failed.flushAll("explicit")) failedCommandWrites += 1;
assert.equal(failedCommandWrites, 0, "business command must not run after a failed dirty flush");
assert.equal(failed.isDirty("production"), true, "failed local input remains recoverable");

const coordinatorSource = read("apps/mobile/application/draftBatchCoordinator.ts");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const materials = read("apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts");
const materialView = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const createSheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const startRuntime = read("tools/dev/start-wafl-external-qa.ps1");
const statusRuntime = read("tools/dev/status-wafl-external-qa.ps1");

assert.doesNotMatch(coordinatorSource, /setTimeout|WORK_ORDER_DRAFT_AUTOSAVE_DELAY_MS|"idle" \| "tab-change"/u);
for (const boundary of ["tab-change", "detail-exit", "app-background", "confirm", "explicit"]) assert.match(coordinatorSource, new RegExp(`"${boundary}"`, "u"));
assert.match(experience, /draftBatch\.flushAll\("app-background"\)/u);
assert.match(experience, /copyPending \|\| reorderPending/u);
assert.match(createSheet, /processingMessage=\{props\.pending/u);
assert.match(materials, /pendingMaterialCreates/u);
assert.match(materials, /local-material-/u);
assert.match(materials, /pendingMaterialCreates\.current\.delete\(line\.id\)/u);
assert.match(materials, /materialIdAliases/u);
assert.match(production, /pendingStructureOperations/u);
assert.match(production, /local-process-/u);
assert.match(production, /draftBatch\.flushSection\("production", "explicit"\)/u);
assert.doesNotMatch(materialView, /material-quantity-row-expanded|material-quantity-expanded-editor/u);
assert.doesNotMatch(overview, /fullWidth: props\.activeBasicField/u);
assert.match(createSheet, /keyboardAutoExpand/u);
assert.match(startRuntime, /makerQaProfile -eq "alpha67-current-maker"/u);
assert.match(statusRuntime, /makerQaProfile -eq "alpha67-current-maker"/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha68-command-draft-batch-sheet-ux",
  boundaryFlushes: { overviewWrites, materialWrites, commandWrites },
  idleNetworkWrites: 0,
  failedCommandWrites,
  physicalResultInferred: false,
}));
