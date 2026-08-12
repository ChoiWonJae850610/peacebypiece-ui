#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  clearOwnedMaterialInlineEditSession,
  createMaterialInlineEditSession,
  ownsMaterialInlineEditSession,
} from "../apps/mobile/features/materials/materialInlineEditSession.ts";
import {
  acceptNestedStructureServerRow,
  applyNestedColorPalette,
  cancelNestedColorPalette,
  createNestedStructureEditorState,
  openNestedColorPalette,
  reconcileNestedStructureSelection,
  selectNestedStructureRow,
} from "../apps/mobile/features/work-orders/size-color/nestedStructureEditorState.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const controlled = read("apps/mobile/components/ControlledInlineEditValue.tsx");
const structure = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const runtime = read("scripts/run-wafl-v2-alpha59-size-color-structure-runtime-qa.mjs");

const session = (itemId, field, token, workOrderGeneration = 3) => createMaterialInlineEditSession({
  workOrderId: "work-order-a", itemId, field, token, workOrderGeneration,
});

const nameA = session("material-a", "name", 1);
const nameAReopen = session("material-a", "name", 2);
const colorA = session("material-a", "colorOption", 3);
const usageA = session("material-a", "usageArea", 4);
const memoA = session("material-a", "memo", 5);
const priceA = session("material-a", "unitPrice", 6);
const nameB = session("material-b", "name", 7);

assert.equal(clearOwnedMaterialInlineEditSession(nameA, nameA), null);
assert.equal(ownsMaterialInlineEditSession(nameAReopen, nameA), false);
assert.equal(clearOwnedMaterialInlineEditSession(nameAReopen, nameA), nameAReopen);
assert.equal(clearOwnedMaterialInlineEditSession(colorA, nameAReopen), colorA);
assert.equal(clearOwnedMaterialInlineEditSession(usageA, colorA), usageA);
assert.equal(clearOwnedMaterialInlineEditSession(memoA, usageA), memoA);
assert.equal(clearOwnedMaterialInlineEditSession(priceA, memoA), priceA);
assert.equal(clearOwnedMaterialInlineEditSession(nameB, priceA), nameB);
assert.equal(ownsMaterialInlineEditSession(nameA, session("material-a", "name", 1, 4)), false);

assert.match(experience, /createMaterialInlineEditSession\(\{[\s\S]{0,300}workOrderId:[\s\S]{0,220}itemId: line\.id[\s\S]{0,160}field[\s\S]{0,160}workOrderGeneration/);
assert.match(experience, /closeOwnedMaterialEditorSession/);
assert.match(experience, /if \(inlineOwner && !ownsMaterialInlineEditSession\(materialInlineSessionRef\.current, inlineOwner\)\) return/);
const beginMaterialEdit = experience.slice(experience.indexOf("function beginMaterialEdit"), experience.indexOf("function changeMaterialDraft"));
assert.doesNotMatch(beginMaterialEdit, /현재 필드 편집을 완료해 주세요/);
assert.match(materials, /onCancel=\{\(\) => \{ if \(owner\) onCancel\(owner\); \}\}/);
assert.match(materials, /onSave=\{\(finalizedValue\) => \{ if \(owner\) onSave\(/);
assert.match(materials, /materialType === "accessory" \? "부자재" : "원단"/);
assert.match(controlled, /finalizationRef\.current\.requestSave\(\)/);
assert.match(controlled, /onSubmitEditing=.*handleSubmitEditing/);
assert.match(controlled, /onEndEditing=\{handleEndEditing\}/);

const white = { id: "color-white", name: "화이트", hex: "#FFFFFF" };
const gray = { id: "color-gray", name: "그레이", hex: "#8A8F98" };
let nested = createNestedStructureEditorState(white);
nested = selectNestedStructureRow(nested, gray);
assert.equal(nested.selectedId, "color-gray");
nested = openNestedColorPalette(nested);
assert.equal(nested.child, "palette");
const canceled = cancelNestedColorPalette(nested, "#8A8F98");
assert.deepEqual({ child: canceled.child, selectedId: canceled.selectedId, hex: canceled.hexDraft }, {
  child: "row", selectedId: "color-gray", hex: "#8A8F98",
});
nested = applyNestedColorPalette(openNestedColorPalette(canceled), "#111111");
assert.equal(nested.child, "row");
assert.equal(nested.selectedId, "color-gray");
nested = acceptNestedStructureServerRow(nested, { id: "color-gray", name: "그레이 수정", hex: "#111111" });
nested = reconcileNestedStructureSelection(nested, [gray, white]);
assert.equal(nested.selectedId, "color-gray");
assert.equal(nested.nameDraft, "그레이 수정");
nested = selectNestedStructureRow(nested, white);
assert.equal(nested.selectedId, "color-white");

const catalogEditor = structure.slice(structure.indexOf("function CatalogChoice"), structure.indexOf("export default function WorkOrderSizeColorStructureEditor"));
assert.match(catalogEditor, /accessibilityState=\{\{ checked: props\.selected \}\}/);
assert.match(catalogEditor, /selected\.has\(normalized\(option\.displayName\)\)/);
assert.match(catalogEditor, /onToggle\(\{ displayName: option\.displayName, hexValue: option\.hexValue/);
assert.match(catalogEditor, /onRemove=\{\(\) => props\.onRemove\(option\)\}/);
assert.doesNotMatch(catalogEditor, /onPatchColor|ExistingStructureEditor/);
assert.match(runtime, /inlineSessionNestedEditorLifecycle/);
assert.match(runtime, /proveInlineSessionAndNestedEditorStateMachines/);
assert.match(runtime, /ALPHA59_INLINE_SESSION_NESTED_EDITOR_IPHONE_REQA_REQUIRED/);
assert.match(runtime, /ALPHA59_INLINE_SESSION_NESTED_EDITOR_BLOCKED/);

console.log("workorder v2 alpha.59 inline session nested editor UX contract: PASS");
