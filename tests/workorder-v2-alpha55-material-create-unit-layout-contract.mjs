#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { formatQuantity, formatQuantityParts } from "../apps/mobile/lib/mobileDisplay.ts";
import { isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

for (const unit of ["m", "yd", "kg", "벌", "장"]) {
  for (const value of ["0", "2", "12", "144"]) {
    const parts = formatQuantityParts(value, unit);
    assert.equal(parts.value, value);
    assert.equal(parts.unit, unit);
    assert.equal(parts.combined, formatQuantity(value, unit));
    assert.equal(parts.value.includes(unit), false, "numeric element must not absorb the unit");
  }
}
assert.deepEqual(formatQuantityParts(undefined, "yd"), {
  value: "미입력",
  unit: "",
  combined: "미입력",
});

const workOrderId = "11111111-1111-1111-1111-111111111111";
const materialsPath = `/api/v2/work-orders/${workOrderId}/materials`;
const alpha55Env = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ALPHA55_MATERIAL_ORDER_LIFECYCLE_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.55-dev-test-mobile-material-order-lifecycle-runtime",
};
assert.equal(isTailscaleServePathAllowed(materialsPath, "POST", alpha55Env), true);
assert.equal(isTailscaleServePathAllowed(materialsPath, "GET", alpha55Env), true);
assert.equal(isTailscaleServePathAllowed(materialsPath, "POST", {
  ...alpha55Env,
  WAFL_EXTERNAL_QA_ALPHA55_MATERIAL_ORDER_LIFECYCLE_MUTATION_ENABLED: "false",
}), false);
assert.equal(isTailscaleServePathAllowed(materialsPath, "POST", {
  ...alpha55Env,
  WAFL_V2_COMMAND_MUTATION_APPROVED: "wrong-approval",
}), false);
assert.equal(isTailscaleServePathAllowed(materialsPath, "POST", {
  ...alpha55Env,
  WAFL_SERVER_RUNTIME_MODE: "production",
}), false);

const quantityComponent = read("apps/mobile/features/materials/MaterialQuantityValue.tsx");
const reelValue = read("apps/mobile/features/inputs/reel-picker/ReelInlineEditValue.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const editor = read("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const policy = read("apps/mobile/domain/workOrderPolicy.ts");
const runtimeQa = read("scripts/run-wafl-v2-alpha55-material-order-runtime-qa.mjs");

assert.match(quantityComponent, /formatQuantityParts/);
assert.match(quantityComponent, /<Text numberOfLines=\{1\}[^>]*>\{display\.value\}<\/Text>/);
assert.match(quantityComponent, /<Text numberOfLines=\{1\}[^>]*>\{display\.unit\}<\/Text>/);
assert.match(quantityComponent, /alignItems: "baseline"/);
assert.match(quantityComponent, /flexDirection: "row"/);
assert.match(quantityComponent, /flexWrap: "nowrap"/);
assert.match(quantityComponent, /value:[\s\S]*?flexShrink: 0/);
assert.match(quantityComponent, /unit:[\s\S]*?flexShrink: 0/);
assert.match(reelValue, /readonly displayContent\?: ReactNode/);
assert.match(materials, /field === "unitCode" \? undefined : \([\s\S]*?<MaterialQuantityValue/);
assert.match(materials, /testID="material-order-quantity-calculated"[\s\S]*?unitCode=\{line\.unitCode\}/);
assert.match(editor, /<MaterialQuantityValue[\s\S]*?value=\{calculatedOrderQuantity\}/);

const createSlice = experience.slice(
  experience.indexOf("function beginMaterialCreate"),
  experience.indexOf("function beginMaterialEdit"),
);
assert.match(createSlice, /if \(!canEditWorkOrder\(detail, user\)\) return/);
assert.match(createSlice, /workOrderId: detail\.header\.id/);
const saveSlice = experience.slice(
  experience.indexOf("async function saveMaterial"),
  experience.indexOf("function reloadLatestMaterial"),
);
assert.match(saveSlice, /selectedWorkOrderId\.current !== editor\.workOrderId/);
assert.match(saveSlice, /detail\.header\.id !== editor\.workOrderId/);
assert.match(saveSlice, /const expectedVersion = detail\.header\.entityVersion/);
assert.match(saveSlice, /workOrderMutationController\.createMaterial\(editor\.workOrderId/);
assert.match(policy, /detail\.header\.status === "draft"/);
assert.match(policy, /detail\.revision\.status === "draft"/);
assert.match(runtimeQa, /ALPHA55_UNIT_LAYOUT_EDITABLE_MATERIAL/);
assert.match(runtimeQa, /--unit-layout-create/);
assert.match(runtimeQa, /--create-only-recovery/);
assert.match(runtimeQa, /ALPHA55_AUTO_WRITE_VERIFY_MATERIAL/);
assert.match(runtimeQa, /writeVerifyBaseline\(before\), \[99, 99, 77, 5, 132, 48, 13, 2\]/);
assert.match(runtimeQa, /writeVerifyBaseline\(after\), \[100, 100, 78, 6, 133, 49, 13, 2\]/);
const createRecoverySlice = runtimeQa.slice(
  runtimeQa.indexOf("async function runCreateOnlyRecovery"),
  runtimeQa.indexOf("async function snapshotMemoImeDisplay"),
);
assert.doesNotMatch(createRecoverySlice, /method:\s*"PATCH"/);
assert.match(createRecoverySlice, /command: "material-create"[\s\S]*?method: "POST"/);
assert.match(createRecoverySlice, /\.\.\.\(options\.idempotencyKey \? \{ "Idempotency-Key": options\.idempotencyKey \} : \{\}\)/);
assert.match(createRecoverySlice, /idempotencyKey: createIdempotencyKey/);
assert.match(createRecoverySlice, /idempotencyKeyPresent: Boolean\(options\.idempotencyKey\)/);
for (const diagnosticField of [
  "requestKind",
  "endpoint",
  "status",
  "contentType",
  "apiErrorCode",
  "responseBodySummary",
  "startedKst",
  "endedKst",
  "timeout",
]) {
  assert.match(createRecoverySlice, new RegExp(`${diagnosticField}:`));
}
assert.match(runtimeQa, /command: "create"[\s\S]*?command: "unit-patch"/);
assert.match(runtimeQa, /unitCode: "m"[\s\S]*?patch: \{ unitCode: "yd" \}/);
assert.match(runtimeQa, /unit-layout-marker-must-not-preexist/);
assert.match(runtimeQa, /duplicateAutomaticUnknownMutation: 0/);

console.log("workorder v2 alpha.55 material create/unit layout contract: PASS");
