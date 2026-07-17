import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const migration = read("db/v2/migrations/010_v2_generated_document_receipt_link.sql");
const migrationRunner = read("scripts/run-wafl-v2-alpha38-document-receipt-migration.mjs");
const runtimeRunner = read("scripts/run-wafl-v2-alpha38-pdf-r2-runtime.mjs");
const repository = read("lib/generated-documents/work-order-pdf/generationRepository.ts");
const transport = read("lib/generated-documents/work-order-pdf/r2WorkerTransport.ts");
const renderer = read("lib/generated-documents/work-order-pdf/localChromiumRenderer.mts");
const renderInput = read("lib/generated-documents/work-order-pdf/localRenderInputCore.mjs");
const renderPage = read("app/dev/workorder-pdf-render/[runToken]/page.tsx");
const renderComponent = read("components/workorder/preview/GeneratedIssuedWorkOrderPreview.tsx");
const sampleRenderComponent = read("components/workorder/preview/SampleIssuedWorkOrderPreview.tsx");
const version = read("lib/constants/version.ts").match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
const mobileVersion = read("apps/mobile/constants/version.ts").match(/MOBILE_APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const publicVersion = version.replace(/-.+$/, "");
const expectedVersions = process.env.WAFL_ALPHA38_PREFINAL_CONTRACT === "1"
  ? ["2.0.0-alpha.37"]
  : ["2.0.0-alpha.38", "2.0.0-alpha.39", "2.0.0-alpha.40", "2.0.0-alpha.41", "2.0.0-alpha.42", "2.0.0-alpha.43"];

assert.ok(expectedVersions.includes(version));
assert.equal(mobileVersion, version);
assert.match(publicVersion, /^\d+\.\d+\.\d+$/);
assert.equal(appConfig.expo.version, publicVersion);
assert.equal(appConfig.expo.extra.appVersion, version);

assert.match(migration, /result_generated_document_id uuid/);
assert.match(migration, /FOREIGN KEY \(company_id, result_generated_document_id\)/);
assert.match(migration, /REFERENCES public\.generated_documents \(company_id, id\)/);
assert.match(migration, /ON DELETE RESTRICT/);
assert.match(migration, /NOT VALID/);
assert.match(migration, /2\.0\.0-alpha\.38-dev-test-reviewed/);
assert.doesNotMatch(migration, /^\s*(?:CREATE TABLE|CREATE INDEX|DROP|TRUNCATE|DELETE|UPDATE)\b/im);
assert.doesNotMatch(migration, /result_generated_document_id\s+(?:text|varchar)/i);

assert.match(migrationRunner, /ledger-must-be-9-before-010/);
assert.match(migrationRunner, /migration-manifest-order-invalid/);
assert.match(migrationRunner, /superuser-forbidden/);
assert.match(migrationRunner, /target-fingerprint-mismatch/);
assert.match(migrationRunner, /v1_baseline_fingerprint/);
assert.match(migrationRunner, /Existing receipt non-null count: 0/);

assert.match(repository, /PreparePendingGeneratedDocumentInput/);
assert.match(repository, /Promise<PreparedGeneratedDocument>/);
assert.match(repository, /result_generated_document_id/);
assert.match(repository, /RETURNING id, company_id, work_order_id/);
assert.match(repository, /FOR UPDATE/);
assert.match(repository, /pg_advisory_xact_lock/);
assert.match(repository, /COALESCE\(MAX\(generation_no\), 0\) \+ 1/);
const pendingInsert = repository.match(/insertPending:\s*`([\s\S]*?)`/)?.[1] ?? "";
assert.doesNotMatch(pendingInsert, /INSERT INTO generated_documents \(\s*id,/i);
assert.match(pendingInsert, /RETURNING id/);
assert.doesNotMatch(repository, /randomUUID|deterministicUuid/i);

assert.match(transport, /createR2WorkerUploadUrl/);
assert.match(transport, /createR2WorkerFileUrl/);
assert.match(transport, /application\/pdf/);
assert.match(transport, /PDF_R2_DELETE_DISABLED_ALPHA38/);
assert.doesNotMatch(transport, /createR2WorkerDeleteUrl|method:\s*"DELETE"/);
assert.match(renderer, /workorder-pdf-render/);
assert.match(renderer, /waitUntil: "domcontentloaded"/);
assert.match(renderer, /data-wafl-pdf-ready/);
assert.match(renderer, /document\.fonts\.ready/);
assert.match(renderer, /pageRootCount/);
assert.doesNotMatch(renderer, /waitUntil: "networkidle"/);
assert.match(renderInput, /\.tmp.*wafl-v2-alpha38.*render-input/s);
assert.match(renderInput, /\^\[a-f0-9\]\{32\}\$/);
assert.match(renderPage, /assertLocalOnlyRouteHost/);
assert.match(renderComponent, /IssuedWorkOrderDocument/);
assert.match(renderComponent, /data-wafl-pdf-snapshot-sha/);
assert.match(renderComponent, /data-wafl-pdf-ready="true"/);
assert.match(sampleRenderComponent, /data-wafl-pdf-ready="true"/);
assert.match(renderComponent, /id="wafl-pdf-snapshot"/);

assert.match(runtimeRunner, /actual-issued-a30fact-target-missing/);
assert.match(runtimeRunner, /createWorkOrderIssuedPdfSnapshot/);
assert.match(runtimeRunner, /LocalChromiumIssuedWorkOrderPdfRenderer/);
assert.match(runtimeRunner, /INSERT INTO public\.generated_documents/);
assert.doesNotMatch(runtimeRunner, /INSERT INTO public\.generated_documents \(\s*id,/i);
assert.match(runtimeRunner, /RETURNING id, company_id/);
assert.match(runtimeRunner, /result_generated_document_id=\$6::uuid/);
assert.match(runtimeRunner, /IDEMPOTENCY_CONFLICT/);
assert.match(runtimeRunner, /IDEMPOTENCY_RECEIPT_INCOMPLETE/);
assert.match(runtimeRunner, /IDEMPOTENCY_DOCUMENT_MISSING/);
assert.match(runtimeRunner, /replay\.replay, true/);
assert.match(runtimeRunner, /R2 object key:/);
assert.match(runtimeRunner, /workerRequest\(config, "PUT"/);
assert.match(runtimeRunner, /workerRequest\(config, "GET"/);
assert.doesNotMatch(runtimeRunner, /workerRequest\(config, "DELETE"/);
assert.doesNotMatch(runtimeRunner, /randomUUID/);
assert.match(runtimeRunner, /r2-environment-fingerprint-mismatch/);
assert.match(runtimeRunner, /cross-tenant-document-leak/);
assert.match(runtimeRunner, /duplicateReplayDelta: 0/);
assert.match(runtimeRunner, /retained: true/);
assert.match(runtimeRunner, /partialMutation: false/);
assert.match(runtimeRunner, /productionMutation: false/);
assert.match(runtimeRunner, /CONTINUATION_GENERATED_DOCUMENT_ID/);
assert.match(runtimeRunner, /CONTINUATION_OBJECT_KEY/);
assert.match(runtimeRunner, /isContinuation\s*\?\s*\{ replay: false, document: await auditGenerated/);
assert.match(runtimeRunner, /continuation-object-already-exists/);

console.log("workorder-v2-alpha38-pdf-r2-runtime-contract: PASS");
