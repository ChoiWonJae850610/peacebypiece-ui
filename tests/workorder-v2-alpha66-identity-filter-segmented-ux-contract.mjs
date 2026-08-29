#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  matchesWorkOrderIdentityFilters,
  normalizeWorkOrderLineageFilters,
} from "../lib/domain/work-orders/contracts/lineage.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const choice = read("apps/mobile/features/inputs/WaflChoiceButtons.tsx");
const characterChoice = read("apps/mobile/features/work-orders/identity/WorkOrderCharacterChoice.tsx");
const create = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const list = read("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx");
const api = read("apps/mobile/lib/api/workOrdersApi.ts");
const service = read("lib/domain/work-orders/read/listService.ts");
const repository = read("lib/domain/work-orders/read/listRepository.ts");

assert.match(choice, /selectionMode: "multiple"/u);
assert.match(choice, /accessibilityRole=\{multiple \? "checkbox" : "radio"\}/u);
assert.match(characterChoice, /작업 구분/u);
assert.match(characterChoice, /본생산/u);
assert.match(characterChoice, /샘플/u);
assert.match(create, /WorkOrderCharacterChoice/u);
assert.match(overview, /WorkOrderCharacterChoice/u);
assert.doesNotMatch(create, /Sample 여부|label: "일반"/u);
assert.doesNotMatch(overview, /일반으로 변경|Sample로 변경/u);
assert.match(experience, /useState\(true\)/u);
assert.match(experience, /setCreateIsSample\(true\)/u);

assert.match(list, /작업 구분/u);
assert.match(list, /전체/u);
assert.match(list, /본생산/u);
assert.match(list, /작업 계보/u);
assert.match(list, /selectionMode="multiple"/u);
assert.match(list, /activeFilterChips/u);
assert.match(list, /lineageFilters\.filter\(\(value\) => value !== lineage\)/u);

assert.match(api, /query\.set\("character", input\.character\)/u);
assert.match(api, /query\.set\("lineage"/u);
assert.match(service, /ALLOWED_QUERY_KEYS = new Set\(\["limit", "cursor", "q", "status", "character", "lineage"\]\)/u);
assert.match(service, /LINEAGE_FILTERS\.filter\(\(value\) => selected\.has\(value\)\)/u);
assert.match(service, /\$\{query \?\? ""\}\\0\$\{status\}\\0\$\{character\}\\0\$\{lineage\.join\(","\)\}/u);
assert.match(repository, /'production' AND w\.is_sample = false/u);
assert.match(repository, /cardinality\(\$8::text\[\]\) = 0/u);
assert.match(repository, /'reorder' = ANY\(\$8::text\[\]\) AND w\.reorder_round >= 1/u);
assert.match(repository, /'rework' = ANY\(\$8::text\[\]\) AND w\.derivation_kind = 'rework'/u);

const originalProduction = { isSample: false, derivationKind: "original", reorderRound: 0 };
const invalidSampleReorder = { isSample: true, derivationKind: "reorder", reorderRound: 1 };
const productionRework = { isSample: false, derivationKind: "rework", reorderRound: 0 };
const sampleRework = { isSample: true, derivationKind: "rework", reorderRound: 0 };
const productionReorderRework = { isSample: false, derivationKind: "rework", reorderRound: 2 };
assert.equal(matchesWorkOrderIdentityFilters(originalProduction, "all", []), true);
assert.equal(matchesWorkOrderIdentityFilters(originalProduction, "production", []), true);
assert.equal(matchesWorkOrderIdentityFilters(originalProduction, "sample", []), false);
assert.equal(matchesWorkOrderIdentityFilters(invalidSampleReorder, "sample", ["reorder"]), false);
assert.equal(matchesWorkOrderIdentityFilters(productionRework, "production", ["rework"]), true);
assert.equal(matchesWorkOrderIdentityFilters(sampleRework, "sample", ["rework"]), true);
assert.equal(matchesWorkOrderIdentityFilters(productionReorderRework, "production", ["reorder"]), true);
assert.equal(matchesWorkOrderIdentityFilters(productionReorderRework, "production", ["rework"]), true);
assert.equal(matchesWorkOrderIdentityFilters(originalProduction, "all", ["reorder", "rework"]), false);
assert.deepEqual(normalizeWorkOrderLineageFilters(["rework", "reorder"]), ["reorder", "rework"]);

assert.equal(fs.existsSync("db/v2/migrations/020_v2_sample_reorder_invariant.sql"), true);
assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length, 21);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha66-identity-filter-segmented-ux",
  previousPermanentInventoryRetained: 157,
  addedPermanentChecks: 1,
  finalPermanentInventory: 158,
  migrationLedger: "21/21",
  migration020: 1,
  actualReorderCreateE2E: 0,
  actualReworkCreateE2E: 0,
  productionMutation: 0,
  ownerFixtureMutation: 0,
  physicalResultInferred: false,
}));
