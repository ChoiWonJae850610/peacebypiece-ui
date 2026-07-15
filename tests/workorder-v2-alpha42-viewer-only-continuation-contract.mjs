import assert from "node:assert/strict";
import fs from "node:fs";

import {
  ALPHA42_COMPANY_C_FORBIDDEN_FIXTURE,
  ALPHA42_COMPANY_H_RESOURCE_HIDING_FIXTURE,
  ALPHA42_STORED_COMPANY_B_RESPONSE,
  ALPHA42_ZERO_CALL_COMPLETION_BUDGET,
  assertAlpha42NegativeIsolationZeroBudget,
  assertPublicViewerNotFoundResponse,
  assertWorkspaceForbiddenResponse,
  assertWorkspaceNotFoundResponse,
} from "../scripts/lib/alpha42-viewer-response-assertions.mjs";

const helper = fs.readFileSync("scripts/lib/local-viewer-server.mjs", "utf8");
const runtimeGuard = fs.readFileSync("lib/generated-documents/document-access/runtimeGuard.ts", "utf8");
const routeHelpers = fs.readFileSync("lib/generated-documents/document-access/routeHelpers.ts", "utf8");
const accessRoute = fs.readFileSync("app/api/v2/work-orders/documents/[documentRef]/access-tokens/route.ts", "utf8");
const service = fs.readFileSync("lib/generated-documents/document-access/service.ts", "utf8");
const repository = fs.readFileSync("lib/generated-documents/document-access/repository.ts", "utf8");
const apiGuards = fs.readFileSync("lib/auth/apiRouteGuards.ts", "utf8");
const companyGuard = fs.readFileSync("lib/billing/companyApiAccessGuard.ts", "utf8");
const runtimeRunner = fs.readFileSync("scripts/run-wafl-v2-alpha42-realistic-issued-embedded-qr-runtime.mjs", "utf8");

assert.match(helper, /server\.listen\(0, LOCAL_VIEWER_HOST/);
assert.match(helper, /LOCAL_VIEWER_HOST = "127\.0\.0\.1"/);
assert.match(helper, /WAFL_DOCUMENT_VIEWER_ORIGIN: origin/);
assert.match(helper, /WAFL_V2_DOCUMENT_VIEWER_ENABLED: "1"/);
assert.match(helper, /LOCAL_VIEWER_READINESS_PATH = "\/v"/);
assert.match(helper, /appPaths\["\/v\/page"\]/);
assert.match(helper, /redirect: "manual"/);
assert.match(helper, /cwd: rootDir/);
assert.match(helper, /node_modules\/next\/dist\/bin\/next", "start"/);
assert.doesNotMatch(helper, /rawToken|token_hash|storage_object_key|signedUrl/);
assert.doesNotMatch(helper, /-p", "2371"|localhost|0\.0\.0\.0/);
assert.match(helper, /ALPHA42_VIEWER_ONLY_REMAINING_BUDGET = Object\.freeze/);
for (const pair of [
  "pdfGet: 2",
  "tokenAccessUpdate: 1",
  "eventInsert: 1",
  "pdfPut: 0",
  "finalizeUpdate: 0",
  "receiptInsert: 0",
  "documentInsert: 0",
  "tokenInsert: 0",
  "imageRequest: 0",
  "r2Delete: 0",
]) assert.ok(helper.includes(pair), `missing viewer-only budget ${pair}`);

for (const code of [
  "PORT_ALREADY_IN_USE",
  "VIEWER_SERVER_PROCESS_EXITED",
  "VIEWER_SERVER_START_TIMEOUT",
  "VIEWER_READINESS_ROUTE_NOT_FOUND",
  "VIEWER_READINESS_REDIRECTED",
  "VIEWER_READINESS_FORBIDDEN",
  "VIEWER_ORIGIN_MISMATCH",
  "VIEWER_LOCAL_HOST_GUARD_REJECTED",
  "VIEWER_BUILD_OR_ROUTE_MANIFEST_MISSING",
]) assert.ok(helper.includes(code), `missing typed readiness reason ${code}`);

assert.match(runtimeGuard, /WAFL_V2_DOCUMENT_VIEWER_ENABLED !== "1"/);
assert.match(routeHelpers, /secure: new URL\(request\.url\)\.protocol === "https:"/);
assert.match(routeHelpers, /httpOnly: true/);
assert.match(routeHelpers, /sameSite: "lax"/);
assert.match(routeHelpers, /handlePublicDocumentFile\(request: Request, disposition: "inline" \| "attachment"\)/);

const publicFixture = {
  status: 404,
  body: { ok: false, error: { code: "NOT_FOUND", retryable: false } },
};
assert.doesNotThrow(() => assertPublicViewerNotFoundResponse(publicFixture));
assert.doesNotThrow(() => assertWorkspaceNotFoundResponse(ALPHA42_STORED_COMPANY_B_RESPONSE));
assert.doesNotThrow(() => assertWorkspaceNotFoundResponse(ALPHA42_COMPANY_H_RESOURCE_HIDING_FIXTURE));
assert.doesNotThrow(() => assertWorkspaceForbiddenResponse(ALPHA42_COMPANY_C_FORBIDDEN_FIXTURE));
assert.doesNotThrow(() => assertAlpha42NegativeIsolationZeroBudget(ALPHA42_ZERO_CALL_COMPLETION_BUDGET));

assert.throws(() => assertPublicViewerNotFoundResponse(ALPHA42_STORED_COMPANY_B_RESPONSE));
assert.throws(() => assertWorkspaceNotFoundResponse(publicFixture));
assert.throws(() => assertWorkspaceNotFoundResponse({ ...ALPHA42_STORED_COMPANY_B_RESPONSE, status: 200 }));
assert.throws(() => assertWorkspaceNotFoundResponse({ status: 404, body: { code: "NOT_FOUND" } }));
assert.throws(() => assertWorkspaceNotFoundResponse({
  status: 404,
  body: { code: "WAFL_NOT_FOUND", generatedDocumentId: "internal-id" },
}));
assert.throws(() => assertWorkspaceForbiddenResponse({
  status: 403,
  body: { code: "FORBIDDEN", error: "FORBIDDEN", reason: "approval_pending", accessBlocked: true },
}));
assert.throws(() => assertAlpha42NegativeIsolationZeroBudget({
  ...ALPHA42_ZERO_CALL_COMPLETION_BUDGET,
  pdfGet: 1,
}));

assert.match(accessRoute, /return handleListDocumentAccessTokens\(generatedDocumentId\)/);
const listHandler = routeHelpers.slice(
  routeHelpers.indexOf("export async function handleListDocumentAccessTokens"),
  routeHelpers.indexOf("export async function handleCreateDocumentAccessToken"),
);
assert.match(listHandler, /requireWorkspaceApiGuard\(\{ permissionCode: "workorder\.read" \}\)/);
assert.match(listHandler, /getDocumentShares/);
assert.doesNotMatch(listHandler, /readPublicDocumentPdf|redeemPublicDocumentToken|createDocumentShare|rotateDocumentShare|revokeDocumentShare/);
const listService = service.slice(
  service.indexOf("export async function getDocumentShares"),
  service.indexOf("export async function revokeDocumentShare"),
);
assert.match(listService, /permissionCode: "workorder\.read"/);
assert.match(listService, /listDocumentAccessTokens/);
const listRepository = repository.slice(
  repository.indexOf("export async function listDocumentAccessTokens"),
  repository.indexOf("export async function revokeDocumentAccessToken"),
);
assert.match(listRepository, /withWaflV2TenantReadOnlyTransaction/);
assert.match(listRepository, /company_id = \$1 AND id = \$2::uuid/);
assert.doesNotMatch(listRepository, /\bINSERT\b|\bUPDATE\b|\bDELETE\b/);
assert.match(apiGuards, /notFound: "WAFL_NOT_FOUND"/);
assert.match(apiGuards, /return createApiErrorResponse\([\s\S]*WAFL_API_ERROR_CODES\.notFound,[\s\S]*404/);
assert.match(companyGuard, /approvalPending: "COMPANY_APPROVAL_PENDING"/);
assert.match(companyGuard, /approvalPending: "approval_pending"/);
assert.match(companyGuard, /return 403/);
assert.match(runtimeRunner, /assertPublicViewerNotFoundResponse/);
assert.match(runtimeRunner, /assertWorkspaceNotFoundResponse/);
assert.match(runtimeRunner, /assertWorkspaceForbiddenResponse/);

const remainingBudget = Object.freeze({
  pdfGet: 2,
  tokenAccessUpdate: 1,
  eventInsert: 1,
  pdfPut: 0,
  finalizeUpdate: 0,
  receiptInsert: 0,
  documentInsert: 0,
  tokenInsert: 0,
  imageRequest: 0,
  r2Delete: 0,
});
assert.deepEqual(remainingBudget, {
  pdfGet: 2,
  tokenAccessUpdate: 1,
  eventInsert: 1,
  pdfPut: 0,
  finalizeUpdate: 0,
  receiptInsert: 0,
  documentInsert: 0,
  tokenInsert: 0,
  imageRequest: 0,
  r2Delete: 0,
});

console.log("workorder v2 alpha.42 viewer-only continuation contract: PASS");
