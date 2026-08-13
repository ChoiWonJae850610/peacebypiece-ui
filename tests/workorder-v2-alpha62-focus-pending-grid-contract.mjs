#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createSerializedMutationQueue } from "../apps/mobile/application/mutationController.ts";
import { planInlineEditTransition } from "../apps/mobile/application/inlineEditTransition.ts";
import { decideInlineEditCommit } from "../apps/mobile/lib/inlineEditFinalization.ts";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const order = [];
let releaseFirst;
const firstGate = new Promise((resolve) => { releaseFirst = resolve; });
const queue = createSerializedMutationQueue();
const first = queue.enqueue(async () => { order.push("A:start"); await firstGate; order.push("A:end"); return 1; });
const second = queue.enqueue(async () => { order.push("B"); return 2; });
await Promise.resolve();
assert.deepEqual(order, ["A:start"]);
assert.equal(queue.pendingCount, 2);
releaseFirst();
assert.deepEqual(await Promise.all([first, second]), [1, 2]);
assert.deepEqual(order, ["A:start", "A:end", "B"]);
assert.equal(queue.pendingCount, 0);
assert.deepEqual(planInlineEditTransition({ currentField: "A", nextField: "B", currentDirty: true }), { activateNextImmediately: true, commitCurrent: true });
assert.equal(planInlineEditTransition({ currentField: "A", nextField: "B", currentDirty: false }).commitCurrent, false);
assert.equal(planInlineEditTransition({ currentField: "A", nextField: "A", currentDirty: true }).commitCurrent, false);

const mutationValues = [];
const focusQueue = createSerializedMutationQueue();
async function transitionHarness({ activationValue, draftValue, semantics }) {
  const decision = decideInlineEditCommit({ activationValue, draftValue, semantics });
  const plan = planInlineEditTransition({ currentField: "A", nextField: "B", currentDirty: decision.changed });
  let activeField = "A";
  if (plan.activateNextImmediately) activeField = "B";
  const save = plan.commitCurrent ? focusQueue.enqueue(async () => { mutationValues.push(decision.nullableValue); }) : Promise.resolve();
  assert.equal(activeField, "B", "next field focus must not wait for the network queue");
  await save;
}
await transitionHarness({ activationValue: "메모", draftValue: "새 메모", semantics: "nullable-text" });
await transitionHarness({ activationValue: "동일", draftValue: "동일", semantics: "nullable-text" });
await transitionHarness({ activationValue: "삭제", draftValue: "", semantics: "nullable-text" });
assert.deepEqual(mutationValues, ["새 메모", null], "changed/unchanged/clear mutation accounting");

const picker = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const partnerPicker = read("apps/mobile/features/materials/MaterialPartnerPickerSheet.tsx");
for (const token of ["single-choice-reel", "WaflOptionReel", "FiniteOptionReelColumn", "optionItems"]) assert.ok(picker.includes(token));
assert.doesNotMatch(picker, /flatOptionList|flatOptionMetadata/);
assert.ok(partnerPicker.includes("WaflReelPickerSheet"));
assert.ok(partnerPicker.includes('kind="option"'));

const experience = [
  read("apps/mobile/features/MobileWorkOrderExperience.tsx"),
  read("apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts"),
].join("\n");
for (const token of ["createSerializedMutationQueue", "planInlineEditTransition", "inlineMutationQueue.enqueue", "previousInlineOwner", "activeBasicFieldRef.current = field"]) assert.ok(experience.includes(token));
assert.doesNotMatch(experience, /현재 필드 편집을 완료해 주세요/);

const sizeController = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
const sizeRead = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
for (const token of ["PendingCommandScope", '"measurement-unit"', "authoritativeVersion", "mutationQueue.enqueue"]) assert.ok(sizeController.includes(token));
assert.ok(sizeRead.includes('isSizeColorCommandPending(edit?.pendingScope ?? null, "measurement-unit")'));
assert.doesNotMatch(sizeRead, /disabled=\{edit\?\.busy\}/);

const grid = read("apps/mobile/features/inputs/WaflOptionGrid.tsx");
const structureEditor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
for (const token of ["WaflOptionGridItem", 'columns: 3 | 4', 'accessibilityRole="checkbox"', "removable"]) assert.ok(grid.includes(token));
assert.equal((structureEditor.match(/<WaflOptionGrid/g) ?? []).length, 4);
for (const label of ["WAFL 기본 사이즈", "등록 사이즈", "WAFL 기본 색상", "등록 색상"]) assert.ok(structureEditor.includes(label));
assert.ok(structureEditor.includes('columns={4}'));
assert.ok(structureEditor.includes('columns={3}'));

const sheets = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
for (const label of ["사용자 저장 스펙", "사용자 저장 스펙 관리", "스펙 저장"]) assert.ok(sheets.includes(label));
assert.doesNotMatch(sheets, /label:\s*"저장 스펙"|>저장 스펙 관리</);

console.log("WAFL v2 alpha.62 iPhone focus/pending/grid remediation contract: PASS");
