#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { WAFL_SPEC_MEASUREMENT_DIAGRAMS } from "../apps/mobile/features/work-orders/size-color/specMeasurementDiagramDefinitions.ts";
import { WAFL_STATIC_GARMENT_ASSETS } from "../apps/mobile/features/work-orders/size-color/staticGarmentAssetDefinitions.ts";

const renderer = fs.readFileSync("apps/mobile/features/work-orders/size-color/WaflSpecMeasurementDiagram.tsx", "utf8");
const staticLayer = fs.readFileSync("apps/mobile/features/work-orders/size-color/WaflStaticGarmentAsset.tsx", "utf8");
const staticDefinitions = fs.readFileSync("apps/mobile/features/work-orders/size-color/staticGarmentAssetDefinitions.ts", "utf8");
const measurementDefinitions = fs.readFileSync("apps/mobile/features/work-orders/size-color/specMeasurementDiagramDefinitions.ts", "utf8");
const design = fs.readFileSync("docs/project/app-v2/11a-mobile-design-system-v2.md", "utf8");
const ia = fs.readFileSync("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md", "utf8");

const expectedFiles = {
  T: { front: "apps/mobile/assets/garments/GARMENT-UPPER-FRONT.svg", back: "apps/mobile/assets/garments/GARMENT-UPPER-BACK.svg" },
  B: { front: "apps/mobile/assets/garments/GARMENT-LOWER-FRONT.svg", back: "apps/mobile/assets/garments/GARMENT-LOWER-BACK.svg" },
  O: { front: "apps/mobile/assets/garments/GARMENT-OUTER-FRONT.svg", back: "apps/mobile/assets/garments/GARMENT-OUTER-BACK.svg" },
  D: { front: "apps/mobile/assets/garments/GARMENT-DRESS-FRONT.svg", back: "apps/mobile/assets/garments/GARMENT-DRESS-BACK.svg" },
};

let fixedPaths = 0;
let mappedGuides = 0;
for (const categoryCode of ["T", "B", "O", "D"]) {
  const asset = WAFL_STATIC_GARMENT_ASSETS[categoryCode];
  for (const side of ["front", "back"]) {
    const view = asset[side];
    const svgFile = expectedFiles[categoryCode][side];
    assert.equal(view.assetFile, svgFile);
    assert.equal(view.side, side);
    assert.equal(view.sourceViewBox, "0 0 600 800");
    assert.ok(fs.existsSync(svgFile), `${categoryCode} ${side} SVG is retained as a fixed source asset`);
    const svg = fs.readFileSync(svgFile, "utf8");
    const svgPaths = [...svg.matchAll(/<path d="([^"]+)"/gu)].map((match) => match[1]);
    const runtimePaths = [...view.outlinePaths, ...view.detailPaths];
    assert.deepEqual(runtimePaths, svgPaths, `${categoryCode} ${side} runtime layer preserves the authored path geometry exactly`);
    assert.doesNotMatch(svg, /#9b4a27|selected|active/iu, `${categoryCode} ${side} asset has no selection state`);
    const matrix = view.overlayTransform.match(/^matrix\(([-\d.]+) 0 0 ([-\d.]+) [-\d.]+ [-\d.]+\)$/u);
    assert.ok(matrix, `${categoryCode} ${side} placement is a scale/translate matrix`);
    assert.equal(Number(matrix[1]), Number(matrix[2]), `${categoryCode} ${side} placement preserves garment proportions`);
    fixedPaths += runtimePaths.length;
  }
  mappedGuides += WAFL_SPEC_MEASUREMENT_DIAGRAMS[categoryCode].guides.length;
}

assert.equal(mappedGuides, 55, "stable mapped overlay inventory is preserved");
assert.match(renderer, /<WaflStaticGarmentAsset categoryCode=\{definition\.categoryCode\}/u);
assert.match(renderer, /definition\.guides\.find/u, "one focused dynamic annotation remains a separate layer");
assert.doesNotMatch(renderer, /silhouettePaths|detailPaths/u, "shared overlay renderer no longer invents garment geometry");
assert.doesNotMatch(measurementDefinitions, /silhouettePaths|detailPaths/u, "annotation owner contains no garment geometry");
assert.doesNotMatch(staticLayer, /selected|active|selectedSpecKeys|onPress|Pressable/u, "static layer is selection-free and noninteractive");
assert.doesNotMatch(staticDefinitions, /buildGarmentPath|procedur|midpoint|fallback/iu, "no procedural silhouette generator exists");

for (const token of ["STATIC FRONT/BACK GARMENT PAIR", "DYNAMIC MEASUREMENT OVERLAY", "garment geometry", "grid remains the only selection"] ) {
  assert.ok(`${design}\n${ia}`.toLocaleLowerCase("en-US").includes(token.toLocaleLowerCase("en-US")), `canonical guidance missing ${token}`);
}

assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length, fs.existsSync("db/v2/migrations/020_v2_sample_reorder_invariant.sql") ? 20 : fs.existsSync("db/v2/migrations/019_v2_work_order_lineage_sample.sql") ? 19 : 18);
assert.equal(fs.existsSync("db/v2/migrations/019_v2_static_garment_asset_overlay.sql"), false);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha65-static-garment-asset-overlay",
  fixedGarmentAssets: 8,
  fixedAssetPaths: fixedPaths,
  mappedOverlayGuides: mappedGuides,
  proceduralSilhouetteOwners: 0,
  diagramInteractionOwners: 0,
  migration019: 0,
}));
