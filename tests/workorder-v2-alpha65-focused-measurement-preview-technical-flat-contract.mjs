#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  nextSpecItemPreviewKey,
  reconcileSpecItemPreviewKey,
  toggleSpecItemSelection,
} from "../apps/mobile/domain/specItemSelectionPolicy.ts";
import { WAFL_SPEC_MEASUREMENT_DIAGRAMS } from "../apps/mobile/features/work-orders/size-color/specMeasurementDiagramDefinitions.ts";
import { WAFL_STATIC_GARMENT_ASSETS } from "../apps/mobile/features/work-orders/size-color/staticGarmentAssetDefinitions.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const selector = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const renderer = read("apps/mobile/features/work-orders/size-color/WaflSpecMeasurementDiagram.tsx");
const staticLayer = read("apps/mobile/features/work-orders/size-color/WaflStaticGarmentAsset.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

const mappedA = { systemSpecItemKey: "T:shoulder_width" };
const mappedB = { systemSpecItemKey: "T:chest_width" };
const unmapped = { systemSpecItemKey: null };
let selected = [];
let preview = null;

// Fresh open never infers a preview from persisted/current selections.
assert.equal(preview, null);
selected = toggleSpecItemSelection(selected, "system:T:shoulder_width");
preview = nextSpecItemPreviewKey(preview, mappedA, false);
assert.deepEqual(selected, ["system:T:shoulder_width"]);
assert.equal(preview, "T:shoulder_width");

selected = toggleSpecItemSelection(selected, "system:T:chest_width");
preview = nextSpecItemPreviewKey(preview, mappedB, false);
assert.equal(selected.length, 2, "grid keeps unrestricted staged multi-selection");
assert.equal(preview, "T:chest_width", "latest mapped activation owns the sole preview");

selected = toggleSpecItemSelection(selected, "system:T:shoulder_width");
preview = nextSpecItemPreviewKey(preview, mappedA, true);
assert.equal(preview, "T:chest_width", "turning off another mapped item leaves the active preview alone");
selected = toggleSpecItemSelection(selected, "system:T:chest_width");
preview = nextSpecItemPreviewKey(preview, mappedB, true);
assert.equal(preview, null, "turning off the previewed item returns to garment-only");

selected = toggleSpecItemSelection(selected, "catalog:custom");
preview = nextSpecItemPreviewKey("T:chest_width", unmapped, false);
assert.equal(preview, null, "unmapped company/custom/current staging has no fabricated preview");
assert.equal(reconcileSpecItemPreviewKey("T:chest_width", [mappedA]), null, "catalog refresh removes an invalid preview");
assert.equal(reconcileSpecItemPreviewKey("T:chest_width", [mappedA, mappedB]), "T:chest_width");

let mappedGuides = 0;
for (const categoryCode of ["T", "B", "O", "D"]) {
  const asset = WAFL_STATIC_GARMENT_ASSETS[categoryCode];
  for (const side of ["front", "back"]) {
    const view = asset[side];
    const matrix = view.overlayTransform.match(/^matrix\(([-\d.]+) 0 0 ([-\d.]+) ([-\d.]+) ([-\d.]+)\)$/u);
    assert.ok(matrix, `${categoryCode} ${side} uses scale/translate only`);
    assert.equal(Number(matrix[1]), Number(matrix[2]), `${categoryCode} ${side} uses uniform scale`);
    assert.ok(view.outlinePaths.length >= 1, `${categoryCode} ${side} has one complete authored silhouette`);
    assert.ok(view.outlinePaths.length + view.detailPaths.length >= 4, `${categoryCode} ${side} retains authored recognizable construction detail`);
  }
  mappedGuides += WAFL_SPEC_MEASUREMENT_DIAGRAMS[categoryCode].guides.length;
}
assert.equal(mappedGuides, 55, "T14/B11/O15/D15 catalog mapping is unchanged");
assert.doesNotMatch(Object.values(WAFL_STATIC_GARMENT_ASSETS.T).flatMap((value) => value?.outlinePaths ?? []).join(" "), /L212 610|L354 640/u, "upper no longer has the rejected tunic-length body");
assert.doesNotMatch(Object.values(WAFL_STATIC_GARMENT_ASSETS.B).flatMap((value) => value?.outlinePaths ?? []).join(" "), /M188 255 Q300 278 412 255/u, "lower removes the rejected brief-like pelvis band");

assert.match(selector, /const \[previewSpecKey, setPreviewSpecKey\] = useState<string \| null>\(null\)/u);
assert.match(selector, /onApply\(selectedItems\)/u, "V still applies all staged selections");
assert.match(selector, /previewSpecKey=\{previewSpecKey\}/u);
assert.match(renderer, /definition\.guides\.find/u);
assert.doesNotMatch(renderer, /definition\.guides\.map/u, "overlay cardinality cannot exceed one");
assert.doesNotMatch(renderer, /selectedSpecKeys/u, "diagram no longer consumes the plural selection set");
assert.match(renderer, /guide \? \(\(\) =>/u, "null preview renders the static garment with zero labels and measurement geometry");
assert.match(staticLayer, /stroke=\{WAFL_THEME\.color\.navyInk\}/u, "construction detail uses a quiet deep-navy-family token");
assert.doesNotMatch(staticLayer, /WAFL_THEME\.color\.border/u, "beige border is not reused as technical detail ink");

for (const token of ["focused preview", "one ephemeral", "uniform scale", "physical visual acceptance"]) {
  assert.ok(`${design}\n${ia}`.toLocaleLowerCase("en-US").includes(token.toLocaleLowerCase("en-US")), `canonical focused-preview guidance missing ${token}`);
}

assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length, fs.existsSync("db/v2/migrations/020_v2_sample_reorder_invariant.sql") ? 20 : fs.existsSync("db/v2/migrations/019_v2_work_order_lineage_sample.sql") ? 19 : 18);
assert.equal(fs.existsSync("db/v2/migrations/019_v2_focused_measurement_preview.sql"), false);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha65-focused-measurement-preview-technical-flat",
  previousPermanentInventoryRetained: 152,
  addedPermanentChecks: 1,
  finalPermanentInventory: 153,
  mappedGuides,
  overlayCardinality: "0..1",
  uniformTransforms: 8,
  migration019: 0,
  physicalVisualResultInferred: false,
}));
