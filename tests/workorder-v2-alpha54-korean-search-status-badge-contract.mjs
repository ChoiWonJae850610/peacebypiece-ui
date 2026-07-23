#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  extractHangulInitials,
  isHangulInitialQuery,
  matchesWorkOrderSearch,
  normalizeHangulInitialQuery,
  normalizeSearchText,
} from "../apps/mobile/features/work-orders/list/workOrderSearchPolicy.ts";
import {
  resolveWorkOrderServerSearchQuery,
} from "../apps/mobile/features/work-orders/list/immediateSearchPolicy.ts";
import {
  getWorkOrderWorkflowPresentation,
  matchesWorkOrderStatusFilter,
  WORK_ORDER_STATUS_FILTER_OPTIONS,
  WORK_ORDER_STATUS_LABEL,
} from "../apps/mobile/features/work-orders/list/workOrderListStatusPolicy.ts";

const linen = {
  productName: "리넨 라운드 셔츠 원피스",
  displayDocumentNumber: "WO-2026-007",
};

assert.equal(extractHangulInitials("리넨"), "ㄹㄴ");
assert.equal(extractHangulInitials(linen.productName), "ㄹㄴ ㄹㅇㄷ ㅅㅊ ㅇㅍㅅ");
assert.equal(matchesWorkOrderSearch(linen, "ㄹ"), true);
assert.equal(matchesWorkOrderSearch(linen, "ㄹㄴ"), true);
assert.equal(matchesWorkOrderSearch(linen, "ㅅㅊ"), true);
assert.equal(matchesWorkOrderSearch(linen, "ㄱ"), false);
assert.equal(matchesWorkOrderSearch(linen, "리넨"), true);
assert.equal(matchesWorkOrderSearch(linen, "wo-2026"), true);
assert.equal(matchesWorkOrderSearch(linen, "007"), true);
assert.equal(matchesWorkOrderSearch(linen, "  리넨  "), true);
assert.equal(matchesWorkOrderSearch({ productName: "Wafl Linen" }, "  WAFL "), true);
assert.equal(matchesWorkOrderSearch(linen, ""), true);
assert.equal(matchesWorkOrderSearch({ productName: "각" }, "ㄱ"), true);
assert.equal(matchesWorkOrderSearch({ productName: "각" }, "ㄱㅅ"), false);
assert.equal(normalizeSearchText("  WAFL   Linen  "), "wafl linen");
assert.equal(normalizeHangulInitialQuery("ᄅᄂ"), "ㄹㄴ");
assert.equal(isHangulInitialQuery("ㄹ"), true);
assert.equal(isHangulInitialQuery("리"), false);

assert.equal(resolveWorkOrderServerSearchQuery("", "ㄹ"), null);
assert.equal(resolveWorkOrderServerSearchQuery("", "ㄹㄴ"), null);
assert.equal(resolveWorkOrderServerSearchQuery("", "리넨"), "리넨");
assert.equal(resolveWorkOrderServerSearchQuery("셔츠", "ㄹ"), "");
assert.equal(resolveWorkOrderServerSearchQuery("", ""), null);

const expectedWorkflow = {
  draft: ["draft", "작성 중", "draft"],
  ready_to_issue: ["delivery", "전달·발행", "delivery"],
  issued: ["progress", "진행 중", "progress"],
  revised: ["draft", "작성 중", "draft"],
  completed: ["completed", "완료", "completed"],
  cancelled: ["hold_cancel", "보류·취소", "hold"],
};
for (const [status, [filter, label, variant]] of Object.entries(expectedWorkflow)) {
  const presentation = getWorkOrderWorkflowPresentation(status);
  assert.deepEqual(presentation, { filter, label, variant });
  assert.equal(WORK_ORDER_STATUS_LABEL[status], label);
  assert.equal(matchesWorkOrderStatusFilter(status, filter), true);
  assert.equal(matchesWorkOrderStatusFilter(status, "all"), true);
}
assert.equal(matchesWorkOrderStatusFilter("issued", "delivery"), false);
assert.deepEqual(
  WORK_ORDER_STATUS_FILTER_OPTIONS.map(({ id, label }) => [id, label]),
  [
    ["all", "전체"],
    ["draft", "작성 중"],
    ["delivery", "전달·발행"],
    ["progress", "진행 중"],
    ["completed", "완료"],
    ["hold_cancel", "보류·취소"],
  ],
);

const list = fs.readFileSync("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx", "utf8");
assert.match(list, /visibleItems\.map/);
assert.match(list, /matchesWorkOrderSearch\(item, searchDraft\)/);
assert.match(list, /matchesWorkOrderStatusFilter\(item\.status, statusFilter\)/);
assert.match(list, /WORK_ORDER_STATUS_FILTER_OPTIONS\.map/);
assert.match(list, /getWorkOrderWorkflowPresentation\(item\.status\)/);
assert.match(list, /검색 결과가 없습니다\./);
assert.match(list, /현재 회사에서 조회할 수 있는 작업지시서가 없습니다\./);
assert.doesNotMatch(list, />발행됨</);

console.log("workorder v2 alpha.54 Korean initial search and workflow badge contract: PASS");
