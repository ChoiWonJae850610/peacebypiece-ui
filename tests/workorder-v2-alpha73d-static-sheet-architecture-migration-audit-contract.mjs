import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

function listTsx(relativeDirectory) {
  const directory = path.join(root, relativeDirectory);
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules") return [];
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return listTsx(path.relative(root, absolute));
    return entry.isFile() && entry.name.endsWith(".tsx") ? [absolute] : [];
  });
}

const mobileTsx = listTsx("apps/mobile").map((file) => fs.readFileSync(file, "utf8")).join("\n");
const audit = read("docs/project/app-v2/static-sheet-architecture-migration-audit-design.md");
const inputSheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const detentPolicy = read("apps/mobile/domain/waflSheetDetentPolicy.ts");
const directInputPolicy = read("apps/mobile/domain/waflDirectInputKeyboardPolicy.ts");

const count = (source, pattern) => [...source.matchAll(pattern)].length;

assert.equal(count(mobileTsx, /<WaflInputSheet\b/gu), 26, "all live WaflInputSheet JSX instances must stay inventoried");
assert.equal(count(mobileTsx, /<WaflReelPickerSheet\b/gu), 8, "all live reel consumers must stay inventoried");
assert.equal(count(mobileTsx, /<WaflPairedOptionReelPickerSheet\b/gu), 1, "paired reel consumer must stay inventoried");
assert.equal(count(mobileTsx, /<WaflDecisionSheet\b/gu), 3, "all shared Decision callsites must stay inventoried");
assert.equal(count(mobileTsx, /<InlineDatePicker\b/gu), 1, "fixed calendar must stay inventoried");
assert.equal(count(mobileTsx, /<Modal\b/gu), 7, "all raw native Modal hosts must stay inventoried");

for (const classification of [
  "STATIC_BOTTOM_SHEET",
  "STATIC_BOTTOM_SHEET_SCROLLABLE",
  "STATIC_REEL_PICKER",
  "CENTER_DIALOG_CANDIDATE",
  "FULLSCREEN_KEEP",
  "SPECIAL_FIXED_MODAL_KEEP",
]) assert.match(audit, new RegExp(`\\b${classification}\\b`, "u"));

for (const owner of [
  "features/feedback/WaflDecisionSheet.tsx",
  "features/inputs/reel-picker/WaflReelPickerSheet.tsx",
  "features/MobileWorkOrderExperience.tsx",
  "features/work-orders/list/WorkOrderListScreen.tsx",
  "features/work-orders/drawing/WorkOrderSketchEditor.tsx",
  "features/work-orders/create/WorkOrderCreateSheet.tsx",
  "features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx",
  "features/work-orders/reorder/WorkOrderReorderSheets.tsx",
  "features/work-orders/size-color/MeasurementTemplateSheets.tsx",
  "features/work-orders/overview/WorkOrderDetailOverview.tsx",
  "features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx",
  "features/work-orders/size-color/SpecItemSelectionSheet.tsx",
  "features/work-orders/documents/QuickDeliveryFoundation.tsx",
  "features/work-orders/documents/WorkOrderDocumentWorkbench.tsx",
  "features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx",
  "features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx",
]) assert.ok(audit.includes(owner), `missing WaflInputSheet owner ${owner}`);

for (const symbol of [
  "resolveWaflSheetDragStartOffset",
  "clampWaflSheetOffset",
  "resolveWaflSheetDragOffset",
  "shouldCaptureWaflSheetHeaderDrag",
  "shouldCaptureWaflSheetDrag",
  "resolveWaflSheetRelease",
]) {
  assert.doesNotMatch(detentPolicy, new RegExp(`export function ${symbol}\\b`, "u"), `Phase 1 must retire ${symbol}`);
  assert.match(audit, new RegExp(`\\b${symbol}\\b`, "u"), `retirement map must name ${symbol}`);
}
assert.doesNotMatch(directInputPolicy, /export function resolveWaflDirectInputDragRelease\b/u);
assert.match(audit, /resolveWaflDirectInputDragRelease/u);
assert.doesNotMatch(inputSheet, /onStartShouldSetResponderCapture|userDraggedDuringKeyboardRef/u, "A73D Phase 1 must implement the audited static root");
assert.match(inputSheet, /testID="wafl-sheet-fixed-header"/u);

for (const contract of [
  "alpha64-free-settle-sheet-physics",
  "alpha64-shared-sheet-architecture-stability",
  "alpha64-physical-ui-regression",
  "alpha64-real-sheet-category-spec",
  "alpha64-spec-catalog-sticky-sheet",
  "alpha64-contentfit-footer-sizecolor-inset",
  "alpha64-sheet-actions-quick-address-nested",
  "alpha64-keyboard-focus-sheet-actions",
  "alpha65-common-picker-physical-drag",
  "alpha65-production-physical-parity-save-picker",
  "alpha65-sheet-inventory-reusable-create-active-geometry",
  "alpha68-direct-input-single-geometry-drag-submit-fix",
  "alpha73C Phase 2",
  "alpha73C Phase 3",
  "alpha73C Phase 4",
]) assert.ok(audit.includes(contract), `missing permanent contract migration decision ${contract}`);

for (const invariant of [
  "Header is fixed",
  "Body owns vertical scrolling",
  "There is no drag-dismiss path",
  "Hide restores the static resting position",
  "Nested routes close and reopen by presentation generation",
  "No user outcome depends on an adjustable header gesture",
  "Product behavior delta: `0`",
  "ALPHA73D_PHASE1_STATIC_SHEET_PRIMITIVE_CORE_IPHONE_QA_REQUIRED",
  "PHYSICAL_RESULT_NOT_INFERRED",
]) assert.ok(audit.includes(invariant), `missing static-sheet invariant: ${invariant}`);

console.log(JSON.stringify({
  checkpoint: "ALPHA73D_STATIC_SHEET_ARCHITECTURE_MIGRATION_AUDIT_PLAN_COMPLETE",
  productBehaviorDelta: 0,
  waflInputSheetInstances: 26,
  reelConsumers: 8,
  pairedReelConsumers: 1,
  decisionCallsites: 3,
  rawNativeModals: 7,
  physical: "PHYSICAL_RESULT_NOT_INFERRED",
}, null, 2));
console.log("workorder v2 alpha.73D static sheet architecture migration audit contract: PASS");
