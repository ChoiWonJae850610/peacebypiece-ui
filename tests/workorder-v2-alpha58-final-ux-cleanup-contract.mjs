import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDelayedLoadingController,
  DELAYED_LOADING_THRESHOLD_MS,
  WORK_ORDER_LOADING_MESSAGES,
} from "../apps/mobile/features/work-orders/loading/delayedLoadingPolicy.ts";
import {
  readOnlyBadgeLabel,
  resolveWorkOrderTabVisualState,
} from "../apps/mobile/features/work-orders/overview/workOrderDetailPresentation.ts";

function createManualScheduler() {
  let nextId = 1;
  const tasks = new Map();
  return {
    schedule(callback, delayMs) {
      const id = nextId;
      nextId += 1;
      tasks.set(id, { callback, delayMs });
      return id;
    },
    cancel(id) {
      tasks.delete(id);
    },
    run(id) {
      const task = tasks.get(id);
      if (!task) return false;
      tasks.delete(id);
      task.callback();
      return true;
    },
    ids() {
      return [...tasks.keys()];
    },
    task(id) {
      return tasks.get(id) ?? null;
    },
  };
}

assert.equal(DELAYED_LOADING_THRESHOLD_MS, 400);
assert.deepEqual(WORK_ORDER_LOADING_MESSAGES, {
  detail: "작업지시서를 불러오는 중입니다.",
  media: "이미지와 첨부파일을 불러오는 중입니다.",
  sizeColor: "사이즈·색상 정보를 불러오는 중입니다.",
  fabric: "원단 정보를 불러오는 중입니다.",
  accessory: "부자재 정보를 불러오는 중입니다.",
});

const scheduler = createManualScheduler();
const visibility = [];
const controller = createDelayedLoadingController({
  onVisibilityChange: (visible) => visibility.push(visible),
  schedule: (callback, delayMs) => scheduler.schedule(callback, delayMs),
  cancel: (id) => scheduler.cancel(id),
});

controller.update({ loading: true, identity: "work-order-a:size-color" });
const firstTimer = scheduler.ids()[0];
assert.equal(scheduler.task(firstTimer).delayMs, 400);
assert.deepEqual(visibility, [], "loading copy must stay hidden before the threshold");

controller.update({ loading: false, identity: "work-order-a:size-color" });
assert.equal(scheduler.run(firstTimer), false, "a short load must cancel its pending timer");
assert.deepEqual(visibility, [], "a load that finishes before 400ms must never flash");

controller.update({ loading: true, identity: "work-order-a:size-color" });
const longLoadTimer = scheduler.ids()[0];
assert.equal(scheduler.run(longLoadTimer), true);
assert.deepEqual(visibility, [true], "a continuing load must become visible at the threshold");
controller.update({ loading: false, identity: "work-order-a:size-color" });
assert.deepEqual(visibility, [true, false], "loading completion must hide immediately");

controller.update({ loading: true, identity: "work-order-a:fabric" });
const staleTimer = scheduler.ids()[0];
controller.update({ loading: true, identity: "work-order-b:fabric" });
const currentTimer = scheduler.ids()[0];
assert.notEqual(staleTimer, currentTimer);
assert.equal(scheduler.run(staleTimer), false, "identity changes must cancel stale timers");
assert.equal(scheduler.run(currentTimer), true);

controller.update({ loading: true, identity: "work-order-b:fabric" });
assert.equal(scheduler.ids().length, 0, "a visible load must not create duplicate timers");
controller.update({ loading: false, identity: "work-order-b:fabric" });
controller.update({ loading: true, identity: "work-order-b:accessory" });
const unmountTimer = scheduler.ids()[0];
controller.dispose();
assert.equal(scheduler.run(unmountTimer), false, "unmount disposal must cancel the timer");

assert.equal(readOnlyBadgeLabel(false), "읽기 전용");
assert.equal(readOnlyBadgeLabel(true), null, "editable WorkOrders must not show the badge");
assert.equal(resolveWorkOrderTabVisualState({ selected: true, locked: false }), "active");
assert.equal(resolveWorkOrderTabVisualState({ selected: false, locked: false }), "inactive");
assert.equal(resolveWorkOrderTabVisualState({ selected: true, locked: true }), "locked");

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const images = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const sizeColor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const runtimeQa = read("scripts/run-wafl-v2-alpha58-size-color-real-read-runtime-qa.mjs");
const renderedSources = [experience, overview, images, sizeColor, materials].join("\n");

for (const removedCopy of [
  "사이즈·색상은 실제 저장 데이터를 읽기 전용으로 표시합니다.",
  "제작과 문서는 다음 단계에서 연결합니다.",
  "발행된 작업지시서는 읽기 전용입니다.",
  "첫 이미지만 자동 대표가 됩니다.",
  "이번 범위",
  "다음 단계",
  "작업지시서 상세를 불러오는 중",
]) {
  assert.equal(renderedSources.includes(removedCopy), false, `removed customer copy remains: ${removedCopy}`);
}

assert.equal(images.includes(">작업지시서 이미지</Text>"), false);
assert.equal(sizeColor.includes(">사이즈·색상</Text>"), false);
assert.equal(overview.includes('<Section title="기본정보">'), false);
for (const retainedMeaning of [
  "색상×사이즈",
  "완성 스펙",
  "등록된 사이즈와 색상이 없습니다.",
  "다시 시도",
]) assert.ok(renderedSources.includes(retainedMeaning), `operational UI meaning missing: ${retainedMeaning}`);

for (const source of [experience, sizeColor, materials]) {
  assert.match(source, /DelayedLoadingMessage/);
  assert.doesNotMatch(source, /setTimeout\s*\(/);
}
assert.match(overview, /resolveWorkOrderTabVisualState/);
assert.match(overview, /readOnlyBadgeLabel/);
assert.match(runtimeQa, /ALPHA58_FINAL_UX_CLEANUP_IPHONE_REQA_REQUIRED/);
for (const runtimeEvidence of [
  "activeTabSharedPolicy",
  "delayedLoadingSharedPolicy",
  "developerProgressCopyAbsent",
  "duplicateTopHeadingsAbsent",
  "readOnlyBadgePolicy",
  "loadingCopy",
]) assert.ok(runtimeQa.includes(runtimeEvidence), `Runtime evidence missing: ${runtimeEvidence}`);

console.log("workorder v2 alpha.58 final UX cleanup contract: PASS");
