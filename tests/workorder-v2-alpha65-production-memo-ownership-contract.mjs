#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const assetController = read("apps/mobile/features/work-orders/images/useWorkOrderAssetAuthoringController.ts");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
const validation = read("lib/domain/work-orders/command/processValidation.ts");
const repository = read("lib/domain/work-orders/command/processCommandRepository.ts");
const quantitySync = read("lib/domain/work-orders/command/commandRepository.ts");
const documentWorkbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const previewRepository = read("lib/domain/work-orders/read/previewRepository.ts");
const migration009 = read("db/v2/migrations/009_v2_workorder_factory_instruction_fields.sql");
const runtimeQa = read("scripts/run-wafl-v2-alpha65-production-authoring-runtime-qa.mjs");

assert.doesNotMatch(gallery, /공장 전달 메모|factoryDeliveryMemo|work-order-factory-delivery-memo/u);
assert.doesNotMatch(assetController, /saveFactoryDeliveryMemo|factoryDeliveryMemoLength|FACTORY_DELIVERY_MEMO_MAX_LENGTH/u);
assert.doesNotMatch(overview, /onSaveFactoryDeliveryMemo|factoryDeliveryMemo=\{detail\.revision\.factoryDeliveryMemo\}/u);

assert.match(production, /inlineField\(process, "memo", "메모", WAFL_UNSET_PLACEHOLDER\)/u);
assert.match(production, /field === "memo" \? process\.memo \?\? "" : stripDecimalTrailingZeros\(process\.unitPrice\)/u);
assert.match(production, /field === "memo" \? \{ memo: value \|\| null \} : \{ unitPrice: value \}/u);
assert.match(production, /processInput\(latest, patch\)/u);
assert.equal((production.match(/inlineField\(process, "memo", "메모", WAFL_UNSET_PLACEHOLDER\)/gu) ?? []).length, 1, "factory and additional cards must share one processCard memo owner");
assert.match(production, /PRODUCTION_MEMO_MAX_LENGTH = 100/u);
assert.doesNotMatch(production, /WaflSheetValueField|ProductionMemoInput|FactoryMemo/u);

assert.match(validation, /memo: string \| null/u);
assert.match(validation, /value\.memo === null \|\| value\.memo === undefined \|\| value\.memo === "" \? null/u);
assert.match(repository, /INSERT INTO work_order_processes[\s\S]*memo[\s\S]*input\.command\.process\.memo/u);
assert.match(repository, /UPDATE work_order_processes SET[\s\S]*memo=\$11/u);
assert.match(repository, /DELETE FROM work_order_processes[\s\S]*RETURNING id/u);
assert.match(quantitySync, /UPDATE work_order_processes[\s\S]*SET quantity = \$3::numeric,[\s\S]*amount = round\(\$3::numeric \* unit_price, 2\)/u);
assert.doesNotMatch(quantitySync.slice(quantitySync.indexOf("UPDATE work_order_processes"), quantitySync.indexOf("UPDATE work_order_revisions", quantitySync.indexOf("UPDATE work_order_processes"))), /memo\s*=/u);

assert.match(migration009, /factory_delivery_memo text/u);
assert.match(previewRepository, /factory_delivery_memo/u);
assert.match(documentWorkbench, /detail\.revision\.factoryDeliveryMemo/u);
assert.equal(fs.existsSync("db/v2/migrations/019_v2_production_memo.sql"), false);

assert.match(runtimeQa, /resumeStartVersion = version/u);
assert.match(runtimeQa, /currentTotalQuantity = Number\(existingPage\.totalQuantity\)/u);
assert.match(runtimeQa, /retainedBaseline = \{[\s\S]*entityVersion: resumeStartVersion,[\s\S]*totalQuantity: currentTotalQuantity,[\s\S]*processes: existingPage\.processes\.map/u);
assert.match(runtimeQa, /runLabel = \(label\) => requestedResumeMarker \? `resume-v\$\{resumeStartVersion\}-\$\{label\}` : label/u);
assert.doesNotMatch(runtimeQa, /existingPage\.processes\.every\(\(row\) => Number\(row\.quantity\) === 120\)/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha65-production-memo-ownership",
  previousPermanentInventoryRetained: 139,
  addedPermanentChecks: 1,
  finalPermanentInventory: 140,
  legacyFactoryDeliveryMemoData: "preserved-read-and-document-consumer",
  productionMemoOwner: "work_order_processes.memo",
  migrationLedger: "18/18",
  migration019: 0,
}));
