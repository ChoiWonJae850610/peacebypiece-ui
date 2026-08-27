#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { createWorkOrderDraftBatchCoordinator } from "../apps/mobile/application/draftBatchCoordinator.ts";
import {
  createLocalSizeColorIdentity,
  remapLocalQuantityIdentity,
  resolveTemplateModifiedAfterSizeReconcile,
} from "../apps/mobile/features/work-orders/size-color/localSizeColorDraftPolicy.ts";
import { getWaflBasicSpecTemplate } from "../lib/domain/work-orders/measurement/waflBasicSpecV1.ts";

const read = (path) => fs.readFileSync(path, "utf8");

const writes = { overview: 0, production: 0, sizes: 0 };
const coordinator = createWorkOrderDraftBatchCoordinator();
for (const section of Object.keys(writes)) coordinator.register(section, async () => { writes[section] += 1; return true; });

for (const [field, value] of [["dueDate", "2026-09-10"], ["targetAudience", "여성"], ["categoryMajor", "상의"], ["categoryDetail", "니트"], ["seasonCode", "26FW"]]) {
  coordinator.stage("overview", { field, value });
}
await new Promise((resolve) => setTimeout(resolve, 30));
assert.deepEqual(writes, { overview: 0, production: 0, sizes: 0 }, "same-tab local edits and idle time must not write");
assert.equal(await coordinator.flushSection("overview", "tab-change").then((result) => result.committed), true);
assert.equal(writes.overview, 1, "top-level boundary is one logical overview flush");

coordinator.stage("production", { field: "memo", value: "local" });
assert.equal(writes.production, 0);
assert.equal((await coordinator.flushSection("production", "explicit")).committed, true);
assert.equal(writes.production, 1, "production subsection boundary flushes once");

const failed = createWorkOrderDraftBatchCoordinator();
failed.register("production", async () => false);
failed.stage("production", { field: "unitPrice", value: "900" });
assert.equal((await failed.flushSection("production", "explicit")).committed, false);
assert.equal(failed.isDirty("production"), true, "failed subsection flush preserves local dirty state");

const tempSizeId = createLocalSizeColorIdentity("size", 1);
const tempColorId = createLocalSizeColorIdentity("color", 2);
assert.equal(tempSizeId, "local-size-1");
assert.equal(tempColorId, "local-color-2");
assert.deepEqual(
  remapLocalQuantityIdentity({ colorId: tempColorId, sizeRowId: tempSizeId, quantity: 12 }, tempSizeId, "size-authoritative"),
  { colorId: tempColorId, sizeRowId: "size-authoritative", quantity: 12 },
);
assert.equal(resolveTemplateModifiedAfterSizeReconcile(false), false, "automatic size reconciliation is not a content edit");
assert.equal(resolveTemplateModifiedAfterSizeReconcile(true), true, "an existing content edit remains modified");

const tops = getWaflBasicSpecTemplate("T", "니트");
assert.ok(tops?.valuesCm.M && Object.keys(tops.valuesCm.M).length > 0, "WAFL template retains late-size source values");

const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
for (const field of ["dueDate", "targetAudience", "categoryMajor", "categoryDetail", "seasonCode", "productName"]) {
  assert.ok(overview.includes(`onActivate={() => props.onBeginEdit("${field}")}`));
}
assert.match(overview, /props\.canEdit \? props\.draft\.dueDate : header\.dueDate/u);

const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
assert.doesNotMatch(experience, /setSaveMessage(?:State)?\("저장됨"\)/u);
assert.match(experience, /showToast\("레시피가 복사되었습니다\."/u);

const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
assert.match(production, /async function switchCategory/u);
assert.match(production, /flushSection\("production", "explicit"\)/u);
assert.match(production, /flushProductionCategorySwitch/u);
assert.match(production, /flush: async \(\) => \(await draftBatch\.flushSection\("production", "explicit"\)\)\.committed/u);

const sizeColor = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
assert.match(sizeColor, /pendingStructureOperations/u);
assert.match(sizeColor, /createLocalSizeColorIdentity/u);
assert.match(sizeColor, /remapLocalQuantityIdentity/u);
assert.match(sizeColor, /draftBatch\.stage\("sizes"/u);

const repository = read("lib/domain/work-orders/command/sizeColorStructureCommandRepository.ts");
assert.match(repository, /source_template_id/u);
assert.match(repository, /findWaflBasicSpecTemplateById/u);
assert.match(repository, /ON CONFLICT \(size_spec_id, size_row_id, pom_column_id\) DO NOTHING/u);

const commandCodes = read("lib/domain/work-orders/command/workOrderCommandCodes.ts");
const modifiedCodes = commandCodes.match(/MEASUREMENT_SNAPSHOT_CONTENT_COMMAND_CODES[\s\S]+?\] as const/u)?.[0] ?? "";
assert.doesNotMatch(modifiedCodes, /sizeStructure/u);

const createSheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const inputSheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const sheetTextInput = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
assert.match(createSheet, /keyboardMode="directInput"/u);
assert.match(inputSheet, /directInputConfirmRef\.current/u);
assert.match(inputSheet, /Keyboard\.dismiss\(\)/u);
assert.match(sheetTextInput, /directInput\.submitInput\(registrationKey\)/u);
assert.match(createSheet, /keyboardAutoExpand/u);

const list = read("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx");
for (const text of ["현재 표시 레시피", "새 레시피 만들기", "레시피 목록 새로고침", "레시피 검색", "제품명·레시피 번호·품목·시즌 검색"]) assert.match(list, new RegExp(text, "u"));
const documents = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
assert.match(documents, /label="레시피 확정"/u);
assert.match(documents, /PDF 미리보기/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha68-local-authoring-spec-recipe-ux",
  sameTabWrites: 0,
  boundaryFlushes: writes,
  lateSizeTemplateValues: Object.keys(tops.valuesCm.M).length,
  physicalResultInferred: false,
}));
