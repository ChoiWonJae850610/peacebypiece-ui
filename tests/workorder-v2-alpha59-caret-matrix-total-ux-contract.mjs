#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { planColorSizeQuantityProjection } from "../lib/domain/work-orders/command/quantityProjectionPolicy.ts";
import { reconcileQuantityCell } from "../apps/mobile/features/work-orders/size-color/sizeColorReconciliation.ts";
import {
  createEmptyCurrentRunAccountingEvidence,
  normalizeCanonicalIntegerEvidence,
} from "../scripts/lib/alpha59-runtime-accounting.mjs";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const controlled = read("apps/mobile/components/ControlledInlineEditValue.tsx");
const compactInline = read("apps/mobile/components/InlineEditableFields.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const sizeColor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const controller = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
const repository = read("lib/domain/work-orders/command/sizeColorStructureCommandRepository.ts");
const commandRoute = read("lib/domain/work-orders/command/sizeColorStructureCommandRoute.ts");
const basicRoute = read("lib/domain/work-orders/command/commandRoute.ts");
const validation = read("lib/domain/work-orders/command/validation.ts");
const detailRepository = read("lib/domain/work-orders/read/detailRepository.ts");
const listRepository = read("lib/domain/work-orders/read/listRepository.ts");
const issueRepository = read("lib/domain/work-orders/command/issueRepository.ts");
const apiClient = read("apps/mobile/lib/apiClient.ts");
const runtimeQa = read("scripts/run-wafl-v2-alpha59-size-color-structure-runtime-qa.mjs");

const inlineSources = [controlled, compactInline, overview, experience, materials].join("\n");
assert.doesNotMatch(inlineSources, /selectTextOnFocus|selection\s*=|setNativeProps\s*\(/);
assert.match(controlled, /inputRef\.current\?\.focus\(\)/);
assert.match(controlled, /onChangeText=/);
assert.match(controlled, /onSubmitEditing=.*handleSubmitEditing/);
assert.match(controlled, /onEndEditing=\{handleEndEditing\}/);
assert.match(controlled, /finalizationRef\.current\.requestSave\(\)/);

assert.match(sizeColor, /<Text style=\{styles\.sectionTitle\}>색상·사이즈<\/Text>/);
assert.match(sizeColor, /<Text style=\{styles\.sectionTitle\}>완성 스펙<\/Text>/);
assert.doesNotMatch(sizeColor, /합계 일치|색상×사이즈 생산수량 · 총/);
assert.match(sizeColor, /!matrix\.projectionsMatch/);
assert.match(sizeColor, /저장된 총수량과 색상×사이즈 합계가 다릅니다/);

assert.match(overview, /label="총 수량"[\s\S]{0,120}header\.totalQuantity\.toLocaleString/);
assert.doesNotMatch(overview, /field="totalQuantity"|onBeginEdit\("totalQuantity"\)|overview-inline-total-quantity/);
assert.doesNotMatch(experience, /patch\.totalQuantity\s*=/);
assert.match(validation, /if \(options\.matrixTotalOwned\) allowedPatchKeys\.delete\("totalQuantity"\)/);
assert.match(basicRoute, /matrixTotalOwned: isAlpha59SizeColorStructureMutationRuntime\(\)/);

assert.deepEqual(planColorSizeQuantityProjection({
  currentQuantity: 0, requestedQuantity: 3, currentMatrixTotal: 0, workOrderTotal: 0, revisionTotal: 0,
}), {
  semantic: "changed", canonicalTotalQuantity: 3, quantityChanged: true, projectionChanged: true,
});
assert.deepEqual(planColorSizeQuantityProjection({
  currentQuantity: 6, requestedQuantity: 6, currentMatrixTotal: 16, workOrderTotal: 16, revisionTotal: 16,
}), {
  semantic: "no-op", canonicalTotalQuantity: 16, quantityChanged: false, projectionChanged: false,
});
assert.deepEqual(planColorSizeQuantityProjection({
  currentQuantity: 6, requestedQuantity: 6, currentMatrixTotal: 16, workOrderTotal: 15, revisionTotal: 16,
}), {
  semantic: "reconcile", canonicalTotalQuantity: 16, quantityChanged: false, projectionChanged: true,
});

assert.match(repository, /withWaflV2TenantWriteTransaction/);
assert.match(repository, /SELECT COALESCE\(sum\(quantity\), 0\)::integer AS total_quantity/);
assert.match(repository, /total_quantity = CASE WHEN \$5::boolean THEN \$6::integer ELSE total_quantity END/);
assert.match(repository, /total_quantity_snapshot = CASE WHEN \$5::boolean THEN \$6::integer ELSE total_quantity_snapshot END/);
assert.match(repository, /projectionPlan\.semantic === "no-op"/);
assert.match(repository, /projectionPlan\.semantic === "reconcile"/);
assert.match(repository, /canonicalTotalQuantity/);
assert.doesNotMatch(commandRoute, /`\s*(?:SELECT|INSERT|UPDATE|DELETE)\b/i);

assert.match(detailRepository, /COALESCE\(sum\(q\.quantity\), 0\)::integer/);
assert.match(listRepository, /quantity_totals AS/);
assert.match(issueRepository, /matrix_total_quantity/);
assert.match(issueRepository, /integer\(target\.total_quantity\) !== matrixTotalQuantity/);
assert.match(apiClient, /value\.projectionsMatch !== projectionsMatch/);
assert.match(controller, /onTotalQuantityReconcile/);
assert.match(controller, /const optimisticBundle = optimistic\(snapshot\.bundle\)/);
assert.match(controller, /snapshot\.onReconcile\(\(\) => optimisticBundle/);
assert.match(controller, /optimisticApplied && !conflictRefreshed/);
assert.match(controller, /snapshot\.onReconcile\(\(\) => snapshot\.bundle/);
assert.match(controller, /await snapshot\.onConflict\(\)[\s\S]{0,100}conflictRefreshed = true/);
assert.match(experience, /setItems\([\s\S]{0,220}totalQuantity/);
assert.match(experience, /setSelected\([\s\S]{0,180}totalQuantity/);
assert.match(runtimeQa, /quantity-create-three[\s\S]{0,500}quantity: 3/);
assert.match(runtimeQa, /normalizeCanonicalIntegerEvidence\(initialMatrix\.body\?\.data\?\.matrixTotal/);
assert.ok(runtimeQa.indexOf("persistAccountingEvidence([])") < runtimeQa.indexOf("normalizeCanonicalIntegerEvidence(initialMatrix.body?.data?.matrixTotal"));
assert.match(runtimeQa, /quantity-create-five[\s\S]{0,500}quantity: 5/);
assert.match(runtimeQa, /quantity-create-seven[\s\S]{0,500}quantity: 7/);
assert.match(runtimeQa, /assertQuantityProjection\(quantityCreateThree, 3, 3\)/);
assert.match(runtimeQa, /assertQuantityProjection\(quantityCreateFive, 8, 5\)/);
assert.match(runtimeQa, /assertQuantityProjection\(quantityCreateSeven, 15, 7\)/);
assert.match(runtimeQa, /quantity-update-five-to-six[\s\S]{0,500}quantity: 6/);
assert.match(runtimeQa, /assertQuantityProjection\(quantityUpdate, 16, 6\)/);
assert.match(runtimeQa, /quantity-unchanged-six-no-op/);
assert.match(runtimeQa, /ALPHA59_CARET_MATRIX_TOTAL_IPHONE_REQA_REQUIRED/);
assert.match(runtimeQa, /ALPHA59_CARET_MATRIX_TOTAL_BLOCKED/);

for (const value of ["0", "3", "8", "15", "16", 0, 3, 8, 15, 16]) {
  assert.equal(normalizeCanonicalIntegerEvidence(value), Number(value));
}
for (const value of [null, undefined, "", Number.NaN, -1, -0.25, 1.5, "3.0", "-1", "NaN", "three", " 3 ", "03"] ) {
  assert.throws(() => normalizeCanonicalIntegerEvidence(value), /INTEGER_EVIDENCE_INVALID/);
}
assert.deepEqual(createEmptyCurrentRunAccountingEvidence(), {
  steps: [],
  summary: {
    workOrderVersion: 0,
    revisionVersion: 0,
    events: 0,
    receipts: 0,
    changed: 0,
    noOp: 0,
    rejected: 0,
    replay: 0,
    steps: 0,
    priorFixtureIds: [],
    priorTemporaryMarker: null,
  },
});

const bundle = {
  matrix: {
    workOrderId: "work-order",
    revisionId: "revision",
    sizes: [],
    colors: [],
    quantityCells: [{ colorId: "color-a", sizeRowId: "size-a", quantity: "5" }],
    matrixTotal: "5",
    expectedTotal: "5",
    workOrderTotal: "5",
    revisionTotal: "5",
    projectionsMatch: true,
    totalsMatch: true,
    memoFallback: null,
    entityVersion: 1,
  },
  specifications: {
    workOrderId: "work-order", revisionId: "revision", genderCode: null, categoryCode: null,
    measurementUnit: "cm", templateId: null, sizes: [], pomColumns: [], cells: [], entityVersion: 1,
  },
};
const reconciled = reconcileQuantityCell(bundle, "color-b", "size-b", 7);
assert.equal(reconciled.matrix.matrixTotal, "12");
assert.equal(reconciled.matrix.workOrderTotal, "12");
assert.equal(reconciled.matrix.revisionTotal, "12");
assert.equal(reconciled.matrix.projectionsMatch, true);

console.log("workorder v2 alpha.59 caret matrix total UX contract: PASS");
