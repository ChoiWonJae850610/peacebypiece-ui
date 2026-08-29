import assert from "node:assert/strict";
import fs from "node:fs";

import {
  createBoundedPreview,
  needsMatrixFullView,
  needsSpecFullView,
  SIZE_COLOR_MAIN_PREVIEW_LIMIT,
  SIZE_SPEC_MAIN_PREVIEW_LIMIT,
} from "../apps/mobile/features/work-orders/size-color/sizeColorMainPreviewPolicy.ts";
import { resolveWorkOrderSectionIntent } from "../apps/mobile/features/work-orders/overview/workOrderSectionIntent.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const metric = read("apps/mobile/features/layout/WaflMetricField.tsx");
const headerAction = read("apps/mobile/features/layout/WaflSectionHeaderAction.tsx");
const sizeEditor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const sizeRead = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");
const roadmap = read("docs/project/app-v2/08-roadmap-2.0.md");

assert.deepEqual(resolveWorkOrderSectionIntent("fabric"), { section: "materials", materialFocus: "fabric" });
assert.deepEqual(resolveWorkOrderSectionIntent("accessory"), { section: "materials", materialFocus: "accessory" });
assert.deepEqual(resolveWorkOrderSectionIntent("sizes"), { section: "sizes", materialFocus: null });
assert.deepEqual(createBoundedPreview([1, 2, 3, 4, 5], 4), { items: [1, 2, 3, 4], totalCount: 5, truncated: true });
assert.equal(SIZE_COLOR_MAIN_PREVIEW_LIMIT, 5);
assert.equal(SIZE_SPEC_MAIN_PREVIEW_LIMIT, 5);
assert.equal(needsMatrixFullView(200, 5), false);
assert.equal(needsMatrixFullView(1, 6), true);
assert.equal(needsSpecFullView(200, 5), false);
assert.equal(needsSpecFullView(1, 6), true);

assert.match(metric, /backgroundColor: WAFL_THEME\.color\.fabricBeige/);
assert.doesNotMatch(metric, /valueFrameEditable|borderBottomWidth|borderBottomColor/);
assert.match(overview, /<WaflMetricField editable=\{false\} label="총 수량"/);
assert.equal((overview.match(/<WaflMetricField/g) ?? []).length, 6);

for (const label of ["이미지", "사이즈·색상", "원부자재", "제작", "문서"]) assert.match(overview, new RegExp(`label: "${label}"`));
assert.doesNotMatch(overview, /\{ id: "fabric", label: "원단"|\{ id: "accessory", label: "부자재"/);
assert.match(overview, /testID="work-order-combined-materials"/);
assert.match(overview, /<WaflMaterialsCategorySwitch/);
assert.match(overview, /renderMaterialSection\(activeMaterialCategory\)/);
assert.match(experience, /loadMaterials\(detail\.header\.id, "fabric", "initial"\)/);
assert.match(experience, /loadMaterials\(detail\.header\.id, "accessory", "initial"\)/);

assert.doesNotMatch(sizeEditor, /StructureSummaryCard|summaryDisclosure|work-order-size-visible-summary|work-order-color-visible-summary/);
assert.match(sizeRead, /testID="size-color-expanded-matrix-card"/);
assert.match(sizeRead, /testID="finished-spec-expanded-card"/);
assert.match(sizeRead, /<WaflFrozenAxisTable/);
assert.match(sizeRead, /<MatrixTable edit=\{edit\} matrix=\{matrix\} preview \/>/);
assert.match(sizeRead, /<SpecTable edit=\{edit\?\.canEditStructure \? edit : undefined\} onEditSpecItems=\{edit\?\.canEditStructure \? onEditSpecItems : undefined\} preview specifications=\{currentSpecifications\} \/>/);
assert.doesNotMatch(sizeRead, /<ScrollView horizontal[^>]*contentContainerStyle=\{styles\.fullViewTable\}/);
assert.match(sizeRead, /label="사이즈"[\s\S]*label="색상"/);

assert.match(headerAction, /minHeight: WAFL_THEME\.touch\.minimum/);
assert.match(headerAction, /width: WAFL_THEME\.touch\.minimum/);
assert.match(materials, /embedded\?: boolean/);
assert.match(materials, /state\.items\.map/);
assert.doesNotMatch(materials, /materialSectionVisibleLimit|hasBoundedItems|showAll/);
assert.doesNotMatch(materials, /WaflListAddCap|addCapAnchor|listWithAddCap/);

for (const doc of [design, ia]) assert.match(doc, /OWNER_PHYSICAL_REVIEW_REQUIRED/);
assert.match(ia, /개요 \/ 이미지(?:·첨부)? \/ 사이즈·색상 \/ 원부자재 \/ 제작 \/ 문서/);
assert.match(ia, /presentation-only|presentation-only|presentation/i);
assert.match(roadmap, /(?:Status target: `ALPHA64_[A-Z0-9_]+_IPHONE_REQA_REQUIRED`|Status: `ALPHA[0-9]+_FINALIZATION_COMPLETE`)/);
assert.doesNotMatch(roadmap, /Status target: `ALPHA64_[A-Z0-9_]+_COMPLETE`/);

console.log("workorder-v2-alpha64-design-system-v2-ia-simplification-contract: PASS");
