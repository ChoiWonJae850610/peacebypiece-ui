#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const route = read("app/api/v2/work-orders/[workOrderId]/revisions/issue/route.ts");
const contracts = read("lib/domain/work-orders/contracts/commands.ts");
const validation = read("lib/domain/work-orders/command/issueValidation.ts");
const service = read("lib/domain/work-orders/command/issueService.ts");
const repository = read("lib/domain/work-orders/command/issueRepository.ts");
const routeHandler = read("lib/domain/work-orders/command/issueRoute.ts");
const guard = read("lib/domain/work-orders/command/runtimeGuard.ts");
const migration001 = read("db/v2/migrations/001_v2_tenant_document_number_foundation.sql");
const migration002 = read("db/v2/migrations/002_v2_work_orders_revisions.sql");
const migration003 = read("db/v2/migrations/003_v2_revision_content.sql");
const preflight = read("scripts/run-wafl-v2-alpha27-revision-issue-preflight.mjs");
const runtime = read("scripts/run-wafl-v2-alpha27-revision-issue-runtime.mjs");
const pipeline = read("tools/pipeline/peacebypiece-auto-pipeline.ps1");

assert.match(route, /export async function POST/, "issue route must expose POST only");
assert.doesNotMatch(route, /export async function (GET|PUT|PATCH|DELETE)/, "issue route must not expose other methods");
for (const token of ["IssueWorkOrderCommand", "expectedRevisionVersion", "IssueWorkOrderCommandResult", "nextDraftCreated: false"]) {
  assert.ok(contracts.includes(token), `issue contract missing ${token}`);
}
for (const token of ["expectedWorkOrderVersion", "expectedRevisionVersion", "expectedRevisionId", "parseIdempotencyKey", "assertAllowedKeys"]) {
  assert.ok(validation.includes(token), `issue validation missing ${token}`);
}
for (const forbidden of ["companyId", "actorMemberId", "revisionNumber", "documentNumber", "issuedAt", "nextRevisionId"]) {
  assert.doesNotMatch(validation, new RegExp(`\\"${forbidden}\\"`), `client must not supply ${forbidden}`);
}

assert.match(routeHandler, /permissionCode: "workorder\.update"/, "issue must reuse the canonical update permission");
assert.match(service, /WAFL_V2_ALPHA27_MUTATION_APPROVAL/, "issue must require the exact alpha.27 approval");
assert.match(guard, /2\.0\.0-alpha\.27-dev-test-revision-issue-runtime/, "fixed alpha.27 approval value required");
assert.match(service, /tenantScope\.companyMemberId/, "idempotency scope must include actor");
assert.match(service, /command\.workOrderId[\s\S]*command\.revisionId[\s\S]*command\.idempotencyKey/, "idempotency scope must include work order and revision");
assert.doesNotMatch(repository, /input\.command\.idempotencyKey/, "repository must not receive raw idempotency key");

for (const token of [
  "withWaflV2TenantWriteTransaction",
  "installTenantClaims",
  "FOR UPDATE OF w, r",
  "expectedRevisionVersion",
  "allocate_work_order_document_sequence",
  "document_number_base",
  "revision_status = 'finalized'",
  "finalized_by_member_id",
  "status = 'issued'",
  "entity_version = entity_version + 1",
  "INSERT INTO work_order_command_receipts",
  "ON CONFLICT (company_id, command_code, idempotency_key) DO NOTHING",
  "INSERT INTO domain_events",
  "work_order.revision.issue",
  "nextDraftCreated: false",
]) assert.ok(repository.includes(token), `atomic issue repository missing ${token}`);

assert.match(migration001, /PRIMARY KEY \(company_id, business_date\)/, "tenant/day sequence identity required");
assert.match(migration001, /ON CONFLICT \(company_id, business_date\)[\s\S]*last_sequence = document_number_sequences\.last_sequence \+ 1/, "atomic sequence allocator required");
assert.match(migration002, /UNIQUE \(company_id, document_number_base\)/, "tenant document number uniqueness required");
assert.match(migration002, /work_order_revisions_single_draft_idx/, "single draft invariant required");
assert.match(migration002, /work_order_revisions_immutable_guard/, "revision immutable guard required");
assert.match(migration003, /revision-scoped child rows are immutable after finalization/, "revision children must lock after issue");
assert.doesNotMatch(repository, /generated_documents|document_access_tokens|storage_object_key|token_hash/, "alpha.27 must not generate documents, QR, or storage rows");
assert.doesNotMatch(repository, /INSERT INTO work_order_revisions/, "issue must not invent an automatic next draft");
assert.doesNotMatch(repository, /max\s*\(/i, "document allocation must never use max()+1");
assert.doesNotMatch(repository, /DELETE\s+FROM|TRUNCATE|DROP\s+TABLE|ALTER\s+TABLE/i, "issue command must not contain destructive or schema SQL");

const diagnostic = routeHandler.match(/console\.error\("\[WORK_ORDER_V2_ISSUE_COMMAND_FAILED\]"[\s\S]*?\n\s*\}\);/)?.[0] ?? "";
assert.ok(diagnostic, "sanitized issue diagnostic required");
assert.doesNotMatch(diagnostic, /error\.message|request|body|idempotency|token|storage|DATABASE_URL/, "issue diagnostic must not leak request or secrets");

for (const token of [
  "VERIFY WAFL V2 ALPHA27 REVISION ISSUE PREFLIGHT",
  "SELECT filename FROM wafl_v2_migration_ledger ORDER BY filename",
  "Valid issue Command sent: false",
  "Dev/Test DB test-data mutation: false",
  "Result: PASS",
]) assert.ok(preflight.includes(token), `alpha.27 preflight missing ${token}`);
assert.doesNotMatch(preflight, /INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|TRUNCATE|DROP\s+TABLE|ALTER\s+TABLE/i, "preflight must contain no DB mutation SQL");
for (const token of [
  "EXECUTE WAFL V2 ALPHA27 REVISION ISSUE RUNTIME",
  "assert.equal(Number(ledger.rows[0]?.count), 8)",
  "successes[0].body?.data?.nextVersion",
  "Concurrent issue single winner: PASS",
  "Display document number allocated: 1",
  "Next draft created: 0",
  "Receipt delta: +1; event delta: +1",
  "Cleanup/reset/rollback: NOT_RUN by policy",
  "mutationCommitted",
  "lastSuccessfulStep",
]) assert.ok(runtime.includes(token), `alpha.27 runtime missing ${token}`);
assert.doesNotMatch(runtime, /DELETE\s+FROM|TRUNCATE|DROP\s+TABLE|ALTER\s+TABLE|ROLLBACK\s+TO/i, "runtime must not contain cleanup or schema SQL");
for (const token of [
  "RunWaflV2Alpha27RevisionIssuePreflight",
  "RunWaflV2Alpha27RevisionIssueRuntimeVerification",
  "run-wafl-v2-alpha27-revision-issue-preflight.mjs",
  "run-wafl-v2-alpha27-revision-issue-runtime.mjs",
  "2.0.0-alpha.27-dev-test-revision-issue-runtime",
]) assert.ok(pipeline.includes(token), `canonical pipeline missing ${token}`);

console.log("workorder v2 alpha.27 revision issue command static contract: PASS");
