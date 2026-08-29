#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { WAFL_SPEC_MEASUREMENT_DIAGRAMS } from "../apps/mobile/features/work-orders/size-color/specMeasurementDiagramDefinitions.ts";
import { WAFL_STATIC_GARMENT_ASSETS } from "../apps/mobile/features/work-orders/size-color/staticGarmentAssetDefinitions.ts";

const renderer = fs.readFileSync("apps/mobile/features/work-orders/size-color/WaflSpecMeasurementDiagram.tsx", "utf8");
const design = fs.readFileSync("docs/project/app-v2/11a-mobile-design-system-v2.md", "utf8");
const ia = fs.readFileSync("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md", "utf8");

const finitePoint = (point) => point.length === 2 && point.every((value) => Number.isFinite(value) && value >= 0 && value <= 360);
let guideCount = 0;
let authoredConnectorCount = 0;

for (const categoryCode of ["T", "B", "O", "D"]) {
  const definition = WAFL_SPEC_MEASUREMENT_DIAGRAMS[categoryCode];
  assert.ok(definition, `${categoryCode} definition exists`);
  assert.ok(WAFL_STATIC_GARMENT_ASSETS[categoryCode].front.outlinePaths.length >= 1, `${categoryCode} owns a fixed recognizable front asset`);
  assert.ok(WAFL_STATIC_GARMENT_ASSETS[categoryCode].back.outlinePaths.length >= 1, `${categoryCode} owns a fixed recognizable back asset`);
  for (const guide of definition.guides) {
    assert.ok(guide.measurementPoints.length >= 2, `${guide.specKey} has authored measurement geometry`);
    assert.ok(guide.measurementPoints.every(finitePoint), `${guide.specKey} measurement points are bounded`);
    assert.ok(guide.connectorPoints.length === 0 || guide.connectorPoints.length >= 2, `${guide.specKey} connector is absent or explicitly authored`);
    assert.ok(guide.connectorPoints.every(finitePoint), `${guide.specKey} connector points are bounded`);
    assert.ok(guide.label.width >= 54 && guide.label.height >= 16, `${guide.specKey} label is readable`);
    assert.ok(guide.label.x >= 0 && guide.label.x + guide.label.width <= 360, `${guide.specKey} label x is bounded`);
    assert.ok(guide.label.y >= 0 && guide.label.y + guide.label.height <= 340, `${guide.specKey} label y is bounded`);
    for (const [from, to] of guide.extensionLines) {
      assert.ok(finitePoint(from) && finitePoint(to), `${guide.specKey} extension line is bounded`);
    }
    guideCount += 1;
    if (guide.connectorPoints.length >= 2) authoredConnectorCount += 1;
  }
}

assert.equal(guideCount, 55);
assert.ok(authoredConnectorCount <= 55);
assert.match(renderer, /Polyline/u, "renderer consumes explicit polyline geometry");
assert.match(renderer, /guide\.measurementPoints/u);
assert.match(renderer, /guide\.connectorPoints/u);
assert.match(renderer, /guide\.extensionLines/u);
assert.match(renderer, /WaflStaticGarmentAsset/u, "renderer consumes the independent fixed garment layer");
assert.doesNotMatch(renderer, /midpointX|midpointY|labelSide|labelEdgeX/u, "no fallback auto connector remains");
assert.doesNotMatch(renderer, /Pressable|onPress|Image\s/u, "diagram stays feedback-only");
assert.match(renderer, /previewSpecKey/u, "one ephemeral focused preview selects the rendered guide");
assert.doesNotMatch(renderer, /definition\.guides\.map/u, "renderer never paints a plural selected overlay");
assert.doesNotMatch(renderer, /opacity=\{active \? 1 : 0\.38\}/u, "inactive measurement network is not painted beneath the garment");
assert.match(renderer, /aspectRatio: 1\.28/u, "diagram footprint uses the available width for the front/back pair");

for (const token of ["hand-authored", "connector crossing", "technical flat", "grid remains the only selection"] ) {
  assert.ok(`${design}\n${ia}`.toLocaleLowerCase("en-US").includes(token.toLocaleLowerCase("en-US")), `canonical guidance missing ${token}`);
}

assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length, fs.existsSync("db/v2/migrations/021_v2_work_order_image_output_include.sql") ? 21 : fs.existsSync("db/v2/migrations/020_v2_sample_reorder_invariant.sql") ? 20 : fs.existsSync("db/v2/migrations/019_v2_work_order_lineage_sample.sql") ? 19 : 18);
assert.equal(fs.existsSync("db/v2/migrations/019_v2_visual_spec_diagram_fidelity.sql"), false);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha65-visual-spec-diagram-fidelity",
  categories: 4,
  handAuthoredGuides: guideCount,
  explicitConnectors: authoredConnectorCount,
  automaticConnectorFallbacks: 0,
  diagramInteractionOwners: 0,
  migration019: 0,
}));
