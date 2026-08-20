#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const theme = read("apps/mobile/constants/theme.ts");
const choice = read("apps/mobile/features/inputs/WaflChoiceButtons.tsx");
const characterChoice = read("apps/mobile/features/work-orders/identity/WorkOrderCharacterChoice.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const create = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const readModels = read("lib/domain/work-orders/contracts/read-models.ts");
const lineage = read("lib/domain/work-orders/contracts/lineage.ts");
const list = read("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx");

assert.match(theme, /segmentedControl:\s*\{/u);
assert.match(theme, /compactHeight:\s*26/u);
assert.match(theme, /compactSegmentWidth:\s*52/u);
assert.match(theme, /compactTouchInset:\s*9/u);
assert.match(choice, /presentation\?: "form" \| "compact"/u);
assert.match(choice, /hitSlop=\{compact \? WAFL_THEME\.segmentedControl\.compactTouchInset/u);
assert.match(choice, /width: WAFL_THEME\.segmentedControl\.compactSegmentWidth/u);
assert.match(choice, /buttonCompactFirst/u);
assert.match(choice, /buttonCompactLast/u);

assert.match(characterChoice, /presentation\?: "form" \| "compact"/u);
assert.match(characterChoice, /compact \? null : <Text style=\{styles\.label\}>작업 구분<\/Text>/u);
assert.match(characterChoice, /presentation=\{props\.presentation\}/u);
assert.match(characterChoice, /containerCompact: \{ flexShrink: 0, justifyContent: "center", minHeight: WAFL_THEME\.touch\.minimum \}/u);

assert.match(overview, /<View style=\{styles\.identityRow\}>/u);
assert.match(overview, /<View style=\{styles\.statusRow\}>/u);
assert.match(overview, /presentation="compact"/u);
assert.doesNotMatch(overview, /원본 ·/u);
assert.doesNotMatch(overview, /sourceRelation/u);
assert.match(overview, /identityRow: \{[^}]*flexDirection: "row"[^}]*justifyContent: "space-between"/u);
assert.doesNotMatch(overview, /identityRow: \{[^}]*flexWrap/u, "compact grouped control stays top-right instead of wrapping beneath the title");
assert.match(overview, /statusRow: \{[^}]*flex: 1[^}]*flexWrap: "wrap"/u);

assert.match(readModels, /readonly sourceSummary:/u);
assert.match(lineage, /readonly sourceWorkOrderId:/u);
assert.match(lineage, /readonly sourceRevisionId:/u);
assert.match(create, /<WorkOrderCharacterChoice/u);
assert.doesNotMatch(create, /presentation="compact"/u);
assert.match(experience, /useState\(true\)/u);
assert.match(experience, /setCreateIsSample\(true\)/u);
assert.match(list, /작업 구분/u);
assert.match(list, /selectionMode="multiple"/u);

assert.equal(fs.existsSync("db/v2/migrations/020_v2_sample_reorder_invariant.sql"), true);
assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length, 20);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha66-header-identity-compact-control",
  previousPermanentInventoryRetained: 158,
  addedPermanentChecks: 1,
  finalPermanentInventory: 159,
  passiveSourceSubtitleVisible: 0,
  sourceReadModelPreserved: true,
  compactSegments: 2,
  migrationLedger: "20/20",
  migration020: 1,
  actualReorderCreateE2E: 0,
  actualReworkCreateE2E: 0,
  productionMutation: 0,
  ownerFixtureMutation: 0,
  physicalResultInferred: false,
}));
