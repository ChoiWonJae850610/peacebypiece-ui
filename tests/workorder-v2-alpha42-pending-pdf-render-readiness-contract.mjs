#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const runner = read("scripts/run-wafl-v2-alpha42-pending-pdf-render-readiness.mjs");
const runtimeRunner = read("scripts/run-wafl-v2-alpha42-realistic-issued-embedded-qr-runtime.mjs");
const inputCore = read("lib/generated-documents/work-order-pdf/localRenderInputCore.mjs");
const inputWrapper = read("lib/generated-documents/work-order-pdf/localRenderInput.ts");
const renderer = read("lib/generated-documents/work-order-pdf/localChromiumRenderer.mts");
const rendererType = read("lib/generated-documents/work-order-pdf/renderer.ts");
const route = read("app/dev/workorder-pdf-render/[runToken]/page.tsx");
const provider = read("components/auth/CurrentUserProvider.tsx");

assert.match(inputCore, /getLocalIssuedPdfRenderInputPath/);
assert.match(inputCore, /writeLocalIssuedPdfRenderInput/);
assert.match(inputCore, /readLocalIssuedPdfRenderInput/);
assert.equal((inputCore.match(/\.tmp", "wafl-v2-alpha38", "render-input"/g) ?? []).length, 1);
assert.match(inputCore, /PDF_RENDER_INPUT_NOT_FOUND/);
assert.match(inputCore, /PDF_RENDER_INPUT_INVALID/);
assert.match(inputCore, /actualSnapshotSha256 !== parsed\.snapshotSha256/);
assert.match(inputWrapper, /^import "server-only";/);
assert.match(inputWrapper, /from "\.\/localRenderInputCore\.mjs"/);
assert.doesNotMatch(inputCore, /server-only|next\/headers|next\/cookies/);
assert.match(runtimeRunner, /writeLocalIssuedPdfRenderInput/);
assert.match(runtimeRunner, /localRenderInputCore\.mjs/);
assert.doesNotMatch(runtimeRunner, /wafl-v2-alpha38\/render-input/);
assert.match(runtimeRunner, /canonicalSnapshotJson: canonicalSnapshot/);
assert.match(runtimeRunner, /objectKeyPlan: objectKey/);

for (const code of [
  "PDF_RENDER_ROUTE_NOT_FOUND",
  "PDF_RENDER_ROUTE_FORBIDDEN",
  "PDF_RENDER_ROUTE_REDIRECTED",
  "PDF_RENDER_ROUTE_SERVER_ERROR",
]) assert.ok(renderer.includes(code), `missing renderer diagnostic ${code}`);
assert.match(renderer, /status=\$\{status\}/);
assert.match(renderer, /contentType=/);
assert.match(renderer, /finalPath=/);
assert.match(renderer, /bodyPrefix=/);
assert.match(renderer, /slice\(0, 1_000\)/);
assert.match(renderer, /rowSplitViolationCount/);
assert.match(rendererType, /renderRouteStatus: number/);
assert.match(rendererType, /renderRoutePathname: string/);
assert.match(rendererType, /rowSplitViolationCount: number/);
assert.match(route, /assertLocalOnlyRouteHost/);
assert.match(route, /readLocalIssuedPdfRenderInput/);
assert.match(provider, /pathname\.startsWith\("\/dev\/workorder-pdf-render\/"\)/);

assert.match(runner, /BEGIN READ ONLY/);
assert.match(runner, /generated_status,\s*"pending"/);
assert.match(runner, /row\.snapshot/);
assert.match(runner, /serializeWorkOrderIssuedPdfSnapshot\(snapshot\)/);
assert.match(runner, /hashWorkOrderIssuedPdfSnapshot\(snapshot\)/);
assert.match(runner, /deriveEmbeddedQrOpaqueToken/);
assert.match(runner, /EMBEDDED_QR_TOKEN_REDERIVATION_MISMATCH/);
assert.match(runner, /String\(row\.token_hash\)\.trim\(\)/);
assert.match(runner, /method: "GET"/);
assert.equal((runner.match(/method: "GET"/g) ?? []).length, 1);
assert.doesNotMatch(runner, /method:\s*"(?:PUT|DELETE)"/);
assert.doesNotMatch(runner, /\b(?:INSERT INTO|UPDATE public\.|DELETE FROM|TRUNCATE|DROP TABLE)\b/i);
assert.match(runner, /writeLocalIssuedPdfRenderInput/);
assert.match(runner, /readLocalIssuedPdfRenderInput/);
assert.match(runner, /localRenderInputCore\.mjs/);
assert.doesNotMatch(runner, /localRenderInput\.ts/);
assert.match(runner, /LocalChromiumIssuedWorkOrderPdfRenderer/);
assert.match(runner, /representativeImageVisible, true/);
assert.match(runner, /embeddedQrVisible, true/);
assert.match(runner, /rowSplitViolationCount, 0/);
assert.match(runner, /consoleErrorCount, 0/);
assert.match(runner, /failedRequestCount, 0/);
assert.match(runner, /pdfR2Object: "ABSENT_BY_READ_ONLY_AUDIT_20260715_191508"/);
assert.match(runner, /dbMutation: false/);
assert.match(runner, /r2Put: 0/);
assert.match(runner, /r2Delete: 0/);
assert.match(runner, /rawTokenPersisted: false/);
assert.match(runner, /viewerUrlPersisted: false/);
assert.doesNotMatch(runner, /console\.log\([^\n]*(?:rawToken|viewerUrl|token_hash|image_key)/);

console.log("workorder v2 alpha.42 pending PDF render readiness contract: PASS");
