import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const structurePath = "apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx";
const specPath = "apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx";
const structure = read(structurePath);
const spec = read(specPath);
const reusable = read("apps/mobile/features/inputs/WaflReusableCreateForm.tsx");
const sharedInput = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx");

for (const [label, source] of [["Direct Size/Color", structure], ["Direct Spec/POM", spec]]) {
  assert.doesNotMatch(source, /onPreparedForAutoFocus/u, `${label} must not request prepared autofocus`);
  assert.doesNotMatch(source, /\bautoFocus\b/u, `${label} must not use raw mount autofocus`);
}

assert.match(structure, /title="직접 사이즈 만들기"/u);
assert.match(structure, /title="직접 색상 만들기"/u);
assert.match(structure, /inputRef=\{directInputRef\}/u, "Direct Size must keep its mounted shared field ref");
assert.match(structure, /inputRef=\{nameInputRef\}/u, "Direct Color must keep its mounted shared field ref");
assert.match(structure, /<ColorGrid onChange=\{setSelectedHex\} value=\{selectedHex\} \/>/u, "Direct Color palette must remain in the reusable form");
assert.match(spec, /title=\{childTitle\}/u);
assert.match(spec, /inputRef=\{editorInputRef\}/u, "Spec create/rename must keep one shared field ref");
assert.match(spec, /nested\.route === "rename" \? async \(\) =>/u, "Spec rename must keep the canonical confirm branch");

assert.match(reusable, /const disabled = props\.pending \|\| !props\.value\.trim\(\)/u, "invalid reusable input must remain disabled");
assert.match(reusable, /useWaflSheetDirectInputConfirm\(props\.onCreate, disabled\)/u, "valid native Done must keep the canonical exactly-once confirm owner");
assert.match(reusable, /<WaflSheetValueField/u);
assert.doesNotMatch(reusable, /\bautoFocus\b|\.focus\(/u, "the shared reusable form must remain manual-focus by default");
assert.match(sharedInput, /function handleFocus\([\s\S]*?registerFocusedTarget\(targetRef\.current\);/u, "an explicit native field focus must enter the shared reveal registry through the canonical semantic-ready guard");
assert.match(sharedInput, /resolveWaflDirectInputSubmitBehavior/u, "submit-before-blur policy must remain shared");

assert.doesNotMatch(overview, /onPreparedForAutoFocus|\bautoFocus\b/u, "Season/Detail reference direct inputs must remain manual-focus");

const newRecipe = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
assert.doesNotMatch(newRecipe, /onPreparedForAutoFocus|\bautoFocus\b/u, "Phase 2 supersedes the former New Recipe prepared-focus exception");

const sketch = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
assert.doesNotMatch(sketch, /onPreparedForAutoFocus/u, "Phase 2 keeps Sketch presentation identity without prepared autofocus");

const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
assert.doesNotMatch(quick, /detailAddressInputRef|handleDirectAfterOpen|onPreparedForAutoFocus/u, "Phase 2 supersedes feature-local Quick return focus");

const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
assert.match(reel, /keyboardMode=\{renderPath === "numeric-keypad" \? "directInput" : "default"\}/u, "the later A73D numeric mode must use the shared direct-input lifecycle");
assert.match(reel, /onPreparedForAutoFocus=\{renderPath === "numeric-keypad"/u, "numeric focus remains intentional through one prepared transaction");
assert.doesNotMatch(reel, /\sautoFocus(?:\s|=)/u, "raw numeric mount autofocus must remain retired");

const dragPolicy = read("apps/mobile/domain/waflDirectInputKeyboardPolicy.ts");
assert.doesNotMatch(dragPolicy, /resolveWaflDirectInputDragRelease/u, "A73D Phase 1 retires the later shared root-drag branch");

const drawingApi = read("apps/mobile/lib/api/drawingApi.ts");
assert.match(drawingApi, /primary-sketch/u, "Drawing persistence boundary must remain present");

const version = read("lib/constants/version.ts");
assert.match(version, /2\.0\.0-alpha\.(?:72|73|74|75)/u);
assert.equal(fs.readdirSync(path.join(root, "db", "v2", "migrations")).filter((name) => name.endsWith(".sql")).length, 22);

const design = read("docs/project/app-v2/input-sheet-keyboard-normalization-audit-design.md");
assert.match(design, /ALPHA73C_PHASE1_MANUAL_REUSABLE_CREATE_FOCUS_IPHONE_QA_REQUIRED/u);
assert.match(design, /Phase 1 — manual reusable-create focus \(implemented; iPhone QA required\)/u);
assert.match(design, /Physical result: not inferred/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73c-phase1-manual-reusable-create-focus",
  previousPermanentInventoryRetained: 238,
  addedPermanentChecks: 1,
  finalPermanentInventory: 239,
  preparedAutofocusRemoved: ["Direct Size", "Direct Color", "Direct Spec/POM create/rename"],
  physicalResultInferred: false,
}));
