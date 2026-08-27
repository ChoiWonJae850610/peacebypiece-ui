#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createSpecItemCandidates, initialSpecItemSelection, selectedSpecItems, toggleSpecItemSelection } from "../apps/mobile/domain/specItemSelectionPolicy.ts";
import { resolveWaflSheetRelease, shouldCaptureWaflSheetHeaderDrag } from "../apps/mobile/domain/waflSheetDetentPolicy.ts";
import { isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";
import { MAKER_QA_APPROVAL } from "../lib/external-qa/makerQaCapabilities.mjs";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const uuid = "10000000-0000-4000-8000-000000000001";
const currentMakerEnvironment = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ALPHA64_DOCUMENT_R0_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA64_CURRENT,
  WAFL_V2_DOCUMENT_VIEWER_ENABLED: "1",
  WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA64_CURRENT,
};

const migration = read("db/v2/migrations/017_v2_company_spec_item_catalog.sql");
const optionPolicy = read("lib/domain/work-orders/catalog/structureOptionPolicy.ts");
const optionRepository = read("lib/domain/work-orders/catalog/structureOptionRepository.ts");
const measurementRepository = read("lib/domain/work-orders/measurement/measurementCommandRepository.ts");
const measurementRoute = read("lib/domain/work-orders/measurement/measurementCommandRoute.ts");
const mobileContract = read("apps/mobile/domain/mobileContract.ts");
const selectionPolicy = read("apps/mobile/domain/specItemSelectionPolicy.ts");
const selectionSheet = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const readOnly = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const frozenTable = read("apps/mobile/features/layout/WaflFrozenAxisTable.tsx");
const inputSheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const theme = read("apps/mobile/constants/theme.ts");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

for (const token of [
  "017_v2_company_spec_item_catalog",
  "option_kind IN ('size', 'color', 'spec_item')",
  "option_kind IN ('size', 'spec_item') AND hex_value IS NULL",
  "2.0.0-alpha.64-spec-catalog-dev-test-reviewed",
]) assert.ok(`${migration}\n${read("scripts/run-wafl-v2-alpha64-spec-catalog-migration.mjs")}`.includes(token), `missing migration boundary: ${token}`);
assert.doesNotMatch(migration, /CREATE\s+TABLE|ADD\s+COLUMN|REFERENCES\s+public\.work_order_size_spec_poms/iu);

assert.match(optionPolicy, /"size" \| "color" \| "spec_item"/u);
assert.match(optionRepository, /STRUCTURE_OPTION_RENAME_COMMAND_CODE/u);
assert.match(optionRepository, /work_order_size_spec_poms/u);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${uuid}/size-color/options/${uuid}`, "PATCH", currentMakerEnvironment), true);
assert.match(optionRepository, /is_active=false/u);
assert.match(optionRepository, /option_kind='spec_item'/u);

for (const source of [measurementRepository, measurementRoute, mobileContract]) assert.match(source, /set-pom-selection/u);
assert.match(measurementRepository, /work_order\.measurement\.pom_selection\.batch|pomSelectionBatch/u);
assert.match(measurementRepository, /DELETE FROM work_order_size_spec_values[\s\S]*NOT \(pom_column_id=ANY/u);
assert.match(measurementRepository, /DELETE FROM work_order_size_spec_poms[\s\S]*NOT \(id=ANY/u);
assert.match(measurementRepository, /currentPomId/u);
assert.match(measurementRepository, /company_spec_item:/u);
assert.match(measurementRepository, /'length',NULL/u);

for (const token of ["createSpecItemCandidates", "initialSpecItemSelection", "toggleSpecItemSelection", "selectedSpecItems"]) assert.match(selectionPolicy, new RegExp(token, "u"));
assert.match(selectionSheet, /스펙 항목명/u);
assert.match(selectionSheet, /confirmDisabled=\{unchanged\}/u);
assert.match(selectionSheet, /onSetPomSelection|onApply/u);
assert.match(readOnly, /스펙 항목 선택/u);
assert.match(frozenTable, /cornerLabel: ReactNode/u);

const catalog = [{ id: "catalog-a", kind: "spec_item", displayName: "총장", hexValue: null, active: true, sourceKind: "company", categoryCode: "T" }];
const current = [{ id: "pom-a", code: "LENGTH", displayName: "총장", displayOrder: 0 }, { id: "pom-legacy", code: "OLD", displayName: "기존 항목", displayOrder: 1 }];
const candidates = createSpecItemCandidates(current, catalog, []);
assert.deepEqual(candidates.map((item) => [item.catalogOptionId, item.currentPomId]), [["catalog-a", "pom-a"], [null, "pom-legacy"]]);
const initial = initialSpecItemSelection(candidates);
assert.equal(initial.length, 2);
const toggled = toggleSpecItemSelection(initial, "legacy:pom-legacy");
assert.deepEqual(selectedSpecItems(candidates, toggled).map((item) => item.displayName), ["총장"]);

for (const token of ["mediumDetentRatio: 0.68", "expandedDetentRatio: 0.94", "dismissDistance", "dragHandleHeight", "dragZoneMinHeight: 44"]) assert.ok(theme.includes(token), `missing sheet token: ${token}`);
for (const token of ["onStartShouldSetResponderCapture", "onResponderMove", "resolveWaflSheetRelease", "Animated.spring", "ScrollView", "onRequestClose={cancel}", 'testID="wafl-sheet-bottom-inset"']) assert.ok(inputSheet.includes(token), `missing sheet behavior: ${token}`);
assert.ok(inputSheet.includes("onStartShouldSetResponderCapture={() => draggable && openReady && !actionPending && !dismissingRef.current}"), "header must capture at touch-down only while the sheet is open and not closing");
assert.ok(!inputSheet.includes("PanResponder.create"), "late-acquisition PanResponder path must not return");
assert.ok(inputSheet.includes('testID="wafl-sheet-actions"'));
assert.match(inputSheet, /Swipe|swipe|cancel\(\)/u);
assert.equal(shouldCaptureWaflSheetHeaderDrag({ actionPending: false, dx: 20, dy: 3 }), false);
assert.equal(shouldCaptureWaflSheetHeaderDrag({ actionPending: false, dx: 0, dy: 24 }), true);
assert.deepEqual(resolveWaflSheetRelease({ dragStartOffset: 200, dy: -160, vy: -0.2, maxSettleOffset: 200, dismissDistance: 96, dismissVelocity: 1.15, flickVelocity: 0.45, velocityProjectionMs: 72, maxVelocityProjection: 88 }), { kind: "settle", offset: 40 });
assert.equal(resolveWaflSheetRelease({ dragStartOffset: 200, dy: 110, vy: 0.2, maxSettleOffset: 200, dismissDistance: 96, dismissVelocity: 1.15, flickVelocity: 0.45, velocityProjectionMs: 72, maxVelocityProjection: 88 }).kind, "dismiss");

assert.match(overview, /stickyHeaderIndices=\{\[2\]\}/u);
const navigationIndex = overview.indexOf("<View style={styles.navigationBar}>", overview.indexOf("<ScrollView"));
const heroIndex = overview.indexOf('testID="production-card-sheet"', navigationIndex);
const tabIndex = overview.indexOf("<View style={styles.tabRailFrame}>", heroIndex);
assert.ok(navigationIndex > -1 && navigationIndex < heroIndex && heroIndex < tabIndex, "back/hero must precede the sticky feature rail inside the detail scroller");

for (const token of ["WAFL Sheet System v2", "medium `0.68`", "expanded `0.94`", "cancel-only", "스펙 항목 〉", "only sticky element"]) assert.ok(`${design}\n${ia}`.includes(token), `missing canonical guidance: ${token}`);

console.log("workorder v2 alpha.64 spec catalog sticky tabs draggable sheets contract: PASS");
