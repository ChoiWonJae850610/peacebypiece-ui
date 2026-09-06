#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const migration = read("db/v2/migrations/022_v2_work_order_drawings.sql");
const route = read("lib/domain/work-orders/drawing/drawingRoute.ts");
const mobileApi = read("apps/mobile/lib/api/drawingApi.ts");
const editor = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const gate = read("apps/mobile/features/work-orders/drawing/workOrderSketchPolicy.ts");
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const deleteRoute = read("lib/domain/work-orders/command/draftDeleteRoute.ts");
const ingress = read("lib/external-qa/configCore.mjs");
const capabilities = read("lib/external-qa/makerQaCapabilities.mjs");

assert.match(migration, /CREATE TABLE public\.work_order_drawings/);
assert.match(migration, /entity_version integer NOT NULL DEFAULT 1/);
assert.match(migration, /UNIQUE \(company_id, revision_id, slot_key\)/);
assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
assert.match(migration, /FORCE ROW LEVEL SECURITY/);
assert.match(migration, /GRANT SELECT, INSERT, UPDATE ON TABLE public\.work_order_drawings TO wafl_v2_tenant_runtime/);
assert.doesNotMatch(migration.replace(/ON DELETE (?:RESTRICT|SET NULL)/g, ""), /\b(?:DROP|TRUNCATE|DELETE\s+FROM|UPDATE\s+\w+\s+SET)\b/i);

assert.match(route, /handleGetPrimaryWorkOrderDrawing/);
assert.match(route, /handleSavePrimaryWorkOrderDrawing/);
assert.match(route, /DRAWING_SLOT_KEY = "primary_sketch"/);
assert.match(route, /validateDrawingScene/);
assert.match(route, /entity_version=entity_version\+1/);
assert.match(route, /IDEMPOTENCY_CONFLICT/);
assert.match(route, /work_order_command_receipts/);
assert.match(route, /domain_events/);
assert.doesNotMatch(route, /UPDATE work_orders SET entity_version/);
assert.doesNotMatch(route, /R2|upload|generated_document|PDF/);

assert.match(mobileApi, /getPrimaryWorkOrderDrawing/);
assert.match(mobileApi, /savePrimaryWorkOrderDrawing/);
assert.match(mobileApi, /idempotencyKey/);
assert.match(editor, /beginDrawingActiveStroke/);
assert.match(editor, /finalizeDrawingActiveStroke/);
assert.match(editor, /undoDrawingScene/);
assert.match(editor, /redoDrawingScene/);
assert.match(editor, /serializeDrawingScene/);
assert.match(editor, /drawingScenesEqual\(reconciled\.scene, submitted\)/);
assert.match(editor, /error\.code !== "TIMEOUT" && error\.code !== "NETWORK_ERROR"/);
assert.match(editor, /스케치 저장/);
assert.match(editor, /스케치를 닫을까요\?/);
assert.match(editor, /저장하지 않은 변경사항이 사라집니다/);
assert.match(editor, /onConfirm: closeEditorSession/);
assert.doesNotMatch(editor, /setInterval|autoSave|autosave/i);

assert.match(gate, /input\.authenticated && input\.dev/);
assert.match(gallery, /sketchAuthoringEnabled \? "스케치" : "스케치\(준비 중\)"/);
assert.match(gallery, /<WorkOrderSketchEditor/);
assert.match(deleteRoute, /DELETE FROM work_order_drawings/);
assert.match(ingress, /primary-sketch/);
assert.match(capabilities, /DRAWING_AUTHORING/);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73-product-sketch-persistence",
  previousPermanentInventoryRetained: 227,
  addedPermanentChecks: 1,
  finalPermanentInventory: 228,
  scenePersistence: "revision-owned-independent-version",
  explicitSaveOnly: true,
  productionEntryEnabled: false,
  r2Mutation: 0,
  physicalResultInferred: false,
}));
