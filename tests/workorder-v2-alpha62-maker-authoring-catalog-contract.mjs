#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const migration = read("db/v2/migrations/015_v2_company_work_order_structure_options.sql");
for (const token of [
  "company_work_order_structure_options",
  "option_kind IN ('size', 'color')",
  "UNIQUE (company_id, option_kind, normalized_name)",
  "ENABLE ROW LEVEL SECURITY",
  "FORCE ROW LEVEL SECURITY",
  "wafl_v2_request_company_id()",
  "2.0.0-alpha.62-dev-test-reviewed",
]) assert.ok(migration.includes(token), `migration missing ${token}`);
assert.doesNotMatch(migration.replace(/^\s*--.*$/gm, ""), /\b(?:TRUNCATE|DROP\s+TABLE|DELETE\s+FROM)\b/i);

const runner = read("scripts/run-wafl-v2-alpha62-structure-option-migration.mjs");
for (const token of [
  "015_v2_company_work_order_structure_options.sql",
  "ledger-must-be-14-before-015",
  "ALPHA62_MIGRATION_015_APPLY_PASS",
  "ALPHA62_MIGRATION_015_READ_ONLY_AUDIT_PASS",
  "catalog-seed-forbidden",
]) assert.ok(runner.includes(token), `runner missing ${token}`);

const repository = read("lib/domain/work-orders/catalog/structureOptionRepository.ts");
for (const token of [
  "work_order.structure_option.create",
  "work_order.structure_option.remove",
  "ON CONFLICT (company_id, command_code, idempotency_key)",
  "WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3",
  "company_id=$1 AND id=$2::uuid",
  "is_active=false",
  "DELETE FROM company_work_order_structure_options WHERE company_id=$1 AND id=$2::uuid",
  "work_order_sizes",
  "work_order_colors",
]) assert.ok(repository.includes(token), `repository missing ${token}`);
assert.doesNotMatch(repository, /work_order_command_receipts[\s\S]{0,160}\bRETURNING\s+id\b/i, "receipt scalar id assumption forbidden");

const route = read("lib/domain/work-orders/catalog/structureOptionRoute.ts");
for (const token of [
  'requireWorkspaceApiGuard({ permissionCode })',
  'guard("workorder.update"',
  "getWorkOrderV2MeasurementMutationRuntimeGuard",
  "assignedMemberId(access.scope)",
]) assert.ok(route.includes(token), `route missing ${token}`);

const config = read("lib/external-qa/configCore.mjs");
for (const token of [
  "makerAuthoringAssetMutationEnabled",
  "size-color\\/options",
  "alpha62SizeMeasurementEnabled(env)",
  "/api/v2/work-orders/files/upload",
]) assert.ok(config.includes(token), `runtime composition missing ${token}`);

const editor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
for (const token of [
  "CompanyWorkOrderStructureOption",
  "createStructureOption",
  "removeStructureOption",
  "회사 선택지 제거",
  "직접 만들기",
  ">추가</Text>",
  "summarizeStagedDeletionQuantity",
  "diffStagedStructureSelection",
  "StructureCard",
]) assert.ok(editor.includes(token), `mobile catalog UX missing ${token}`);
assert.ok(!editor.includes("ExistingStructureEditor"), "legacy duplicate structure editor must be removed");
assert.ok(!editor.includes("<WaflOptionReel"), "size/color two-way selection must not regress to a reel");

const materialEditor = read("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx");
for (const token of ["Save", "X", "onBlur", "변경 취소", "저장"]) {
  assert.ok(materialEditor.includes(token), `material UX missing ${token}`);
}
assert.ok(!materialEditor.includes(">완료<"), "app-custom Done text must not return");

const partnerRepository = read("lib/domain/work-orders/read/materialPartnerRepository.ts");
const partnerRoute = read("lib/domain/work-orders/read/materialPartnerRoute.ts");
const materialValidation = read("apps/mobile/domain/workOrderValidation.ts");
const materialRead = read("lib/domain/work-orders/read/detailRepository.ts");
for (const token of [
  "installTenantClaims",
  "createDbPartnerRepository",
  "w.assignee_member_id = $3",
]) assert.ok(partnerRepository.includes(token), `partner repository missing ${token}`);
assert.ok(partnerRoute.includes('requireWorkspaceApiGuard({ permissionCode: "workorder.read" })'));
assert.ok(materialRead.includes("NULL::text AS partner_name"));
assert.ok(materialEditor.includes("MaterialPartnerPickerSheet"));
assert.ok(materialValidation.includes('errors.partnerId = "거래처를 선택해 주세요."'));
assert.ok(materialValidation.includes("Number(unitPrice) <= 0"));

console.log("WAFL v2 alpha.62 Maker authoring catalog contract: PASS");
