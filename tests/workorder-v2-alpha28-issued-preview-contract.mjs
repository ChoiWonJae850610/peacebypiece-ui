#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const files = [
  "app/api/v2/work-orders/[workOrderId]/revisions/[revisionId]/preview/route.ts",
  "lib/domain/work-orders/read/previewRepository.ts",
  "lib/domain/work-orders/read/previewService.ts",
  "lib/domain/work-orders/read/previewRoute.ts",
  "components/workorder/preview/IssuedWorkOrderPreview.tsx",
  "components/workorder/preview/IssuedWorkOrderDocument.tsx",
  "components/workorder/preview/IssuedWorkOrderPreview.module.css",
  "app/(workspace)/workspace/workorders/[workOrderId]/revisions/[revisionId]/preview/page.tsx",
];
for (const file of files) assert.ok(fs.existsSync(path.join(root, file)), `missing alpha.28 file: ${file}`);
const repository = read(files[1]);
const service = read(files[2]);
const route = read(files[3]);
const component = `${read(files[4])}\n${read(files[5])}`;
const css = read(files[6]);
const models = read("lib/domain/work-orders/contracts/read-models.ts");
const runner = read("scripts/run-wafl-v2-alpha28-issued-preview.mjs");

assert.match(models, /export type WorkOrderIssuedPreviewReadModel/);
assert.match(repository, /const TARGET = `[^`]*r\.id = \$3::uuid[^`]*r\.work_order_id = w\.id/);
assert.match(repository, /JOIN work_order_revisions r ON \$\{TARGET\}/);
assert.match(repository, /r\.product_name_snapshot/);
assert.match(repository, /const params = \[input\.scope\.companyId, input\.workOrderId, input\.revisionId, input\.assignedCompanyMemberId\]/);
assert.match(repository, /const revisionParams = \[input\.scope\.companyId, input\.revisionId\]/);
const childQueries = [...repository.matchAll(/client\.query<DbQueryResultRow>\(`([\s\S]*?)`, revisionParams\)/g)].map((match) => match[1]);
assert.equal(childQueries.length, 7, "all seven Preview child queries must use the bounded revision parameter pair");
for (const [index, sql] of childQueries.entries()) {
  const placeholders = [...new Set([...sql.matchAll(/\$(\d+)/g)].map((match) => Number(match[1])))].sort((a, b) => a - b);
  assert.deepEqual(placeholders, [1, 2], `child query ${index + 1} must use contiguous company/revision placeholders`);
  assert.match(sql, /company_id\s*=\s*\$1/);
  assert.match(sql, /revision_id\s*=\s*\$2::uuid/);
}
assert.doesNotMatch(repository, /SELECT\s+\*\s+FROM\s+rows/i);
assert.match(repository, /withWaflV2TenantReadOnlyTransaction/);
assert.match(repository, /WORK_ORDER_V2_PREVIEW_QUERY_COUNT = 9/);
assert.doesNotMatch(repository, /storage_object_key|thumbnail_object_key|token_hash|signed_url|\bpartners\b/i);
assert.doesNotMatch(repository, /^\s*(INSERT|UPDATE|DELETE|MERGE|TRUNCATE|DROP|ALTER)\b/im);
assert.match(service, /DOCUMENT_NOT_READY/);
assert.match(service, /assignedCompanyMemberId/);
assert.doesNotMatch(service, /searchParams|get\("companyId"\)|get\("revisionId"\)/);
assert.match(route, /requireWorkspaceApiGuard\(\{ permissionCode: "workorder\.read" \}\)/);
assert.match(route, /getWorkOrderV2ReadRuntimeGuard/);
assert.match(route, /X-WAFL-Preview-Query-Count/);
const diagnostic = route.match(/console\.error\("\[WORK_ORDER_V2_PREVIEW_READ_FAILED\]"[^;]+;/)?.[0] ?? "";
assert.ok(diagnostic);
assert.doesNotMatch(diagnostic, /error\.message|storage|token|secret|query/i);
assert.match(component, /data-testid="issued-workorder-preview-a4"/);
assert.match(component, /window\.print\(\)/);
assert.match(component, /작업지시서/);
assert.doesNotMatch(component, /mock|QR|PDF 다운로드|storage/i);
assert.match(css, /@page\s+cover\s*\{\s*size:\s*A4 landscape/);
assert.match(css, /@page\s+content\s*\{\s*size:\s*A4 portrait/);
assert.match(css, /@media print/);
assert.match(css, /@media\s*\(max-width:\s*760px\)/);
assert.match(runner, /BEGIN READ ONLY/);
assert.match(runner, /method:GET/);
assert.doesNotMatch(runner, /method:\s*["'`](POST|PATCH|PUT|DELETE)/);
assert.doesNotMatch(runner, /^\s*(INSERT|UPDATE|DELETE|MERGE|TRUNCATE|DROP|ALTER)\b/im);
assert.match(runner, /fs\.readdirSync[\s\S]*db\/v2\/migrations/);
assert.match(runner, /read-only-preview-mutated-database/);
assert.match(runner, /MAX_SERVER_TAIL_BYTES = 12 \* 1024/);
assert.match(runner, /child\.stdout\.on\("data"/);
assert.match(runner, /child\.stderr\.on\("data"/);
assert.match(runner, /REDACTED_DB_URL/);
assert.match(runner, /child\.once\("close"/);
assert.match(runner, /await stopServer\(child\)/);
console.log("workorder v2 alpha.28 issued preview contract: PASS");
