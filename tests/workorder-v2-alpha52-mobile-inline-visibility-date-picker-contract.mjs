#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { datePickerReducer } from "../apps/mobile/hooks/useDatePickerState.ts";

const controlled = fs.readFileSync("apps/mobile/components/ControlledInlineEditValue.tsx", "utf8");
const expanded = fs.readFileSync("apps/mobile/components/ExpandedInlineField.tsx", "utf8");
const visibility = fs.readFileSync("apps/mobile/hooks/useFocusedFieldVisibility.ts", "utf8");
const dateState = fs.readFileSync("apps/mobile/hooks/useDatePickerState.ts", "utf8");
const datePicker = fs.readFileSync("apps/mobile/components/InlineDatePicker.tsx", "utf8");
const overview = fs.readFileSync("apps/mobile/components/WorkOrderDetailOverview.tsx", "utf8");
const materials = fs.readFileSync("apps/mobile/components/WorkOrderMaterialsReadOnly.tsx", "utf8");

for (const source of [controlled, expanded, materials]) assert.doesNotMatch(source, /horizontalScroll|overflowX/);
assert.match(materials, /material-core-row-expanded/);
assert.match(materials, /material-quantity-row-expanded/);
assert.match(materials, /material-header-expanded-editor/);
assert.match(materials, /activeQuantityField/);
assert.match(materials, /activeSummaryField/);
assert.match(materials, /activeHeaderField/);
assert.match(expanded, /width: "100%"/);
assert.match(controlled, /paddingRight: 98/);
assert.match(controlled, /height: 44/);
assert.match(controlled, /accessibilityLabel="변경 취소"/);
assert.match(controlled, /accessibilityLabel="변경 저장"/);
assert.doesNotMatch(controlled, />\s*(?:취소|완료)\s*</);

assert.match(visibility, /measureInWindow/);
assert.match(visibility, /event\.endCoordinates\.screenY/);
assert.match(visibility, /fieldBottom - keyboardTop/);
assert.match(visibility, /scrollOffsetRef\.current \+ delta/);
assert.match(visibility, /keyboardDidShow/);
assert.match(visibility, /keyboardDidChangeFrame/);
assert.doesNotMatch(visibility, /setInterval|setTimeout|while\s*\(/);
assert.match(overview, /onFieldFocus/);
assert.match(overview, /onScroll=\{onScroll\}/);
assert.match(overview, /scrollEventThrottle=\{16\}/);
assert.doesNotMatch(overview, /KeyboardAvoidingView/);
assert.match(overview, /automaticallyAdjustKeyboardInsets=\{Platform\.OS === "ios"\}/);

for (const phase of ["closed", "open-clean", "open-dirty", "committing"]) assert.match(dateState, new RegExp(phase));
assert.match(datePicker, /testID="wafl-date-picker-sheet"/);
assert.match(datePicker, /justifyContent: "flex-end"/);
assert.match(datePicker, /useSafeAreaInsets/);
assert.match(datePicker, /납기일 지우기/);
assert.match(datePicker, /선택한 날짜/);
assert.match(datePicker, /onPress=\{commit\}/);
assert.match(datePicker, /dispatch\(\{ type: "select", value: dayValue \}\)/);
assert.doesNotMatch(datePicker, /onChange\(dayValue\)|toISOString|DateTimePicker/);
assert.doesNotMatch(overview, /key=\{`\$\{props\.activeBasicField === "dueDate"\}/);

const initial = {
  phase: "closed",
  draftValue: "",
  visibleYear: 2000,
  visibleMonth: 0,
  openCount: 0,
  closeCount: 0,
};
const opened = datePickerReducer(initial, { type: "open", value: "2026-09-12", today: "2026-07-22" });
assert.equal(opened.phase, "open-clean");
assert.equal(opened.openCount, 1);
assert.equal(opened.visibleYear, 2026);
assert.equal(opened.visibleMonth, 8);
assert.deepEqual(datePickerReducer(opened, { type: "open", value: "2026-10-01", today: "2026-07-22" }), opened, "an open picker must not reopen");

const selected = datePickerReducer(opened, { type: "select", value: "2026-09-13" });
assert.equal(selected.phase, "open-dirty");
assert.equal(selected.draftValue, "2026-09-13");
const committing = datePickerReducer(selected, { type: "begin-commit" });
assert.equal(committing.phase, "committing");
const closed = datePickerReducer(committing, { type: "close" });
assert.equal(closed.phase, "closed");
assert.equal(closed.closeCount, 1);
assert.deepEqual(datePickerReducer(closed, { type: "close" }), closed, "a closed picker must not close twice");

const cleared = datePickerReducer(opened, { type: "clear" });
assert.equal(cleared.draftValue, "");
assert.equal(cleared.phase, "open-dirty");
assert.equal(opened.draftValue, "2026-09-12", "calendar cancel keeps the original value immutable");

console.log("workorder v2 alpha.52 mobile inline visibility/date picker contract: PASS");
