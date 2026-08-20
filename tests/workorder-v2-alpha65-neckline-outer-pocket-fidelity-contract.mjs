#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

import { WAFL_STATIC_GARMENT_ASSETS } from "../apps/mobile/features/work-orders/size-color/staticGarmentAssetDefinitions.ts";
import { WAFL_SPEC_MEASUREMENT_DIAGRAMS } from "../apps/mobile/features/work-orders/size-color/specMeasurementDiagramDefinitions.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const lowerHashes = {
  front: "9a30e521e6481d5b39947b78cba9eb6579c346d3f602e4dd2276c23072a8f92c",
  back: "2a94e8e7bbbe261ab94743725a79a8d5e35fdb0e7615e6ecd4633093bb9c821f",
};

for (const categoryCode of ["T", "B", "O", "D"]) {
  for (const side of ["front", "back"]) {
    const view = WAFL_STATIC_GARMENT_ASSETS[categoryCode][side];
    const svgPaths = [...read(view.assetFile).matchAll(/<path d="([^"]+)"/gu)].map((match) => match[1]);
    assert.deepEqual([...view.outlinePaths, ...view.detailPaths], svgPaths, `${categoryCode} ${side} SVG/TS path parity`);
  }
}

for (const categoryCode of ["T", "D"]) {
  const front = WAFL_STATIC_GARMENT_ASSETS[categoryCode].front.outlinePaths[0];
  const back = WAFL_STATIC_GARMENT_ASSETS[categoryCode].back.outlinePaths[0];
  assert.match(front, /^M270 150 C274 174 284 190 300 190 C316 190 326 174 330 150 /u, `${categoryCode} front owns the clean symmetric round neck`);
  assert.match(back, /^M270 150 C278 164 288 172 300 172 C312 172 322 164 330 150 /u, `${categoryCode} back owns the clean symmetric round neck`);
  assert.doesNotMatch(`${front} ${back}`, /M280 146|L300 181|Q300 168/u, `${categoryCode} rejects the prior pinched/angular neckline`);
}

const outerFront = WAFL_STATIC_GARMENT_ASSETS.O.front;
const outerBack = WAFL_STATIC_GARMENT_ASSETS.O.back;
assert.equal(outerFront.outlinePaths.length, 1, "outer front removes the forced angular collar outline");
assert.match(outerFront.outlinePaths[0], /^M270 150 C278 170 288 182 300 182 C312 182 322 170 330 150 /u, "outer front owns a calm rounded neck opening");
assert.match(outerBack.outlinePaths[0], /^M270 150 C280 164 290 172 300 172 C310 172 320 164 330 150 /u, "outer back owns a calm rounded neck opening");
assert.ok(outerFront.detailPaths.includes("M250 178 C264 202 282 216 300 218 C318 216 336 202 350 178"), "outer front collar construction is one quiet symmetric curve");
assert.ok(outerBack.detailPaths.includes("M240 180 C258 198 278 207 300 207 C322 207 342 198 360 180"), "outer back neck construction is one quiet symmetric curve");
const pockets = outerFront.detailPaths.filter((path) => path === "M247 408 L277 408 L277 448 L247 448 Z" || path === "M353 408 L323 408 L323 448 L353 448 Z");
assert.equal(pockets.length, 2, "outer front has exactly two straight axis-aligned pockets");
assert.doesNotMatch(outerFront.detailPaths.join(" "), /L270 395|L330 395|L283 447|L317 447/u, "tilted pocket geometry is absent");

for (const [side, expected] of Object.entries(lowerHashes)) assert.equal(sha256(WAFL_STATIC_GARMENT_ASSETS.B[side].assetFile), expected, `lower ${side} remains byte-stable`);
assert.equal(Object.values(WAFL_SPEC_MEASUREMENT_DIAGRAMS).reduce((sum, definition) => sum + definition.guides.length, 0), 55);
assert.equal(fs.readdirSync("apps/mobile/assets/garments").filter((name) => /^GARMENT-(?:UPPER|LOWER|OUTER|DRESS)-(?:FRONT|BACK)\.svg$/u.test(name)).length, 8);
assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length, fs.existsSync("db/v2/migrations/020_v2_sample_reorder_invariant.sql") ? 20 : fs.existsSync("db/v2/migrations/019_v2_work_order_lineage_sample.sql") ? 19 : 18);
assert.equal(fs.existsSync("db/v2/migrations/019_v2_neckline_outer_pocket_fidelity.sql"), false);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha65-neckline-outer-pocket-fidelity",
  previousPermanentInventoryRetained: 155,
  addedPermanentChecks: 1,
  finalPermanentInventory: 156,
  roundNeckViews: 4,
  calmOuterNeckViews: 2,
  straightOuterPockets: 2,
  lowerAssetByteStable: true,
  stableSideRoutes: 55,
  physicalVisualResultInferred: false,
  migration019: 0,
}));
