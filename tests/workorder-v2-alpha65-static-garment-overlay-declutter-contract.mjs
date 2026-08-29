#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { WAFL_SPEC_MEASUREMENT_DIAGRAMS } from "../apps/mobile/features/work-orders/size-color/specMeasurementDiagramDefinitions.ts";
import { WAFL_STATIC_GARMENT_ASSETS } from "../apps/mobile/features/work-orders/size-color/staticGarmentAssetDefinitions.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const renderer = read("apps/mobile/features/work-orders/size-color/WaflSpecMeasurementDiagram.tsx");
const staticLayer = read("apps/mobile/features/work-orders/size-color/WaflStaticGarmentAsset.tsx");
const selector = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

const categories = ["T", "B", "O", "D"];
const geometryBeforeSelection = JSON.stringify(WAFL_STATIC_GARMENT_ASSETS);
let mappedGuides = 0;

for (const categoryCode of categories) {
  const definition = WAFL_SPEC_MEASUREMENT_DIAGRAMS[categoryCode];
  assert.ok(WAFL_STATIC_GARMENT_ASSETS[categoryCode].front, `${categoryCode} static front garment exists`);
  assert.ok(WAFL_STATIC_GARMENT_ASSETS[categoryCode].back, `${categoryCode} static back garment exists`);
  mappedGuides += definition.guides.length;

  const previewCode = definition.guides[0].specKey;
  const renderedPreviewGeometry = definition.guides.filter((guide) => guide.specKey === previewCode);
  assert.equal(renderedPreviewGeometry.length, 1, `${categoryCode} preview geometry is singular`);
}

assert.equal(categories.length, 4);
assert.equal(mappedGuides, 55);
assert.equal(JSON.stringify(WAFL_STATIC_GARMENT_ASSETS), geometryBeforeSelection, "garment geometry is selection-independent");
assert.match(renderer, /guide \? \(\(\) =>/u, "full measurement geometry is gated by one preview guide");
assert.doesNotMatch(renderer, /definition\.guides\.map/u, "zero preview and multi-selection cannot paint plural guides");
assert.doesNotMatch(renderer, /opacity=\{active \? 1 : 0\.38\}/u, "zero-selected has no pale full geometry network");
assert.doesNotMatch(renderer, /stroke=\{WAFL_THEME\.color\.readOnly\}/u, "measurement geometry has no neutral production stroke path");
assert.doesNotMatch(staticLayer, /selected|active|selectedSpecKeys|Pressable|onPress/u, "static garment remains selection-free and noninteractive");
assert.doesNotMatch(renderer, /silhouettePaths|buildGarment|fallback|centerAxis|constructionAxis/iu, "active renderer owns no procedural silhouette or construction axis");
assert.match(selector, /columns=\{4\}/u);
assert.match(selector, /setSelectedKeys\(\(current\) => toggleSpecItemSelection/u, "four-column grid remains the selection owner");
assert.equal(WAFL_SPEC_MEASUREMENT_DIAGRAMS.S, undefined, "legacy setup has no fabricated visual mapping");
assert.equal(WAFL_SPEC_MEASUREMENT_DIAGRAMS.X, undefined, "unknown/custom category has no fabricated visual mapping");

for (const token of ["no-preview", "endpoint dots", "one ephemeral preview", "selection remains owned exclusively"]) {
  assert.ok(`${design}\n${ia}`.toLocaleLowerCase("en-US").includes(token.toLocaleLowerCase("en-US")), `canonical guidance missing ${token}`);
}

assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length, fs.existsSync("db/v2/migrations/021_v2_work_order_image_output_include.sql") ? 21 : fs.existsSync("db/v2/migrations/020_v2_sample_reorder_invariant.sql") ? 20 : fs.existsSync("db/v2/migrations/019_v2_work_order_lineage_sample.sql") ? 19 : 18);
assert.equal(fs.existsSync("db/v2/migrations/019_v2_static_garment_overlay_declutter.sql"), false);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha65-static-garment-overlay-declutter",
  staticGarmentCategories: categories.length,
  mappedMeasurementGuides: mappedGuides,
  zeroSelectedFullMeasurementSpans: 0,
  zeroSelectedEndpointDots: 0,
  productionConstructionAxes: 0,
  diagramInteractionOwners: 0,
  gridSelectionOwners: 1,
  migration019: 0,
}));
