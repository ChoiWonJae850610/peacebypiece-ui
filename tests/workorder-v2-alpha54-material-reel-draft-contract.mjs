#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { decideDraftExit } from "../apps/mobile/application/draftExitPolicy.ts";
import { materialReelDraftPatch } from "../apps/mobile/features/materials/materialReelAdapter.ts";

assert.deepEqual(materialReelDraftPatch({ field: "requiredQuantity", value: "12.5", unitCode: "yd", currentUnitCode: "yd" }), { requiredQuantity: "12.5" });
assert.deepEqual(materialReelDraftPatch({ field: "allowanceQuantity", value: "0.5", unitCode: "m", currentUnitCode: "yd" }), { allowanceQuantity: "0.5" });
assert.deepEqual(materialReelDraftPatch({ field: "unitCode", value: "12", unitCode: "kg", currentUnitCode: "yd" }), { unitCode: "kg" });

assert.equal(decideDraftExit({ intent: "background", mutationInFlight: false }), "preserve");
assert.equal(decideDraftExit({ intent: "list", mutationInFlight: false }), "discard");
assert.equal(decideDraftExit({ intent: "feature", mutationInFlight: false }), "discard");
assert.equal(decideDraftExit({ intent: "session-loss", mutationInFlight: false }), "discard");
assert.equal(decideDraftExit({ intent: "list", mutationInFlight: true }), "blocked-saving");

const sheet = fs.readFileSync("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx", "utf8");
const materials = fs.readFileSync("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx", "utf8");
const editor = fs.readFileSync("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx", "utf8");
const experience = fs.readFileSync("apps/mobile/features/MobileWorkOrderExperience.tsx", "utf8");
const overview = fs.readFileSync("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx", "utf8");
const inlineReel = fs.readFileSync("apps/mobile/features/inputs/reel-picker/ReelInlineEditValue.tsx", "utf8");

for (const token of ["snapToInterval={ITEM_HEIGHT}", "VISIBLE_ROWS = 5", "숫자 직접 입력", "numberReel", "intervalReel", "unitOnlyReel", 'accessibilityLabel="변경 취소"', 'accessibilityLabel="변경 저장"']) assert.ok(sheet.includes(token), `reel sheet missing ${token}`);
assert.doesNotMatch(sheet, /stepButton|cancelText|applyText|적용 후 원단의 Check/);
assert.doesNotMatch(sheet, /apiClient|fetch\(|PATCH|workOrderMutationController/);
for (const field of ["requiredQuantity", "allowanceQuantity", "inventoryUsageQuantity", "unitCode"]) assert.match(materials, new RegExp(`field=\"${field}\"`));
assert.match(materials, /materialReelDraftPatch/);
assert.match(materials, /kind=\{reelTarget\.field === "unitCode" \? "unit" : "quantity"\}/);
assert.match(materials, /onSaveEdit\(patch\)/);
assert.match(materials, /onCancelEdit\(\)/);
assert.doesNotMatch(inlineReel, /accessibilityLabel="변경 저장"|accessibilityLabel="변경 취소"/);
assert.match(editor, /materialReelDraftPatch/);
assert.match(overview, /kind="integer"/);
assert.match(overview, /props\.onSave\(\{ totalQuantity: value \}\)/);
assert.match(experience, /async function saveMaterial\(draftOverride\?: MaterialDraftUpdate\)[\s\S]*createMaterialDraft\(draftOverride \?\? \{\}, editor\.draft\)/);
assert.match(experience, /cancelMaterialEditor\(\);\s+return;/);
assert.doesNotMatch(experience, /저장하지 않은 변경사항이 있습니다|변경사항 버리기/);
assert.match(experience, /leaveWithDraftPolicy/);

console.log("workorder v2 alpha.54 material reel local-draft contract: PASS");
