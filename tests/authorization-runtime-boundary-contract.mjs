import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

const appRoutes = [
  "app/api/workorders/route.ts",
  "app/api/workorders/[workOrderId]/route.ts",
  "app/api/workorders/inventory-group/route.ts",
  "app/api/workorders/attachments/file/route.ts",
  "app/api/workorders/attachments/upload/route.ts",
  "app/api/workorders/attachments/upload/complete/route.ts",
  "app/api/workorders/attachments/primary/route.ts",
  "app/api/workorders/attachments/delete/route.ts",
  "app/api/admin/members/route.ts",
  "app/api/admin/members/[memberId]/route.ts",
  "app/api/admin/members/[memberId]/permissions/route.ts",
  "app/api/admin/files/trash/restore/route.ts",
  "app/api/admin/files/trash/purge/route.ts",
  "app/api/admin/files/workorders/restore/route.ts",
  "app/api/admin/files/workorders/purge/route.ts",
  "app/api/invitations/join-requests/[requestId]/approve/route.ts",
  "app/api/invitations/join-requests/[requestId]/reject/route.ts",
];

for (const routePath of appRoutes) {
  const source = read(routePath);
  assert.doesNotMatch(
    source,
    /requireApiPermission\(/,
    `${routePath} must not use header-preview permission guard`,
  );
}

const apiGuard = read("lib/auth/apiRouteGuards.ts");
assert.match(apiGuard, /WAFL_PERMISSION_DENIED/);
assert.match(apiGuard, /WAFL_NOT_FOUND/);
assert.match(apiGuard, /WAFL_RUNTIME_BLOCKED/);
assert.match(apiGuard, /Cache-Control": "no-store"/);
assert.match(apiGuard, /getValidatedWorkspaceMember/);
assert.match(apiGuard, /member\.userId !== session\.userId/);

const runtime = read("lib/runtime/serverRuntime.ts");
assert.match(runtime, /server-only/);
assert.match(runtime, /WAFL_SERVER_RUNTIME_MODE/);
assert.match(runtime, /VERCEL_ENV/);
assert.match(runtime, /NODE_ENV/);
assert.match(runtime, /return SERVER_RUNTIME_MODES\.production/);
assert.doesNotMatch(runtime, /NEXT_PUBLIC/);

const devConfig = read("lib/dev/testContext/config.ts");
assert.match(devConfig, /isServerDevTestRuntime/);
assert.match(devConfig, /WAFL_ENABLE_DEV_TEST_CONTEXT === "1"/);
assert.match(devConfig, /return "production"/);
assert.match(devConfig, /return "flag_disabled"/);
assert.doesNotMatch(devConfig, /NEXT_PUBLIC/);

const workOrderHandlers = read("lib/workorder/api/workOrderRouteHandlers.ts");
assert.match(workOrderHandlers, /validateOpaqueWorkOrderRouteParam/);
assert.match(workOrderHandlers, /createWaflNotFoundResponse/);
assert.doesNotMatch(workOrderHandlers, /spec_sheets row not found for id:\s*\$\{workOrderId\}/);

const opaque = read("lib/routing/opaqueRouteParams.ts");
assert.ok(opaque.includes("wo_[A-Za-z0-9_-"), "opaque route must accept future wo_ ids");
assert.match(opaque, /wafl-fn-company-\[a-j\]-workorder-\\d\{5\}/);
assert.match(opaque, /createWaflNotFoundResponse/);

const attachmentFile = read("lib/workorder/attachments/attachmentFileRoute.ts");
assert.match(attachmentFile, /MEMBER_PERMISSION_CODE\.storageRead/);
assert.match(attachmentFile, /requireWorkspaceApiGuard/);
assert.match(attachmentFile, /keyCompanyId !== companyId/);
assert.match(attachmentFile, /createWaflNotFoundResponse/);
assert.match(attachmentFile, /storage_key = \$2 OR thumbnail_key = \$2/);
assert.match(attachmentFile, /is_active = true/);
assert.match(attachmentFile, /deleted_at IS NULL/);

const primaryRoute = read("app/api/workorders/attachments/primary/route.ts");
assert.match(primaryRoute, /MEMBER_PERMISSION_CODE\.workorderUpdate/);
assert.match(primaryRoute, /companyId/);
assert.match(primaryRoute, /setPrimaryDesignAttachment\(\{/);

const attachmentRepo = read("lib/workorder/persistence/dbAttachmentRepository.ts");
assert.match(attachmentRepo, /company_id = \$3/);
assert.match(attachmentRepo, /company_id = \$2/);

for (const routePath of [
  "app/api/workorders/attachments/upload/route.ts",
  "app/api/workorders/attachments/upload/complete/route.ts",
  "app/api/workorders/attachments/primary/route.ts",
]) {
  const source = read(routePath);
  assert.match(source, /MEMBER_PERMISSION_CODE\.workorderUpdate/, `${routePath} must enforce server workorder update permission`);
  assert.match(source, /requireWorkspaceApiGuard/, `${routePath} must use server workspace guard`);
}

for (const routePath of [
  "app/api/admin/files/trash/restore/route.ts",
  "app/api/admin/files/trash/purge/route.ts",
  "app/api/admin/files/workorders/restore/route.ts",
  "app/api/admin/files/workorders/purge/route.ts",
  "app/api/workorders/attachments/delete/route.ts",
]) {
  const source = read(routePath);
  assert.match(source, /requireWorkspaceApiGuard/, `${routePath} must use server workspace guard`);
}

const r2Client = read("lib/storage/r2/r2Client.ts");
for (const errorLabel of [
  "R2_PUT_ERROR",
  "R2_GET_ERROR",
  "R2_DELETE_ERROR",
  "R2_PRESIGNED_DELETE_ERROR",
]) {
  const start = r2Client.indexOf(errorLabel);
  assert.notEqual(start, -1, `missing ${errorLabel}`);
  const block = r2Client.slice(start, r2Client.indexOf("});", start));
  assert.doesNotMatch(block, /bucketName|endpoint|,\s*key,/);
  assert.match(block, /hasKey/);
}

const roadmap = read("lib/internal/roadmap/roadmap-0.24.25.ts");
for (const token of [
  "Authorization, Runtime Boundary, and Opaque Routing",
  "IDOR tests using other-company identifiers",
  "Server-side permission enforcement",
  "Opaque workorder route parameter validation",
  "DB migration none",
  "Cloudflare Worker code change was added",
  "Operations dashboard UI cleanup was deferred",
]) {
  assert.ok(roadmap.includes(token), `roadmap 0.24.25 missing ${token}`);
}

console.log("authorization runtime boundary contract: OK");
