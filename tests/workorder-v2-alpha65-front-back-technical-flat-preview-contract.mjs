#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  WAFL_SPEC_MEASUREMENT_DIAGRAMS,
  WAFL_SPEC_MEASUREMENT_SIDE_BY_KEY,
} from "../apps/mobile/features/work-orders/size-color/specMeasurementDiagramDefinitions.ts";
import { WAFL_STATIC_GARMENT_ASSETS } from "../apps/mobile/features/work-orders/size-color/staticGarmentAssetDefinitions.ts";
import { WAFL_SYSTEM_SPEC_ITEM_CATALOG } from "../lib/domain/work-orders/catalog/systemSpecItemCatalog.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const renderer = read("apps/mobile/features/work-orders/size-color/WaflSpecMeasurementDiagram.tsx");
const staticRenderer = read("apps/mobile/features/work-orders/size-color/WaflStaticGarmentAsset.tsx");
const selector = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");
const categories = ["T", "B", "O", "D"];
const sides = ["front", "back"];

let assetViews = 0;
let mappedGuides = 0;
const routedKeys = [];
for (const categoryCode of categories) {
  const pair = WAFL_STATIC_GARMENT_ASSETS[categoryCode];
  assert.equal(pair.categoryCode, categoryCode);
  for (const side of sides) {
    const view = pair[side];
    assert.equal(view.side, side);
    assert.equal(view.categoryCode, categoryCode);
    assert.ok(fs.existsSync(view.assetFile), `${categoryCode} ${side} authored SVG exists`);
    const svg = read(view.assetFile);
    const svgPaths = [...svg.matchAll(/<path d="([^"]+)"/gu)].map((match) => match[1]);
    assert.deepEqual([...view.outlinePaths, ...view.detailPaths], svgPaths, `${categoryCode} ${side} SVG/TS exact parity`);
    const matrix = view.overlayTransform.match(/^matrix\(([-\d.]+) 0 0 ([-\d.]+) ([-\d.]+) ([-\d.]+)\)$/u);
    assert.ok(matrix, `${categoryCode} ${side} uses scale and translation only`);
    assert.equal(Number(matrix[1]), Number(matrix[2]), `${categoryCode} ${side} preserves aspect ratio`);
    assert.ok(view.outlinePaths.length >= 1, `${categoryCode} ${side} has a complete authored outline`);
    assetViews += 1;
  }
  const guides = WAFL_SPEC_MEASUREMENT_DIAGRAMS[categoryCode].guides;
  const catalogKeys = new Set(WAFL_SYSTEM_SPEC_ITEM_CATALOG[categoryCode].map((item) => item.key));
  assert.ok(guides.length > 0 && guides.length <= catalogKeys.size);
  assert.ok(guides.some((guide) => guide.side === "front"), `${categoryCode} has a front-owned preview`);
  assert.ok(guides.some((guide) => guide.side === "back"), `${categoryCode} has a back-owned preview`);
  for (const guide of guides) {
    assert.ok(catalogKeys.has(guide.specKey), `${guide.specKey} remains a canonical category POM`);
    assert.equal(WAFL_SPEC_MEASUREMENT_SIDE_BY_KEY[guide.specKey], guide.side, `${guide.specKey} has one stable side owner`);
    assert.ok(sides.includes(guide.side));
    assert.ok(guide.measurementPoints.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 360 && y >= 0 && y <= 280));
    assert.ok(guide.label.y + guide.label.height <= 280);
    routedKeys.push(guide.specKey);
  }
  mappedGuides += guides.length;
}

assert.equal(assetViews, 8);
assert.equal(mappedGuides, 55);
assert.equal(Object.keys(WAFL_SPEC_MEASUREMENT_SIDE_BY_KEY).length, 55);
assert.deepEqual(new Set(routedKeys).size, 55);
assert.equal(fs.readdirSync("apps/mobile/assets/garments").filter((name) => /^GARMENT-(?:UPPER|LOWER|OUTER|DRESS)-(?:FRONT|BACK)\.svg$/u.test(name)).length, 8);
for (const obsolete of ["GARMENT-UPPER-LONGSLEEVE.svg", "GARMENT-LOWER-TROUSERS.svg", "GARMENT-OUTER-JACKET.svg", "GARMENT-DRESS-LONGSLEEVE.svg"]) {
  assert.equal(fs.existsSync(`apps/mobile/assets/garments/${obsolete}`), false, `${obsolete} single-view owner is retired`);
}

assert.match(staticRenderer, /asset\.front/u);
assert.match(staticRenderer, /asset\.back/u);
assert.match(renderer, /definition\.guides\.find/u, "renderer keeps one preview maximum");
assert.match(renderer, /guide \? \(\(\) =>/u, "garment-only mode gates all measurement geometry and labels");
assert.doesNotMatch(renderer, /definition\.guides\.map/u);
assert.match(selector, /previewSpecKey=\{previewSpecKey\}/u);
assert.match(selector, /onApply\(selectedItems\)/u, "V still applies all staged items independently of preview");
assert.match(selector, /columns=\{4\}/u);

for (const token of ["front/back", "garment-only", "stable side", "singular ephemeral preview", "OWNER_PHYSICAL_REVIEW_REQUIRED"]) {
  assert.ok(`${design}\n${ia}`.toLocaleLowerCase("en-US").includes(token.toLocaleLowerCase("en-US")), `canonical front/back guidance missing ${token}`);
}

assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length, fs.existsSync("db/v2/migrations/021_v2_work_order_image_output_include.sql") ? 21 : fs.existsSync("db/v2/migrations/020_v2_sample_reorder_invariant.sql") ? 20 : fs.existsSync("db/v2/migrations/019_v2_work_order_lineage_sample.sql") ? 19 : 18);
assert.equal(fs.existsSync("db/v2/migrations/019_v2_front_back_technical_flat.sql"), false);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha65-front-back-technical-flat-preview",
  previousPermanentInventoryRetained: 153,
  addedPermanentChecks: 1,
  finalPermanentInventory: 154,
  authoredGarmentViews: assetViews,
  stableSideRoutes: mappedGuides,
  previewCardinality: "0..1",
  physicalVisualResultInferred: false,
  migration019: 0,
}));
