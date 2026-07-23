#!/usr/bin/env node
import assert from "node:assert/strict";

import {
  canEditMaterial,
  canEditOverviewField,
  canEditWorkOrder,
  canShowMaterialLifecycleActions,
  isMaterialFieldReadOnly,
} from "../apps/mobile/domain/workOrderPolicy.ts";

const user = { permissionCodes: ["workorder.update"] };
const detail = { header: { status: "draft" }, revision: { status: "draft" } };
const active = { lifecycle: "active", status: "editing", locked: false };
assert.equal(canEditWorkOrder(detail, user), true);
assert.equal(canEditOverviewField(detail, user, "productName"), true);
assert.equal(canEditMaterial(detail, user, active), true);
assert.equal(canEditMaterial(detail, user, { ...active, lifecycle: "archived" }), false);
assert.equal(canEditMaterial(detail, user, { ...active, locked: true }), false);
assert.equal(canEditMaterial({ ...detail, header: { status: "issued" } }, user, active), false);
assert.equal(canShowMaterialLifecycleActions(detail, user), true);
assert.equal(isMaterialFieldReadOnly("orderQuantity"), true);
assert.equal(isMaterialFieldReadOnly("unitPrice"), false);

console.log("workorder v2 alpha.53 mobile policy contract: PASS");
