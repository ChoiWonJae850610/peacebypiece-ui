#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  WORK_ORDER_SEARCH_LAYOUT,
  workOrderSearchLayoutState,
} from "../apps/mobile/features/work-orders/list/immediateSearchPolicy.ts";
import {
  INLINE_DATE_PICKER_LAYOUT,
  calendarGridHeight,
  resolveDateBadgeState,
} from "../apps/mobile/components/inlineDatePickerLayout.ts";
import { calendarMonthCells, datePickerReducer } from "../apps/mobile/hooks/useDatePickerState.ts";

const searchStates = [
  workOrderSearchLayoutState({ query: "", searching: false }),
  workOrderSearchLayoutState({ query: "A", searching: false }),
  workOrderSearchLayoutState({ query: "ABC", searching: false }),
  workOrderSearchLayoutState({ query: "ABC", searching: true }),
];
for (const state of searchStates) {
  assert.equal(state.rowHeight, WORK_ORDER_SEARCH_LAYOUT.rowHeight);
  assert.equal(state.fieldHeight, WORK_ORDER_SEARCH_LAYOUT.fieldHeight);
  assert.equal(state.inputHeight, WORK_ORDER_SEARCH_LAYOUT.inputHeight);
  assert.equal(state.accessorySize, WORK_ORDER_SEARCH_LAYOUT.accessorySize);
}
assert.deepEqual(searchStates.map((state) => state.accessory), ["empty", "clear", "clear", "loading"]);
assert.equal(WORK_ORDER_SEARCH_LAYOUT.rowHeight, WORK_ORDER_SEARCH_LAYOUT.fieldHeight);
assert.ok(WORK_ORDER_SEARCH_LAYOUT.inputHeight <= WORK_ORDER_SEARCH_LAYOUT.fieldHeight);

assert.equal(calendarGridHeight(calendarMonthCells(2026, 6).length), 180);
assert.equal(calendarGridHeight(calendarMonthCells(2026, 7).length), 216);
assert.throws(() => calendarGridHeight(28), /calendar-grid-cell-count-invalid/);
assert.ok(
  INLINE_DATE_PICKER_LAYOUT.dayBadgeSize
    + INLINE_DATE_PICKER_LAYOUT.dayBadgeBorderWidth * 2
    <= INLINE_DATE_PICKER_LAYOUT.dayCellHeight,
);
assert.equal(resolveDateBadgeState({ today: false, stored: false, selected: false }), "normal");
assert.equal(resolveDateBadgeState({ today: true, stored: false, selected: false }), "today");
assert.equal(resolveDateBadgeState({ today: true, stored: true, selected: false }), "stored");
assert.equal(resolveDateBadgeState({ today: true, stored: true, selected: true }), "selected");

const initial = { phase: "closed", draftValue: "", visibleYear: 2000, visibleMonth: 0, openCount: 0, closeCount: 0 };
const opened = datePickerReducer(initial, { type: "open", value: "2026-07-30", today: "2026-07-23" });
const selected = datePickerReducer(opened, { type: "select", value: "2026-07-31" });
assert.equal(selected.draftValue, "2026-07-31");
assert.equal(datePickerReducer(selected, { type: "close" }).phase, "closed");

const list = fs.readFileSync("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx", "utf8");
const picker = fs.readFileSync("apps/mobile/components/InlineDatePicker.tsx", "utf8");
assert.match(list, /style=\{styles\.searchAccessory\}/);
assert.match(list, /style=\{styles\.filterRail\}/);
assert.match(list, /multiline=\{false\}/);
assert.match(list, /numberOfLines=\{1\}/);
assert.match(list, /includeFontPadding: false/);
assert.match(picker, /style=\{styles\.dayCell\}[\s\S]*styles\.dayBadge/);
assert.match(picker, /maxFontSizeMultiplier=\{1\.25\}/);
assert.doesNotMatch(picker, /dayCell: \{[^}]*aspectRatio/);
assert.doesNotMatch(picker, /today: \{[^}]*borderWidth|storedDay: \{[^}]*borderWidth|selectedDay: \{[^}]*borderWidth/);
assert.doesNotMatch(picker, /toISOString|DateTimePicker/);

console.log("workorder v2 alpha.54 final UI polish contract: PASS");
