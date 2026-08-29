#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

import { WAFL_STATIC_GARMENT_ASSETS } from "../apps/mobile/features/work-orders/size-color/staticGarmentAssetDefinitions.ts";
import { WAFL_SPEC_MEASUREMENT_DIAGRAMS } from "../apps/mobile/features/work-orders/size-color/specMeasurementDiagramDefinitions.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const categories = ["T", "O", "D"];
const lowerHashes = {
  front: "9a30e521e6481d5b39947b78cba9eb6579c346d3f602e4dd2276c23072a8f92c",
  back: "2a94e8e7bbbe261ab94743725a79a8d5e35fdb0e7615e6ecd4633093bb9c821f",
};

for (const [side, expected] of Object.entries(lowerHashes)) {
  assert.equal(sha256(WAFL_STATIC_GARMENT_ASSETS.B[side].assetFile), expected, `lower ${side} stays byte-stable`);
}

for (const categoryCode of categories) {
  for (const side of ["front", "back"]) {
    const view = WAFL_STATIC_GARMENT_ASSETS[categoryCode][side];
    const svg = read(view.assetFile);
    const paths = [...svg.matchAll(/<path d="([^"]+)"/gu)].map((match) => match[1]);
    assert.deepEqual([...view.outlinePaths, ...view.detailPaths], paths, `${categoryCode} ${side} SVG/TS mirror parity`);
    assert.equal(view.outlinePaths.length, 1, `${categoryCode} ${side} keeps one continuous garment silhouette`);
    assert.equal(view.detailPaths.filter((path) => /C(?:194|200) (?:192|195|210)/u.test(path) || /C(?:400|406) (?:192|195|210)/u.test(path)).length, 2, `${categoryCode} ${side} owns exactly two quiet armhole seams`);
    assert.ok(view.outlinePaths[0].endsWith(" Z"), `${categoryCode} ${side} continuous silhouette closes once`);
    assert.doesNotMatch(view.outlinePaths.join(" "), /Z.*(?:M218 170 L170|M220 170 L170|M210 178 L160)/u, `${categoryCode} ${side} has no detached sleeve outline after the body`);
  }
  const guideCodes = new Set(WAFL_SPEC_MEASUREMENT_DIAGRAMS[categoryCode].guides.map((guide) => guide.code));
  for (const code of ["shoulder_width", "armhole_depth", "sleeve_length", "upper_arm_width"]) assert.ok(guideCodes.has(code), `${categoryCode}:${code} focused preview remains routed`);
}

assert.equal(Object.keys(WAFL_SPEC_MEASUREMENT_DIAGRAMS).length, 4);
assert.equal(Object.values(WAFL_SPEC_MEASUREMENT_DIAGRAMS).reduce((sum, definition) => sum + definition.guides.length, 0), 55);
assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length, fs.existsSync("db/v2/migrations/021_v2_work_order_image_output_include.sql") ? 21 : fs.existsSync("db/v2/migrations/020_v2_sample_reorder_invariant.sql") ? 20 : fs.existsSync("db/v2/migrations/019_v2_work_order_lineage_sample.sql") ? 19 : 18);
assert.equal(fs.existsSync("db/v2/migrations/019_v2_shoulder_armhole_fidelity.sql"), false);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha65-front-back-shoulder-armhole-fidelity",
  previousPermanentInventoryRetained: 154,
  addedPermanentChecks: 1,
  finalPermanentInventory: 155,
  correctedCategoryViews: 6,
  lowerAssetByteStable: true,
  stableSideRoutes: 55,
  physicalVisualResultInferred: false,
  migration019: 0,
}));
