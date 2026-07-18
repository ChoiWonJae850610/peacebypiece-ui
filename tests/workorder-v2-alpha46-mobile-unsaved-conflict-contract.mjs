#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");
const app = read("apps/mobile/components/MobileWorkOrderApp.tsx");
const detail = read("apps/mobile/components/WorkOrderDetailOverview.tsx");
const client = read("apps/mobile/lib/apiClient.ts");

assert.match(app, /저장하지 않은 변경사항이 있습니다\./);
assert.match(app, /계속 편집/);
assert.match(app, /변경사항 버리기/);
assert.match(app, /function confirmDiscard/);
assert.match(app, /function returnToList\(\)[\s\S]*confirmDiscard/);
assert.match(app, /function selectItemSafely[\s\S]*confirmDiscard/);
assert.match(app, /function disconnectSafely[\s\S]*confirmDiscard/);
assert.match(app, /function cancelBasicInfoEdit[\s\S]*confirmDiscard/);
assert.match(app, /basicInfoDraft\.productName !== detail\.header\.productName/);
assert.match(app, /saveRequestInFlight\.current/);
assert.match(app, /저장 중입니다\./);

assert.match(client, /const entityVersion = Number\.isSafeInteger\(nested\.entityVersion\)/);
assert.match(app, /error\.code === "CONFLICT"/);
assert.match(app, /setConflictVersion\(error\.entityVersion\)/);
assert.match(app, /다른 변경이 먼저 저장되었습니다\./);
assert.match(detail, /최신 내용 불러오기/);
assert.match(app, /현재 입력한 변경사항은 버려집니다\./);
assert.match(app, /const refreshed = await getWorkOrderDetail\(selected\.workOrderId\)/);
assert.doesNotMatch(app.match(/function reloadLatestBasicInfo\(\)[\s\S]*?\n  function retry/)?.[0] ?? "", /patchWorkOrderBasicInfo/);
assert.match(app, /error\.code === "LOCKED" \|\| error\.code === "REVISION_MISMATCH"/);
assert.match(app, /현재 상태에서는 수정할 수 없습니다\./);
assert.match(detail, /발행된 제작 카드는 읽기 전용입니다\./);
assert.match(detail, /disabled=\{!props\.dirty \|\| saving \|\| locked\}/);
assert.match(detail, /keyboardType="number-pad"/);
assert.match(detail, /placeholder="YYYY-MM-DD"/);
assert.match(detail, /KeyboardAvoidingView/);
assert.doesNotMatch(`${app}\n${client}`, /setInterval|exponential|polling/i);

console.log("workorder v2 alpha.46 unsaved/conflict contract: PASS");
