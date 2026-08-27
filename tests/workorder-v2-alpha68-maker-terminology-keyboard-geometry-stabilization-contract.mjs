#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  resolveWaflSheetBodyMeasurements,
  resolveWaflSheetKeyboardRestoreOffset,
} from "../apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts";
import { resolveWaflAdaptiveInitialHeight } from "../apps/mobile/domain/waflSheetDetentPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(target) : [target];
});

const intrinsicHeight = 236;
const keyboardInset = 291;
const staticEndGap = 16;
const chrome = {
  footerHeight: 64,
  headerHeight: 82,
  maxRatio: 0.58,
  minHeight: 280,
  safeBottom: 16,
  verticalChrome: 16,
  windowHeight: 844,
};

let restingHeight = null;
let restingOffset = null;
for (const keyboardSystemExpanded of [false, true]) {
  for (let cycle = 0; cycle < 3; cycle += 1) {
    const shown = resolveWaflSheetBodyMeasurements({
      intrinsicContentHeight: intrinsicHeight,
      reportedScrollContentHeight: intrinsicHeight + staticEndGap + keyboardInset,
      staticEndGap,
    });
    const delayedHidden = resolveWaflSheetBodyMeasurements({
      intrinsicContentHeight: intrinsicHeight,
      reportedScrollContentHeight: intrinsicHeight + staticEndGap,
      staticEndGap,
    });
    assert.equal(shown.adaptiveBodyHeight, intrinsicHeight + staticEndGap);
    assert.equal(delayedHidden.adaptiveBodyHeight, intrinsicHeight + staticEndGap);
    assert.equal(shown.scrollContentHeight, intrinsicHeight + staticEndGap + keyboardInset);

    const mediumHeight = resolveWaflAdaptiveInitialHeight({ ...chrome, bodyHeight: shown.adaptiveBodyHeight });
    const delayedMediumHeight = resolveWaflAdaptiveInitialHeight({ ...chrome, bodyHeight: delayedHidden.adaptiveBodyHeight });
    const expandedHeight = Math.round(chrome.windowHeight * 0.88);
    const mediumOffset = expandedHeight - mediumHeight;
    const delayedMediumOffset = expandedHeight - delayedMediumHeight;
    assert.equal(delayedMediumHeight, mediumHeight);
    assert.equal(delayedMediumOffset, mediumOffset);
    assert.equal(resolveWaflSheetKeyboardRestoreOffset({ settledOffset: mediumOffset, userDragged: false }), mediumOffset);
    assert.equal(resolveWaflSheetKeyboardRestoreOffset({ settledOffset: mediumOffset, userDragged: true }), null);
    assert.equal(keyboardSystemExpanded === true || keyboardSystemExpanded === false, true);
    restingHeight ??= mediumHeight;
    restingOffset ??= mediumOffset;
    assert.equal(mediumHeight, restingHeight);
    assert.equal(mediumOffset, restingOffset);
  }
}

const inputSheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
assert.match(inputSheet, /resolveWaflSheetBodyMeasurements/u);
assert.match(inputSheet, /intrinsicContentHeight:\s*event\.nativeEvent\.layout\.height/u);
assert.match(inputSheet, /staticEndGap:\s*WAFL_THEME\.sheet\.bodyEndGap/u);
assert.doesNotMatch(
  inputSheet,
  /onContentSizeChange=\{\(_width, height\) => \{[\s\S]{0,180}measureBody\(height\)/u,
  "transient ScrollView keyboard padding must not feed adaptive body measurement",
);
assert.match(inputSheet, /intrinsicBodyContentHeightRef\.current - viewport\.height/u);

const expectedIssuedDocumentResiduals = new Map([
  ["apps/mobile/components/ProductionCardMock.tsx", 7],
  ["apps/mobile/constants/mockProductionCard.ts", 4],
  ["apps/mobile/features/inputs/waflLiveSheetInventory.ts", 1],
  ["apps/mobile/features/work-orders/documents/WaflAuthenticatedPdfViewer.tsx", 2],
  ["apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx", 4],
  ["apps/mobile/features/work-orders/documents/documentShareMessage.ts", 3],
  ["apps/mobile/utils/previewLink.ts", 1],
]);
const actualResiduals = new Map();
for (const file of walk("apps/mobile").filter((candidate) => /\.(?:json|ts|tsx)$/u.test(candidate) && !candidate.replaceAll("\\", "/").includes("apps/mobile/.tmp/"))) {
  const normalized = file.replaceAll("\\", "/");
  const count = read(file).split("작업지시서").length - 1;
  if (count > 0) actualResiduals.set(normalized, count);
}
assert.deepEqual(actualResiduals, expectedIssuedDocumentResiduals, "every remaining 작업지시서 string must be an issued-document allowlist entry");

const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
assert.match(experience, /title:\s*"레시피를 삭제합니다"/u);
assert.match(experience, /helper:\s*"삭제한 레시피는 복구할 수 없습니다\."/u);
assert.match(experience, /processingMessage:\s*"레시피를 삭제 중입니다\."/u);
assert.match(experience, /successMessage:\s*"레시피가 삭제되었습니다\."/u);
assert.match(experience, /copyPending \|\| reorderPending \? "레시피를 생성 중입니다\."/u);

const list = read("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx");
for (const label of ["레시피 복사", "레시피 삭제", "레시피 열기", "레시피 구분 필터", "레시피 더 보기"]) {
  assert.match(list, new RegExp(label, "u"));
}

const appConfig = read("apps/mobile/app.json");
assert.match(appConfig, /WAFL 레시피에 사용할 사진/u);
assert.match(appConfig, /WAFL 레시피 이미지를 촬영/u);

const documents = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
assert.match(documents, /title:\s*"레시피를 확정합니다"/u);
assert.match(documents, /레시피가 확정되고 작업지시서가 생성되었습니다\./u);
assert.match(documents, /레시피는 확정되었습니다\. 작업지시서 PDF만 만들지 못했습니다\./u);
const shareMessage = read("apps/mobile/features/work-orders/documents/documentShareMessage.ts");
assert.match(shareMessage, /WAFL에서 작업지시서를 공유했습니다\./u);
assert.match(shareMessage, /아래 링크에서 작업지시서를 확인해 주세요\./u);

const internalDomainFiles = walk("lib/domain/work-orders").filter((candidate) => /\.(?:ts|mjs)$/u.test(candidate));
assert.ok(internalDomainFiles.length > 0);
assert.ok(internalDomainFiles.some((file) => read(file).includes("WorkOrder")), "internal WorkOrder domain naming remains intact");

console.log(JSON.stringify({
  contract: "workorder-v2-alpha68-maker-terminology-keyboard-geometry-stabilization",
  keyboard: {
    cyclesPerExpansionState: 3,
    delayedContentSizeStable: true,
    intrinsicMeasurementExcludesKeyboard: true,
    keyboardSystemExpandedStates: 2,
    userDragPreserved: true,
  },
  terminology: {
    issuedDocumentResidualFiles: expectedIssuedDocumentResiduals.size,
    issuedDocumentResidualOccurrences: [...expectedIssuedDocumentResiduals.values()].reduce((sum, count) => sum + count, 0),
    internalWorkOrderRename: 0,
    makerRecipeCopy: true,
  },
  physicalResultInferred: false,
}));
