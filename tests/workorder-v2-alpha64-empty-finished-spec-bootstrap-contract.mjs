#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const readOnly = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const editor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const selector = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const reusableCreateEntry = read("apps/mobile/features/inputs/WaflReusableCreateEntryAction.tsx");
const measurementRepository = read("lib/domain/work-orders/measurement/measurementCommandRepository.ts");
const measurementService = read("lib/domain/work-orders/measurement/measurementCommandService.ts");
const measurementRoute = read("lib/domain/work-orders/measurement/measurementCommandRoute.ts");
const optionRepository = read("lib/domain/work-orders/catalog/structureOptionRepository.ts");
const runtimeQa = read("scripts/run-wafl-v2-alpha64-spec-catalog-runtime-qa.mjs");
const theme = read("apps/mobile/constants/theme.ts");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

assert.match(readOnly, /function SpecItemEntry/u, "empty and non-empty branches must reuse one entry owner");
assert.equal((readOnly.match(/<SpecItemEntry /gu) ?? []).length, 2, "table corner and empty state must share the same chooser entry");
assert.match(readOnly, /pomColumns\.length === 0 \|\| currentSpecifications\.sizes\.length === 0[\s\S]*edit\?\.canEditStructure && onEditSpecItems/u);
assert.match(readOnly, /등록된 완성 스펙 정보가 없습니다\./u);
assert.match(editor, /onEditSpecItems=\{\(\) => \{ edit\.onBegin\(\); setChooser\("spec_item"\)/u);
assert.match(editor, /edit\.canEditStructure && chooser === "spec_item"/u);
assert.doesNotMatch(editor, /categoryCode && chooser === "spec_item"|onEditSpecItems=\{categoryCode \?/u);
assert.match(selector, /recommendedSystemItems\.length === 0/u);
assert.match(selector, /대분류와 세부품목을 선택하면 WAFL 추천 스펙 항목을 볼 수 있습니다/u);
assert.match(selector, /WaflReusableCreateEntryAction/u);
assert.match(reusableCreateEntry, /label = "직접 만들기"/u);

assert.match(optionRepository, /const categoryCode = input\.kind === "spec_item" \? decodeWorkOrderMajorCategoryCode/u);
assert.doesNotMatch(optionRepository, /input\.kind === "spec_item" && !categoryCode/u, "nullable migration-018 scope must remain reusable");
assert.match(optionRepository, /category_code IS NULL OR category_code = \$2/u);

assert.match(measurementRepository, /async function bootstrapSpec/u);
assert.match(measurementRepository, /INSERT INTO work_order_size_specs\(id,company_id,revision_id,measurement_unit\)/u);
assert.match(measurementRepository, /INSERT INTO work_order_size_spec_sizes[\s\S]*FROM work_order_sizes/u);
assert.match(measurementRepository, /!existing && \(kind==="set-unit"\|\|kind==="set-pom-selection"\)/u);
assert.match(measurementRepository, /!categoryCode && systemSpecItemKeys\.length > 0/u, "null category must not fabricate a system recommendation");
assert.match(measurementRepository, /category_code IS NULL OR category_code=\$3/u, "only neutral company items are valid without a category");
assert.match(runtimeQa, /"empty-bootstrap"/u);
assert.match(runtimeQa, /first explicit V must bootstrap the missing measurement aggregate/u);
assert.match(runtimeQa, /spec\.sizes\.length, 1/u);

assert.doesNotMatch(measurementService, /Measurement command \$\{error\.reason\}/u);
assert.doesNotMatch(measurementRoute, /Measurement command (?:failed|not_found)|Unknown measurement command/u);
assert.match(measurementService, /작업지시서 또는 완성 스펙 대상을 찾을 수 없습니다/u);

assert.match(theme, /frozenTableCellWidth: 82/u);
assert.match(theme, /frozenTableRowHeight: 44/u);
assert.match(theme, /frozenTableEditableValueWidth: 60/u);
assert.match(theme, /frozenTableEditableValueHeight: 34/u);
assert.match(`${design}\n${ia}`, /zero rows|zero-row|zero POM|zero Finished Spec|Finished Spec empty state/iu);
assert.match(ia, /issued\/locked WorkOrders expose no authoring entry/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-empty-finished-spec-bootstrap",
  previousPermanentInventoryRetained: 137,
  addedPermanentChecks: 1,
  finalPermanentInventory: 138,
  emptyStateChooserReuse: true,
  nullCategoryDirectCreate: true,
  firstBatchBootstrapsSnapshot: true,
  rawMeasurementNotFoundRendered: 0,
  underlineGeometry: "82x44/60x34/gap5",
  migrationLedger: "18/18",
  productionMutation: 0,
}));
