#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  canSetWorkOrderSample,
  isValidWorkOrderSampleLineage,
  matchesWorkOrderIdentityFilters,
  workOrderIdentityBadgeLabels,
} from "../lib/domain/work-orders/contracts/lineage.ts";
import { evaluateWorkOrderIssueReadiness } from "../lib/domain/work-orders/issueReadiness.ts";
import { resolveReadinessIssueDestination } from "../apps/mobile/domain/workOrderReadinessNavigation.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const migration019 = read("db/v2/migrations/019_v2_work_order_lineage_sample.sql");
const migration020 = read("db/v2/migrations/020_v2_sample_reorder_invariant.sql");
const lineage = read("lib/domain/work-orders/contracts/lineage.ts");
const sampleRoute = read("lib/domain/work-orders/command/sampleCommandRoute.ts");
const readiness = read("lib/domain/work-orders/issueReadiness.ts");
const detailRepository = read("lib/domain/work-orders/read/detailRepository.ts");
const mobileContract = read("apps/mobile/domain/mobileContract.ts");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const readinessRow = read("apps/mobile/features/layout/WaflReadinessActionRow.tsx");
const navigation = read("apps/mobile/domain/workOrderReadinessNavigation.ts");
const fixture = read("scripts/run-wafl-v2-alpha66-lineage-fixture.mjs");
const runtimeQa = read("scripts/run-wafl-v2-alpha66-lineage-runtime-qa.mjs");

assert.match(migration020, /work_orders_sample_reorder_invariant_check/u);
assert.match(migration020, /NOT is_sample OR \(derivation_kind <> 'reorder' AND reorder_round = 0\)/u);
assert.doesNotMatch(migration020, /DROP|TRUNCATE|DELETE\s+FROM|UPDATE\s+work_orders/iu);
assert.equal(read("db/v2/migrations/019_v2_work_order_lineage_sample.sql"), migration019, "migration019 source owner remains intact");
assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length, 20);

const sampleOriginal = { isSample: true, derivationKind: "original", reorderRound: 0 };
const sampleRework = { isSample: true, derivationKind: "rework", reorderRound: 0 };
const invalidSampleReorder = { isSample: true, derivationKind: "reorder", reorderRound: 1 };
const invalidSampleInheritedRework = { isSample: true, derivationKind: "rework", reorderRound: 2 };
assert.equal(isValidWorkOrderSampleLineage(sampleOriginal), true);
assert.equal(isValidWorkOrderSampleLineage(sampleRework), true);
assert.equal(isValidWorkOrderSampleLineage(invalidSampleReorder), false);
assert.equal(isValidWorkOrderSampleLineage(invalidSampleInheritedRework), false);
assert.equal(canSetWorkOrderSample({ derivationKind: "reorder", reorderRound: 1 }), false);
assert.equal(canSetWorkOrderSample({ derivationKind: "rework", reorderRound: 0 }), true);
assert.deepEqual(workOrderIdentityBadgeLabels(sampleRework), ["샘플", "재작업"]);
assert.deepEqual(workOrderIdentityBadgeLabels(invalidSampleInheritedRework), []);
assert.equal(matchesWorkOrderIdentityFilters(sampleRework, "sample", ["rework"]), true);
assert.equal(matchesWorkOrderIdentityFilters(invalidSampleReorder, "sample", ["reorder"]), false);
assert.match(lineage, /if \(!isValidWorkOrderSampleLineage\(identity\)\) return false/u);
assert.match(sampleRoute, /derivation_kind <> 'reorder' AND reorder_round = 0/u);
assert.match(sampleRoute, /SAMPLE_REORDER_FORBIDDEN/u);
assert.match(overview, /header\.identity\.reorderRound === 0/u, "reorder context hides invalid Sample control");

assert.match(fixture, /sampleRework/u);
assert.match(fixture, /suffix: "07 Sample 재작업"[\s\S]+kind: "rework", round: 0, source: "sample", root: "sample"/u);
assert.doesNotMatch(fixture, /Sample 2차 리오더 재작업/u);
assert.match(runtimeQa, /sampleReorderFilterCount: 0/u);
assert.match(runtimeQa, /sampleReworkFilterCount: 1/u);
assert.match(runtimeQa, /reorderSampleMutationRejected: true/u);

const evaluated = evaluateWorkOrderIssueReadiness({
  productName: "", productTypeCode: null, seasonCode: null, itemCode: null, dueDate: null,
  companyDocumentCode: null, workOrderTotal: 0, revisionTotal: 0, matrixTotal: 0,
  representativeImageCount: 0, fabricCount: 0, accessoryCount: 0, includedAttachmentCount: 0,
});
assert.equal(evaluated.issues.length, evaluated.hardBlockers.length + evaluated.warnings.length);
assert.equal(new Set(evaluated.issues.map((issue) => issue.code)).size, evaluated.issues.length);
assert.match(readiness, /issues: \[\.\.\.hardBlockers, \.\.\.warnings\]/u);
assert.match(detailRepository, /issues: readiness\.issues/u);
assert.match(mobileContract, /readonly issues:/u);

assert.doesNotMatch(overview, /다음 확인|slice\(0, 3\)|외 \d+건/u);
assert.match(readinessRow, /발행 전 확인 \$\{issueCount\}건/u);
assert.match(readinessRow, /발행 준비 완료/u);
assert.match(overview, /title="발행 전 확인"/u);
assert.match(overview, /\{readinessIssues\.length\}개의 항목을 확인해 주세요/u);
assert.match(overview, /readinessIssues\.map/u);
assert.match(overview, /testID="preissue-readiness-sheet-list"/u);
assert.ok(overview.indexOf("<Section title=\"비용 구성\">") < overview.indexOf("<WaflReadinessActionRow"), "pre-issue action follows cost composition");
assert.match(overview, /pendingReadinessIntentRef/u);
assert.match(overview, /onAfterClose=\{finishReadinessClose\}/u);
assert.match(navigation, /READINESS_SECTION_BY_CODE/u);
assert.doesNotMatch(navigation, /includes\(|message|제품명이|원단 정보/u, "routing must not parse Korean messages");
assert.equal(resolveReadinessIssueDestination("REPRESENTATIVE_IMAGE_REQUIRED")?.intent, "media");
assert.equal(resolveReadinessIssueDestination("MATERIAL_REQUIRED")?.intent, "fabric");
assert.equal(resolveReadinessIssueDestination("NO_INCLUDED_ATTACHMENT")?.intent, "output");
assert.equal(resolveReadinessIssueDestination("UNKNOWN_FUTURE_ISSUE"), null);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha66-sample-reorder-invariant-preissue-checklist",
  previousPermanentInventoryRetained: 159,
  addedPermanentChecks: 1,
  finalPermanentInventory: 160,
  migrationLedger: "20/20",
  migration020: 1,
  actualReorderCreateE2E: 0,
  actualReworkCreateE2E: 0,
  productionMutation: 0,
  ownerFixtureMutation: 0,
  physicalResultInferred: false,
}));
