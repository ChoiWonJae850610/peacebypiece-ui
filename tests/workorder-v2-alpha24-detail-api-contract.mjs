#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const alpha26ContractExists = fs.existsSync(path.join(root, "tests/workorder-v2-alpha26-material-command-api-contract.mjs"));

const routePaths = [
  "app/api/v2/work-orders/[workOrderId]/route.ts",
  "app/api/v2/work-orders/[workOrderId]/materials/route.ts",
  "app/api/v2/work-orders/[workOrderId]/size-color/route.ts",
  "app/api/v2/work-orders/[workOrderId]/size-spec/route.ts",
  "app/api/v2/work-orders/[workOrderId]/processes/route.ts",
  "app/api/v2/work-orders/[workOrderId]/assets/route.ts",
  "app/api/v2/work-orders/[workOrderId]/documents/route.ts",
  "app/api/v2/work-orders/[workOrderId]/history/route.ts",
];
for (const routePath of routePaths) {
  assert.ok(fs.existsSync(path.join(root, routePath)), `missing alpha.24 route: ${routePath}`);
  const route = read(routePath);
  assert.match(route, /export async function GET\(/, `${routePath} must expose GET`);
  if (routePath === "app/api/v2/work-orders/[workOrderId]/route.ts") {
    assert.doesNotMatch(route, /export async function (POST|PUT|DELETE)/, `${routePath} may add only alpha.25 PATCH beside GET`);
    assert.match(route, /handlePatchWorkOrderBasicInfoV2/, `${routePath} must use the bounded alpha.25 PATCH handler`);
  } else if (routePath === "app/api/v2/work-orders/[workOrderId]/materials/route.ts" && alpha26ContractExists) {
    assert.doesNotMatch(route, /export async function (PATCH|PUT|DELETE)/, `${routePath} may add only alpha.26 POST beside GET`);
    assert.match(route, /handleAddMaterialLineV2/, `${routePath} must use the bounded alpha.26 POST handler`);
  } else {
    assert.doesNotMatch(route, /export async function (POST|PATCH|PUT|DELETE)/, `${routePath} must remain read-only`);
  }
}

const repository = read("lib/domain/work-orders/read/detailRepository.ts");
const service = read("lib/domain/work-orders/read/detailService.ts");
const routeHandler = read("lib/domain/work-orders/read/detailRoute.ts");
const cursor = read("lib/domain/work-orders/read/detailCursor.ts");
const readModels = read("lib/domain/work-orders/contracts/read-models.ts");
const dbClient = read("lib/db/client.ts");
const runner = read("scripts/run-wafl-v2-alpha24-detail-api.mjs");
const pipeline = read("tools/pipeline/peacebypiece-auto-pipeline.ps1");

for (const typeName of [
  "WorkOrderDetailCoreReadModel",
  "WorkOrderMaterialPage",
  "WorkOrderSizeColorMatrixReadModel",
  "WorkOrderSizeSpecReadModel",
  "WorkOrderAssetPage",
  "WorkOrderDocumentPage",
  "WorkOrderHistoryPage",
]) {
  assert.ok(readModels.includes(`export type ${typeName}`), `missing canonical alpha.24 DTO ${typeName}`);
}

assert.match(routeHandler, /getWorkOrderV2ReadRuntimeGuard\(\)/, "runtime fingerprint guard must run for detail and tabs");
assert.match(routeHandler, /requireWorkspaceApiGuard\(\{ permissionCode: "workorder\.read" \}\)/, "detail routes require workorder.read");
assert.match(routeHandler, /WorkOrderApiErrorEnvelope/, "detail routes must reuse the typed error envelope");
assert.match(routeHandler, /X-WAFL-Detail-Statement-Count/, "bounded statement count header required");
assert.match(routeHandler, /errorCode:[\s\S]*String\(error\.code\)/, "runtime diagnostics must retain only a sanitized error code");
const diagnosticBlock = routeHandler.match(/console\.error\("\[WORK_ORDER_V2_DETAIL_READ_FAILED\]"[\s\S]*?\n\s*\}\);/)?.[0] ?? "";
assert.ok(diagnosticBlock, "sanitized detail diagnostic block missing");
assert.doesNotMatch(diagnosticBlock, /errorMessage|error\.message|error\.detail|error\.query/, "runtime diagnostics must not log DB messages, details, or SQL");
assert.match(service, /throw new WorkOrderDetailRequestError\(\{ code: "NOT_FOUND", status: 404/, "missing and cross-company IDs must share generic not-found");
assert.doesNotMatch(service, /companyId.*searchParams|get\("companyId"\)|revisionId.*searchParams|get\("revisionId"\)|memberId.*searchParams|get\("memberId"\)/, "client tenant/revision/member scope must not be trusted");

assert.match(dbClient, /"BEGIN READ ONLY; SET LOCAL ROLE wafl_v2_tenant_runtime"/, "fixed tenant read-only begin/role call required");
assert.match(repository, /withWaflV2TenantReadOnlyTransaction/, "detail repositories must reuse the tenant read helper");
assert.match(repository, /WORK_ORDER_V2_DETAIL_REPOSITORY_STATEMENT_COUNT = 2/, "claims plus one tab SQL is the bounded repository statement count");
assert.match(repository, /set_config\('wafl\.company_id'/, "company RLS claim required");
assert.match(repository, /set_config\('wafl\.company_member_id'/, "member RLS claim required");
assert.doesNotMatch(repository, /client\.query\("SET LOCAL ROLE/, "detail repositories must not add a role round trip");

for (const token of ["createHmac", "timingSafeEqual", "CURSOR_VERSION", "CURSOR_TTL_MS", "scopeHash", "workOrderId", "kind"]) {
  assert.ok(cursor.includes(token), `tab cursor contract missing ${token}`);
}
assert.match(cursor, /toString\("base64url"\)/, "tab cursor must use URL-safe base64url");
assert.match(cursor, /payload\.exp <=/, "expired tab cursor must be rejected");
assert.match(cursor, /payload\.k !== input\.kind/, "cursor must bind the tab kind");
assert.match(cursor, /payload\.w !== input\.workOrderId/, "cursor must bind the WorkOrder ID");

function sqlBlock(name) {
  const match = repository.match(new RegExp("export const " + name + " = `([\\s\\S]*?)`;"));
  assert.ok(match, `missing SQL block ${name}`);
  return match[1];
}

const coreSql = sqlBlock("WORK_ORDER_V2_DETAIL_CORE_SQL");
const materialsSql = sqlBlock("WORK_ORDER_V2_MATERIALS_SQL");
const sizeColorSql = sqlBlock("WORK_ORDER_V2_SIZE_COLOR_SQL");
const sizeSpecSql = sqlBlock("WORK_ORDER_V2_SIZE_SPEC_SQL");
const processesSql = sqlBlock("WORK_ORDER_V2_PROCESSES_SQL");
const assetsSql = sqlBlock("WORK_ORDER_V2_ASSETS_SQL");
const documentsSql = sqlBlock("WORK_ORDER_V2_DOCUMENTS_SQL");
const historySql = sqlBlock("WORK_ORDER_V2_HISTORY_SQL");

assert.doesNotMatch(coreSql, /snapshot|storage_object_key|token_hash|document_access_tokens/i, "core payload SQL must not read document/file/token internals");
assert.match(materialsSql, /work_order_material_lines/, "materials endpoint must read material lines");
assert.doesNotMatch(materialsSql, /\bpartners\b/, "v2 tenant material read must not depend on ungranted legacy partner tables");
assert.doesNotMatch(materialsSql, /work_order_processes|work_order_images|generated_documents|domain_events|color_size_quantities/, "materials endpoint must not eager-load other tabs");
assert.match(sizeColorSql, /work_order_colors[\s\S]*work_order_sizes[\s\S]*color_size_quantities/, "size-color endpoint must read only its matrix tables");
assert.doesNotMatch(sizeColorSql, /work_order_material_lines|work_order_processes|work_order_images|generated_documents|domain_events/, "size-color endpoint must not eager-load other tabs");
assert.match(sizeSpecSql, /work_order_size_specs[\s\S]*work_order_size_spec_sizes[\s\S]*work_order_size_spec_poms[\s\S]*work_order_size_spec_values/, "size-spec endpoint must use structured size-spec tables");
assert.match(processesSql, /work_order_processes/, "process endpoint must read process rows");
assert.doesNotMatch(processesSql, /work_order_material_lines|work_order_images|generated_documents|domain_events/, "process endpoint must not eager-load other tabs");
assert.match(assetsSql, /work_order_revision_images[\s\S]*work_order_revision_attachments/, "assets endpoint must read revision-linked metadata");
assert.doesNotMatch(assetsSql, /storage_object_key|thumbnail_object_key/, "asset endpoint must not select storage keys");
assert.match(documentsSql, /generated_documents/, "documents endpoint must read generated document metadata");
assert.doesNotMatch(documentsSql, /snapshot|storage_object_key|token_hash/, "documents endpoint must not select snapshot, object key, or token hash");
assert.match(historySql, /domain_events/, "history endpoint must read domain events");
assert.doesNotMatch(historySql, /metadata|actor_member_id|system_actor_id|privileged_reason/, "history endpoint must omit sensitive event metadata and actors");

for (const sql of [coreSql, materialsSql, sizeColorSql, sizeSpecSql, processesSql, assetsSql, documentsSql, historySql]) {
  assert.match(sql, /w\.company_id = \$1|company_id = \$1/, "every detail/tab SQL must begin from tenant scope");
  assert.doesNotMatch(sql, /SELECT\s+\*/i, "detail/tab SQL must not use SELECT *");
}
assert.match(materialsSql, /LIMIT \$7/, "material collection must be bounded");
assert.match(assetsSql, /LIMIT \$7/, "asset collection must be bounded");
assert.match(documentsSql, /LIMIT \$6/, "document collection must be bounded");
assert.match(historySql, /LIMIT \$6/, "history collection must be bounded");

for (const token of [
  "VERIFY WAFL V2 ALPHA24 DETAIL API",
  "Company A/H/B authenticated detail read: PASS",
  "Cross-company core/tab IDs: NOT_FOUND",
  "Accessory cursor",
  "Asset cursor",
  "Route metrics (sanitized)",
  "apiOutlierOver500Ms",
  "DB schema mutation: false",
  "Result: PASS",
]) {
  assert.ok(runner.includes(token), `alpha.24 runtime runner missing ${token}`);
}
assert.match(runner, /assert\.ok\(result\.db\.p95Ms <= 250/, "250ms detail/tab DB budget must not be relaxed");
assert.match(runner, /assert\.ok\(result\.api\.p95Ms <= 500/, "500ms API wall-time budget must remain explicit");
assert.doesNotMatch(runner, /console\.log\([^\n]*(?:connectionString|sessionSecret|aId|hId|bId|cId)/, "IDs, DB URLs, and secrets must not enter runtime logs");
assert.match(pipeline, /RunWaflV2Alpha24DetailApiVerification/, "canonical pipeline switch required");
assert.match(pipeline, /alpha24-detail-api-runtime/, "alpha.24 runtime failure handoff required");
assert.match(pipeline, /InvokeProjectCommandWithResultFile[\s\S]*run-wafl-v2-alpha24-detail-api\.mjs/, "pipeline must invoke the canonical alpha.24 runner");

for (const source of [repository, service, routeHandler, cursor, ...routePaths.map(read)]) {
  assert.doesNotMatch(source, /^\s*(?:INSERT\s+INTO|UPDATE\s+\S+\s+SET|DELETE\s+FROM|MERGE\s+INTO|TRUNCATE|DROP|ALTER)\b/im, "alpha.24 detail slice must remain read-only");
}

console.log("workorder v2 alpha.24 detail/lazy API contract: PASS");
