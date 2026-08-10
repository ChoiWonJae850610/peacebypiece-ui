import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  CUSTOM_COLOR_GRID,
  createImmutableAddSnapshot,
  hexToRgb,
} from "../apps/mobile/features/work-orders/size-color/sizeColorAutoSortPolicy.ts";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");

const selected = ["44", " 55 ", "６６"];
const queue = createImmutableAddSnapshot(selected, []);
selected.splice(0, selected.length, "77");
assert.equal(Object.isFrozen(queue), true);
assert.equal(Object.isFrozen(queue.pending), true);
assert.deepEqual(queue.selected, ["44", "55", "66"]);
assert.deepEqual(queue.pending, ["44", "55", "66"]);
const duplicateQueue = createImmutableAddSnapshot(["44", "55", "55", "66"], ["55"]);
assert.deepEqual(duplicateQueue.pending, ["44", "66"]);
assert.deepEqual(duplicateQueue.duplicates, ["55"]);

assert.ok(CUSTOM_COLOR_GRID.length >= 24);
assert.deepEqual(hexToRgb("#1F2A44"), { r: 31, g: 42, b: 68 });
assert.ok(CUSTOM_COLOR_GRID.every((cell) => /^#[0-9A-F]{6}$/.test(cell.hex)));

const editor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const controller = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
const policy = read("apps/mobile/domain/sizeColorStructurePolicy.ts");
const readOnly = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const packageJson = read("package.json");
const lockfile = read("package-lock.json");

for (const copy of ["개 추가", "RGB", "HEX", "직접 색상 만들기"]) assert.match(editor, new RegExp(copy));
assert.match(editor, /WaflOptionReel/);
assert.match(editor, /CUSTOM_COLOR_GROUPS/);
assert.doesNotMatch(editor, /PanResponder|dragging|accessibilityActions|onReorderSizeIds|onReorderColorIds/);
assert.doesNotMatch(editor, /숫자 사이즈|선택 목록 수|SIZE_NUMERIC_REEL_RANGE/);
assert.doesNotMatch(editor, /H 값|S 값|L 값|manualHex|setManualHex/);
assert.doesNotMatch(editor, /placeholder="HEX|placeholder="RGB|placeholder="HSL/);
assert.match(editor, /confirmWaflDestructiveAction/);
assert.doesNotMatch(editor, /archive|restore/i);
assert.ok(
  editor.indexOf("const immutableSelection") < editor.indexOf("props.onAdd(immutableSelection)")
    && editor.indexOf("props.onAdd(immutableSelection)") < editor.indexOf("if (!result.failed) props.onClose()"),
  "selection is captured before the request and cleared only after success",
);

assert.match(controller, /const immutableSelection = Object\.freeze/);
assert.match(controller, /await snapshot\.onRefreshLatest\(\)/);
assert.match(controller, /expectedVersion = result\.nextVersion/);
assert.match(controller, /const ids = identity\(\)/);
assert.match(controller, /if \(!isConflict\(error\)\)/);
assert.match(controller, /const reconciled =/);
assert.match(controller, /retryError/);
assert.doesNotMatch(controller, /reorderSizes|reorderColors|onReorderSizeIds|onReorderColorIds/);
assert.match(policy, /Object\.freeze/);
assert.doesNotMatch(readOnly, /onAddSizes|onPatchColor|onReorder/);
assert.match(editor, /영구 삭제/);
assert.doesNotMatch(`${editor}\n${readOnly}`, /보관|복원/);

const packageDependencies = Object.keys(JSON.parse(packageJson).dependencies ?? {}).sort();
const lockDependencies = Object.keys(JSON.parse(lockfile).packages?.[""]?.dependencies ?? {}).sort();
assert.deepEqual(packageDependencies, lockDependencies);

console.log("workorder-v2 alpha.59 picker/drag QA-fix historical contract corrected to automatic sort: PASS");
