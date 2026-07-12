#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const requiredFiles = [
  "app/api/v2/work-orders/route.ts",
  "lib/domain/work-orders/read/listCursor.ts",
  "lib/domain/work-orders/read/listRepository.ts",
  "lib/domain/work-orders/read/listRoute.ts",
  "lib/domain/work-orders/read/listService.ts",
  "lib/domain/work-orders/read/runtimeGuard.ts",
  "scripts/run-wafl-v2-alpha23-list-api.mjs",
];
for (const file of requiredFiles) {
  assert.ok(fs.existsSync(path.join(root, file)), `missing alpha.23 file: ${file}`);
}

const route = read("app/api/v2/work-orders/route.ts");
const cursor = read("lib/domain/work-orders/read/listCursor.ts");
const repository = read("lib/domain/work-orders/read/listRepository.ts");
const routeHandler = read("lib/domain/work-orders/read/listRoute.ts");
const service = read("lib/domain/work-orders/read/listService.ts");
const runtimeGuard = read("lib/domain/work-orders/read/runtimeGuard.ts");
const dbClient = read("lib/db/client.ts");
const readModels = read("lib/domain/work-orders/contracts/read-models.ts");
const errors = read("lib/domain/work-orders/contracts/errors.ts");
const runner = read("scripts/run-wafl-v2-alpha23-list-api.mjs");
const listItemBlock = readModels.match(/export type WorkOrderListItem = \{([\s\S]*?)\n\};/)?.[1] ?? "";

assert.match(route, /export async function GET\(request: Request\)/, "v2 list route must expose GET");
assert.match(route, /handleCreateWorkOrderDraftV2/, "alpha.25 may add only the bounded create handler beside alpha.23 GET");
assert.doesNotMatch(route, /export async function (PATCH|PUT|DELETE)/, "collection route must not add unsupported mutations");
assert.match(routeHandler, /requireWorkspaceApiGuard\(\{ permissionCode: "workorder\.read" \}\)/, "existing auth/permission guard required");
assert.match(routeHandler, /getWorkOrderV2ReadRuntimeGuard\(\)/, "dev/test runtime guard required before API access");
assert.match(routeHandler, /WorkOrderApiErrorEnvelope/, "alpha.20 typed error envelope must be reused");
assert.match(errors, /readonly ok: false/, "typed error envelope must preserve WAFL ok=false envelope");

for (const token of [
  "workOrderId",
  "displayDocumentNumber",
  "estimatedAmountSummary",
  "representativeThumbnail",
  "incompleteMaterialSummary",
  "processCount",
  "latestDocumentStatus",
  "updatedAt",
]) {
  assert.ok(readModels.includes(token), `canonical list DTO missing ${token}`);
}
for (const forbidden of ["storageObjectKey", "attachments:", "materials:", "processes:", "snapshot:", "rawToken"]) {
  assert.ok(!listItemBlock.includes(forbidden), `list DTO exposes forbidden field ${forbidden}`);
}

assert.match(service, /WORK_ORDER_LIST_DEFAULT_LIMIT/, "default limit must reuse canonical constant");
assert.match(service, /WORK_ORDER_LIST_MAX_LIMIT/, "maximum limit must reuse canonical constant");
assert.match(service, /LIMIT_EXCEEDED/, "limit overflow must use typed error");
assert.match(service, /CURSOR_INVALID/, "invalid cursor must use typed error");
assert.match(service, /ALLOWED_QUERY_KEYS = new Set\(\["limit", "cursor"\]\)/, "companyId and workOrderId query inputs must be rejected");

for (const token of ["createHmac", "timingSafeEqual", "CURSOR_VERSION", "CURSOR_TTL_MS", "scopeHash"]) {
  assert.ok(cursor.includes(token), `signed/expiring cursor contract missing ${token}`);
}
assert.match(cursor, /payload\.exp <=/, "expired cursor must be rejected");
assert.match(cursor, /payload\.v !== CURSOR_VERSION/, "cursor version mismatch must be rejected");
assert.match(
  cursor,
  /return \/\^\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}\$\/i\.test\(value\)/,
  "cursor ID guard must accept PostgreSQL UUID textual syntax",
);
assert.match(cursor, /!isUuid\(payload\.i\)/, "decoded cursor IDs must pass the PostgreSQL UUID textual guard");

const md5UuidHex = createHash("md5").update("alpha.22-md5-postgresql-uuid-fixture").digest("hex");
const md5PostgresUuid = [
  md5UuidHex.slice(0, 8),
  md5UuidHex.slice(8, 12),
  md5UuidHex.slice(12, 16),
  md5UuidHex.slice(16, 20),
  md5UuidHex.slice(20),
].join("-");
const postgresUuidText = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const rfcVersionVariantUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
assert.equal(postgresUuidText.test(md5PostgresUuid), true, "PostgreSQL-valid md5 UUID must pass the cursor ID guard");
assert.equal(rfcVersionVariantUuid.test(md5PostgresUuid), false, "fixture must exercise the former RFC version/variant rejection");
assert.match(runner, /cursor=not-a-cursor/, "forged cursor must remain covered by CURSOR_INVALID runtime verification");

assert.match(
  dbClient,
  /WAFL_V2_TENANT_READ_TRANSACTION_BEGIN\s*=\s*\n\s*"BEGIN READ ONLY; SET LOCAL ROLE wafl_v2_tenant_runtime"/,
  "tenant list transaction must use one fixed begin-and-role protocol call",
);
assert.doesNotMatch(
  dbClient,
  /WAFL_V2_TENANT_READ_TRANSACTION_BEGIN\s*=.*(?:`|\+|\$\{)/,
  "tenant runtime role must not be composed from external input",
);
assert.match(repository, /withWaflV2TenantReadOnlyTransaction/, "repository must use the dedicated tenant read-only transaction");
assert.doesNotMatch(repository, /client\.query\("SET LOCAL ROLE/, "repository must not spend a separate role round trip");
assert.match(repository, /set_config\('wafl\.company_id'/, "RLS company claim is required");
assert.match(repository, /WORK_ORDER_V2_LIST_REPOSITORY_QUERY_COUNT = 2/, "repository bounded statement budget must be explicit");
assert.match(
  repository,
  /Counts bounded statements inside the repository callback, not all endpoint protocol round trips/,
  "query-count header semantics must not be confused with total endpoint protocol round trips",
);
assert.match(repository, /WITH page_ids AS MATERIALIZED/, "page IDs must be bounded before child summaries");
assert.match(repository, /LIMIT \$5/, "page query must be bounded");
assert.match(repository, /ORDER BY w\.updated_at DESC, w\.id DESC/, "stable order is required");
assert.match(repository, /\(w\.updated_at, w\.id\) < \(\$2::timestamptz, \$3::uuid\)/, "stable cursor predicate is required");
assert.doesNotMatch(repository, /SELECT\s+\*/i, "v2 list repository must not use SELECT *");
assert.doesNotMatch(repository, /\bLATERAL\b/i, "row-wise lateral aggregation is forbidden");
assert.doesNotMatch(repository, /JSONB?_AGG|JSON_AGG/i, "full child JSON aggregation is forbidden");
assert.doesNotMatch(repository, /storage_object_key|thumbnail_object_key/i, "storage keys must not enter list SQL");

for (const token of [
  "WAFL_V2_READ_API_ENABLED",
  "WAFL_V2_READ_APPROVED",
  "WAFL_V2_RUNTIME",
  "WAFL_V2_TEST_PREFIX",
  "WAFL_V2_APPROVED_DB_FINGERPRINT",
  "runtime-not-dev-test",
  "db-fingerprint-mismatch",
]) {
  assert.ok(runtimeGuard.includes(token), `runtime guard missing ${token}`);
}

for (const token of [
  "BEGIN READ ONLY",
  "500",
  "5000",
  "CURSOR_INVALID",
  "LIMIT_EXCEEDED",
  "AUTH_REQUIRED",
  "FORBIDDEN",
  "duplicateCount",
  "missingCount",
  "Business data mutation: false",
  "Production mutation: false",
  "measureCompanyAPages",
  "Company A listDb 30-sample metrics",
  "outlierOver100Ms",
  "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)",
  "Company A first-page EXPLAIN (sanitized)",
  "Company A slowest-page EXPLAIN (sanitized)",
]) {
  assert.ok(runner.includes(token), `runtime runner missing ${token}`);
}
assert.match(runner, /assertTypedError\(companyC, 403, "FORBIDDEN"\)/, "approval-pending company C must remain workspace-blocked");
assert.match(runner, /scopeHash\(foreignCompanyId\)/, "company B/C cursor scopes must be rejected when reused by company A");
for (const token of ["forbiddenKeys", "Object.entries(current)", "normalizedKey", "incompleteMaterialSummary"]) {
  assert.ok(runner.includes(token), `runtime exact-key payload scanner missing ${token}`);
}
assert.doesNotMatch(runner, /const serialized = JSON\.stringify\(value\)/, "payload scanner must not substring-scan the entire JSON value");
assert.match(runner, /for \(let round = 0; round < 3; round \+= 1\)/, "company A must use three passes over the same 10 cursor pages");
assert.match(runner, /pageDescriptors\.length, 10/, "company A measurement must retain the 10-page correctness traversal");
for (const metricLog of [
  "Company A API 30-sample metrics (sanitized)",
  "Company A transaction 30-sample metrics (sanitized)",
  "Company H API traversal metrics (sanitized)",
  "Company H transaction traversal metrics (sanitized)",
  "outlierOver500Ms",
]) {
  assert.ok(runner.includes(metricLog), `runtime timing evidence missing ${metricLog}`);
}
assert.match(runner, /if \(companyAPerformance\.listDb\.p95Ms > 100\)/, "100ms DB p95 budget must not be relaxed");
assert.match(runner, /ledger_count\), 7, "migration ledger must remain 7\/7 after approved index 007"/, "alpha.23 runtime must require the applied 007 ledger state");
assert.match(runner, /BEGIN READ ONLY/, "performance diagnosis must remain read-only");
assert.match(runner, /SET LOCAL ROLE wafl_v2_tenant_runtime/, "EXPLAIN must use the tenant runtime role");
assert.match(runner, /loadWorkOrderListSql/, "EXPLAIN must use the repository list SQL rather than a divergent copy");
assert.doesNotMatch(runner, /console\.log\([^\n]*(?:cursorUpdatedAt|cursorWorkOrderId|descriptor\.query)/, "cursor tuples and raw query values must not enter logs");
assert.doesNotMatch(
  runner,
  /^\s*(?:INSERT\s+INTO|UPDATE\s+\S+\s+SET|DELETE\s+FROM|MERGE\s+INTO|TRUNCATE\s+TABLE|DROP\s+TABLE|ALTER\s+TABLE|CREATE\s+TABLE)\b/im,
  "alpha.23 runner must not contain mutating SQL",
);

console.log("workorder v2 alpha.23 list API contract: PASS");
