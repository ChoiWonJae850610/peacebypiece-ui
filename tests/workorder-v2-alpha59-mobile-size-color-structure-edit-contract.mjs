import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  isStructureMutationCommitAllowed,
  normalizeColorHex,
  sameColorDraft,
  validateColorDraft,
  validateSizeLabel,
} from "../apps/mobile/features/work-orders/size-color/sizeColorStructureEditPolicy.ts";
import { isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");
const uuid = "11111111-2222-4333-8444-555555555555";
const targetId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const mutationEnv = {
  NODE_ENV: "development",
  WAFL_SERVER_RUNTIME_MODE: "development",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.59-dev-test-size-color-structure-runtime",
  WAFL_EXTERNAL_QA_ALPHA59_SIZE_COLOR_STRUCTURE_MUTATION_ENABLED: "true",
};

const exactRoutes = [
  [`/api/v2/work-orders/${uuid}/size-color/sizes`, "POST"],
  [`/api/v2/work-orders/${uuid}/size-color/sizes/${targetId}`, "PATCH"],
  [`/api/v2/work-orders/${uuid}/size-color/sizes/reorder`, "POST"],
  [`/api/v2/work-orders/${uuid}/size-color/colors`, "POST"],
  [`/api/v2/work-orders/${uuid}/size-color/colors/${targetId}`, "PATCH"],
  [`/api/v2/work-orders/${uuid}/size-color/colors/reorder`, "POST"],
];
for (const [pathname, method] of exactRoutes) {
  assert.equal(isTailscaleServePathAllowed(pathname, method, mutationEnv), true, `${method} ${pathname}`);
  for (const denied of ["GET", "PUT", "DELETE"]) {
    if (denied !== method) assert.equal(isTailscaleServePathAllowed(pathname, denied, mutationEnv), false);
  }
  assert.equal(isTailscaleServePathAllowed(pathname, method, { ...mutationEnv, NODE_ENV: "production", WAFL_SERVER_RUNTIME_MODE: "production" }), false);
  assert.equal(isTailscaleServePathAllowed(pathname, method, { ...mutationEnv, WAFL_EXTERNAL_QA_ALPHA59_SIZE_COLOR_STRUCTURE_MUTATION_ENABLED: "false" }), false);
}
for (const pathname of [
  `/api/v2/work-orders/not-a-uuid/size-color/sizes`,
  `/api/v2/work-orders/${uuid}/size-color/sizes/not-a-uuid`,
  `/api/v2/work-orders/${uuid}/size-color/colors/${targetId}/extra`,
  `/api/v2/work-orders/${uuid}/processes`,
  `/api/v2/work-orders/${uuid}/documents`,
  `/api/v2/work-orders/${uuid}/history`,
]) assert.equal(isTailscaleServePathAllowed(pathname, "POST", mutationEnv), false, pathname);

const sizes = [
  { id: "size-1", code: "S", displayLabel: "S", displayOrder: 0 },
  { id: "size-2", code: "M", displayLabel: "M", displayOrder: 1 },
];
assert.deepEqual(validateSizeLabel(" L ", sizes), { value: "L", error: null });
assert.ok(validateSizeLabel("s", sizes).error);

const colors = [
  { id: "color-1", displayName: "Navy", hexValue: "#112233", displayOrder: 0 },
];
assert.equal(normalizeColorHex(" #aabbcc "), "#AABBCC");
assert.deepEqual(validateColorDraft({ displayName: "Ivory", hexValue: "" }, colors), {
  displayName: "Ivory",
  hexValue: null,
  error: null,
});
assert.ok(validateColorDraft({ displayName: "navy", hexValue: "#FFFFFF" }, colors).error);
assert.ok(validateColorDraft({ displayName: "Ivory", hexValue: "#FFF" }, colors).error);
assert.equal(sameColorDraft(colors[0], { displayName: "Navy", hexValue: "#112233" }), true);

assert.equal(isStructureMutationCommitAllowed({
  requestWorkOrderId: uuid,
  activeWorkOrderId: uuid,
  requestGeneration: 3,
  activeGeneration: 3,
}), true);
assert.equal(isStructureMutationCommitAllowed({
  requestWorkOrderId: uuid,
  activeWorkOrderId: targetId,
  requestGeneration: 3,
  activeGeneration: 3,
}), false);
assert.equal(isStructureMutationCommitAllowed({
  requestWorkOrderId: uuid,
  activeWorkOrderId: uuid,
  requestGeneration: 3,
  activeGeneration: 4,
}), false);

const repository = read("lib/domain/work-orders/command/sizeColorStructureCommandRepository.ts");
const commandCodes = read("lib/domain/work-orders/command/workOrderCommandCodes.ts");
const service = read("lib/domain/work-orders/command/sizeColorStructureCommandService.ts");
const route = read("lib/domain/work-orders/command/sizeColorStructureCommandRoute.ts");
const validation = read("lib/domain/work-orders/command/sizeColorStructureValidation.ts");
const editor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const controller = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const readOnly = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const runner = read("tools/dev/start-wafl-external-qa.ps1");
const runtimeQa = read("scripts/run-wafl-v2-alpha59-size-color-structure-runtime-qa.mjs");

for (const code of [
  "work_order.size_structure.create",
  "work_order.size_structure.rename",
  "work_order.size_structure.reorder",
  "work_order.color_structure.create",
  "work_order.color_structure.patch",
  "work_order.color_structure.reorder",
]) assert.ok(commandCodes.includes(code));
assert.match(repository, /FOR UPDATE OF w, r/);
assert.match(repository, /w\.status AS work_order_status/);
assert.match(repository, /r\.revision_status/);
assert.match(repository, /entity_version = entity_version \+ 1/);
assert.match(repository, /INSERT INTO domain_events/);
assert.match(repository, /INSERT INTO work_order_command_receipts/);
assert.match(repository, /RETURNING request_sha256/);
assert.doesNotMatch(repository, /INSERT INTO work_order_command_receipts[\s\S]{0,280}RETURNING id/);
assert.doesNotMatch(repository, /'work_order', \$2::uuid/);
assert.match(repository, /assertExactSet/);
assert.match(repository, /size_code/);
assert.match(repository, /color_code/);
assert.match(repository, /DELETE FROM \$\{config\.table\}/);
assert.doesNotMatch(repository, /archiv|restore/i);
assert.match(service, /permissionCode: "workorder\.update"/);
assert.match(service, /requireSizeColorStructureMutationApproval\(\)/);
assert.match(route, /getWorkOrderV2SizeColorStructureMutationRuntimeGuard/);
assert.doesNotMatch(route, /\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b/);
assert.match(validation, /REORDER_ITEM_BATCH_MAX/);
assert.match(validation, /HEX_PATTERN/);
assert.match(validation, /parseIdempotencyKey/);

assert.match(editor, /WorkOrderSizeColorReadOnly/);
assert.match(editor, /edit\.canEdit/);
assert.match(editor, /count=\{matrix\.sizes\.length\} editable=\{edit\.canEdit\} kind="size"/);
assert.match(editor, /count=\{matrix\.colors\.length\} editable=\{edit\.canEdit\} kind="color"/);
assert.match(editor, /WaflOptionReel/);
assert.match(editor, /ExistingStructureEditor/);
assert.doesNotMatch(editor, /PanResponder|onLongPress|accessibilityActions|onReorderSizeIds|onReorderColorIds/);
assert.doesNotMatch(editor, /ChevronUp|ChevronDown/);
assert.match(editor, /confirmWaflDestructiveAction/);
assert.doesNotMatch(editor, /archive|restore/i);
assert.match(controller, /createExplicitMutationController/);
assert.match(controller, /isStructureMutationCommitAllowed/);
assert.match(controller, /onCommitted/);
assert.match(controller, /onConflict/);
assert.match(controller, /validateSizeLabel/);
assert.match(controller, /validateColorDraft/);
assert.match(controller, /onRefreshLatest/);
assert.match(controller, /sortSizeRows/);
assert.match(controller, /sortColorRows/);
assert.doesNotMatch(controller, /reorderSizes|reorderColors|onReorderSizeIds|onReorderColorIds/);
assert.match(overview, /WorkOrderSizeColorStructureEditor/);
assert.match(experience, /canEdit: canEditWorkOrder\(detail, user\)/);
assert.match(experience, /refreshSizeColorProjection/);
assert.doesNotMatch(readOnly, /TextInput|onAddSize|onPatchColor|onMoveSize/);
assert.match(runner, /EnableAlpha59SizeColorStructureMutation/);
assert.match(runner, /RuntimeQaMode -eq "size-color-structure"/);
assert.match(runner, /WAFL_EXTERNAL_QA_ALPHA59_SIZE_COLOR_STRUCTURE_MUTATION_ENABLED/);
assert.match(runner, /mutationMode = "alpha59-qa-remediation"/);
assert.match(runtimeQa, /syntheticSizeRows: 0/);
assert.match(runtimeQa, /syntheticColorRows: 0/);
assert.match(runtimeQa, /expectedCommandCount/);
assert.match(runtimeQa, /cleanupExactFixtureChildren/);
assert.match(runtimeQa, /mode: "normal"/);
assert.match(runtimeQa, /mode: "finally-fallback"/);
assert.match(runtimeQa, /validateImmutableFixtureOwnership/);
assert.match(runtimeQa, /spec_size\.size_code/);
assert.doesNotMatch(runtimeQa, /work_order_size_spec_sizes[^;]*size_row_id=\$3::uuid/s);
assert.match(runtimeQa, /entity_id = \$2 AND command_code/);
assert.doesNotMatch(runtimeQa, /entity_id = \$2::uuid/);
assert.match(runtimeQa, /READ_ONLY_REGRESSION_PRODUCT/);
assert.match(runtimeQa, /Metro/);
assert.doesNotMatch(runtimeQa, /migration.*(?:INSERT|UPDATE|DELETE)/i);

console.log("workorder v2 alpha.59 mobile size/color structure edit contract: PASS");
