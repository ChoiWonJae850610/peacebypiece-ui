#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { workOrderReadinessNeedsCanonicalRefresh } from "../apps/mobile/domain/workOrderReadinessRefreshPolicy.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const queryController = read("apps/mobile/features/work-orders/workOrderQueryController.ts");
const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
const mobileContract = read("apps/mobile/domain/mobileContract.ts");
const list = read("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx");
const runtimeQa = read("scripts/run-wafl-v2-alpha66-readiness-refresh-runtime-qa.mjs");

const mediaColumnStart = overview.indexOf("<View style={styles.mediaColumn}>");
const mediaColumnEnd = overview.indexOf("</View>", overview.indexOf("<Text style={styles.statusBadge}", mediaColumnStart));
const heroTextStart = overview.indexOf("<View style={styles.heroText}>");
assert.ok(mediaColumnStart >= 0 && mediaColumnEnd > mediaColumnStart && mediaColumnEnd < heroTextStart, "workflow status belongs below the representative image, before the text column");
assert.match(overview.slice(mediaColumnStart, mediaColumnEnd), /<Text style=\{styles\.statusBadge\}>\{formatWorkOrderStatus\(header\.status\)\}<\/Text>/u);

const identityStart = overview.indexOf("<View style={styles.identityRow}>");
const identityEnd = overview.indexOf("</View>", overview.indexOf("<WorkOrderCharacterChoice", identityStart));
const identitySource = overview.slice(identityStart, identityEnd);
assert.doesNotMatch(identitySource, /formatWorkOrderStatus|header\.identity\.isSample[^\n]+identityBadge/u, "detail identity row has neither workflow status nor duplicate Sample badge");
assert.match(identitySource, /reorderRound[^\n]+차 리오더/u);
assert.match(identitySource, /derivationKind === "rework"[^\n]+재작업/u);
assert.match(identitySource, /header\.identity\.reorderRound === 0[\s\S]+presentation="compact"/u);
assert.match(overview, /identityRow: \{[^}]*flexDirection: "row"[^}]*justifyContent: "space-between"/u);
assert.doesNotMatch(overview, /identityRow: \{[^}]*flexWrap/u, "compact character control must not wrap beneath the title");
assert.match(list, /item\.identity\.isSample \? "샘플" : null/u, "list Sample badge remains unchanged");

assert.match(mobileContract, /readonly basedOnVersion: number/u);
assert.match(mobileContract, /readonly source: "server_canonical" \| "client_preview"/u);
assert.match(queryController, /workOrderReadinessNeedsCanonicalRefresh/u);
assert.match(queryController, /detailAfterReadinessRelevantMutation/u);
assert.match(experience, /canonicalDetailRefreshQueue/u);
assert.match(experience, /workOrderReadinessNeedsCanonicalRefresh\(detail\)/u);
assert.match(experience, /refreshCanonicalDetailAfterMutation\(detail\.header\.id\)/u);
assert.match(experience, /reconcileCanonicalDetail\(refreshed\)/u);
assert.match(experience, /onRefreshReadinessAfterMutation/u);
assert.match(production, /onMutationCommitted\?\.\(\)/u, "Production uses the same parent canonical refresh path after a successful command");
assert.doesNotMatch(experience, /setReadinessCount|readinessCount[^A-Za-z]/u, "no parallel client readiness counter");
assert.match(runtimeQa, /readiness-count-delta/u);
assert.match(runtimeQa, /readiness-issues-not-restored/u);
assert.match(runtimeQa, /fixture-residual-due-date/u);
assert.match(runtimeQa, /N_TO_N_MINUS_1_THEN_N_PLUS_1_RESTORE/u);
assert.match(runtimeQa, /overviewAndSheetSot: "header\.readiness\.issues"/u);

const detailFor = (entityVersion, basedOnVersion, source = "server_canonical") => ({
  header: { entityVersion, readiness: { basedOnVersion, source } },
});
assert.equal(workOrderReadinessNeedsCanonicalRefresh(detailFor(7, 7)), false);
assert.equal(workOrderReadinessNeedsCanonicalRefresh(detailFor(8, 7)), true, "successful version projection invalidates stale readiness");
assert.equal(workOrderReadinessNeedsCanonicalRefresh(detailFor(7, 7, "client_preview")), true, "client preview never replaces canonical readiness");

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha66-header-status-layout-readiness-refresh",
  previousPermanentInventoryRetained: 160,
  addedPermanentChecks: 1,
  finalPermanentInventory: 161,
  migrationLedger: "20/20",
  migration021: 0,
  actualReorderCreateE2E: 0,
  actualReworkCreateE2E: 0,
  productionMutation: 0,
  ownerFixtureMutation: 0,
  physicalResultInferred: false,
}));
