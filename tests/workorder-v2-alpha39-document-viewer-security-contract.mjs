#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const migration = read("db/v2/migrations/011_v2_document_access_viewer_functions.sql");
const constants = read("lib/generated-documents/document-access/constants.ts");
const token = read("lib/generated-documents/document-access/token.ts");
const session = read("lib/generated-documents/document-access/session.ts");
const repository = read("lib/generated-documents/document-access/repository.ts");
const service = read("lib/generated-documents/document-access/service.ts");
const routes = read("lib/generated-documents/document-access/routeHelpers.ts");
const viewer = read("app/v/DocumentViewerClient.tsx");
const qrSource = read("lib/generated-documents/document-access/qr.ts");
const runtime = read("scripts/run-wafl-v2-alpha39-document-viewer-runtime.mjs");
const previewTargetRoutePath = "app/api/v2/work-orders/documents/[documentRef]/preview-target/route.ts";
const accessTokenRoutePath = "app/api/v2/work-orders/documents/[documentRef]/access-tokens/route.ts";
const accessTokenRevokeRoutePath = "app/api/v2/work-orders/documents/[documentRef]/access-tokens/[tokenId]/revoke/route.ts";
const accessTokenRotateRoutePath = "app/api/v2/work-orders/documents/[documentRef]/access-tokens/[tokenId]/rotate/route.ts";
const previewTargetRoute = read(previewTargetRoutePath);
const accessTokenRoute = read(accessTokenRoutePath);
const accessTokenRevokeRoute = read(accessTokenRevokeRoutePath);
const accessTokenRotateRoute = read(accessTokenRotateRoutePath);
const packageJson = read("package.json");
const pipeline = read("tools/pipeline/peacebypiece-auto-pipeline.ps1");

assert.match(migration, /CREATE OR REPLACE FUNCTION public\.wafl_v2_redeem_document_access_token\(/);
assert.match(migration, /CREATE OR REPLACE FUNCTION public\.wafl_v2_read_document_access_session\(/);
assert.equal((migration.match(/SECURITY DEFINER/g) ?? []).length, 2);
assert.equal((migration.match(/SET search_path = pg_catalog, public/g) ?? []).length, 2);
assert.match(migration, /REVOKE ALL ON FUNCTION public\.wafl_v2_redeem_document_access_token[\s\S]+FROM PUBLIC/);
assert.match(migration, /REVOKE ALL ON FUNCTION public\.wafl_v2_read_document_access_session[\s\S]+FROM PUBLIC/);
assert.equal((migration.match(/GRANT EXECUTE ON FUNCTION/g) ?? []).length, 2);
assert.doesNotMatch(migration.replace(/^\s*--.*$/gm, ""), /\bEXECUTE\s+format\s*\(/i, "dynamic SQL is forbidden");
assert.doesNotMatch(migration, /\b(?:ALTER TABLE|CREATE TABLE|CREATE INDEX|DROP|TRUNCATE|DELETE FROM)\b/i);
assert.match(migration, /token\.access_count \+ 1/);
assert.match(migration, /redeemed\.access_count = 1/);
assert.match(migration, /'pdf\.share_viewed'/);

assert.match(constants, /DOCUMENT_ACCESS_DEFAULT_EXPIRY_DAYS = 7/);
assert.match(constants, /DOCUMENT_VIEWER_SESSION_MAX_AGE_SECONDS = 15 \* 60/);
assert.match(constants, /\^\[A-Za-z0-9_-\]\{43\}\$/);
assert.match(token, /createHmac\("sha256"/);
assert.match(token, /document-share-token:v1/);
assert.match(token, /toString\("base64url"\)/);
assert.match(token, /createHash\("sha256"\).*digest\("hex"\)/s);
assert.match(token, /new URL\("\/v", origin\)/);
assert.match(token, /url\.hash = `t=\$\{rawToken\}`/);
assert.doesNotMatch(token, /url\.searchParams|\/v\/\$\{rawToken\}/);

assert.match(session, /wafl-document-viewer-session:v1/);
assert.match(session, /timingSafeEqual/);
assert.match(routes, /httpOnly: true/);
assert.match(routes, /sameSite: "lax"/);
assert.match(routes, /Cache-Control": "private, no-store"/);
assert.match(routes, /genericPublicNotFound/);
assert.match(routes, /Content-Disposition/);
assert.doesNotMatch(routes, /redirect\(|signedUrl|storageObjectKey:/);
assert.match(viewer, /window\.location\.hash/);
assert.match(viewer, /history\.replaceState/);
assert.match(viewer, /method: "POST"/);
assert.match(viewer, /\/api\/public\/document-viewer\/file/);
assert.match(viewer, /\/api\/public\/document-viewer\/download/);

for (const routePath of [previewTargetRoutePath, accessTokenRoutePath, accessTokenRevokeRoutePath, accessTokenRotateRoutePath]) {
  assert.ok(fs.existsSync(path.join(root, routePath)), `missing shared documentRef route: ${routePath}`);
}
assert.equal(fs.existsSync(path.join(root, "app/api/v2/work-orders/documents/[documentNumber]")), false);
assert.equal(fs.existsSync(path.join(root, "app/api/v2/work-orders/documents/[generatedDocumentId]")), false);
assert.match(previewTargetRoute, /params: Promise<\{ documentRef: string \}>/);
assert.match(previewTargetRoute, /documentRef: documentNumber/);
assert.match(previewTargetRoute, /resolveIssuedPreviewTarget\(\{ documentNumber,/);
for (const routeSource of [accessTokenRoute, accessTokenRevokeRoute, accessTokenRotateRoute]) {
  assert.match(routeSource, /documentRef: generatedDocumentId/);
}
assert.match(service, /DOCUMENT_ACCESS_UUID_PATTERN/);
assert.match(service, /assertUuid\(input\.generatedDocumentId\)/);

assert.match(repository, /INSERT INTO document_access_tokens[\s\S]+RETURNING id/);
assert.doesNotMatch(repository, /INSERT INTO document_access_tokens\s*\([^)]*\bid\b/i);
assert.match(repository, /token_hash/);
assert.doesNotMatch(repository, /raw_token|signed_url|viewer_url/i);
for (const eventCode of ["pdf.shared", "pdf.share_viewed", "pdf.share_revoked"]) {
  assert.ok(`${constants}\n${migration}`.includes(eventCode), `missing event ${eventCode}`);
}
assert.match(service, /workorder\.read/);
assert.match(service, /workorder\.update/);
assert.match(service, /R2WorkerGeneratedDocumentTransport/);
assert.doesNotMatch(service, /\.put\(|\.delete\(/);

assert.match(qrSource, /QR Code Model 2/);
assert.match(qrSource, /error correction level M/);
assert.match(qrSource, /for \(let mask = 1; mask < 8/);
assert.match(qrSource, /const quietZone = 4/);
assert.doesNotMatch(packageJson, /"qrcode"|"qr-code"/i);
const qrJavaScript = ts.transpileModule(qrSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { createQrCode, createQrSvg } = await import(`data:text/javascript;base64,${Buffer.from(qrJavaScript).toString("base64")}`);
const qrPayload = "http://localhost:3000/v#t=" + "A".repeat(43);
const qrA = createQrCode(qrPayload);
const qrB = createQrCode(qrPayload);
assert.deepEqual(qrA, qrB, "QR matrix must be deterministic");
assert.equal(qrA.size, qrA.version * 4 + 17);
assert.ok(qrA.mask >= 0 && qrA.mask < 8);
assert.ok(qrA.modules[0].slice(0, 7).filter(Boolean).length > 0, "finder pattern missing");
const svg = createQrSvg(qrPayload);
assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
assert.doesNotMatch(svg, /<text|AAAAAA/);

assert.match(runtime, /token-row-delta-mismatch/);
assert.match(runtime, /share-receipt-row-delta-mismatch/);
assert.match(runtime, /incomplete-share-receipt-detected/);
assert.match(runtime, /state\.tokens\.length, 2/);
assert.match(runtime, /pdf\.shared"\], 2/);
assert.match(runtime, /pdf\.share_viewed"\], 2/);
assert.match(runtime, /pdf\.share_revoked"\], 1/);
assert.match(runtime, /R2 GET only; PUT\/DELETE 0/);
assert.match(runtime, /generated document\/production mutation 0/);
assert.match(runtime, /approved-r2-fingerprints-missing/);
assert.match(runtime, /BEGIN READ ONLY; SET LOCAL ROLE wafl_v2_tenant_runtime/);
assert.match(runtime, /public_execute/);
assert.match(runtime, /runtime_execute/);
assert.match(runtime, /generation-receipt-baseline-mismatch/);
assert.match(runtime, /share-receipt-baseline-not-empty/);
assert.match(runtime, /verifyTenantIsolation/);
assert.match(runtime, /createR2WorkerSignedUrl/);
assert.match(runtime, /r2-readiness-sha-mismatch/);
assert.match(runtime, /r2GetCount: r2Readiness\.getCount/);
assert.match(runtime, /WAFL_V2_ALPHA39_REUSE_R2_READINESS_EVIDENCE/);
assert.match(runtime, /r2-readiness-evidence-fingerprint-invalid/);
assert.match(runtime, /SERVER_READY_TIMEOUT_MS = 30_000/);
assert.match(runtime, /SERVER_READY_POLL_MS = 250/);
assert.match(runtime, /server-route-manifest-conflict:document-dynamic-slug/);
assert.match(runtime, /server-readiness-timeout:first=/);
assert.match(runtime, /viewer-session-cookie-http-only-missing/);
assert.match(runtime, /viewer-session-cookie-same-site-invalid/);
assert.match(runtime, /public-viewer-internal-identity-leak/);
assert.doesNotMatch(runtime, /method:\s*"PUT"|method:\s*"DELETE"/);
assert.match(pipeline, /function AddAlpha39DocumentViewerRepoStateSections/);
assert.match(pipeline, /historical alpha\.38 approved dev\/test PUT 1 retained/);
assert.match(pipeline, /approved dev\/test migration 011 applied once/);

for (const forbidden of ["raw_token", "signed_url", "viewer_url"]) {
  assert.doesNotMatch(migration, new RegExp(`\\b${forbidden}\\b`, "i"));
}

console.log("workorder v2 alpha.39 document viewer security contract: PASS");
