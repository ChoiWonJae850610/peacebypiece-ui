#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  WORK_ORDER_SEARCH_DEBOUNCE_MS,
  WORK_ORDER_SEARCH_LAYOUT,
  normalizeWorkOrderSearchQuery,
  shouldIssueWorkOrderSearch,
  workOrderSearchLayoutState,
} from "../apps/mobile/features/work-orders/list/immediateSearchPolicy.ts";

assert.equal(WORK_ORDER_SEARCH_DEBOUNCE_MS, 200);
assert.ok(WORK_ORDER_SEARCH_DEBOUNCE_MS >= 150 && WORK_ORDER_SEARCH_DEBOUNCE_MS <= 250);
assert.equal(normalizeWorkOrderSearchQuery("  가  "), "가");
assert.equal(shouldIssueWorkOrderSearch("", "가"), true);
assert.equal(shouldIssueWorkOrderSearch("가", " 가 "), false);
for (const input of [
  { query: "", searching: false },
  { query: "가", searching: false },
  { query: "가나다", searching: true },
]) {
  const layout = workOrderSearchLayoutState(input);
  assert.equal(layout.rowHeight, WORK_ORDER_SEARCH_LAYOUT.rowHeight);
  assert.equal(layout.fieldHeight, WORK_ORDER_SEARCH_LAYOUT.fieldHeight);
  assert.equal(layout.inputHeight, WORK_ORDER_SEARCH_LAYOUT.inputHeight);
  assert.equal(layout.accessorySize, WORK_ORDER_SEARCH_LAYOUT.accessorySize);
}

const list = fs.readFileSync("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx", "utf8");
assert.match(list, /setTimeout\(\(\) => onSearchRef\.current/);
assert.match(list, /keyboardShouldPersistTaps="handled"/);
assert.match(list, /onScrollBeginDrag=\{Keyboard\.dismiss\}/);
assert.match(list, /accessibilityLabel="검색어 지우기"/);
assert.match(list, /multiline=\{false\}/);
assert.match(list, /numberOfLines=\{1\}/);
assert.match(list, /textAlignVertical="center"/);
assert.match(list, /style=\{styles\.searchAccessory\}/);
assert.match(list, /style=\{styles\.filterRail\}/);
assert.match(list, /searchField: \{[^}]*height: WORK_ORDER_SEARCH_LAYOUT\.fieldHeight[^}]*maxHeight: WORK_ORDER_SEARCH_LAYOUT\.fieldHeight[^}]*overflow: "hidden"/);
assert.match(list, /searchInput: \{[^}]*height: WORK_ORDER_SEARCH_LAYOUT\.inputHeight[^}]*includeFontPadding: false[^}]*lineHeight: WORK_ORDER_SEARCH_LAYOUT\.inputLineHeight/);
assert.doesNotMatch(list, /accessibilityLabel="작업지시서 검색 실행"|styles\.searchButton/);

console.log("workorder v2 alpha.54 immediate search contract: PASS");
