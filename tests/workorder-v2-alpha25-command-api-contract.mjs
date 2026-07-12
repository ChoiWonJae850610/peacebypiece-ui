#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const listRoute = read("app/api/v2/work-orders/route.ts");
const detailRoute = read("app/api/v2/work-orders/[workOrderId]/route.ts");
const commands = read("lib/domain/work-orders/contracts/commands.ts");
const dbClient = read("lib/db/client.ts");
const runtimeGuard = read("lib/domain/work-orders/command/runtimeGuard.ts");
const validation = read("lib/domain/work-orders/command/validation.ts");
const service = read("lib/domain/work-orders/command/commandService.ts");
const repository = read("lib/domain/work-orders/command/commandRepository.ts");
const routeHandler = read("lib/domain/work-orders/command/commandRoute.ts");
const runner = read("scripts/run-wafl-v2-alpha25-command-preflight.mjs");
const runtimeRunner = read("scripts/run-wafl-v2-alpha25-command-runtime.mjs");
const pipeline = read("tools/pipeline/peacebypiece-auto-pipeline.ps1");

assert.match(listRoute, /export async function GET\(/, "alpha.23 list GET must remain mounted");
assert.match(listRoute, /export async function POST\(/, "alpha.25 create POST must be mounted");
assert.doesNotMatch(listRoute, /export async function (PUT|PATCH|DELETE)/, "collection route may expose only GET and POST");
assert.match(detailRoute, /export async function GET\(/, "alpha.24 detail GET must remain mounted");
assert.match(detailRoute, /export async function PATCH\(/, "alpha.25 basic PATCH must be mounted");
assert.doesNotMatch(detailRoute, /export async function (POST|PUT|DELETE)/, "detail route may expose only GET and PATCH");

for (const token of [
  "CreateWorkOrderDraftCommand",
  "PatchWorkOrderBasicInfoCommand",
  "WorkOrderDraftCommandResult",
  "idempotencyKey: IdempotencyKey",
  "expectedVersion: EntityVersion",
  "productTypeCode",
  "memo",
]) {
  assert.ok(commands.includes(token), `command contract missing ${token}`);
}
assert.doesNotMatch(commands, /readonly companyId/, "command body must not accept companyId");
const createBasicContract = commands.match(/export type CreateWorkOrderDraftCommand[\s\S]*?\n\};/)?.[0] ?? "";
const patchBasicContract = commands.match(/export type PatchWorkOrderBasicInfoCommand[\s\S]*?\n\};/)?.[0] ?? "";
assert.ok(createBasicContract && patchBasicContract, "create/basic patch contract blocks must exist");
assert.doesNotMatch(createBasicContract + patchBasicContract, /readonly revisionId/, "basic command body must not accept client revisionId");

assert.match(runtimeGuard, /getWorkOrderV2ReadRuntimeGuard\(\)/, "command guard must reuse the approved dev/test fingerprint boundary");
assert.match(runtimeGuard, /WAFL_V2_COMMAND_API_ENABLED/, "command feature gate required");
assert.match(runtimeGuard, /WAFL_V2_COMMAND_MUTATION_APPROVED/, "separate mutation approval gate required");
assert.match(runtimeGuard, /2\.0\.0-alpha\.25-dev-test-command-runtime/, "exact alpha.25 mutation approval value required");
assert.match(service, /requireCommandMutationApproval\(\)/, "service must recheck approval immediately before repository mutation");

assert.match(routeHandler, /permissionCode = input\.kind === "create" \? "workorder\.create" : "workorder\.update"/, "create/update permissions must remain action-code based");
assert.match(routeHandler, /COMMAND_BODY_MAX_BYTES = 16 \* 1024/, "command payload must be bounded");
assert.match(routeHandler, /WorkOrderApiErrorEnvelope/, "command routes must use the canonical typed error envelope");
assert.match(routeHandler, /X-WAFL-Command-Statement-Count/, "statement-count evidence header required");
assert.match(routeHandler, /X-WAFL-Command-Transaction-Count/, "transaction-count evidence header required");
assert.match(routeHandler, /X-WAFL-Idempotent-Replay/, "idempotent replay evidence header required");
const diagnostic = routeHandler.match(/console\.error\("\[WORK_ORDER_V2_COMMAND_FAILED\]"[\s\S]*?\n\s*\}\);/)?.[0] ?? "";
assert.ok(diagnostic, "sanitized command diagnostic block missing");
assert.doesNotMatch(diagnostic, /error\.message|request|body|idempotency|token|storage|DATABASE_URL/, "diagnostics must not log request, token, storage, or DB details");

for (const forbiddenClientField of ["companyId", "memberId", "revisionId", "currentRevisionId"]) {
  assert.doesNotMatch(validation, new RegExp(`\\"${forbiddenClientField}\\"`), `${forbiddenClientField} must not be an allowed input key`);
}
assert.match(validation, /UNSUPPORTED_FIELD/, "unknown fields must be rejected");
assert.match(validation, /Idempotency-Key/, "create must require Idempotency-Key");
assert.match(validation, /expectedVersion/, "patch must require expectedVersion");
assert.match(validation, /EMPTY_PATCH/, "empty patch must be rejected");

assert.match(dbClient, /"BEGIN; SET LOCAL ROLE wafl_v2_tenant_runtime"/, "fixed tenant write transaction begin/role call required");
assert.match(repository, /withWaflV2TenantWriteTransaction/, "commands must use the dedicated tenant write transaction helper");
assert.match(repository, /set_config\('wafl\.company_id'/, "company RLS claim required");
assert.match(repository, /set_config\('wafl\.company_member_id'/, "member RLS claim required");
assert.match(repository, /set_config\('wafl\.correlation_id'/, "correlation RLS claim required");
assert.doesNotMatch(repository, /client\.query\("SET LOCAL ROLE/, "repository must not add a role round trip");

for (const token of [
  "INSERT INTO work_order_command_receipts",
  "ON CONFLICT (company_id, command_code, idempotency_key) DO NOTHING",
  "INSERT INTO work_orders",
  "INSERT INTO work_order_revisions",
  "revision_no, revision_status",
  "0, 'draft'",
  "current_revision_id",
  "INSERT INTO domain_events",
  "UPDATE work_order_command_receipts",
]) {
  assert.ok(repository.includes(token), `atomic create contract missing ${token}`);
}
assert.doesNotMatch(repository, /document_number_sequences|allocate_work_order_document_sequence|generated_documents|document_access_tokens/, "alpha.25 must not issue document numbers or documents");
assert.match(service, /scopedIdempotencyKeyHash = sha256/, "raw idempotency key must be scoped and hashed before persistence");
assert.match(service, /tenantScope\.companyMemberId/, "idempotency scope must include the actor");
assert.doesNotMatch(repository, /input\.command\.idempotencyKey/, "repository must never persist the raw idempotency key");

assert.match(repository, /FOR UPDATE OF w, r/, "patch must lock the current WorkOrder and revision");
assert.match(repository, /currentVersion !== input\.command\.expectedVersion/, "patch must check expectedVersion");
assert.match(repository, /entity_version = entity_version \+ 1/, "successful patch must advance the version");
assert.match(repository, /current_revision_id = \$4::uuid AND status = 'draft'/, "patch must target only the current draft");
assert.match(repository, /revision_status = 'draft'/, "patch must keep finalized revisions immutable");
assert.match(service, /code: "CONFLICT"[\s\S]*status: 409/, "stale version must map to typed 409 conflict");
assert.match(service, /code: "NOT_FOUND"[\s\S]*status: 404/, "cross-company IDs must remain generic NOT_FOUND");
assert.match(service, /code: "REVISION_MISMATCH"[\s\S]*status: 409/, "non-current revision must be rejected");

assert.match(repository, /changedFields/, "audit metadata must contain a changed-field allowlist");
assert.match(repository, /versionTransition/, "audit metadata must contain version transition");
assert.doesNotMatch(repository, /storage_object_key|signedUrl|rawToken|session claim|DATABASE_URL/, "command/audit source must not use storage, token, or DB secrets");

for (const token of [
  "VERIFY WAFL V2 ALPHA25 COMMAND PREFLIGHT",
  "mutation-approval-must-be-absent",
  "Valid create/PATCH request sent: false",
  "Company C pre-mutation FORBIDDEN: PASS",
  "Alpha.23/24 Read API regression: PASS",
  "DB schema mutation: false",
  "Dev/Test DB test-data mutation: false",
  "Result: PASS",
]) {
  assert.ok(runner.includes(token), `read-only preflight runner missing ${token}`);
}
assert.doesNotMatch(runner, /INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|TRUNCATE|DROP\s+TABLE|ALTER\s+TABLE/i, "preflight runner must contain no DB write SQL");
assert.match(pipeline, /RunWaflV2Alpha25CommandPreflight/, "canonical alpha.25 preflight pipeline switch required");
assert.match(pipeline, /alpha25-command-preflight/, "preflight failure handoff stage required");
assert.match(pipeline, /Remove-Item Env:WAFL_V2_COMMAND_MUTATION_APPROVED/, "preflight must remove mutation approval before execution");
assert.match(pipeline, /run-wafl-v2-alpha25-command-preflight\.mjs/, "pipeline must invoke the canonical preflight runner");

for (const token of [
  "EXECUTE WAFL V2 ALPHA25 COMMAND RUNTIME",
  "alpha25-command-runtime-v1",
  "Created synthetic WorkOrders: 1",
  "Updated synthetic WorkOrders: 1 unique row; 2 successful version transitions",
  "Idempotency single effect/different payload conflict: PASS",
  "Optimistic concurrency single winner: PASS",
  "Cleanup/reset/rollback: NOT_RUN by policy",
  "Dev/Test DB test-data mutation: true",
]) {
  assert.ok(runtimeRunner.includes(token), `approved runtime runner missing ${token}`);
}
assert.match(runtimeRunner, /work_order_count\) \+ 1/, "runtime ledger must require exactly one new WorkOrder");
assert.match(runtimeRunner, /revision_count\) \+ 1/, "runtime ledger must require exactly one R0 revision");
assert.match(runtimeRunner, /receipt_count\) \+ 1/, "runtime ledger must require exactly one receipt");
assert.match(runtimeRunner, /event_count\) \+ 3/, "runtime ledger must require exactly three safe events");
assert.doesNotMatch(runtimeRunner, /DELETE\s+FROM|TRUNCATE|DROP\s+TABLE|ALTER\s+TABLE|ROLLBACK\s+TO/i, "approved runtime runner must not contain cleanup or schema SQL");
assert.match(pipeline, /RunWaflV2Alpha25CommandRuntimeVerification/, "approved runtime pipeline switch required");
assert.match(pipeline, /alpha25-command-runtime/, "approved runtime failure handoff stage required");
assert.match(pipeline, /run-wafl-v2-alpha25-command-runtime\.mjs/, "pipeline must invoke the approved runtime runner");

console.log("workorder v2 alpha.25 command API static contract: PASS");
