#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const read = (file) => fs.readFileSync(file, "utf8");
const helper = read("apps/mobile/features/work-orders/documents/currentRevisionDocumentState.ts");
const compiledHelper = ts.transpileModule(helper, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { resolveCurrentRevisionDocumentState } = await import(`data:text/javascript;base64,${Buffer.from(compiledHelper).toString("base64")}`);

const document = (id, revisionId, status, generationNumber = 1) => ({
  id,
  revisionId,
  status,
  generationNumber,
  documentType: "factory_instruction",
  displayDocumentNumber: id,
  fileSizeBytes: status === "generated" ? 100 : null,
  generatedAt: status === "generated" ? "2026-09-11T00:00:00.000Z" : null,
  accessTokenAvailable: false,
  inlineUrl: status === "generated" ? `/documents/${id}` : null,
  downloadUrl: status === "generated" ? `/documents/${id}?download=1` : null,
});

const revisionA = "revision-a";
const revisionB = "revision-b";
const historicalGenerated = document("a-generated", revisionA, "generated");
const historicalFailed = document("a-failed", revisionA, "failed", 2);

const none = resolveCurrentRevisionDocumentState([historicalGenerated, historicalFailed], revisionB);
assert.deepEqual(none.documents, []); // 1 filter before status
assert.equal(none.generated, null); // 2 historical generated excluded
assert.equal(none.failed, null); // 3 historical failed excluded
assert.equal(none.state, "none"); // 4 no current document

const currentGenerated = document("b-generated", revisionB, "generated", 3);
const generated = resolveCurrentRevisionDocumentState([historicalGenerated, currentGenerated], revisionB);
assert.equal(generated.generated?.id, "b-generated"); // 5 current generated
assert.equal(generated.state, "generated"); // 6 generated state

const currentPending = document("b-pending", revisionB, "pending", 4);
const pending = resolveCurrentRevisionDocumentState([historicalGenerated, currentPending], revisionB);
assert.equal(pending.pending?.id, "b-pending"); // 7 current pending
assert.equal(pending.state, "pending"); // 8 pending state

const currentFailed = document("b-failed", revisionB, "failed", 5);
const failed = resolveCurrentRevisionDocumentState([historicalGenerated, currentFailed], revisionB);
assert.equal(failed.failed?.id, "b-failed"); // 9 current failed
assert.equal(failed.state, "failed"); // 10 failed state

const ordered = resolveCurrentRevisionDocumentState([
  document("b-generated-newest", revisionB, "generated", 8),
  document("b-generated-older", revisionB, "generated", 7),
  currentPending,
  currentFailed,
], revisionB);
assert.equal(ordered.generated?.id, "b-generated-newest"); // 11 endpoint order
assert.equal(ordered.state, "generated"); // 12 status precedence
assert.equal(ordered.pending, null); // 13 Stage 2B newest generation supersedes older pending
assert.equal(ordered.failed, null); // 14 Stage 2B newest generation supersedes older failed

const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const detailRepository = read("lib/domain/work-orders/read/detailRepository.ts");
const issuedPreview = read("components/workorder/preview/IssuedWorkOrderPreview.tsx");
const generationService = read("lib/generated-documents/work-order-pdf/generationService.ts");
const immutableMigration = read("db/v2/migrations/005_v2_documents_access_events.sql");
const verifySafe = read("tools/pipeline/verify-safe.ps1");
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const migrations = fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name));

assert.doesNotMatch(helper, /react|requestJson|fetch\s*\(/u); // 15 pure helper
assert.match(helper, /filter\(\(document\) => document\.revisionId === currentRevisionId\)/u); // 16 revision first
assert.match(workbench, /resolveCurrentRevisionDocumentWorkbenchModel\(documents, detail\.header\.currentRevisionId, currentArtifactHealth\)/u); // 17 extended one owner + artifact health
assert.doesNotMatch(workbench, /documents\.find\(\(item\) => item\.status === "generated"\)/u); // 18 broad generated removed
assert.doesNotMatch(workbench, /documents\.find\(\(item\) => item\.status === "failed"\)/u); // 19 broad failed removed
assert.match(workbench, /const \{ generated, pending: pendingDocument \} = currentDocumentState/u); // 20 actions bind projection
assert.match(workbench, /prepareAuthenticatedDocumentPdfForSave\([\s\S]*documentId: saveTarget\.id/u); // 21 save current
assert.match(workbench, /createDocumentShare\(shareTarget\.id/u); // 22 share current
assert.match(workbench, /documentId=\{currentDocumentState\.viewerDocumentId \?\? undefined\}/u); // 23 viewer current
assert.match(workbench, /loadTokensForCurrentDocument\(model\.tokenTarget\)/u); // 24 token current and healthy
assert.match(workbench, /currentGeneratedDocumentIdRef/u); // 25 token identity
assert.match(workbench, /tokenLoadGenerationRef/u); // 26 async generation guard
assert.match(workbench, /key=\{`\$\{detail\.header\.id\}:\$\{detail\.header\.currentRevisionId\}:/u); // 27 revision transition resets local state
assert.match(workbench, /if \(!document\)[\s\S]{0,140}setTokens\(\[\]\)/u); // 28 no current generated clears tokens
assert.match(workbench, /current-revision-document-pending[\s\S]{0,100}PDF를 생성 중입니다/u); // 29 pending UI
assert.match(workbench, /current-revision-document-none[\s\S]{0,120}현재 리비전의 PDF가 없습니다/u); // 30 none UI
assert.match(workbench, /currentDocumentState\.canRetry[\s\S]{0,180}PDF 다시 생성/u); // 31 failed retry
const retryBody = workbench.slice(workbench.indexOf("async function retryGeneration"), workbench.indexOf("async function shareDocument"));
assert.match(retryBody, /generateAndReconcile/u); // 31 generation-only retry
assert.doesNotMatch(retryBody, /issueWorkOrderR0/u); // 32 no reissue
assert.match(detailRepository, /LEFT JOIN generated_documents d[\s\S]*d\.work_order_id = t\.id[\s\S]*ORDER BY d\.created_at DESC/u); // 33 history endpoint retained
assert.match(issuedPreview, /item\.revisionId === revisionId && item\.status === "generated"/u); // 34 web exact revision
assert.match(generationService, /work_order_revision_id=\$2::uuid[\s\S]*status='generated'[\s\S]*status='pending'/u); // 35 generation exact revision
assert.match(generationService, /pg_advisory_xact_lock/u); // 36 advisory lock
assert.match(generationService, /work_order_command_receipts/u); // 37 idempotency receipt
assert.match(immutableMigration, /generated_documents_immutable_guard/u); // 38 immutable guard
assert.match(verifySafe, /workorder-v2-alpha67-pdf-generation-retry-public-viewer-contract\.mjs/u); // 39 retry regression
assert.match(verifySafe, /workorder-v2-alpha78-finalization-contract\.mjs/u); // 40 alpha78 regression
assert.equal(migrations.length, 22); // 41 migration delta zero
assert.equal(appConfig.expo.extra.appVersion, "2.0.0-alpha.79"); // 42 finalized current version
for (const dependency of ["@shopify/react-native-skia", "react-native-reanimated", "react-native-gesture-handler", "react-native-worklets"]) {
  assert.equal(mobilePackage.dependencies[dependency], undefined); // 43-46 dependency boundary
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha79-current-revision-artifact-identity",
  assertions: 47,
  checkpoint: "ALPHA79_CURRENT_REVISION_ARTIFACT_IDENTITY_IPHONE_IPAD_QA_REQUIRED",
  currentRevisionStates: [none.state, pending.state, failed.state, generated.state],
  migrationLedgerExpected: "22/22",
  appVersion: "2.0.0-alpha.79",
  physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
}));
