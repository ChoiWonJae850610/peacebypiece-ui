#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ALPHA42_REALISTIC_FIXTURE, assertAlpha42RealisticFixture } from "../lib/generated-documents/work-order-pdf/realisticIssuedFixture.mjs";
import { deriveEmbeddedQrOpaqueToken } from "../lib/generated-documents/document-access/tokenDerivation.mjs";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const migration = read("db/v2/migrations/012_v2_document_access_token_purpose.sql");
const migrationRunner = read("scripts/run-wafl-v2-alpha42-token-purpose-migration.mjs");
const runtimeRunner = read("scripts/run-wafl-v2-alpha42-realistic-issued-embedded-qr-runtime.mjs");
const imageTransport = read("scripts/lib/alpha42-representative-image.mjs");
const constants = read("lib/generated-documents/document-access/constants.ts");
const repository = read("lib/generated-documents/document-access/repository.ts");
const service = read("lib/generated-documents/document-access/service.ts");
const token = read("lib/generated-documents/document-access/token.ts");
const snapshot = read("lib/generated-documents/work-order-pdf/snapshot.ts");
const renderContext = read("lib/generated-documents/work-order-pdf/embeddedQrRenderContext.mjs");
const renderer = read("lib/generated-documents/work-order-pdf/localChromiumRenderer.mts");
const localRenderInput = read("lib/generated-documents/work-order-pdf/localRenderInputCore.mjs");
const documentRenderer = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
const generatedPreview = read("components/workorder/preview/GeneratedIssuedWorkOrderPreview.tsx");
const renderRoute = read("app/dev/workorder-pdf-render/[runToken]/page.tsx");
const fixture = assertAlpha42RealisticFixture(ALPHA42_REALISTIC_FIXTURE);

const version = read("lib/constants/version.ts").match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
assert.ok(new Set(["2.0.0-alpha.41", "2.0.0-alpha.42", "2.0.0-alpha.43", "2.0.0-alpha.44", "2.0.0-alpha.45", "2.0.0-alpha.46", "2.0.0-alpha.47", "2.0.0-alpha.48", "2.0.0-alpha.49", "2.0.0-alpha.50", "2.0.0-alpha.51"]).has(version), "alpha.42 checkpoint/final version invalid");

assert.match(migration, /ADD COLUMN token_purpose text NOT NULL DEFAULT 'manual_share'/);
assert.match(migration, /token_purpose IN \('manual_share', 'embedded_qr'\)/);
assert.match(migration, /CREATE UNIQUE INDEX document_access_tokens_one_embedded_qr_per_document_idx/);
assert.match(migration, /ON public\.document_access_tokens \(company_id, generated_document_id\)/);
assert.match(migration, /WHERE token_purpose = 'embedded_qr'/);
assert.doesNotMatch(migration, /\b(?:DROP|TRUNCATE|DELETE|UPDATE)\b/i);
assert.equal(fs.readdirSync(path.join(root, "db/v2/migrations")).filter((name) => /^\d{3}_.*\.sql$/.test(name)).length, fs.existsSync(path.join(root, "db/v2/migrations/013_v2_material_line_archive_lifecycle.sql")) ? 13 : 12);

assert.match(migrationRunner, /const FILE = "012_v2_document_access_token_purpose\.sql"/);
assert.match(migrationRunner, /before\.ledger\.length, 11/);
assert.match(migrationRunner, /after\.ledger\.length, 12/);
assert.match(migrationRunner, /MODE === "apply"/);
assert.match(migrationRunner, /BEGIN READ ONLY/);
assert.match(migrationRunner, /read-only-mode-approval-forbidden/);
assert.match(migrationRunner, /target-fingerprint-mismatch/);

assert.match(constants, /DOCUMENT_ACCESS_DEFAULT_EXPIRY_DAYS = 7/);
assert.match(constants, /DOCUMENT_ACCESS_MAX_EXPIRY_DAYS = 30/);
assert.match(constants, /DOCUMENT_EMBEDDED_QR_EXPIRY_DAYS = 365/);
assert.match(constants, /DOCUMENT_MANUAL_SHARE_PURPOSE = "manual_share"/);
assert.match(constants, /DOCUMENT_EMBEDDED_QR_PURPOSE = "embedded_qr"/);
assert.match(repository, /token_purpose = 'manual_share'/);
assert.match(repository, /insertEmbeddedQrAccessToken[\s\S]*?token_purpose[\s\S]*?VALUES \(\$1, \$2::uuid, \$3::char\(64\), \$4::timestamptz, \$5\)[\s\S]*?DOCUMENT_EMBEDDED_QR_PURPOSE/);
assert.match(repository, /insertEmbeddedQrAccessToken/);
assert.match(service, /createEmbeddedQrAccessToken/);
assert.match(service, /DOCUMENT_EMBEDDED_QR_EXPIRY_DAYS/);
assert.match(service, /insertEmbeddedQrAccessToken/);
assert.doesNotMatch(repository, /raw_token/i);

const derived = deriveEmbeddedQrOpaqueToken("alpha42-contract-secret", {
  companyId: "wafl-fn-company-a",
  generatedDocumentId: "00000000-0000-4000-8000-000000000042",
  commandCode: "work_order.document.embedded_qr.create",
  idempotencyKey: "alpha42-contract-key",
});
assert.match(derived, /^[A-Za-z0-9_-]{43}$/);
assert.equal(derived, deriveEmbeddedQrOpaqueToken("alpha42-contract-secret", {
  companyId: "wafl-fn-company-a",
  generatedDocumentId: "00000000-0000-4000-8000-000000000042",
  commandCode: "work_order.document.embedded_qr.create",
  idempotencyKey: "alpha42-contract-key",
}));
assert.match(token, /deriveEmbeddedQrAccessToken/);
assert.match(token, /scopeEmbeddedQrAccessIdempotencyKey/);

assert.match(snapshot, /embeddedQrPolicy\?/);
assert.match(snapshot, /tokenPurpose: "embedded_qr"/);
assert.match(snapshot, /viewerOriginPolicy: "controlled-fragment-viewer"/);
assert.doesNotMatch(snapshot, /rawToken|tokenHash|viewerUrl|qrSvg/);
assert.match(renderContext, /x-wafl-pdf-embedded-qr/);
assert.match(renderContext, /base64url/);
assert.match(renderContext, /url\.pathname !== "\/v"/);
assert.match(renderer, /extraHTTPHeaders/);
assert.match(renderer, /embeddedQrVisible/);
assert.match(renderer, /PDF_RENDER_ROUTE_NOT_FOUND/);
assert.match(renderer, /PDF_RENDER_ROUTE_FORBIDDEN/);
assert.match(renderer, /PDF_RENDER_ROUTE_REDIRECTED/);
assert.match(renderer, /PDF_RENDER_ROUTE_SERVER_ERROR/);
assert.match(renderer, /slice\(0, 1_000\)/);
assert.match(renderer, /rowSplitViolationCount/);
assert.match(localRenderInput, /writeLocalIssuedPdfRenderInput/);
assert.match(localRenderInput, /getLocalIssuedPdfRenderInputPath\(runToken\)/);
assert.match(localRenderInput, /PDF_RENDER_INPUT_NOT_FOUND/);
assert.match(localRenderInput, /PDF_RENDER_INPUT_INVALID/);
assert.match(renderRoute, /decodeEmbeddedQrRenderContext/);
assert.match(renderRoute, /createQrSvg\(embeddedQrContext\.viewerUrl\)/);
assert.match(generatedPreview, /embeddedQr/);
assert.match(documentRenderer, /data-wafl-embedded-qr="true"/);
assert.equal((documentRenderer.match(/data-wafl-embedded-qr="true"/g) ?? []).length, 1);
assert.match(documentRenderer, /PageNumberFooter pageNumber=\{1\}/);

assert.equal(fixture.productName, "리넨 라운드 셔츠 원피스");
assert.equal(fixture.totalQuantity, 144);
assert.equal(fixture.materials.filter((item) => item.type === "fabric").length, 2);
assert.equal(fixture.materials.filter((item) => item.type === "accessory").length, 4);
assert.equal(fixture.colors.length, 3);
assert.equal(fixture.sizes.length, 3);
assert.equal(fixture.sizeSpec.rows.length, 5);
assert.equal(fixture.processes.length, 4);
assert.ok(fixture.factoryDeliveryMemo.includes("성수 어패럴"));
assert.equal(Object.values(fixture.matrix).flatMap((row) => Object.values(row)).reduce((sum, value) => sum + value, 0), 144);
assert.equal(fixture.image.sourcePath, "public/dev-samples/linen-round-dress-sketch.svg");
assert.match(imageTransport, /OUTPUT_FILENAME = "linen-round-dress-sketch\.png"/);
assert.match(imageTransport, /OUTPUT_MIME_TYPE = "image\/png"/);
assert.match(imageTransport, /extension: "\.png"/);
assert.match(imageTransport, /fileSizeBytes: bytes\.byteLength/);
assert.match(imageTransport, /deviceScaleFactor: 1/);
assert.match(imageTransport, /contentSha256: sha256\(bytes\)/);

assert.match(runtimeRunner, /legacy_source_id=\$3/);
assert.match(runtimeRunner, /RETURNING id/g);
assert.doesNotMatch(runtimeRunner, /randomUUID\(|md5\([^)]*\)::uuid/i);
assert.match(runtimeRunner, /workOrders: 1, revisions: 1/);
assert.match(runtimeRunner, /materials: 6, colors: 3, sizes: 3, matrix: 9/);
assert.match(runtimeRunner, /sizeSpecs: 1, specSizes: 3, specPoms: 5, specValues: 15/);
assert.match(runtimeRunner, /receipts: 3, events: 5/);
assert.match(runtimeRunner, /imageR2Put: 1, pdfR2Put: 1/);
assert.match(runtimeRunner, /imageR2Get: 3, pdfR2Get: 3, r2GetTotal: 6/);
assert.match(runtimeRunner, /continuationMutationBudget/);
assert.match(runtimeRunner, /workOrders: 0, revisions: 0, workOrderPointerUpdates: 0/);
assert.match(runtimeRunner, /receipts: 2, events: 4, generatedDocuments: 1, embeddedTokens: 1/);
assert.match(runtimeRunner, /ALPHA42_CONTINUATION_PREFLIGHT_PASS/);
assert.match(runtimeRunner, /preflightR2Get: \{ image: 1, pdf: 0, total: 1 \}/);
assert.match(runtimeRunner, /a30FactR2Integrity: "PASS_BY_EXISTING_RUNTIME_AND_DB_METADATA_EVIDENCE"/);
assert.match(runtimeRunner, /WORKER_FILE_POLICY_REJECTED/);
assert.match(runtimeRunner, /imageFilename: image\.filename/);
assert.match(runtimeRunner, /imageMimeType: image\.mimeType/);
assert.match(runtimeRunner, /writeLocalIssuedPdfRenderInput/);
assert.match(runtimeRunner, /canonicalSnapshotJson: canonicalSnapshot/);
assert.match(runtimeRunner, /snapshotSha256/);
assert.match(runtimeRunner, /objectKeyPlan: objectKey/);
assert.doesNotMatch(runtimeRunner, /RENDER_INPUT_DIR/);
assert.match(runtimeRunner, /createR2CallAudit/);
assert.match(runtimeRunner, /recordR2Call\(audit, assetKind, "get"\)/);
assert.match(runtimeRunner, /recordR2Call\(audit, assetKind, "put", key\)/);
assert.match(runtimeRunner, /assertR2CallBudget\(r2Audit\)/);
assert.match(runtimeRunner, /imageGet: 3, imagePut: 1,[\s\S]*?pdfGet: 3, pdfPut: 1,[\s\S]*?totalGet: 6, totalPut: 2,[\s\S]*?delete: 0/);
assert.match(runtimeRunner, /r2Audit\.putKeys\.includes\(a30Baseline\.storageObjectKey\), false/);
assert.match(runtimeRunner, /SET LOCAL ROLE wafl_v2_tenant_runtime/);
assert.match(runtimeRunner, /tenantClaims[\s\S]*?SELECT document_code, business_timezone[\s\S]*?FROM public\.wafl_v2_document_number_settings\(\)/);
assert.doesNotMatch(runtimeRunner, /SELECT document_code,business_timezone[\s\S]*?FROM public\.company_settings/);
assert.match(runtimeRunner, /has_function_privilege[\s\S]*?wafl_v2_document_number_settings/);
assert.match(runtimeRunner, /acl\.grantee = 0[\s\S]*?acl\.privilege_type = 'EXECUTE'/);
assert.match(runtimeRunner, /has_table_privilege[\s\S]*?public\.company_settings[\s\S]*?'SELECT'/);
assert.match(runtimeRunner, /DOCUMENT_NUMBER_SETTINGS_NOT_READY/);
assert.match(runtimeRunner, /DOCUMENT_NUMBER_SETTINGS_INVALID/);
assert.match(runtimeRunner, /verifyIssueApiIdempotency/);
assert.match(runtimeRunner, /issue-api-conflict-status-mismatch/);
assert.match(runtimeRunner, /issue-api-conflict-code-mismatch/);
assert.match(runtimeRunner, /expected: "409 CONFLICT", actual: "409 CONFLICT", deltaZero: true/);
assert.match(runtimeRunner, /verifyGenerationRequestShaConflict/);
assert.match(runtimeRunner, /qrPlacementVersion: "cover-top-right\/conflict-proof"/);
assert.match(runtimeRunner, /actual, "IDEMPOTENCY_CONFLICT"/);
assert.match(runtimeRunner, /generation-request-sha-conflict-code-mismatch/);
assert.match(runtimeRunner, /verifyInvalidTokenAndTenantIsolation/);
assert.match(runtimeRunner, /assertPublicViewerNotFoundResponse\(\{ status: invalid\.response\.status, body: invalid\.body \}/);
assert.match(runtimeRunner, /const CROSS_TENANTS = \[COMPANY_B, COMPANY_H\]/);
assert.match(runtimeRunner, /assertWorkspaceNotFoundResponse\(\{ status: result\.response\.status, body: result\.body \}/);
assert.match(runtimeRunner, /assertWorkspaceForbiddenResponse\(\{ status: companyC\.response\.status, body: companyC\.body \}/);
assert.match(runtimeRunner, /tenantTargetVisibility/);
assert.match(runtimeRunner, /work_orders: 0, revisions: 0, documents: 0, tokens: 0/);
assert.match(runtimeRunner, /assertPublicPayloadSafe/);
assert.match(runtimeRunner, /loadTargetMutationLedger/);
assert.match(runtimeRunner, /issue-api-idempotency-mutated-ledger/);
assert.match(runtimeRunner, /no-op-verification-mutated-target-ledger/);
assert.match(runtimeRunner, /a30FactSnapshot/);
assert.match(runtimeRunner, /generated_document_status/);
assert.match(runtimeRunner, /storage_object_key,g\.file_size_bytes,g\.content_sha256/);
assert.match(runtimeRunner, /token_purpose='manual_share'/);
assert.match(runtimeRunner, /a30fact-baseline-mutated/);
assert.match(runtimeRunner, /a30fact-manual-share-token-baseline-mismatch/);
assert.match(runtimeRunner, /runtime-approval-missing/);
assert.match(runtimeRunner, /read-only-mode-approval-forbidden/);
assert.match(runtimeRunner, /generation-replay-not-noop/);
assert.match(runtimeRunner, /rawTokenPersisted: false/);
assert.match(runtimeRunner, /viewerUrlPersisted: false/);
assert.match(runtimeRunner, /assertR2Absent\(config, imageKey, r2Audit, "image"\)/);
assert.match(runtimeRunner, /assertR2Absent\(config, objectKey, r2Audit, "pdf"\)/);
assert.doesNotMatch(runtimeRunner, /method:\s*"DELETE"|fetch\([^)]*DELETE|DELETE\s+FROM|\.delete\(/i);

console.log("workorder v2 alpha.42 realistic issued embedded QR contract: PASS");
