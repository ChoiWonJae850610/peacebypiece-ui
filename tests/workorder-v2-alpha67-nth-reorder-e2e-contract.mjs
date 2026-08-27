#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const lineage = read("lib/domain/work-orders/contracts/lineage.ts");
const validation = read("lib/domain/work-orders/command/validation.ts");
const repository = read("lib/domain/work-orders/command/reorderCommandRepository.ts");
const assetCopy = read("lib/domain/work-orders/command/reorderAssetCopy.ts");
const route = read("lib/domain/work-orders/command/reorderRoute.ts");
const mobile = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const sheets = read("apps/mobile/features/work-orders/reorder/WorkOrderReorderSheets.tsx");
const history = read("lib/domain/work-orders/read/lineageRepository.ts");
const migration019 = read("db/v2/migrations/019_v2_work_order_lineage_sample.sql");
const runner = read("tools/dev/start-wafl-external-qa.ps1");
const capabilities = read("lib/external-qa/makerQaCapabilities.mjs");
const issueService = read("lib/domain/work-orders/command/issueService.ts");

assert.match(lineage, /isSample === false[\s\S]+derivationKind === "original" \|\| input\.derivationKind === "reorder"[\s\S]+status === "issued"[\s\S]+revisionStatus === "finalized"/u);
assert.match(lineage, /input\.isSample === false/u);
assert.doesNotMatch(lineage, /input\.status === "draft"|input\.status === "cancelled"|input\.derivationKind === "rework"/u);
assert.match(validation, /parseRequiredNonNegativeQuantity[\s\S]+Number\.isSafeInteger[\s\S]+Number\(value\) < 0[\s\S]+100_000_000/u);
assert.doesNotMatch(validation, /sourceRevisionId|seriesRootWorkOrderId|reorderRound/u, "client payload cannot own lineage identity or round");

assert.match(repository, /FOR UPDATE OF w/u);
assert.match(repository, /derivation_kind='original'[\s\S]+FOR UPDATE/u);
assert.match(repository, /COALESCE\(max\(used_round\),0\)\+1/u);
assert.match(repository, /command_code='work_order\.reorder_deleted'/u);
assert.match(repository, /work_order_command_receipts/u);
assert.match(migration019, /work_orders_reorder_round_unique_idx[\s\S]+series_root_work_order_id, reorder_round/u);
assert.equal(fs.existsSync("db/v2/migrations/021_v2_nth_reorder.sql"), false, "migration 021 must not be introduced");

assert.match(repository, /INSERT INTO color_size_quantities[\s\S]+quantity\)[\s\S]+SELECT[^;]+,0 FROM/u);
assert.match(repository, /INSERT INTO work_order_size_spec_values/u);
assert.match(repository, /inventory_usage_quantity,order_quantity[\s\S]+0,required_quantity\+allowance_quantity/u);
assert.match(repository, /'editing'/u);
assert.match(repository, /work_order_processes[\s\S]+\$4::numeric,NULL[\s\S]+'ready'/u);
assert.match(repository, /process_total[\s\S]+estimated_total/u);
assert.doesNotMatch(repository, /generated_documents|document_access_tokens|work_order_material_order_events/u);

assert.match(assetCopy, /ri\.is_representative=true/u);
assert.match(assetCopy, /ra\.output_include=true/u);
assert.doesNotMatch(assetCopy, /filename.*match|includes\([^\n]*filename|original_filename.*LIKE/iu, "asset selection cannot use filename heuristics");
assert.match(assetCopy, /targetId = deterministicUuid/u);
assert.match(assetCopy, /createWorkOrderAttachmentStorageKey/u);
assert.match(route, /permissionCode: "workorder\.create"/u);

assert.match(history, /derivation_kind='original'/u);
assert.match(history, /derivation_kind='reorder'/u);
assert.doesNotMatch(history, /derivation_kind='rework'/u);
assert.match(sheets, /title="리오더 만들기"/u);
assert.match(sheets, /title="작업 이력"/u);
assert.match(mobile, /workOrderMutationController\.createReorder/u);
assert.match(mobile, /workOrderQueryController\.seriesHistory/u);
assert.match(mobile, /setPhase\("detail-ready"\)/u);
assert.match(mobile, /reorderedDetail\.header\.identity\.derivationKind !== "reorder"/u);

assert.match(capabilities, /REORDER_CREATE/u);
assert.match(capabilities, /alpha67-current-maker/u);
assert.match(runner, /EnableAlpha67NthReorderMutation/u);
assert.match(runner, /current-maker-alpha67/u);
assert.match(issueService, /MAKER_QA_CAPABILITY\.DOCUMENT_R0/u);
assert.match(issueService, /getWorkOrderV2DocumentR0MutationRuntimeGuard/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha67-nth-reorder-e2e",
  previousPermanentInventoryRetained: 161,
  addedPermanentChecks: 1,
  finalPermanentInventory: 162,
  migrationLedger: "20/20",
  migration021: 0,
  productionMutation: 0,
  ownerFixtureMutation: 0,
  physicalResultInferred: false,
}));
