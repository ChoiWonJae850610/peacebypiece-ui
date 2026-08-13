import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const finalizationModule = await import(pathToFileURL(
  "apps/mobile/lib/inlineEditFinalization.ts",
).href);
const disclosureModule = await import(pathToFileURL(
  "apps/mobile/features/materials/materialMemoDisclosureModel.ts",
).href);

const {
  createInlineEditFinalizationController,
} = finalizationModule;
const {
  MATERIAL_MEMO_COMPACT_LINES,
  createMaterialMemoDisclosureModel,
} = disclosureModule;

for (const scenario of [
  { partial: "ㅎㅏㄴㄱㅡㄹ", finalized: "한글" },
  { partial: "첫 줄\nㄷㅜㄹㅉㅐ", finalized: "첫 줄\n둘째 줄" },
  { partial: "english", finalized: "english" },
  { partial: "한글 English ㅎㅗㄴㅎㅏㅂ", finalized: "한글 English 혼합" },
  { partial: "메모 😀 ㅇㅘㄴㄹㅛ", finalized: "메모 😀 완료" },
]) {
  const controller = createInlineEditFinalizationController("기존 값");
  controller.observe(scenario.partial);
  assert.equal(controller.requestSave(), true);
  assert.equal(controller.requestSave(), false, "rapid duplicate Check must be ignored");
  const result = controller.finalize(scenario.finalized);
  assert.deepEqual(result, { shouldSave: true, value: scenario.finalized });
  assert.equal(controller.finalize(scenario.finalized).shouldSave, false);
  assert.doesNotMatch(result.value, /[ㄱ-ㅎㅏ-ㅣ]+$/u);
}

{
  const controller = createInlineEditFinalizationController("기존 값");
  controller.observe("취소할 값");
  assert.equal(controller.requestSave(), true);
  controller.cancel();
  assert.equal(controller.finalize("취소할 값").shouldSave, false);
}

{
  const controller = createInlineEditFinalizationController("실패 전");
  assert.equal(controller.requestSave(), true);
  assert.equal(controller.finalize("보존할 draft").shouldSave, true);
  controller.reset("보존할 draft");
  assert.equal(controller.requestSave(), true, "explicit retry can start only after owner reset");
}

assert.equal(MATERIAL_MEMO_COMPACT_LINES, 2);
assert.deepEqual(createMaterialMemoDisclosureModel(1, false), {
  expanded: false,
  hasOverflow: false,
  label: null,
  numberOfLines: 2,
});
assert.deepEqual(createMaterialMemoDisclosureModel(2, true), {
  expanded: false,
  hasOverflow: false,
  label: null,
  numberOfLines: 2,
});
assert.deepEqual(createMaterialMemoDisclosureModel(3, false), {
  expanded: false,
  hasOverflow: true,
  label: "더보기",
  numberOfLines: 2,
});
assert.deepEqual(createMaterialMemoDisclosureModel(3, true), {
  expanded: true,
  hasOverflow: true,
  label: "접기",
  numberOfLines: null,
});

const controlled = fs.readFileSync(
  "apps/mobile/components/ControlledInlineEditValue.tsx",
  "utf8",
);
const materials = fs.readFileSync(
  "apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx",
  "utf8",
);

assert.match(controlled, /inputRef\.current\?\.isFocused\(\)/);
assert.match(controlled, /inputRef\.current\.blur\(\)/);
assert.match(controlled, /onEndEditing=\{handleEndEditing\}/);
assert.match(controlled, /onChange=\{handleNativeChange\}/);
assert.match(controlled, /event\.nativeEvent\.text/);
assert.match(controlled, /finalizationRef\.current\.requestSave\(\)/);
assert.match(controlled, /if \(!result\.shouldSave\) return;[\s\S]*?decideInlineEditCommit\([\s\S]*?if \(!decision\.changed\)[\s\S]*?onSave\(decision\.value\)/);
assert.doesNotMatch(controlled, /setTimeout\(/);
assert.match(materials, /onSave\(\{ \[field\]: finalizedValue \}/);
assert.doesNotMatch(`${controlled}\n${materials}`, /selectTextOnFocus|selection=|setNativeProps\(/);
assert.match(materials, /onTextLayout=\{\(event\) => \{[\s\S]*?event\.nativeEvent\.lines\.length/);
assert.match(materials, /testID="material-memo-disclosure"/);
assert.match(materials, /numberOfLines=\{memoDisclosure\.numberOfLines\}/);
assert.match(materials, /accessibilityState=\{\{ expanded: memoExpanded \}\}/);

console.log("PASS workorder-v2-alpha55-memo-ime-display-contract");
