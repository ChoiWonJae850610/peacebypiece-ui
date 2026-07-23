#!/usr/bin/env node
import assert from "node:assert/strict";

import {
  createMaterialDraft,
  materialPatch,
  normalizeMaterialDraft,
  validateMaterialDraft,
} from "../apps/mobile/domain/workOrderValidation.ts";
import {
  normalizeMaterialCommandResult,
  normalizeMaterialLine,
} from "../apps/mobile/lib/apiResponseNormalizer.ts";

const canonical = {
  name: "Cotton",
  colorOption: "Navy",
  usageArea: "Body",
  requiredQuantity: "10",
  allowanceQuantity: "0.5",
  inventoryUsageQuantity: "0",
  orderQuantity: "10.5",
  unitCode: "yd",
  unitPrice: "15000",
  memo: "memo",
};

const incompleteOptionalDraft = {
  ...canonical,
  colorOption: undefined,
  usageArea: undefined,
  memo: undefined,
};
assert.doesNotThrow(() => validateMaterialDraft(incompleteOptionalDraft));
assert.deepEqual(validateMaterialDraft(incompleteOptionalDraft), {});

const normalizedOptionalDraft = normalizeMaterialDraft(incompleteOptionalDraft);
assert.equal(normalizedOptionalDraft.colorOption, "");
assert.equal(normalizedOptionalDraft.usageArea, "");
assert.equal(normalizedOptionalDraft.memo, "");
assert.equal(normalizedOptionalDraft.orderQuantity, "10.5");

const partialPickerDraft = createMaterialDraft({ requiredQuantity: "12" }, canonical);
assert.deepEqual(partialPickerDraft, { ...canonical, requiredQuantity: "12" });
assert.deepEqual(materialPatch(canonical, partialPickerDraft), { requiredQuantity: "12" });
assert.equal(partialPickerDraft.memo, "memo", "field-only picker updates must preserve the full draft");

const missingUnitErrors = validateMaterialDraft({ ...canonical, unitCode: undefined });
assert.ok(missingUnitErrors.unitCode, "missing required unit must be a structured validation error");
assert.doesNotThrow(() => validateMaterialDraft({}));

const normalizedLine = normalizeMaterialLine({
  id: "00000000-0000-4000-8000-000000000001",
  materialType: "fabric",
  name: "Cotton",
  requiredQuantity: "10.000",
  allowanceQuantity: "0.500",
  inventoryUsageQuantity: "0.000",
  orderQuantity: "10.500",
  unitCode: "yd",
  currency: "KRW",
  unitPrice: "15000.00",
  amount: "157500.00",
  status: "editing",
  displayOrder: 1,
  locked: false,
  lifecycle: "active",
  archivedAt: null,
});
assert.ok(normalizedLine, "valid read models may omit optional text fields");
assert.equal(normalizedLine.colorOption, null);
assert.equal(normalizedLine.usageArea, null);
assert.equal(normalizedLine.memo, null);

assert.equal(normalizeMaterialLine({ ...normalizedLine, requiredQuantity: undefined }), null);
assert.equal(createMaterialDraft({ memo: { invalid: true } }, canonical).memo, "memo");

const workOrderId = "00000000-0000-4000-8000-000000000010";
const validCommandResponse = {
  result: {
    workOrderId,
    materialLineId: "00000000-0000-4000-8000-000000000001",
    materialType: "fabric",
    status: "editing",
    nextVersion: 35,
    lineVersion: 15,
    lifecycle: "active",
  },
  nextVersion: 35,
};
assert.deepEqual(normalizeMaterialCommandResult(validCommandResponse, workOrderId), validCommandResponse);
assert.equal(normalizeMaterialCommandResult({ ...validCommandResponse, nextVersion: 36 }, workOrderId), null);

console.log("workorder v2 alpha.54 actual save remediation contract: PASS");
