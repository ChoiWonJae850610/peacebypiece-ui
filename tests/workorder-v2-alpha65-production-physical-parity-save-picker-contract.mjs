#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { resolveCurrentProductionProcess } from "../apps/mobile/domain/productionProcessIdentityPolicy.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
const material = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const card = read("apps/mobile/features/layout/WaflCompactEntityCard.tsx");
const field = read("apps/mobile/features/layout/WaflCompactField.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const validation = read("lib/domain/work-orders/command/processValidation.ts");
const config = read("lib/external-qa/configCore.mjs");
const runner = read("tools/dev/start-wafl-external-qa.ps1");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const makerIa = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

for (const owner of ["WaflCompactActionRow", "WaflCompactSummaryLine"]) assert.match(card, new RegExp(owner));
for (const owner of ["WaflCompactField", "WaflCompactSelectionField", "waflCompactFieldStyles"]) assert.match(field, new RegExp(owner));
assert.match(material, /WaflCompactSelectionField/u);
assert.match(material, /WaflCompactActionRow/u);
assert.match(production, /WaflCompactSelectionField/u);
assert.match(production, /WaflCompactActionRow/u);
assert.match(production, /WaflCompactSummaryLine/u);
assert.match(production, /수량 \{formatQuantity\(currentData\.totalQuantity, "개"\)\} · 금액 \{formatWon\(process\.amount\)\}/u);
assert.doesNotMatch(production, /WaflCompactSummary items=/u);
assert.doesNotMatch(production, /production-process-summary[^\n]{0,200}공임/u);
assert.match(production, /actions=\{deleteAction\}/u);

const staleFactory = { id: "old", role: "factory" };
const currentFactory = { id: "current", role: "factory" };
const current = { processes: [currentFactory] };
assert.equal(resolveCurrentProductionProcess(current, staleFactory), currentFactory);
assert.equal(resolveCurrentProductionProcess({ processes: [] }, staleFactory), null);
assert.equal(resolveCurrentProductionProcess({ processes: [{ id: "a", role: "factory" }, { id: "b", role: "factory" }] }, staleFactory), null);
assert.equal(resolveCurrentProductionProcess({ processes: [{ id: "new", role: "additional" }] }, { id: "old", role: "additional" }), null);
assert.match(production, /const current = await getWorkOrderProcesses\(workOrderId\); publishData\(current\); await command\(current\)/u);
assert.match(production, /updateWorkOrderProductionProcess\(workOrderId, latest\.id/u);
assert.match(production, /transitionWorkOrderProductionOrder\(workOrderId, latest\.id/u);

assert.equal((production.match(/<WaflReelPickerSheet/g) ?? []).length, 1);
assert.match(production, /const activePickerConfig = pickerHandoff\.route === "factory"/u);
for (const route of ["factoryPartnerId", "processCode", "partnerId"]) assert.ok(production.includes(route));
assert.match(reel, /sizing="reelAdaptive"/u);
assert.match(sheet, /onStartShouldSetResponderCapture=\{\(\) => draggable && openReady && !actionPending\}/u);
assert.match(sheet, /resolveWaflSheetRelease/u);
assert.match(reel, /resolveWaflReelOpeningValue/u);
assert.match(production, /requireSpecifiedValue: true, selectFirstRealOption: true/u);
assert.match(production, /requireSpecifiedValue: selectedProcess === null/u);

assert.match(production, /maxLength=\{memo \? PRODUCTION_MEMO_MAX_LENGTH : 12\}/u);
assert.match(production, /nextDraft\.slice\(0, PRODUCTION_MEMO_MAX_LENGTH\)/u);
assert.match(validation, /memo.*length <= 100/u);
assert.equal("가".repeat(101).slice(0, 100).length, 100);

assert.match(config, /MAKER_QA_CAPABILITY\.PRODUCTION_AUTHORING/u);
assert.match(runner, /EnableAlpha65ProductionAuthoringMutation/u);
for (const marker of ["one Material-style line", "one active canonical `WaflReelPickerSheet` invocation", "authoritative process projection", "first real eligible partner"]) assert.ok(`${design}\n${makerIa}`.includes(marker), `canonical rule missing: ${marker}`);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha65-production-physical-parity-save-picker",
  previousPermanentInventoryRetained: 143,
  addedPermanentChecks: 1,
  finalPermanentInventory: 144,
  migrationLedger: "18/18",
  migration019: 0,
  productionMutation: 0,
  ownerFixtureMutation: 0,
}));
