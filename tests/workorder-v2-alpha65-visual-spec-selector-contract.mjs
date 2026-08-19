#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  WORK_ORDER_CATEGORY_MAJORS,
  WORK_ORDER_NEW_CATEGORY_MAJORS,
  workOrderMajorCategoryPickerOptions,
} from "../lib/domain/work-orders/catalog/workOrderCategoryPolicy.ts";
import { WAFL_SYSTEM_SPEC_ITEM_CATALOG } from "../lib/domain/work-orders/catalog/systemSpecItemCatalog.ts";
import { WAFL_SPEC_MEASUREMENT_DIAGRAMS } from "../apps/mobile/features/work-orders/size-color/specMeasurementDiagramDefinitions.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const selector = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const diagram = read("apps/mobile/features/work-orders/size-color/WaflSpecMeasurementDiagram.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

assert.deepEqual(WORK_ORDER_CATEGORY_MAJORS, ["상의", "하의", "아우터", "원피스", "셋업", "기타"], "historical category decoding remains complete");
assert.deepEqual(WORK_ORDER_NEW_CATEGORY_MAJORS, ["상의", "하의", "아우터", "원피스", "기타"], "new authoring retires setup");
assert.deepEqual(workOrderMajorCategoryPickerOptions(""), ["", "상의", "하의", "아우터", "원피스", "기타"]);
assert.ok(workOrderMajorCategoryPickerOptions("셋업").includes("셋업"), "existing setup remains representable until changed");
assert.match(overview, /workOrderMajorCategoryPickerOptions\(props\.draft\.categoryMajor\)/u);

let mappedCount = 0;
for (const categoryCode of ["T", "B", "O", "D"]) {
  const definition = WAFL_SPEC_MEASUREMENT_DIAGRAMS[categoryCode];
  assert.ok(definition, `${categoryCode} visual definition is required`);
  const catalog = WAFL_SYSTEM_SPEC_ITEM_CATALOG[categoryCode];
  assert.equal(definition.guides.length, catalog.length, `${categoryCode} maps every WAFL-provided item`);
  assert.deepEqual(definition.guides.map((item) => item.specKey), catalog.map((item) => item.key));
  for (const [index, guide] of definition.guides.entries()) {
    const catalogItem = catalog[index];
    assert.equal(guide.displayName, catalogItem.displayName);
    assert.equal(guide.code, catalogItem.code);
    assert.ok(guide.measurementPoints.length >= 2, `${guide.specKey} owns a real measurement span`);
    assert.notDeepEqual(guide.measurementPoints[0], guide.measurementPoints.at(-1), `${guide.specKey} endpoints differ`);
    assert.ok(guide.connectorPoints.length === 0 || guide.connectorPoints.length >= 2, `${guide.specKey} connector is absent or explicit`);
    assert.ok(guide.label.y >= 0 && guide.label.y + guide.label.height <= 340, `${guide.specKey} label stays in viewBox`);
    assert.ok(guide.lineStyle === "solid" || guide.lineStyle === "dashed");
  }
  mappedCount += definition.guides.length;
}
assert.equal(WAFL_SPEC_MEASUREMENT_DIAGRAMS.S, undefined, "legacy setup is grid-only");
assert.equal(WAFL_SPEC_MEASUREMENT_DIAGRAMS.X, undefined, "other is grid-only without fabricated garment art");

for (const token of ["react-native-svg", "pointerEvents=\"none\"", "Circle", "Line", "Rect", "SvgText", "previewSpecKey", "brickOrange"]) {
  assert.ok(diagram.includes(token), `diagram renderer missing ${token}`);
}
assert.doesNotMatch(diagram, /Pressable|onPress|Image\s/u, "diagram is feedback-only, never a hit target or screenshot asset");
assert.match(selector, /<WaflSpecMeasurementDiagram/u);
assert.equal((selector.match(/columns=\{4\}/g) ?? []).length, 1, "all source sections share one four-column grid render path");
assert.match(selector, /\(\["system", "company", "current"\] as const\)\.map/u);
assert.match(selector, /WaflReusableCreateEntryAction/u);
assert.match(selector, /onApply\(selectedItems\)/u);
assert.match(selector, /nextSpecItemPreviewKey/u);
assert.match(selector, /onRemove/u);
assert.match(selector, /onRename/u);

for (const token of ["visual spec selector", "four-column", "grid-only", "셋업", "OWNER_PHYSICAL_REVIEW_REQUIRED"]) {
  assert.ok(`${design}\n${ia}`.toLocaleLowerCase("en-US").includes(token.toLocaleLowerCase("en-US")), `canonical guidance missing ${token}`);
}

assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length, 18);
assert.equal(fs.existsSync("db/v2/migrations/019_v2_visual_spec_selector.sql"), false);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha65-visual-spec-selector",
  categories: 4,
  mappedCount,
  interactionOwners: { diagram: 0, grid: 1 },
  setupNewAuthoring: 0,
  migration019: 0,
}));
