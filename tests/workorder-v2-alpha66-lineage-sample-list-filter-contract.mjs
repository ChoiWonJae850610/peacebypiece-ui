#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { matchesWorkOrderIdentityFilters, normalizeWorkOrderLineageFilters, workOrderIdentityBadgeLabels } from "../lib/domain/work-orders/contracts/lineage.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const migration = read("db/v2/migrations/019_v2_work_order_lineage_sample.sql");
const validation = read("lib/domain/work-orders/command/validation.ts");
const repository = read("lib/domain/work-orders/command/commandRepository.ts");
const sampleCommand = read("lib/domain/work-orders/command/sampleCommandRoute.ts");
const listService = read("lib/domain/work-orders/read/listService.ts");
const listRepository = read("lib/domain/work-orders/read/listRepository.ts");
const detailRepository = read("lib/domain/work-orders/read/detailRepository.ts");
const externalQa = read("lib/external-qa/configCore.mjs");
const mobileExperience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const createSheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const listScreen = read("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx");

assert.match(migration, /ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false/u);
assert.match(migration, /derivation_kind IN \('original', 'reorder', 'rework'\)/u);
assert.match(migration, /source_work_order_id uuid/u);
assert.match(migration, /source_revision_id uuid/u);
assert.match(migration, /series_root_work_order_id uuid/u);
assert.match(migration, /reorder_round integer NOT NULL DEFAULT 0/u);
assert.match(migration, /FOREIGN KEY \(company_id, source_work_order_id\)[\s\S]+ON DELETE RESTRICT/u);
assert.match(migration, /FOREIGN KEY \(company_id, source_revision_id\)[\s\S]+ON DELETE RESTRICT/u);
assert.match(migration, /FOREIGN KEY \(company_id, series_root_work_order_id\)[\s\S]+ON DELETE RESTRICT/u);
assert.match(migration, /source_work_order_id IS NULL OR source_work_order_id <> id/u);
assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS work_orders_reorder_round_unique_idx[\s\S]+WHERE derivation_kind = 'reorder'/u);
assert.doesNotMatch(migration, /ON DELETE CASCADE|DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM|UPDATE work_orders/u);

assert.match(validation, /isSample: typeof input\.body\.isSample === "boolean" \? input\.body\.isSample : false/u, "omitted server input must default explicitly to false");
assert.match(repository, /input\.command\.isSample/u);
assert.match(repository, /'original', 0/u);
assert.match(createSheet, /WorkOrderCharacterChoice/u);
assert.match(mobileExperience, /useState\(true\)/u, "fresh normal create session defaults Sample ON");
assert.match(mobileExperience, /setCreateIsSample\(true\)/u, "every fresh create session resets Sample ON");

assert.match(sampleCommand, /work_order\.set_sample/u);
assert.match(sampleCommand, /UPDATE work_orders SET is_sample=/u);
assert.doesNotMatch(sampleCommand, /UPDATE work_order_revisions|INSERT INTO work_order_revisions|generated_documents/u, "post-create Sample changes must not rewrite revision/document state");
assert.match(sampleCommand, /expectedVersion/u);
assert.match(sampleCommand, /work_order_command_receipts/u);
assert.match(sampleCommand, /domain_events/u);
assert.match(externalQa, /\/sample\$\/i\.test\(pathname\)\) return verb === "PATCH" && isMakerQaCapabilityEnabled\(env, MAKER_QA_CAPABILITY\.BASIC_INFO\)/u, "Sample mutation must use the same cumulative external QA capability meaning");

assert.match(listService, /CHARACTER_FILTERS = \["all", "production", "sample"\]/u);
assert.match(listService, /visibilityKey\(input\.scope, searchQuery, statusFilter, characterFilter, lineageFilters\)/u, "cursor scope binds both identity-filter axes");
assert.match(listRepository, /'production' AND w\.is_sample = false/u);
assert.match(listRepository, /'sample' AND w\.is_sample = true/u);
assert.match(listRepository, /'reorder' = ANY\(\$8::text\[\]\) AND w\.reorder_round >= 1/u);
assert.match(listRepository, /'rework' = ANY\(\$8::text\[\]\) AND w\.derivation_kind = 'rework'/u);
assert.match(detailRepository, /LEFT JOIN work_orders source/u);
assert.match(detailRepository, /source\.product_name AS source_product_name/u);
assert.doesNotMatch(migration, /source_product_name/u, "source display is joined, not copied into schema");

assert.deepEqual(workOrderIdentityBadgeLabels({ isSample: true, derivationKind: "rework", reorderRound: 2 }), [], "invalid Sample+Reorder badges must never render");
assert.deepEqual(workOrderIdentityBadgeLabels({ isSample: true, derivationKind: "rework", reorderRound: 0 }), ["샘플", "재작업"]);
assert.deepEqual(workOrderIdentityBadgeLabels({ isSample: false, derivationKind: "original", reorderRound: 0 }), []);
assert.deepEqual(normalizeWorkOrderLineageFilters(["rework", "reorder"]), ["reorder", "rework"]);
assert.equal(matchesWorkOrderIdentityFilters({ isSample: true, derivationKind: "rework", reorderRound: 2 }, "sample", ["reorder"]), false);
assert.equal(matchesWorkOrderIdentityFilters({ isSample: false, derivationKind: "rework", reorderRound: 0 }, "production", ["rework"]), true);
assert.match(listScreen, /레시피 구분 필터/u);
assert.match(listScreen, /activeFilterChips/u);
assert.match(listScreen, /item\.identity\.isSample[\s\S]+item\.identity\.reorderRound[\s\S]+item\.identity\.derivationKind === "rework"/u);
assert.equal(fs.existsSync("app/api/v2/work-orders/reorder/route.ts"), false);
assert.equal(fs.existsSync("app/api/v2/work-orders/rework/route.ts"), false);

assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length, 20);
assert.ok(fs.existsSync("docs/project/app-v2/66-workorder-lineage-sample-list-filter-evidence.md"));

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha66-lineage-sample-list-filter",
  previousPermanentInventoryRetained: 156,
  addedPermanentChecks: 1,
  finalPermanentInventory: 157,
  migrationLedger: "20/20",
  syntheticLineageFixtureOnly: true,
  actualReorderCreateE2E: 0,
  actualReworkCreateE2E: 0,
  productionMutation: 0,
  ownerFixtureMutation: 0,
  physicalResultInferred: false,
}));
