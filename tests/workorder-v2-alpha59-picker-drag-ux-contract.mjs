import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  COLOR_PALETTE_PRESETS,
  CUSTOM_COLOR_GRID,
  SIZE_ALPHA_PRESETS,
  SIZE_NUMERIC_PRESETS,
  hslToHex,
  normalizeManualHex,
  sortColorRows,
  sortSizeRows,
  togglePresetSelection,
  unavailableColorPresetKeys,
  unavailableSizePresetKeys,
} from "../apps/mobile/features/work-orders/size-color/sizeColorAutoSortPolicy.ts";
import { createSelectionHapticAdapter } from "../apps/mobile/features/inputs/reel-picker/reelPickerHaptics.ts";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");

assert.deepEqual(SIZE_ALPHA_PRESETS, ["XS", "S", "M", "L", "XL", "2XL", "FREE"]);
assert.deepEqual(SIZE_NUMERIC_PRESETS, ["44", "55", "66", "77", "88"]);
assert.ok(CUSTOM_COLOR_GRID.length >= 24);
const unavailableSizes = unavailableSizePresetKeys([{ id: "size-m", code: "M", displayLabel: "Ｍ", displayOrder: 0 }]);
assert.equal(unavailableSizes.has("m"), true);
assert.deepEqual(togglePresetSelection([], "M", unavailableSizes), []);
assert.deepEqual(togglePresetSelection(["S"], "L", unavailableSizes), ["S", "L"]);

assert.equal(COLOR_PALETTE_PRESETS.length, 15);
assert.deepEqual(COLOR_PALETTE_PRESETS.map(({ name }) => name), [
  "블랙", "화이트", "아이보리", "베이지", "브라운", "그레이", "네이비", "블루",
  "민트", "그린", "옐로우", "오렌지", "레드", "핑크", "퍼플",
]);
assert.equal(unavailableColorPresetKeys([{ id: "navy", displayName: "ＮＡＶＹ", hexValue: "#1F2A44", displayOrder: 0 }]).has("navy"), true);
assert.equal(hslToHex(0, 100, 50), "#FF0000");
assert.equal(normalizeManualHex(" #a1b2c3 "), "#A1B2C3");

assert.deepEqual(sortSizeRows([
  { id: "free", displayLabel: "FREE" }, { id: "66", displayLabel: "66" },
  { id: "s", displayLabel: "S" }, { id: "44", displayLabel: "44" },
]).map((row) => row.id), ["s", "44", "66", "free"]);
assert.deepEqual(sortColorRows([
  { id: "gray", displayName: "그레이" }, { id: "white", displayName: "화이트" },
  { id: "ivory", displayName: "아이보리" },
]).map((row) => row.id), ["white", "ivory", "gray"]);

const hapticTicks = [];
const haptics = createSelectionHapticAdapter((durationMs) => hapticTicks.push(durationMs));
haptics.selectionChanged(1, 100);
haptics.selectionChanged(1, 200);
haptics.selectionChanged(2, 220);
assert.deepEqual(hapticTicks, [8, 8]);

const editor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const controller = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
const repository = read("lib/domain/work-orders/command/sizeColorStructureCommandRepository.ts");
const runtimeQa = read("scripts/run-wafl-v2-alpha59-size-color-structure-runtime-qa.mjs");

for (const semantic of ["SIZE_ALPHA_PRESETS", "SIZE_NUMERIC_PRESETS", "COLOR_PALETTE_PRESETS", "CUSTOM_COLOR_GROUPS", "onAddSizes", "onAddColors", "CatalogChoice"]) {
  assert.match(editor, new RegExp(semantic));
}
assert.doesNotMatch(editor, /PanResponder|GripVertical|onLongPress|accessibilityActions|onReorderSizeIds|onReorderColorIds/);
assert.doesNotMatch(controller, /reorderSizes|reorderColors|onReorderSizeIds|onReorderColorIds/);
assert.match(controller, /onRefreshLatest/);
assert.match(controller, /isConflict/);
assert.match(controller, /normalizedPresetKey/);
assert.match(repository, /applyCanonicalSizeOrder/);
assert.match(repository, /applyCanonicalColorOrder/);
assert.match(runtimeQa, /READ_ONLY_REGRESSION_PRODUCT/);
assert.match(runtimeQa, /cleanupSynthetic/);
assert.match(runtimeQa, /fatal[\s\S]*redScreen[\s\S]*uncaught[\s\S]*unhandled/);

console.log("workorder-v2 alpha.59 picker/drag historical contract corrected to automatic sort: PASS");
