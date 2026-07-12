#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const collectionRoute = read("app/api/v2/work-orders/[workOrderId]/materials/route.ts");
const lineRoute = read("app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/route.ts");
const requestRoute = read("app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/order-request/route.ts");
const cancelRoute = read("app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/order-cancel/route.ts");
const completeRoute = read("app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/order-complete/route.ts");
const commands = read("lib/domain/work-orders/contracts/commands.ts");
const runtimeGuard = read("lib/domain/work-orders/command/runtimeGuard.ts");
const validation = read("lib/domain/work-orders/command/materialValidation.ts");
const baseValidation = read("lib/domain/work-orders/command/validation.ts");
const service = read("lib/domain/work-orders/command/materialCommandService.ts");
const repository = read("lib/domain/work-orders/command/materialCommandRepository.ts");
const routeHandler = read("lib/domain/work-orders/command/materialCommandRoute.ts");
const dbClient = read("lib/db/client.ts");
const migration003 = read("db/v2/migrations/003_v2_revision_content.sql");
const migration006 = read("db/v2/migrations/006_v2_deferred_constraints_indexes.sql");
const preflight = read("scripts/run-wafl-v2-alpha26-material-command-preflight.mjs");
const runtime = read("scripts/run-wafl-v2-alpha26-material-command-runtime.mjs");
const pipeline = read("tools/pipeline/peacebypiece-auto-pipeline.ps1");

assert.match(collectionRoute, /export async function GET\(/, "material lazy GET must remain mounted");
assert.match(collectionRoute, /export async function POST\(/, "material create POST must be mounted");
assert.doesNotMatch(collectionRoute, /export async function (PUT|PATCH|DELETE)/, "material collection exposes only GET and POST");
assert.match(lineRoute, /export async function PATCH\(/, "material line PATCH must be mounted");
assert.doesNotMatch(lineRoute, /export async function (GET|POST|PUT|DELETE)/, "material line deletion is deferred without soft-delete schema");
for (const route of [requestRoute, cancelRoute, completeRoute]) {
  assert.match(route, /export async function POST\(/, "order transition route must expose POST");
  assert.doesNotMatch(route, /export async function (GET|PUT|PATCH|DELETE)/, "order transition route must expose only POST");
  assert.match(route, /handleMaterialOrderTransitionV2/, "all order transitions must share the canonical route boundary");
}

for (const token of [
  "AddMaterialLineCommand",
  "PatchMaterialLineCommand",
  "RequestMaterialOrderCommand",
  "CancelMaterialOrderRequestCommand",
  "CompleteMaterialOrderCommand",
  "MaterialLineCommandResult",
  "idempotencyKey: IdempotencyKey",
  "expectedVersion: EntityVersion",
]) {
  assert.ok(commands.includes(token), `material command contract missing ${token}`);
}
assert.doesNotMatch(commands, /readonly companyId/, "command DTO must not accept companyId");

for (const token of [
  "materialType", "requiredQuantity", "allowanceQuantity", "inventoryUsageQuantity",
  "orderQuantity", "unitCode", "unitPrice", "expectedVersion",
  "INVALID_DECIMAL", "AMOUNT_OVERFLOW", "EMPTY_PATCH",
]) {
  assert.ok(validation.includes(token), `material validation missing ${token}`);
}
assert.match(baseValidation, /Idempotency-Key/, "material POST commands must reuse canonical Idempotency-Key validation");
assert.match(baseValidation, /UNSUPPORTED_FIELD/, "material commands must reuse canonical unknown-field rejection");
assert.doesNotMatch(validation, /"status"\s*[,\]]/, "status must not be an allowed scalar PATCH field");
assert.doesNotMatch(validation, /"companyId"|"memberId"|"revisionId"|"supplierCompanyId"/, "tenant/revision spoof fields must not be allowed");

assert.match(runtimeGuard, /2\.0\.0-alpha\.26-dev-test-material-command-runtime/, "exact alpha.26 mutation approval required");
assert.match(runtimeGuard, /SUPPORTED_MUTATION_APPROVALS/, "known fixed approvals must remain allowlisted");
assert.match(service, /requireCommandMutationApproval\(WAFL_V2_ALPHA26_MUTATION_APPROVAL\)/, "service must recheck exact approval before mutation");
assert.match(service, /deterministicUuid/, "create replay must use deterministic line identity without schema change");
assert.match(service, /material\.order\.request/, "request/cancel permission required");
assert.match(service, /material\.order\.place/, "complete permission required");
assert.match(routeHandler, /permissionFor/, "route permissions must be command-specific");
assert.match(routeHandler, /readBoundedCommandJson/, "material routes must reuse bounded JSON parsing");
assert.match(routeHandler, /WorkOrderApiErrorEnvelope/, "typed error envelope required");
assert.match(routeHandler, /X-WAFL-Command-Statement-Count/, "bounded statement evidence header required");
assert.doesNotMatch(routeHandler.match(/console\.error\("\[WORK_ORDER_V2_MATERIAL_COMMAND_FAILED\]"[\s\S]*?\n\s*\}\);/)?.[0] ?? "", /error\.message|request|body|idempotency|token|DATABASE_URL/, "diagnostic must be sanitized");

for (const token of [
  "withWaflV2TenantWriteTransaction",
  "installTenantClaims",
  "FOR UPDATE OF w, r",
  "FOR UPDATE OF w, r, m",
  "current_revision_id",
  "revision_status",
  "entity_version = entity_version + 1",
  "work_order_command_receipts",
  "ON CONFLICT (company_id, command_code, idempotency_key) DO NOTHING",
  "INSERT INTO domain_events",
  "statusTransition",
  "versionTransition",
  "lineVersionTransition",
  "round($12::numeric * $14::numeric, 2)",
]) {
  assert.ok(repository.includes(token), `repository contract missing ${token}`);
}
assert.match(repository, /request:[\s\S]*from: "editing"[\s\S]*to: "requested"/, "editing to requested transition required");
assert.match(repository, /cancel:[\s\S]*from: "requested"[\s\S]*to: "cancelled"/, "requested to cancelled transition required");
assert.match(repository, /complete:[\s\S]*from: "requested"[\s\S]*to: "completed"/, "requested to completed transition required");
const draftGuard = repository.match(/function assertCurrentDraft[\s\S]*?\n}/)?.[0] ?? "";
assert.ok(draftGuard, "current draft guard must exist");
assert.ok(
  draftGuard.indexOf('target.work_order_status !== "draft"') < draftGuard.indexOf('target.revision_status !== "draft"'),
  "WorkOrder issued lock must be checked before revision status",
);
const transitionBoundary = repository.slice(repository.indexOf("export async function transitionMaterialOrderV2"));
const transitionOrder = [
  "withWaflV2TenantWriteTransaction",
  "reserveReceipt",
  "lockMaterialTarget",
  "assertCurrentDraft(target, input.expectedVersion)",
  "target.material_status !== config.from",
  "UPDATE work_order_material_lines",
  "appendMaterialEvent",
];
let previousTransitionIndex = -1;
for (const token of transitionOrder) {
  const nextIndex = transitionBoundary.indexOf(token);
  assert.ok(nextIndex > previousTransitionIndex, `material order lock/mutation order invalid at ${token}`);
  previousTransitionIndex = nextIndex;
}
assert.match(service, /if \(error\.reason === "locked"\)[\s\S]*code: "LOCKED", status: 409/, "issued lock must map to typed LOCKED");
assert.match(dbClient, /catch \(error\) \{[\s\S]*await client\.query\("ROLLBACK"\)[\s\S]*throw error/, "failed material transition must roll back provisional receipt and all writes");
assert.doesNotMatch(repository, /DELETE\s+FROM\s+work_order_material_lines/i, "hard delete is forbidden without canonical lifecycle");
assert.doesNotMatch(repository, /input\.command\.idempotencyKey/, "repository must not receive raw idempotency keys");
assert.match(repository, /assertAmountWithinDatabaseRange/, "partial PATCH must validate the final derived amount against the DB numeric range");
assert.match(service, /amount_out_of_range/, "derived amount overflow must retain a typed validation envelope");

for (const token of [
  "work_order_material_lines_status_check",
  "requested_at timestamptz",
  "completed_at timestamptz",
  "cancelled_at timestamptz",
  "entity_version integer",
]) {
  assert.ok(migration003.includes(token), `existing material schema contract missing ${token}`);
}
for (const token of [
  "work_order_material_lines_revision_company_fk",
  "work_order_material_lines_supplier_company_fk",
  "work_order_material_lines_company_status_idx",
]) {
  assert.ok(migration006.includes(token), `existing tenant/index contract missing ${token}`);
}

for (const token of [
  "VERIFY WAFL V2 ALPHA26 MATERIAL COMMAND PREFLIGHT",
  "mutation-approval-must-be-absent",
  "Valid material create/PATCH/order transition sent: false",
  "Planned retained delta: WorkOrder +0; revision +0; fabric +2; accessory +1; receipt +9; event +11; version transitions +11",
  "Dev/Test DB test-data mutation: false",
  "Result: PASS",
]) {
  assert.ok(preflight.includes(token), `alpha.26 preflight missing ${token}`);
}
assert.doesNotMatch(preflight, /INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|TRUNCATE|DROP\s+TABLE|ALTER\s+TABLE/i, "preflight must contain no DB write SQL");

for (const token of [
  "EXECUTE WAFL V2 ALPHA26 MATERIAL COMMAND RUNTIME",
  "alpha26-fabric-primary-v1",
  "Created material lines: fabric 2; accessory 1",
  "receipt +9; event +11; version transitions +11",
  "Optimistic concurrency patch/request/terminal single winner: PASS",
  "Cleanup/reset/rollback: NOT_RUN by policy",
  'assertTypedError(finalized, 409, "LOCKED")',
  "fabric-create-complete",
  "accessory-create-complete",
  "scalar-patch-complete",
  "patch-concurrency-complete",
  "order-request-complete",
  "order-cancel-complete",
  "order-complete-complete",
  "tenant-isolation-complete",
  "finalized-fixture-complete",
  "read-regression-complete",
  "final-ledger-complete",
  "sanitizeAssertionValue",
  "runnerLocation",
  "lastSuccessfulStep",
  "resourceRef",
  "Schema mutation this run: false",
  "committedMutationObserved",
  'Dev/Test DB test-data mutation this run: ${committedMutationObserved ? "true" : "false"}',
]) {
  assert.ok(runtime.includes(token), `alpha.26 runtime runner missing ${token}`);
}
assert.match(runtime, /fabric_count\) \+ 2/, "runtime ledger must require exactly two fabric lines");
assert.match(runtime, /accessory_count\) \+ 1/, "runtime ledger must require exactly one accessory line");
assert.match(runtime, /receipt_count\) \+ 9/, "runtime ledger must require exactly nine receipts");
assert.match(runtime, /event_count\) \+ 11/, "runtime ledger must require exactly eleven events");
assert.doesNotMatch(runtime, /DELETE\s+FROM|TRUNCATE|DROP\s+TABLE|ALTER\s+TABLE|ROLLBACK\s+TO/i, "runtime runner must not contain cleanup or schema SQL");
assert.doesNotMatch(runtime, /assertTypedError\(finalized,\s*409,\s*"REVISION_MISMATCH"\)/, "finalized issued fixture must use canonical LOCKED error");
const failureDiagnostic = runtime.match(/run\(\)\.catch\(\(error\) => \{[\s\S]*?process\.exitCode = 1;/)?.[0] ?? "";
for (const forbidden of ["DATABASE_URL", "Idempotency-Key", "raw idempotency", "session claim", "storage key", "request body", "response body"]) {
  assert.ok(!failureDiagnostic.includes(forbidden), `sanitized failure diagnostic must exclude ${forbidden}`);
}

for (const token of [
  "Current Migration Ledger Count:",
  "Current Migration Ledger Evidence:",
  "This Run DB Schema Mutation:",
  "Historical Dev/Test Migration Applied:",
  "This Run Dev/Test DB Test-Data Mutation:",
  "Historical Synthetic Seed Evidence:",
  '"unknown; not measured by this failure run"',
]) {
  assert.ok(pipeline.includes(token), `failure repo-state contract missing ${token}`);
}
assert.doesNotMatch(pipeline, /elseif \(\$applyText -match 'Migration ledger rows:/, "failure ledger must not fall back to historical apply logs");

for (const token of [
  "RunWaflV2Alpha26MaterialCommandPreflight",
  "RunWaflV2Alpha26MaterialCommandRuntimeVerification",
  "alpha26-material-command-preflight",
  "alpha26-material-command-runtime",
  "run-wafl-v2-alpha26-material-command-preflight.mjs",
  "run-wafl-v2-alpha26-material-command-runtime.mjs",
]) {
  assert.ok(pipeline.includes(token), `canonical pipeline missing ${token}`);
}

console.log("workorder v2 alpha.26 material command API static contract: PASS");
