#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { decideDraftExit } from "../apps/mobile/application/draftExitPolicy.ts";
import { createExplicitMutationController } from "../apps/mobile/application/mutationController.ts";
import { readOnlyBadgeLabel } from "../apps/mobile/features/work-orders/overview/workOrderDetailPresentation.ts";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");
const app = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const detail = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const inlineField = read("apps/mobile/components/ControlledInlineEditValue.tsx");
const datePicker = read("apps/mobile/components/InlineDatePicker.tsx");
const focusedVisibility = read("apps/mobile/hooks/useFocusedFieldVisibility.ts");
const client = [read("apps/mobile/lib/apiClient.ts"), read("apps/mobile/lib/apiTransport.ts")].join("\n");
const reelPicker = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const inputShell = read("apps/mobile/features/inputs/WaflInputSheet.tsx");

assert.doesNotMatch(app, /저장하지 않은 변경사항이 있습니다\.|계속 편집|변경사항 버리기|function confirmDiscard/);
assert.match(app, /function leaveWithDraftPolicy\(intent: DraftExitIntent, onProceed: \(\) => void\)/);
assert.match(app, /function returnToList\(\)[\s\S]*leaveWithDraftPolicy\("list", clearDetailAndReturnToList\)/);
assert.match(app, /function selectItemSafely[\s\S]*leaveWithDraftPolicy\("work-order", \(\) => void selectItem\(item\)\)/);
assert.match(app, /function disconnectSafely\(\)[\s\S]*leaveWithDraftPolicy\("session-loss", \(\) => void disconnect\(\)\)/);
assert.match(app, /onRequestSectionChange=\{\(onProceed\) => leaveWithDraftPolicy\("feature", onProceed\)\}/);
for (const intent of ["list", "work-order", "feature", "session-loss", "background"]) {
  assert.equal(decideDraftExit({ intent, mutationInFlight: false }), "flush");
}
assert.match(app, /basicInfoDraft\.productName !== detail\.header\.productName/);
assert.match(app, /overviewMutation\.inFlight/);
assert.match(app, /저장 중입니다\./);

assert.match(client, /const entityVersion = Number\.isSafeInteger\(nested\.entityVersion\)/);
assert.match(app, /error\.code === "CONFLICT"/);
assert.match(app, /setConflictVersion\(error\.entityVersion\)/);
assert.match(app, /다른 변경이 먼저 저장되었습니다\./);
assert.match(detail, /최신 내용 불러오기/);
assert.doesNotMatch(app, /현재 입력한 변경사항은 버려집니다\./);
assert.match(app, /const refreshed = await workOrderQueryController\.detail\(selected\.workOrderId\)/);
assert.doesNotMatch(app.match(/function reloadLatestBasicInfo\(\)[\s\S]*?\n  function retry/)?.[0] ?? "", /workOrderMutationController\.updateOverview/);
assert.match(app, /error\.code === "LOCKED" \|\| error\.code === "REVISION_MISMATCH"/);
assert.match(app, /현재 상태에서는 수정할 수 없습니다\./);
assert.equal(readOnlyBadgeLabel(false), "읽기 전용");
assert.equal(readOnlyBadgeLabel(true), null);
assert.match(detail, /readOnlyBadgeLabel\(props\.canEdit\)/);
assert.doesNotMatch(detail, /발행된 작업지시서는 읽기 전용입니다\./);
assert.match(
  inlineField,
  /const saveDisabled = \(!dirty && !nativeDirty\) \|\| saving \|\| finalizing/,
);
assert.match(inlineField, /disabled=\{saveDisabled\}/);
assert.match(detail, /label="총 수량"[\s\S]{0,140}header\.totalQuantity\.toLocaleString/);
assert.doesNotMatch(detail, /field="totalQuantity"|overview-inline-total-quantity/);
assert.match(detail, /onCancel=\{\(\) => \{[\s\S]*props\.onCancelEdit\(\)/);
assert.match(reelPicker, /keyboardType=\{integerOnly \? "number-pad" : "decimal-pad"\}/);
assert.match(inputShell, /cancelAccessibilityLabel = "변경 취소"/);
assert.match(inputShell, /confirmAccessibilityLabel = "변경 저장"/);
assert.match(detail, /<InlineDatePicker/);
assert.match(datePicker, /testID="overview-inline-due-date"/);
assert.match(detail, /automaticallyAdjustKeyboardInsets/);
assert.doesNotMatch(detail, /KeyboardAvoidingView/);
assert.match(focusedVisibility, /measureInWindow/);
assert.match(focusedVisibility, /endCoordinates\.screenY/);
assert.doesNotMatch(`${app}\n${client}`, /setInterval|exponential|polling/i);

const mutation = createExplicitMutationController();
let patchCount = 0;
let releaseFirst;
const firstCheck = mutation.execute(true, () => new Promise((resolve) => {
  patchCount += 1;
  releaseFirst = () => resolve("saved");
}));
assert.deepEqual(await mutation.execute(true, async () => {
  patchCount += 1;
  return "duplicate";
}), { kind: "duplicate-blocked" });
releaseFirst();
assert.deepEqual(await firstCheck, { kind: "success", value: "saved" });
assert.equal(patchCount, 1, "one explicit Check may issue at most one PATCH");
assert.equal(decideDraftExit({ intent: "list", mutationInFlight: false }), "flush");
assert.equal(patchCount, 1, "draft-exit policy decision itself must not issue a PATCH");

console.log("workorder v2 alpha.46 unsaved/conflict contract: PASS");
