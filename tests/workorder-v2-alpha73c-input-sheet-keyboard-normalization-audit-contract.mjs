import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const mobileRoot = path.join(root, "apps", "mobile");
const designPath = path.join(root, "docs", "project", "app-v2", "input-sheet-keyboard-normalization-audit-design.md");

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : filesUnder(target);
    return /\.(?:ts|tsx)$/u.test(entry.name) ? [target] : [];
  });
}

const sources = filesUnder(mobileRoot).map((file) => fs.readFileSync(file, "utf8"));
const joined = sources.join("\n");
const count = (pattern) => joined.match(pattern)?.length ?? 0;

assert.equal(count(/<WaflInputSheet(?:\s|\/)/gu), 26, "all live WaflInputSheet callsites must stay inventoried");
assert.equal(count(/<WaflReelPickerSheet(?:\s|\/)/gu), 8, "all WaflReelPickerSheet callsites must stay inventoried");
assert.equal(count(/<WaflSheetValueField(?:\s|\/)/gu), 15, "all shared value fields must stay inventoried");
assert.equal(count(/<WaflSheetTextInput(?:\s|\/)/gu), 4, "all direct shared TextInput callsites must stay inventoried");
assert.equal(count(/<TextInput(?=\s+(?:[a-z]|\{))/gu), 6, "all raw native TextInput hosts must stay inventoried");
assert.equal(count(/\.focus\(/gu), 5, "normalized forms and Quick keep feature-local focus removed; the numeric picker adds one shared prepared-focus owner");
assert.equal(count(/requestAnimationFrame\(/gu), 26, "the registered-input handoff adds one bounded blur-transfer frame; all interaction and DEV/external-QA observation animation-frame owners stay inventoried");
assert.equal(count(/Keyboard\.addListener\(/gu), 8, "appearance-scoped iOS keyboardWillShow owner and all existing keyboard listeners must stay inventoried");

const overview = fs.readFileSync(path.join(mobileRoot, "features", "work-orders", "overview", "WorkOrderOverviewPickerSheets.tsx"), "utf8");
assert.doesNotMatch(overview, /onPreparedForAutoFocus|autoFocus/u, "Season/Detail reference direct input must remain manual-focus");

const structure = fs.readFileSync(path.join(mobileRoot, "features", "work-orders", "size-color", "WorkOrderSizeColorStructureEditor.tsx"), "utf8");
assert.doesNotMatch(structure, /onPreparedForAutoFocus|autoFocus/u, "Phase 1 must apply the audit decision to Direct Size and Color");

const spec = fs.readFileSync(path.join(mobileRoot, "features", "work-orders", "size-color", "SpecItemSelectionSheet.tsx"), "utf8");
assert.doesNotMatch(spec, /onPreparedForAutoFocus|autoFocus/u, "Phase 1 must apply the audit decision to Direct Spec create and rename");

const quick = fs.readFileSync(path.join(mobileRoot, "features", "work-orders", "documents", "QuickDeliveryFoundation.tsx"), "utf8");
assert.doesNotMatch(quick, /requestAnimationFrame|detailAddressInputRef/u, "Phase 2 removes the parallel Quick nested-return focus owner");

const search = fs.readFileSync(path.join(mobileRoot, "features", "work-orders", "documents", "QuickDeliveryAddressSearchSheet.tsx"), "utf8");
assert.match(search, /returnKeyType="search"/u);
assert.match(search, /onSubmitEditing=\{submitSearch\}/u, "Phase 2 gives Search Return a real domain action");

const design = fs.readFileSync(designPath, "utf8");
for (const heading of [
  "Exhaustive `WaflInputSheet` inventory",
  "Autofocus inventory",
  "Reference behavior and Direct Color root",
  "Responder and geometry ownership",
  "Keyboard action grammar",
  "Quick Delivery ownership map",
  "Address Search state machine",
  "Canonical ownership architecture",
  "Debt map",
  "Implementation phases",
  "Phase 1 implementation boundary",
]) assert.match(design, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));

assert.match(design, /Phase 2 implementation boundary/u);
assert.match(design, /Production\/Owner\/ambiguous mutation: `0\/0\/0`/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73c-input-sheet-keyboard-normalization-audit",
  previousPermanentInventoryRetained: 237,
  addedPermanentChecks: 1,
  finalPermanentInventory: 238,
  phase1ReusableCreateFocusRemovals: 3,
  phase2NormalizedFocusOwnersRemoved: 4,
  physicalResultInferred: false,
}));
