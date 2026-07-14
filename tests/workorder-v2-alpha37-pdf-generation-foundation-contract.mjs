import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const version = read("lib/constants/version.ts");
const mobileVersion = read("apps/mobile/constants/version.ts");
const appJson = read("apps/mobile/app.json");
const mobilePackage = read("apps/mobile/package.json");
const mobileLock = read("apps/mobile/package-lock.json");
const constants = read("lib/generated-documents/work-order-pdf/constants.ts");
const pdfContract = read("lib/generated-documents/work-order-pdf/pdfContract.mjs");
const snapshot = read("lib/generated-documents/work-order-pdf/snapshot.ts");
const assets = read("lib/generated-documents/work-order-pdf/assets.ts");
const rendererPort = read("lib/generated-documents/work-order-pdf/renderer.ts");
const chromiumRenderer = read("lib/generated-documents/work-order-pdf/localChromiumRenderer.mts");
const storePort = read("lib/generated-documents/work-order-pdf/objectStore.ts");
const localStore = read("lib/generated-documents/work-order-pdf/localFilesystemObjectStore.mts");
const repository = read("lib/generated-documents/work-order-pdf/generationRepository.ts");
const sampleFoundation = read("lib/generated-documents/work-order-pdf/sampleFoundation.ts");
const samplePage = read("app/dev/workorder-preview-sample/page.tsx");
const snapshotRoute = read("app/dev/workorder-pdf-snapshot/route.ts");
const sampleRenderer = read("components/workorder/preview/SampleIssuedWorkOrderPreview.tsx");
const documentRenderer = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
const css = read("components/workorder/preview/IssuedWorkOrderPreview.module.css");
const runner = read("scripts/run-wafl-v2-alpha37-pdf-foundation.mjs");
const migration004 = read("db/v2/migrations/004_v2_assets_revision_linkage.sql");
const migration005 = read("db/v2/migrations/005_v2_documents_access_events.sql");
const oldWorkOrderPdf = read("lib/workorder/serverWorkorderPdf.ts");
const oldOrderRequestPdf = read("lib/workorder/serverOrderRequestPdf.ts");
const evidence = read("docs/project/app-v2/34-issued-revision-pdf-generation-foundation-evidence.md");
const agents = read("AGENTS.md");
const verifySafe = read("tools/pipeline/verify-safe.ps1");
const pipeline = read("tools/pipeline/peacebypiece-auto-pipeline.ps1");

const currentVersion = version.match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
assert.ok(["2.0.0-alpha.37", "2.0.0-alpha.38", "2.0.0-alpha.39", "2.0.0-alpha.40"].includes(currentVersion));
assert.match(mobileVersion, new RegExp(currentVersion.replaceAll(".", "\\.")));
assert.equal(JSON.parse(appJson).expo.version, currentVersion);
assert.equal(JSON.parse(appJson).expo.extra.appVersion, currentVersion);
assert.equal(JSON.parse(mobilePackage).version, currentVersion);
assert.equal(JSON.parse(mobileLock).version, currentVersion);
assert.equal(JSON.parse(mobileLock).packages[""].version, currentVersion);

assert.match(constants, /from "\.\/pdfContract\.mjs"/);
assert.match(pdfContract, /WORK_ORDER_PDF_RENDERER_VERSION\s*=\s*"wafl-work-instruction-pdf\/1"/);
assert.match(pdfContract, /WORK_ORDER_PDF_DTO_SCHEMA_VERSION\s*=\s*1/);
assert.match(pdfContract, /WORK_ORDER_PDF_DOCUMENT_TYPE\s*=\s*"factory_instruction"/);
assert.match(pdfContract, /10 \* 1024 \* 1024/);

assert.match(snapshot, /WorkOrderIssuedPreviewReadModel/);
assert.match(snapshot, /PDF_REVISION_NOT_FINALIZED/);
assert.match(snapshot, /PDF_DOCUMENT_NUMBER_MISSING/);
assert.match(snapshot, /PDF_PREVIEW_NOT_READY/);
assert.match(snapshot, /PDF_ASSET_SCOPE_INVALID/);
assert.match(snapshot, /PDF_TENANT_SCOPE_INVALID/);
assert.match(snapshot, /Object\.keys\(value\)\.sort\(\)/);
assert.match(snapshot, /Buffer\.isBuffer/);
assert.match(snapshot, /Number\.isFinite/);
assert.match(snapshot, /createHash\("sha256"\)/);
assert.match(snapshot, /storageObjectKeySnapshot/);
assert.doesNotMatch(snapshot, /signedUrl|DATABASE_URL|rawToken|sessionToken/i);

assert.match(assets, /GeneratedDocumentAssetResolver/);
assert.match(assets, /isRepresentative/);
assert.match(assets, /includeInDocument/);
assert.match(assets, /PDF_ASSET_HASH_MISMATCH/);
assert.match(assets, /image\/svg\+xml/);
assert.match(assets, /linen-round-dress-sketch\.svg/);
assert.doesNotMatch(assets, /R2_WORKER|createR2Worker|fetch\(/);

assert.match(rendererPort, /interface IssuedWorkOrderPdfRenderer/);
assert.match(rendererPort, /pdf: Buffer/);
assert.match(rendererPort, /pageOrientations/);
assert.match(chromiumRenderer, /from "@playwright\/test"/);
assert.match(chromiumRenderer, /preferCSSPageSize: input\.options\.preferCssPageSize/);
assert.match(chromiumRenderer, /printBackground: input\.options\.printBackground/);
assert.match(chromiumRenderer, /PDF_HEADER/);
assert.match(chromiumRenderer, /PDF_EOF/);
assert.match(chromiumRenderer, /getDocument/);
assert.match(chromiumRenderer, /inspection\.pageOrientations\[0\] !== "landscape"/);
assert.match(chromiumRenderer, /orientation !== "portrait"/);
assert.match(chromiumRenderer, /local-chromium/);
assert.doesNotMatch(chromiumRenderer, /external|WAFLOW_PDF_GENERATOR_URL|R2_WORKER|DATABASE_URL/);

assert.match(samplePage, /createAlpha37SamplePdfFoundation/);
assert.match(samplePage, /assertLocalOnlyRouteHost\(\)/);
assert.match(sampleRenderer, /IssuedWorkOrderDocument/);
assert.match(sampleRenderer, /data-wafl-pdf-snapshot-sha/);
assert.match(sampleRenderer, /id="wafl-pdf-snapshot"/);
assert.match(documentRenderer, /data-page-orientation="landscape"/);
assert.match(documentRenderer, /data-page-orientation="portrait"/);
assert.match(css, /@page cover \{ size: A4 landscape/);
assert.match(css, /@page content \{ size: A4 portrait/);
assert.match(css, /break-inside: avoid/);
assert.doesNotMatch(`${sampleFoundation}\n${samplePage}\n${documentRenderer}`, /serverWorkorderPdf|serverOrderRequestPdf|orderRequestHtmlDocument/);
assert.match(oldWorkOrderPdf, /buildWorkorderPdfHtml/);
assert.match(oldOrderRequestPdf, /buildOrderRequestServerPdf/);

assert.match(snapshotRoute, /isLocalOnlyRouteHostAllowed/);
assert.match(snapshotRoute, /status: 404/);
assert.match(snapshotRoute, /Cache-Control/);
assert.doesNotMatch(snapshotRoute, /POST|PATCH|PUT|DELETE|DATABASE_URL|R2_/);

assert.match(storePort, /interface GeneratedDocumentObjectStore/);
assert.match(storePort, /R2WorkerGeneratedDocumentObjectStore/);
assert.match(storePort, /GeneratedDocumentR2Transport/);
assert.doesNotMatch(storePort, /process\.env|fetch\(|createR2WorkerUploadUrl/);
assert.match(localStore, /PDF_OBJECT_OVERWRITE_FORBIDDEN/);
assert.match(localStore, /flag: "wx"/);
assert.match(localStore, /PDF_OBJECT_INTEGRITY_INVALID/);
assert.match(localStore, /CANONICAL_PDF_KEY/);

assert.match(repository, /GeneratedDocumentGenerationRepository/);
assert.match(repository, /GENERATED_DOCUMENT_COMMAND_CODE = "work_order\.document\.generate"/);
assert.match(repository, /pg_advisory_xact_lock/);
assert.match(repository, /allocateGenerationNoAfterLock/);
assert.match(repository, /COALESCE\(MAX\(generation_no\), 0\) \+ 1/);
assert.match(repository, /ON CONFLICT \(company_id, command_code, idempotency_key\) DO NOTHING/);
assert.match(repository, /status = 'generated'/);
assert.match(repository, /status = 'failed'/);
assert.match(repository, /PDF_DB_WRITE_NOT_ENABLED_ALPHA37/);
assert.doesNotMatch(repository, /SELECT\s+\*/i);
assert.doesNotMatch(repository, /DELETE\s+FROM|DROP\s+|TRUNCATE\s+/i);
assert.doesNotMatch(repository, /from "@\/lib\/db\/client"|withWaflV2TenantWriteTransaction/);

for (const token of [
  "generation_no", "storage_object_key", "file_size_bytes", "content_sha256",
  "renderer_version", "dto_schema_version", "snapshot", "failure_code",
  "pending", "generated", "failed",
]) assert.match(migration005, new RegExp(token));
assert.match(migration005, /generated_documents_generation_unique/);
assert.match(migration005, /generated_documents_immutable_guard/);
assert.match(migration004, /work_order_revision_images/);
assert.match(migration004, /work_order_revision_attachments/);
assert.match(migration004, /storage_object_key_snapshot/);

assert.match(runner, /LocalChromiumIssuedWorkOrderPdfRenderer/);
assert.match(runner, /LocalFilesystemGeneratedDocumentObjectStore/);
assert.match(runner, /result: "ALPHA37_PDF_FOUNDATION_PASS"/);
assert.match(runner, /pageCount, 3/);
assert.match(runner, /\["landscape", "portrait", "portrait"\]/);
assert.match(runner, /snapshotSha256Repeat/);
assert.match(runner, /SKIPPED_WITH_REASON/);
assert.match(runner, /DBMutation: false/);
assert.match(runner, /R2Mutation: false/);
assert.match(runner, /WorkerExecution: false/);
assert.match(runner, /productionMutation: false/);
assert.doesNotMatch(runner, /generated_documents|domain_events|work_order_command_receipts|R2_WORKER_UPLOAD_URL/);

assert.match(evidence, /LEVEL_4_FOUNDATION_VERIFIED/);
assert.match(evidence, /SKIPPED_WITH_REASON/);
assert.match(evidence, /DB data mutation: false/);
assert.match(evidence, /R2 mutation: false/);
assert.match(evidence, /Worker execution: false/i);
assert.match(evidence, /generated_documents` pending row: \+1/);
assert.match(agents, /34-issued-revision-pdf-generation-foundation-evidence\.md/);
assert.match(verifySafe, /workorder v2 alpha\.37 PDF generation foundation static contract/);
assert.match(pipeline, /AddAlpha37PdfFoundationRepoStateSections/);
assert.match(pipeline, /Alpha\.37 Snapshot SHA-256/);
assert.match(pipeline, /Alpha\.38 Approval Handoff ZIP/);

console.log("workorder-v2-alpha37-pdf-generation-foundation-contract: PASS");
