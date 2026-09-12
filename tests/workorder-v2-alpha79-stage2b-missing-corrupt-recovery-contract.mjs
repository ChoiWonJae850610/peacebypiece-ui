#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import ts from "typescript";

import { isExternalQaPathAllowed, isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";
import { MAKER_QA_APPROVAL } from "../lib/external-qa/makerQaCapabilities.mjs";

const read = (file) => fs.readFileSync(file, "utf8");
const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const importSource = (source) => import(`data:text/javascript;base64,${Buffer.from(compile(source)).toString("base64")}`);

const coreSource = read("lib/generated-documents/work-order-pdf/artifactHealthCore.ts");
const healthSource = read("lib/generated-documents/work-order-pdf/artifactHealth.ts");
const stateSource = read("apps/mobile/features/work-orders/documents/currentRevisionDocumentState.ts");
const generation = read("lib/generated-documents/work-order-pdf/generationService.ts");
const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const healthRoute = read("app/api/v2/work-orders/documents/[documentRef]/health/route.ts");
const fileRoute = read("lib/generated-documents/work-order-pdf/internalFileRoute.ts");
const devRoute = read("app/api/dev/a79-stage2b-artifact-state/route.ts");
const devRunner = read("scripts/run-wafl-v2-alpha79-stage2b-missing-corrupt-recovery.mjs");
const immutableMigration = read("db/v2/migrations/005_v2_documents_access_events.sql");
const verifySafe = read("tools/pipeline/verify-safe.ps1");
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));

const { classifyGeneratedDocumentArtifact } = await importSource(coreSource);
const { resolveCurrentRevisionDocumentState, resolveCurrentRevisionDocumentWorkbenchModel } = await importSource(stateSource);
const pdf = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n", "ascii");
const metadata = {
  documentId: "doc-healthy",
  objectKey: "generated/company/revision/doc.pdf",
  fileSizeBytes: pdf.byteLength,
  contentSha256: createHash("sha256").update(pdf).digest("hex"),
};

assert.equal(classifyGeneratedDocumentArtifact({ metadata, body: pdf }), "healthy"); // 1
assert.equal(classifyGeneratedDocumentArtifact({ metadata, body: null }), "missing"); // 2
assert.equal(classifyGeneratedDocumentArtifact({ metadata: { ...metadata, fileSizeBytes: pdf.byteLength + 1 }, body: pdf }), "corrupt"); // 3
assert.equal(classifyGeneratedDocumentArtifact({ metadata: { ...metadata, contentSha256: "0".repeat(64) }, body: pdf }), "corrupt"); // 4
assert.equal(classifyGeneratedDocumentArtifact({ metadata, body: Buffer.from("not-a-pdf%%EOF") }), "corrupt"); // 5
assert.equal(classifyGeneratedDocumentArtifact({ metadata: { ...metadata, objectKey: null }, body: pdf }), "corrupt"); // 6
assert.equal(classifyGeneratedDocumentArtifact({ metadata: { ...metadata, contentSha256: null }, body: pdf }), "corrupt"); // 7
assert.match(healthSource, /return message === "PDF_R2_CONTENT_TYPE_INVALID" \? "corrupt" : "transient_error"/u); // 8
assert.doesNotMatch(coreSource, /timeout|network|fetch/u); // 9 pure classifier

const doc = (id, revisionId, status, generationNumber) => ({
  id, revisionId, status, generationNumber, documentType: "factory_instruction",
  displayDocumentNumber: id, fileSizeBytes: status === "generated" ? 100 : null,
  generatedAt: status === "generated" ? "2026-09-12T00:00:00.000Z" : null,
  accessTokenAvailable: false, inlineUrl: status === "generated" ? `/documents/${id}` : null,
  downloadUrl: status === "generated" ? `/documents/${id}?disposition=attachment` : null,
});
const revision = "revision-current";
const oldGenerated = doc("generated-n", revision, "generated", 1);
const newPending = doc("pending-n1", revision, "pending", 2);
const newFailed = doc("failed-n1", revision, "failed", 2);
const newGenerated = doc("generated-n1", revision, "generated", 2);

assert.equal(resolveCurrentRevisionDocumentState([oldGenerated, newPending], revision).state, "pending"); // 10
assert.equal(resolveCurrentRevisionDocumentState([oldGenerated, newPending], revision).pending?.id, "pending-n1"); // 11
assert.equal(resolveCurrentRevisionDocumentState([oldGenerated, newFailed], revision).state, "failed"); // 12
assert.equal(resolveCurrentRevisionDocumentState([oldGenerated, newFailed], revision).failed?.id, "failed-n1"); // 13
assert.equal(resolveCurrentRevisionDocumentState([oldGenerated, newGenerated], revision).state, "generated"); // 14
assert.equal(resolveCurrentRevisionDocumentState([oldGenerated, newGenerated], revision).generated?.id, "generated-n1"); // 15
assert.equal(resolveCurrentRevisionDocumentState([doc("other", "historical", "generated", 99), oldGenerated], revision).generated?.id, "generated-n"); // 16
assert.deepEqual(resolveCurrentRevisionDocumentState([newGenerated, oldGenerated], revision).documents.map((item) => item.id), ["generated-n1", "generated-n"]); // 17

const healthy = resolveCurrentRevisionDocumentWorkbenchModel([oldGenerated], revision, "healthy");
const missing = resolveCurrentRevisionDocumentWorkbenchModel([oldGenerated], revision, "missing");
const corrupt = resolveCurrentRevisionDocumentWorkbenchModel([oldGenerated], revision, "corrupt");
const transient = resolveCurrentRevisionDocumentWorkbenchModel([oldGenerated], revision, "transient_error");
assert.equal(healthy.canView && healthy.canSave && healthy.canShare, true); // 18
assert.equal(healthy.tokenTarget?.id, "generated-n"); // 19
assert.equal(missing.canView || missing.canSave || missing.canShare, false); // 20
assert.equal(missing.viewTarget ?? missing.saveTarget ?? missing.shareTarget ?? missing.tokenTarget, null); // 21
assert.equal(missing.canRetry, true); // 22
assert.equal(missing.retryTarget?.id, "generated-n"); // 23
assert.equal(corrupt.canView || corrupt.canSave || corrupt.canShare, false); // 24
assert.equal(corrupt.viewerTarget ?? corrupt.tokenTarget, null); // 25
assert.equal(corrupt.canRetry, true); // 26
assert.equal(transient.artifactUnavailable, false); // 27
assert.equal(transient.canRetry, false); // 28
assert.equal(transient.canView, true); // 29 ambiguous transport is not confirmed corrupt

assert.match(generation, /ORDER BY generation_no DESC, id DESC/u); // 30 newest attempt owner
assert.match(generation, /generatedHealth === "healthy" && input\.refreshActive !== true/u); // 31 healthy reuse
assert.match(generation, /generatedHealth === "transient_error"[\s\S]*GENERATION_FAILED/u); // 32 ambiguity stops
assert.match(generation, /INSERT INTO generated_documents/u); // 33 recovery N+1 insert
assert.match(generation, /COALESCE\(max\(generation_no\), 0\) \+ 1/u); // 34 generation increment
assert.doesNotMatch(generation, /UPDATE generated_documents[\s\S]{0,220}SET status='pending'/u); // 35 generated never pending
assert.doesNotMatch(generation, /UPDATE generated_documents[\s\S]{0,220}status='generated'[\s\S]{0,220}status='failed'/u); // 36 generated never failed
assert.match(generation, /current\.status === "generated" && generatedHealth === null[\s\S]*CONFLICT/u); // 37 race cannot create N+2
assert.match(generation, /pg_advisory_xact_lock/u); // 38 concurrency serialization
assert.match(generation, /work_order_command_receipts/u); // 39 idempotency receipt
assert.match(immutableMigration, /generated_documents_immutable_guard/u); // 40 immutable DB guard
assert.doesNotMatch(generation, /DELETE FROM generated_documents/u); // 41 old row retained

assert.match(healthRoute, /requireCurrentRevision: true/u); // 42 current revision only
assert.doesNotMatch(healthRoute, /objectKey|storage_object_key|request\.json|searchParams\.get\("force"\)/u); // 43 caller key/force absent
assert.match(healthSource, /work_order_id=\$2::uuid AND work_order_revision_id=\$3::uuid/u); // 44 same work order/revision
assert.match(healthSource, /ORDER BY generation_no DESC, id DESC LIMIT 1/u); // 45 latest generated inspection
assert.match(fileRoute, /classifyGeneratedDocumentArtifact/u); // 46 file route shares integrity owner
assert.match(coreSource, /%PDF-/u); // 47 header validation
assert.match(coreSource, /%%EOF/u); // 48 terminal validation

assert.match(workbench, /getGeneratedDocumentArtifactHealth/u); // 49 explicit health read
assert.match(workbench, /current-revision-document-unavailable/u); // 50 unavailable message
assert.match(workbench, /PDF 파일을 확인할 수 없습니다\./u); // 51 owner copy
assert.match(workbench, /currentDocumentState\.canRetry[\s\S]{0,180}PDF 다시 생성/u); // 52 recovery action
assert.match(workbench, /currentDocumentState\.viewerTarget/u); // 53 viewer newest target
assert.match(workbench, /currentDocumentState\.tokenTarget/u); // 54 token newest target
assert.doesNotMatch(workbench.match(/async function retryGeneration[\s\S]*?\n  }/)?.[0] ?? "", /issueWorkOrderR0/u); // 55 no reissue

assert.match(verifySafe, /workorder-v2-alpha79-current-revision-artifact-identity-contract\.mjs/u); // 56 Stage 1 retained
assert.match(verifySafe, /workorder-v2-alpha79-stage1-physical-harness-contract\.mjs/u); // 57 Stage 1.5 retained
assert.match(verifySafe, /workorder-v2-alpha79-stage2a-failure-retry-r2-cleanup-contract\.mjs/u); // 58 Stage 2A retained
assert.match(verifySafe, /workorder-v2-alpha78-sketch-pdf-output-fidelity-contract\.mjs/u); // 59 alpha.78 retained
assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length, 22); // 60 migration zero
assert.equal(appConfig.expo.extra.appVersion, "2.0.0-alpha.79"); // 61 finalized current version
for (const dependency of ["@shopify/react-native-skia", "react-native-reanimated", "react-native-gesture-handler", "react-native-worklets"]) {
  assert.equal(mobilePackage.dependencies[dependency], undefined); // 62-65 dependency boundary
}
assert.doesNotMatch(generation, /revokeGenerated|DELETE FROM generated_documents/u); // 66 Stage 2B generation never revokes or deletes historical rows; Stage 3A is an independent command owner
assert.match(devRoute, /assertLocalOnlyRouteHost\(\)/u); // 67 DEV exact route local only
assert.match(devRoute, /externalQa\.enabled[\s\S]*externalQa\.production/u); // 68 production fail closed
assert.match(devRoute, /FIXTURE_NAMES[\s\S]*QA A79 generated missing recovery[\s\S]*QA A79 generated corrupt recovery/u); // 69 exact fixtures
assert.match(devRoute, /DELETE_EXACT_GENERATED_OBJECT[\s\S]*store\.deletePdf\(metadata\.objectKey\)/u); // 70 exact missing delete
assert.match(devRoute, /CORRUPT_EXACT_GENERATED_OBJECT[\s\S]*A79_STAGE2B_DETERMINISTIC_CORRUPT_ARTIFACT/u); // 71 exact corrupt overwrite
assert.match(devRoute, /unrelatedMutation: 0/u); // 72 unrelated mutation zero
assert.match(devRunner, /QA A79 generated missing recovery/u); // 73 physical missing fixture
assert.match(devRunner, /QA A79 generated corrupt recovery/u); // 74 automated corrupt fixture
assert.match(devRunner, /Promise\.all\([\s\S]*generate\(missingFixture, replayKey\)/u); // 75 same-key concurrency
assert.match(devRunner, /missingRecovered\.generationNumber, missingN\.generationNumber \+ 1/u); // 76 missing N+1
assert.match(devRunner, /corruptRecovered\.generationNumber, corruptN\.generationNumber \+ 1/u); // 77 corrupt N+1
assert.match(devRunner, /finalPhysicalHealth: "missing"/u); // 78 physical fixture terminal state
assert.match(devRunner, /issueEventDelta: missingAfter\.issueEvents - missingBefore\.issueEvents/u); // 79 Recipe issue delta evidence
assert.match(devRunner, /productionOwnerAmbiguousBusinessMutation: \[0, 0, 0\]/u); // 80 mutation boundary
const routeEnv = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA67_CURRENT,
  WAFL_V2_DOCUMENT_VIEWER_ENABLED: "1",
  WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA67_CURRENT,
  WAFL_EXTERNAL_QA_ALPHA67_NTH_REORDER_MUTATION_ENABLED: "true",
};
const healthPath = "/api/v2/work-orders/documents/00000000-0000-4000-8000-000000000079/health";
assert.equal(isExternalQaPathAllowed(healthPath, "GET", routeEnv), true); // 81 iPhone/iPad health route
assert.equal(isTailscaleServePathAllowed(healthPath, "GET", routeEnv), true); // 82 canonical transport
assert.equal(isExternalQaPathAllowed(healthPath, "POST", routeEnv), false); // 83 mutation method closed

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha79-stage2b-missing-corrupt-recovery",
  assertions: 83,
  checkpoint: "ALPHA79_STAGE2B_MISSING_CORRUPT_RECOVERY_IPHONE_IPAD_QA_REQUIRED",
  generatedRowsMutatedInPlace: 0,
  stage3aRecoveryCoupling: 0,
  physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
}));
