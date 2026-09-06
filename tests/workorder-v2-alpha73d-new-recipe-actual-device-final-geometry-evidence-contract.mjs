#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  isExternalQaPathAllowed,
  isTailscaleServePathAllowed,
} from "../lib/external-qa/configCore.mjs";

const root = process.cwd();
const read = (relative) => fs.readFileSync(`${root}/${relative}`, "utf8");

const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const client = read("apps/mobile/lib/waflInputSheetGeometryEvidence.ts");
const route = read("app/api/dev/wafl-input-sheet-geometry-evidence/route.ts");
const sink = read("lib/external-qa/inputSheetGeometryEvidence.ts");
const ingress = read("lib/external-qa/configCore.mjs");
const create = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const character = read("apps/mobile/features/work-orders/identity/WorkOrderCharacterChoice.tsx");
const templates = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");

// The two reference surfaces share the product motion owner and only opt into
// a diagnostic identity. No New Recipe input behavior override is introduced.
assert.match(create, /diagnosticSurfaceId="new-recipe"/u);
assert.match(templates, /diagnosticSurfaceId=\{mode === "new" \? "spec-save-new" : undefined\}/u);
assert.doesNotMatch(create, /autoCorrect=/u);
assert.match(create, /keyboardMode="directInput"/u);
assert.match(templates, /keyboardMode="directInput"/u);
assert.match(character, /forwardRef<View, Props>/u);
assert.match(character, /collapsable=\{false\} ref=\{ref\}/u);
assert.match(create, /diagnosticRequiredRegionRef=\{characterChoiceMeasurementRef\}/u);

// Ordered external-QA transport retains both original machine-readable
// surfaces when later diagnostics add more bounded surface identities, and
// never joins the keyboard/motion promise chain.
assert.match(client, /"new-recipe"/u);
assert.match(client, /"spec-save-new"/u);
assert.match(client, /let evidenceWriteQueue: Promise<void> = Promise\.resolve\(\)/u);
assert.match(client, /EXPO_PUBLIC_WAFL_EXTERNAL_QA/u);
assert.match(client, /void|best-effort diagnostic transport/u);
assert.match(sheet, /persistDiagnosticEvidence\(evidence\.event, \{ keyboardReveal: evidence \}\)/u);
assert.match(sheet, /scheduleActualDeviceGeometryObservation\(evidence\.event, evidence\.rootTarget\)/u);

for (const token of [
  "sheetWindowRect",
  "inputWindowRect",
  "semanticWindowRect",
  "requiredRegionWindowRect",
  "actualAppliedRootTranslateY",
  "requestedRootTarget",
  "translatedCompletionRef",
  "bodyScroll",
  "keyboardFrame",
  "requiredRegionKeyboardClearance",
]) assert.match(sheet, new RegExp(token, "u"), `actual-device evidence missing ${token}`);
assert.match(sheet, /event: "rootAnimationCompleted"/u);
assert.match(sheet, /requestAnimationFrame\(\(\) => \{/u);

// The sink is local ignored JSONL, bounded, authenticated, external-QA-only,
// and unavailable to production or non-POST ingress.
assert.match(sink, /\.tmp["'], ["']wafl-external-qa/u);
assert.match(sink, /input-sheet-final-geometry-evidence\.jsonl/u);
assert.match(sink, /MAX_SERIALIZED_BYTES = 64 \* 1024/u);
assert.match(sink, /const SURFACES = new Set\(\[/u);
assert.match(sink, /"new-recipe"/u);
assert.match(sink, /"spec-save-new"/u);
assert.match(route, /readExternalQaServerConfig/u);
assert.match(route, /externalQa\.production/u);
assert.match(route, /isActiveSystemAdminSession/u);
assert.match(route, /isTailscaleAutoConnectRequest/u);
assert.match(route, /matchesApprovedLoginHash/u);
assert.match(route, /appendWaflInputSheetGeometryEvidence/u);
assert.match(ingress, /pathname === "\/api\/dev\/wafl-input-sheet-geometry-evidence"[\s\S]*verb === "POST"[\s\S]*WAFL_EXTERNAL_QA_ENABLED[\s\S]*!isProductionEnvironment/u);
const diagnosticPath = "/api/dev/wafl-input-sheet-geometry-evidence";
const qaEnvironment = { NODE_ENV: "development", WAFL_EXTERNAL_QA_ENABLED: "true" };
assert.equal(isTailscaleServePathAllowed(diagnosticPath, "POST", qaEnvironment), true);
assert.equal(isExternalQaPathAllowed(diagnosticPath, "POST", qaEnvironment), true);
assert.equal(isTailscaleServePathAllowed(diagnosticPath, "GET", qaEnvironment), false);
assert.equal(isExternalQaPathAllowed(diagnosticPath, "POST", { ...qaEnvironment, WAFL_SERVER_RUNTIME_MODE: "production" }), false);

// This package observes the existing single-root transaction; it does not
// add another root author, local offset, delay, or draggable owner.
assert.equal((sheet.match(/claimKeyboardRootReveal\(/gu) ?? []).length >= 1, true);
for (const forbidden of [
  "PanResponder",
  "wafl-sheet-header-drag-zone",
  "diagnosticVerticalOffset",
  "diagnosticKeyboardHeight",
]) assert.doesNotMatch(sheet, new RegExp(forbidden, "u"));

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-new-recipe-actual-device-final-geometry-evidence",
  previousPermanentInventoryRetained: 253,
  addedPermanentChecks: 1,
  finalPermanentInventory: 254,
  checkpoint: "ALPHA73D_NEW_RECIPE_ACTUAL_DEVICE_FINAL_GEOMETRY_EVIDENCE_IPHONE_QA_REQUIRED",
  invariants: [
    "ACTUAL_NATIVE_WINDOW_GEOMETRY_OBSERVED",
    "WORK_ORDER_CHARACTER_CHOICE_RECT_CAPTURED",
    "REQUESTED_TARGET_NOT_FINAL_POSITION",
    "NEW_RECIPE_AND_SPEC_SAVE_MACHINE_READABLE",
    "DEV_EXTERNAL_QA_PERSISTED_SINK",
    "PRODUCT_MOTION_BEHAVIOR_UNCHANGED",
  ],
  physicalResultInferred: false,
}));
