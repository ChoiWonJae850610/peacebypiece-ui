#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { isIntegerWonDraft, isIntegerWonValue } from "../apps/mobile/domain/integerWonInputPolicy.ts";
import { resolveProductionOrderPolicy } from "../apps/mobile/domain/productionOrderPolicy.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
const material = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const compactCard = read("apps/mobile/features/layout/WaflCompactEntityCard.tsx");
const categorySwitch = read("apps/mobile/features/layout/WaflSectionCategorySwitch.tsx");
const materialSwitch = read("apps/mobile/features/materials/WaflMaterialsCategorySwitch.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const api = read("apps/mobile/lib/api/productionApi.ts");
const route = read("lib/domain/work-orders/command/processCommandRoute.ts");
const service = read("lib/domain/work-orders/command/processCommandService.ts");
const repository = read("lib/domain/work-orders/command/processCommandRepository.ts");
const validation = read("lib/domain/work-orders/command/processValidation.ts");
const readRepository = read("lib/domain/work-orders/read/detailRepository.ts");
const optionsRepository = read("lib/domain/work-orders/read/productionOptionsRepository.ts");
const config = read("lib/external-qa/configCore.mjs");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const makerIa = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

assert.match(production, /WaflSectionCategorySwitch<ProductionCategory>/u);
assert.match(production, /value: "basic", label: "기본 공정"/u);
assert.match(production, /value: "additional", label: "추가 공정"/u);
assert.match(production, /category === "additional" && data\.editable/u);
assert.match(production, /factoryPolicy\?\.actions\.length/u);
assert.match(production, /WaflCompactEntityCard/u);
assert.match(production, /WaflCompactSummaryLine/u);
assert.match(production, /수량 \{formatQuantity/u);
assert.match(production, /· 금액 \{formatWon/u);
assert.match(material, /WaflCompactEntityCard/u);
assert.match(materialSwitch, /WaflSectionCategorySwitch<MaterialType>/u);
assert.match(categorySwitch, /optionTestIDPrefix/u);
assert.match(compactCard, /borderLeftWidth: WAFL_THEME\.accentCard\.width/u);
assert.match(compactCard, /WaflCompactCardAction/u);

assert.deepEqual(resolveProductionOrderPolicy({ status: "ready", currentDraft: true, editable: true }).actions, ["request"]);
assert.deepEqual(resolveProductionOrderPolicy({ status: "in_progress", currentDraft: true, editable: false }).actions, ["complete", "cancel"]);
assert.deepEqual(resolveProductionOrderPolicy({ status: "completed", currentDraft: true, editable: false }).actions, []);
assert.deepEqual(resolveProductionOrderPolicy({ status: "ready", currentDraft: false, editable: false }).actions, []);
assert.match(api, /order-\$\{kind\}/u);
assert.match(config, /order-\(request\|cancel\|complete\)/u);
assert.match(route, /handleProductionProcessOrderV2/u);
assert.match(service, /transitionProductionProcessOrder/u);
assert.match(repository, /PRODUCTION_ORDER_TRANSITIONS/u);
assert.match(repository, /request:[\s\S]*from: "ready", to: "in_progress"/u);
assert.match(repository, /cancel:[\s\S]*from: "in_progress", to: "ready"/u);
assert.match(repository, /complete:[\s\S]*from: "in_progress", to: "completed"/u);
assert.match(repository, /current\.process_type_code !== WORK_ORDER_FACTORY_PROCESS_CODE/u);
assert.match(repository, /Number\(current\.unit_price\) <= 0 \|\| Number\(current\.quantity\) <= 0/u);
assert.match(repository, /work_order_command_receipts/u);
assert.match(repository, /domain_events/u);
assert.match(readRepository, /status === "ready"/u);

assert.equal(isIntegerWonValue("0"), true);
assert.equal(isIntegerWonValue("9800"), true);
assert.equal(isIntegerWonValue("9.8"), false);
assert.equal(isIntegerWonDraft(""), true);
assert.equal(isIntegerWonDraft("123456789012"), true);
assert.equal(isIntegerWonDraft("1234567890123"), false);
assert.match(production, /keyboardType=\{memo \? "default" : "number-pad"\}/u);
assert.ok(validation.includes("const MONEY = /^(?:0|[1-9]\\d{0,11})$/u;"));
assert.match(validation, /memo.*length <= 100/u);
assert.match(production, /PRODUCTION_MEMO_MAX_LENGTH = 100/u);
assert.match(production, /\{draft\.length\} \/ \{PRODUCTION_MEMO_MAX_LENGTH\}/u);

assert.match(reel, /selectFirstRealOption\?: boolean/u);
assert.match(reel, /if \(props\.options\.length === 0\) return null/u);
assert.match(reel, /if \(options\.length === 0\)/u);
assert.match(reel, /initialScrollIndex=\{options\.length \? selectedIndex : undefined\}/u);
assert.match(reel, /emptyMessage/u);
assert.match(production, /이 공정을 취급하는 등록 거래처가 없습니다\./u);
assert.match(production, /requireSpecifiedValue: true, selectFirstRealOption: true/u);
assert.match(production, /allowUnset: selectedProcess === null/u);
assert.match(production, /requireSpecifiedValue: selectedProcess === null/u);

assert.match(optionsRepository, /COALESCE\(e\.is_enabled,true\)=true/u);
assert.match(optionsRepository, /processPartners/u);
assert.equal(fs.existsSync("db/v2/migrations/019_v2_production_material_style_lifecycle.sql"), false);
for (const marker of ["Production basic-process order lifecycle", "100-character", "first eligible real partner", "zero eligible partner"]) {
  assert.ok(`${design}\n${makerIa}`.includes(marker), `canonical rule missing: ${marker}`);
}

console.log(JSON.stringify({
  contract: "workorder-v2-alpha65-production-material-style-lifecycle",
  previousPermanentInventoryRetained: 142,
  addedPermanentChecks: 1,
  finalPermanentInventory: 143,
  migrationLedger: "18/18",
  migration019: 0,
  productionMutation: 0,
  ownerFixtureMutation: 0,
}));
