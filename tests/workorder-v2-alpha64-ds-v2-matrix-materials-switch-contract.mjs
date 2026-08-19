import assert from "node:assert/strict";
import fs from "node:fs";

import {
  needsMatrixFullView,
  needsSpecFullView,
  SIZE_COLOR_MAIN_PREVIEW_LIMIT,
  SIZE_SPEC_MAIN_PREVIEW_LIMIT,
} from "../apps/mobile/features/work-orders/size-color/sizeColorMainPreviewPolicy.ts";
import { resolveWorkOrderSectionIntent } from "../apps/mobile/features/work-orders/overview/workOrderSectionIntent.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const theme = read("apps/mobile/constants/theme.ts");
const metric = read("apps/mobile/features/layout/WaflMetricField.tsx");
const frozen = read("apps/mobile/features/layout/WaflFrozenAxisTable.tsx");
const sizeRead = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const category = read("apps/mobile/features/materials/WaflMaterialsCategorySwitch.tsx");
const sharedCategory = read("apps/mobile/features/layout/WaflSectionCategorySwitch.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

assert.equal(SIZE_COLOR_MAIN_PREVIEW_LIMIT, 5);
assert.equal(SIZE_SPEC_MAIN_PREVIEW_LIMIT, 5);
assert.equal(needsMatrixFullView(99, 5), false, "Size count must not open matrix full view");
assert.equal(needsMatrixFullView(1, 6), true);
assert.equal(needsSpecFullView(99, 5), false, "Size count must not open spec full view");
assert.equal(needsSpecFullView(1, 6), true);

assert.doesNotMatch(metric, /valueFrameEditable|borderBottomWidth|borderBottomColor/, "metric wrapper must not duplicate child underline");
for (const token of ["frozenTableVisibleRowLimit", "frozenTableLabelWidth", "frozenTableCellWidth", "fabric", "accessory"]) assert.match(theme, new RegExp(`\\b${token}\\b`));

assert.match(frozen, /headerRef\.current\?\.scrollTo/);
assert.match(frozen, /leftRef\.current\?\.scrollTo/);
assert.match(frozen, /fullView \? <View/);
assert.match(frozen, /<ScrollView horizontal onScroll=\{syncHorizontal\}/);
assert.match(frozen, /<ScrollView nestedScrollEnabled onScroll=\{syncVertical\}/);
assert.match(frozen, /scrollEnabled=\{false\}/);

assert.match(sizeRead, /<WaflFrozenAxisTable/);
assert.match(sizeRead, /<Ruler[^>]*size=\{WAFL_THEME\.icon\.small\}/);
assert.match(sizeRead, /<Palette[^>]*size=\{WAFL_THEME\.icon\.small\}/);
assert.doesNotMatch(sizeRead, /PencilLine/);
assert.match(sizeRead, /createBoundedPreview\(props\.matrix\.colors, SIZE_COLOR_MAIN_PREVIEW_LIMIT\)/);
assert.doesNotMatch(sizeRead, /createBoundedPreview\(props\.matrix\.sizes/);
assert.match(sizeRead, /createBoundedPreview\(props\.specifications\.pomColumns, SIZE_SPEC_MAIN_PREVIEW_LIMIT\)/);
assert.doesNotMatch(sizeRead, /createBoundedPreview\(props\.specifications\.sizes/);

assert.match(category, /WAFL_THEME\.badge\.fabric/);
assert.match(category, /WAFL_THEME\.badge\.accessory/);
assert.match(sharedCategory, /accessibilityState=\{\{ selected: active \}\}/);
assert.match(category, /accessibilityLabel=\{`\$\{selectedLabel\} 추가`\}/);
assert.match(overview, /renderMaterialSection\(activeMaterialCategory\)/);
assert.match(overview, /<WaflInputSheet[\s\S]*title=\{`\$\{activeMaterialCategory === "fabric" \? "원단" : "부자재"\} 추가`\}[\s\S]*<WorkOrderMaterialEditor/);
assert.match(overview, /showChrome=\{false\}/);
assert.doesNotMatch(overview, /MATERIAL_SECTION_TYPES\.map\(renderMaterialSection\)/);
assert.match(materials, /state\.items\.map/);
assert.doesNotMatch(materials, /materialSectionVisibleLimit|hasBoundedItems|showAll/);

assert.deepEqual(resolveWorkOrderSectionIntent("fabric"), { section: "materials", materialFocus: "fabric" });
assert.deepEqual(resolveWorkOrderSectionIntent("accessory"), { section: "materials", materialFocus: "accessory" });
for (const source of [design, ia]) {
  assert.match(source, /OWNER_PHYSICAL_REVIEW_REQUIRED/);
  assert.match(source, /frozen-axis|Frozen Axis|frozen axis|WaflFrozenAxisTable/i);
  assert.match(source, /category switch|카테고리 스위치|category switch/i);
}

console.log("workorder-v2-alpha64-ds-v2-matrix-materials-switch-contract: PASS");
