import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const categoryPolicy = await import(pathToFileURL(path.join(
  root,
  "apps/mobile/domain/workOrderCategoryPolicy.ts",
)).href);

const encodedCategory = categoryPolicy.encodeWorkOrderProductType({
  targetAudience: "공용",
  categoryMajor: "아우터",
});
assert.equal(encodedCategory, "wafl-c1|U|O");
assert.deepEqual(
  categoryPolicy.decodeWorkOrderCategory({
    productTypeCode: encodedCategory,
    itemCode: "바람막이",
    seasonCode: "26FW",
  }),
  {
    targetAudience: "공용",
    categoryMajor: "아우터",
    categoryDetail: "바람막이",
    seasonCode: "26FW",
  },
);
assert.deepEqual(
  categoryPolicy.decodeWorkOrderCategory({
    productTypeCode: "apparel.top",
    itemCode: null,
    seasonCode: null,
  }),
  {
    targetAudience: "",
    categoryMajor: "상의",
    categoryDetail: "",
    seasonCode: "",
  },
);

const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const experience = [
  read("apps/mobile/features/MobileWorkOrderExperience.tsx"),
  read("apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts"),
].join("\n");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const validation = read("apps/mobile/domain/workOrderValidation.ts");
const mobileContract = read("apps/mobile/domain/mobileContract.ts");
const commandValidation = read("lib/domain/work-orders/command/validation.ts");

const tabsIndex = overview.indexOf("<View style={styles.tabRailFrame}>");
const overviewSummaryIndex = overview.indexOf("<WaflMetricGrid items={overviewMetricItems}");
assert.ok(tabsIndex >= 0 && overviewSummaryIndex > tabsIndex, "tabs must render above overview totals");
assert.equal((overview.match(/<WaflMetricGrid items=\{overviewMetricItems\}/g) ?? []).length, 1);
assert.match(overview, /label="총 수량"[\s\S]*label="납기"/);
assert.match(overview, /activeSection === "overview"[\s\S]*1벌 원가[\s\S]*예상 총원가/);
assert.doesNotMatch(overview, /mediaCount|formatProductType|productTypeAlias/);
assert.match(overview, /\{ id: "materials", label: "원부자재"/);
assert.match(overview, /\{ id: "output", label: "문서"/);

for (const field of ["targetAudience", "categoryMajor", "categoryDetail", "seasonCode"]) {
  assert.match(overview, new RegExp(`activeBasicField === "${field}"`));
  assert.match(experience, new RegExp(`effectiveDraft\\.${field}`));
}
assert.match(overview, /label="대상"/);
assert.match(overview, /label="대분류"/);
assert.match(overview, /label="세부 품목"/);
assert.match(overview, /label="시즌"/);
assert.match(experience, /encodeWorkOrderProductType\(effectiveDraft\)/);
assert.match(experience, /patch\.productTypeCode = productTypeCode/);
assert.match(experience, /patch\.itemCode = categoryDetail/);
assert.match(experience, /patch\.seasonCode = seasonCode/);
assert.match(mobileContract, /readonly productTypeCode\?: string \| null/);
assert.match(mobileContract, /readonly seasonCode\?: string \| null/);
assert.match(mobileContract, /readonly itemCode\?: string \| null/);
assert.match(commandValidation, /parseOptionalText\(body\.patch\.productTypeCode, "patch\.productTypeCode", 120, true\)/);
assert.match(commandValidation, /parseOptionalText\(body\.patch\.seasonCode, "patch\.seasonCode", 16, true\)/);
assert.match(commandValidation, /parseOptionalText\(body\.patch\.itemCode, "patch\.itemCode", 24, true\)/);

assert.doesNotMatch(materials, /archivedState|archivedTotalCount|onRestore|onLoadMoreArchived|restoreButton|archivedSection/);
assert.doesNotMatch(overview, /archivedMaterials|archivedMaterialCount|onRestoreMaterial|onLoadMoreArchivedMaterials/);
assert.doesNotMatch(experience, /requestRestoreMaterial|loadMoreArchivedMaterials/);
assert.match(experience, /requestDeleteMaterial[\s\S]*초안에서 삭제합니다[\s\S]*발주 이력이 없는 항목만 삭제할 수 있습니다/);
assert.match(validation, /unitCode: materialType === "accessory" \? "개" : "yd"/);
assert.match(experience, /const base = materialCreateDraft\(materialType\)/);
assert.equal((experience.match(/materialCreateDraft\(materialType\)/g) ?? []).length, 1);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha57-v10",
  tabPlacement: "above-overview-summary",
  commonHeader: ["representative-image", "status", "work-order-name"],
  categoryPersistence: ["productTypeCode", "itemCode", "seasonCode"],
  archivedRecoveryUi: 0,
  defaultUnits: { fabric: "yd", accessory: "개" },
  migration: 0,
}));
