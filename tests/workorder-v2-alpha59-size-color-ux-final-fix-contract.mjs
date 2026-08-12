import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const editor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const readOnly = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const controller = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
const repository = read("lib/domain/work-orders/command/sizeColorStructureCommandRepository.ts");
const sortPolicy = read("apps/mobile/domain/sizeColorStructurePolicy.ts");
const runtimeQa = read("scripts/run-wafl-v2-alpha59-size-color-structure-runtime-qa.mjs");

test("shared automatic size and color policy is deterministic", async () => {
  const policy = await import("../apps/mobile/features/work-orders/size-color/sizeColorAutoSortPolicy.ts");
  const sizes = [
    { id: "z", displayLabel: "FREE" },
    { id: "n2", displayLabel: "55" },
    { id: "a", displayLabel: "XS" },
    { id: "n1", displayLabel: "44" },
    { id: "b", displayLabel: "2XL" },
    { id: "c", displayLabel: "커스텀 10" },
    { id: "d", displayLabel: "커스텀 2" },
  ];
  assert.deepEqual(policy.sortSizeRows(sizes).map((row) => row.id), ["a", "b", "n1", "n2", "z", "d", "c"]);

  const colors = [
    { id: "c3", displayName: "그레이" },
    { id: "c1", displayName: "화이트" },
    { id: "c2", displayName: "아이보리" },
    { id: "x2", displayName: "커스텀 10" },
    { id: "x1", displayName: "커스텀 2" },
  ];
  assert.deepEqual(policy.sortColorRows(colors).map((row) => row.id), ["c1", "c2", "c3", "x1", "x2"]);
  assert.match(sortPolicy, /Intl\.Collator\("ko-KR"/);
});

test("mobile owns compact cards and canonical catalog selectors, not manual reorder", () => {
  assert.match(editor, /count=\{matrix\.sizes\.length\} editable=\{edit\.canEdit\} kind="size"/);
  assert.match(editor, /count=\{matrix\.colors\.length\} editable=\{edit\.canEdit\} kind="color"/);
  assert.match(editor, /function CatalogChoice/);
  assert.match(editor, /function SizeChooser[\s\S]*function ColorChooser/);
  assert.match(editor, /직접 색상 만들기/);
  assert.doesNotMatch(editor, /PanResponder|GripVertical|dragTargetIndex|accessibilityMoveActions|onReorderSizeIds|onReorderColorIds/);
  assert.doesNotMatch(controller, /onMoveSize|onMoveColor|onReorderSizeIds|onReorderColorIds|reorderSizes|reorderColors/);
});

test("quantity and measurement sections are independently collapsed", () => {
  assert.match(readOnly, /<Text style=\{styles\.sectionTitle\}>색상·사이즈<\/Text>/);
  assert.match(readOnly, /<Text style=\{styles\.sectionTitle\}>완성 스펙<\/Text>/);
  assert.doesNotMatch(readOnly, /합계 일치|색상×사이즈 생산수량 · 총/);
  assert.match(readOnly, /quantityExpanded/);
  assert.match(readOnly, /measurementExpanded/);
  assert.doesNotMatch(readOnly, /function SummaryItem|summaryGrid|summaryItem|summaryValue/);
});

test("server create and rename paths apply the shared canonical order inside their transaction", () => {
  assert.match(repository, /sizeColorStructurePolicy/);
  assert.match(repository, /sortSizeRows/);
  assert.match(repository, /sortColorRows/);
  assert.match(repository, /applyCanonicalSizeOrder/);
  assert.match(repository, /applyCanonicalColorOrder/);
});

test("alpha.60 supersedes the deferred destructive boundary without archive or restore", () => {
  assert.match(editor, /title: "사이즈 삭제"/);
  assert.match(editor, /title: "색상 삭제"/);
  assert.match(controller, /deleteSize[\s\S]+deleteColor/);
  assert.doesNotMatch(`${editor}\n${controller}`, /archive|restore/i);
});

test("Runtime exact-color identities and accounting keys use the shared ASCII ordinal queue", () => {
  assert.match(runtimeQa, /createExactColorOrdinalQueue/);
  assert.match(runtimeQa, /identity\(colorRequest\.requestIdentityClass\)/);
  assert.match(runtimeQa, /changedWithReceipt\(colorRequest\.stepKey\)/);
  assert.match(runtimeQa, /displayName:\s*colorRequest\.displayName/);
  assert.doesNotMatch(runtimeQa, /identity\(`exact-color-\$\{displayName\}`\)/);
  assert.doesNotMatch(runtimeQa, /changedWithReceipt\(`exact-color-\$\{displayName\}`\)/);
});
