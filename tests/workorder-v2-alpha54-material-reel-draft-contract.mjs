#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { decideDraftExit } from "../apps/mobile/application/draftExitPolicy.ts";
import { materialReelDraftPatch } from "../apps/mobile/features/materials/materialReelAdapter.ts";

assert.deepEqual(materialReelDraftPatch({ field: "requiredQuantity", value: "12.5", unitCode: "yd", currentUnitCode: "yd" }), { requiredQuantity: "12.5" });
assert.deepEqual(materialReelDraftPatch({ field: "allowanceQuantity", value: "0.5", unitCode: "m", currentUnitCode: "yd" }), { allowanceQuantity: "0.5" });
assert.deepEqual(materialReelDraftPatch({ field: "unitCode", value: "12", unitCode: "kg", currentUnitCode: "yd" }), { unitCode: "kg" });

assert.equal(decideDraftExit({ intent: "background", mutationInFlight: false }), "flush");
assert.equal(decideDraftExit({ intent: "list", mutationInFlight: false }), "flush");
assert.equal(decideDraftExit({ intent: "feature", mutationInFlight: false }), "flush");
assert.equal(decideDraftExit({ intent: "session-loss", mutationInFlight: false }), "flush");
assert.equal(decideDraftExit({ intent: "list", mutationInFlight: true }), "blocked-saving");

const sheet = fs.readFileSync("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx", "utf8");
const optionReel = fs.readFileSync("apps/mobile/features/inputs/reel-picker/WaflOptionReel.tsx", "utf8");
const sizingPolicy = fs.readFileSync("apps/mobile/features/inputs/reel-picker/waflReelSheetSizingPolicy.ts", "utf8");
const inputShell = fs.readFileSync("apps/mobile/features/inputs/WaflInputSheet.tsx", "utf8");
const materials = fs.readFileSync("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx", "utf8");
const editor = fs.readFileSync("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx", "utf8");
const experience = [fs.readFileSync("apps/mobile/features/MobileWorkOrderExperience.tsx", "utf8"), fs.readFileSync("apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts", "utf8")].join("\n");
const overview = fs.readFileSync("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx", "utf8");
const inlineReel = fs.readFileSync("apps/mobile/features/inputs/reel-picker/ReelInlineEditValue.tsx", "utf8");
const fieldPolicy = fs.readFileSync("apps/mobile/features/materials/materialFieldPolicy.ts", "utf8");
const historicalEvidence = fs.readFileSync("docs/project/app-v2/53-mobile-reel-picker-input-ux-evidence.md", "utf8");

for (const token of ["snapToInterval={ITEM_HEIGHT}", "숫자 직접 입력", "numberReel", "intervalReel", "unitOnlyReel", "<WaflInputSheet"]) assert.ok(`${sheet}\n${optionReel}`.includes(token), `reel owner missing ${token}`);
assert.match(sizingPolicy, /WAFL_REEL_VISIBLE_ROWS = 5/u);
for (const token of ["cancelAccessibilityLabel", "confirmAccessibilityLabel", "createWaflInputCommitGuard"]) assert.ok(inputShell.includes(token), `shared input shell missing ${token}`);
assert.doesNotMatch(sheet, /stepButton|cancelText|applyText|적용 후 원단의 Check/);
assert.doesNotMatch(sheet, /apiClient|fetch\(|PATCH|workOrderMutationController/);
for (const field of ["requiredQuantity", "allowanceQuantity", "unitCode"]) assert.match(materials, new RegExp(`field=\"${field}\"`));
assert.doesNotMatch(materials, /field="inventoryUsageQuantity"/);
assert.match(fieldPolicy, /MOBILE_MATERIAL_INVENTORY_USAGE_VISIBLE = false/);
assert.match(historicalEvidence, /inventory|재고/i);
assert.match(materials, /materialReelDraftPatch/);
assert.match(materials, /kind=\{reelTarget\.field === "unitCode" \? "unit" : "quantity"\}/);
assert.doesNotMatch(materials, /reelTarget\.field === "unitPrice"/);
assert.match(materials, /onSaveEdit\(patch\)/);
assert.match(materials, /onCancelEdit\(\)/);
assert.doesNotMatch(inlineReel, /accessibilityLabel="변경 저장"|accessibilityLabel="변경 취소"/);
assert.match(editor, /materialReelDraftPatch/);
assert.match(overview, /label="총 수량"[\s\S]{0,120}header\.totalQuantity\.toLocaleString/);
assert.doesNotMatch(overview, /field="totalQuantity"|props\.onSave\(\{ totalQuantity: value \}\)/);
assert.match(experience, /async function saveMaterial\(draftOverride\?: MaterialDraftUpdate, inlineOwner\?: MaterialInlineEditSession\)[\s\S]*createMaterialDraft\(draftOverride \?\? \{\}, editor\.draft\)/);
assert.match(experience, /cancelMaterialEditor\(\);\s+return;/);
assert.doesNotMatch(experience, /저장하지 않은 변경사항이 있습니다|변경사항 버리기/);
assert.match(experience, /leaveWithDraftPolicy/);

console.log("workorder v2 alpha.54 material reel local-draft contract: PASS");
