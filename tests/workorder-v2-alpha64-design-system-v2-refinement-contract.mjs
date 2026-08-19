import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const ia = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");
const roadmap = read("docs/project/app-v2/08-roadmap-2.0.md");
const theme = read("apps/mobile/constants/theme.ts");
const metricGrid = read("apps/mobile/features/layout/WaflMetricGrid.tsx");
const metricField = read("apps/mobile/features/layout/WaflMetricField.tsx");
const headerAction = read("apps/mobile/features/layout/WaflSectionHeaderAction.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const sizeColor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const sizeColorRead = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");

for (const source of [design, ia]) assert.match(source, /OWNER_PHYSICAL_REVIEW_REQUIRED/);
assert.match(roadmap, /(?:Status target: `ALPHA64_[A-Z0-9_]+_IPHONE_REQA_REQUIRED`|Status: `ALPHA[0-9]+_FINALIZATION_COMPLETE`)/);
assert.doesNotMatch(roadmap, /Status target: `ALPHA64_[A-Z0-9_]+_COMPLETE`/);

for (const role of [
  "metricGridGap",
  "metricGridMinColumnWidth",
  "metricGridMinimumColumns",
  "metricGridMaximumColumns",
  "metricCellMinHeight",
  "definitionRowInset",
  "frozenTableVisibleRowLimit",
  "frozenTableLabelWidth",
  "frozenTableCellWidth",
]) assert.match(theme, new RegExp(`\\b${role}\\b`), `missing semantic role ${role}`);

assert.match(metricGrid, /metricGridMinimumColumns/);
assert.match(metricGrid, /metricGridMaximumColumns/);
assert.match(metricGrid, /availableWidth >= wideMinimum/);
assert.match(metricGrid, /flexWrap: "wrap"/);
assert.doesNotMatch(metricGrid, /justifyContent: "center"/);

assert.match(overview, /<WaflMetricGrid items=\{overviewMetricItems\} testID="overview-basic-metric-grid"/);
assert.match(overview, /<WaflMetricField editable=\{false\} label="총 수량"/);
assert.match(metricField, /minHeight: WAFL_THEME\.layout\.metricCellMinHeight/);
assert.doesNotMatch(metricField, /valueFrameEditable|borderBottomWidth|borderBottomColor/);
assert.doesNotMatch(overview, /styles\.summaryGrid|summaryGridTablet|flexBasis: "47%"/);
const costGroupStart = overview.indexOf('<View style={styles.costRowGroup}>');
const costGroupEnd = overview.indexOf("</View>", costGroupStart);
const costGroup = overview.slice(costGroupStart, costGroupEnd);
for (const label of ["원단", "부자재", "공정", "1벌 원가"]) assert.match(costGroup, new RegExp(`label="${label}"`));
assert.match(overview, /costRowGroup:[^\n]+paddingHorizontal: WAFL_THEME\.layout\.definitionRowInset/);
assert.doesNotMatch(overview, /costComponents|costResult:/);

assert.doesNotMatch(sizeColor, /function StructureSummaryCard|summaryDisclosure/);
assert.match(sizeColorRead, /testID="size-color-expanded-matrix-card"/);
assert.match(sizeColorRead, /testID="finished-spec-expanded-card"/);
assert.match(sizeColorRead, /label="사이즈"[\s\S]*label="색상"/);
assert.match(sizeColor, /edit\.onBegin\(\); setChooser\("size"\)/);
assert.match(sizeColor, /edit\.onBegin\(\); setChooser\("color"\)/);
assert.match(sizeColor, /onApplySelectionBatch/);
assert.doesNotMatch(sizeColor, /WaflActionTile(?:Group)?/);

assert.match(headerAction, /minHeight: WAFL_THEME\.touch\.minimum/);
assert.match(headerAction, /width: WAFL_THEME\.touch\.minimum/);
assert.match(materials, /function MaterialListShell/);
assert.match(overview, /<WaflMaterialsCategorySwitch/);
assert.match(materials, /state\.status === "empty"[\s\S]*<MaterialListShell/);
const materialCardEnd = materials.indexOf("function MaterialListShell(");
assert.ok(materialCardEnd > materials.indexOf("function MaterialCard("), "section action owner must not be a MaterialCard child");
assert.match(materials.slice(materialCardEnd), /<MaterialListShell[\s\S]*state\.items\.map/);
assert.doesNotMatch(materials, /WaflListAddCap|listWithAddCap|addCapAnchor/);
assert.doesNotMatch(materials, /AddMaterialButton|WaflActionTile(?:Group)?/);
for (const preserved of ["onOrderAction", "onDelete", "MaterialPartnerPickerSheet", "materialOrderPolicy"]) assert.match(materials, new RegExp(preserved));

console.log("workorder-v2-alpha64-design-system-v2-refinement-contract: PASS");
