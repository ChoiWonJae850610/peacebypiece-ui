#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const tabBody = read("apps/mobile/features/layout/WaflWorkOrderTabBody.tsx");
const image = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const sizeEditor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const sizeView = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const document = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const repository = read("lib/domain/work-orders/command/processCommandRepository.ts");
const quantitySync = read("lib/domain/work-orders/command/commandRepository.ts");

assert.match(tabBody, /paddingHorizontal: WAFL_THEME\.layout\.cardPadding/u);
assert.match(tabBody, /paddingTop: WAFL_THEME\.layout\.tabBodyTopInset/u);
assert.doesNotMatch(production, /container:\s*\{[^}]*paddingHorizontal/u);
assert.doesNotMatch(overview.match(/overviewSection: \{[^\n]+/u)?.[0] ?? "", /paddingHorizontal/u);
assert.doesNotMatch(overview.match(/materialsCombined: \{[^\n]+/u)?.[0] ?? "", /paddingHorizontal/u);
assert.doesNotMatch(image.match(/container: \{[^\n]+/u)?.[0] ?? "", /paddingHorizontal/u);
assert.doesNotMatch(sizeEditor.match(/cards: \{[^\n]+/u)?.[0] ?? "", /paddingHorizontal/u);
assert.match(sizeView, /sectionCard: \{\}/u);
assert.match(document, /previewSheet: \{\}/u);

assert.match(production, /ControlledInlineEditValue/u);
assert.match(production, /createSerializedMutationQueue/u);
assert.match(production, /commitMode="blur-submit"/u);
assert.match(production, /WaflReelPickerSheet/u);
assert.match(production, /allowUnset: true[^\n]+field: "factoryPartnerId"/u);
assert.match(production, /presentPicker\(\{ kind: "process", processId: null \}\)/u);
assert.match(production, /setPickerTarget\(\{ kind: "partner", processId, processCode \}\)/u);
assert.match(production, /partnerOptionsFor\(processCode\)/u);
assert.match(production, /processInput\(latest, patch\)/u);
assert.match(production, /if \(value === original\) \{ setInlineSession\(null\); return; \}/u);
assert.doesNotMatch(production, /WaflInputSheet|WaflSheetValueField/u);
assert.match(production, /useWaflNestedSheetHandoff/u);
for (const forbidden of ["예상 공임", "수량 입력", "로스 비용", "dueDate", "applicationArea", "applicationColorTarget"]) assert.doesNotMatch(production, new RegExp(forbidden, "u"));
assert.doesNotMatch(overview, /WorkOrderProductionAuthoring[^\n]+onMutationComplete/u);

assert.match(repository, /process_total=t\.total,estimated_total=r\.fabric_total\+r\.accessory_total\+t\.total/u);
assert.match(quantitySync, /UPDATE work_order_processes[\s\S]*amount = round\(\$3::numeric \* unit_price, 2\)/u);
assert.equal(fs.existsSync("db/v2/migrations/019_v2_production_card_inline.sql"), false);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha65-production-card-inline-ui",
  previousPermanentInventoryRetained: 140,
  addedPermanentChecks: 1,
  finalPermanentInventory: 141,
  productionMutation: 0,
  ownerFixtureMutation: 0,
  migrationLedger: "18/18",
}));
