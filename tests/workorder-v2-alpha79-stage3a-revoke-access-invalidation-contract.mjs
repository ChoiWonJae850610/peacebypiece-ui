#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

import { isExternalQaPathAllowed, isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";
import { MAKER_QA_APPROVAL } from "../lib/external-qa/makerQaCapabilities.mjs";

const read = (file) => fs.readFileSync(file, "utf8");
const importSource = (source) => import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText).toString("base64")}`);
const repository = read("lib/generated-documents/work-order-pdf/revokeRepository.ts");
const service = read("lib/generated-documents/work-order-pdf/revokeService.ts");
const route = read("app/api/v2/work-orders/[workOrderId]/documents/[documentRef]/revoke/route.ts");
const stateSource = read("apps/mobile/features/work-orders/documents/currentRevisionDocumentState.ts");
const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const api = read("apps/mobile/lib/api/documentsApi.ts");
const fileRoute = read("lib/generated-documents/work-order-pdf/internalFileRoute.ts");
const accessRepository = read("lib/generated-documents/document-access/repository.ts");
const public011 = read("db/v2/migrations/011_v2_document_access_viewer_functions.sql");
const public016 = read("db/v2/migrations/016_v2_r0_document_snapshot_and_managed_qr.sql");
const preview = read("lib/domain/work-orders/read/previewTargetRepository.ts");
const immutable = read("db/v2/migrations/005_v2_documents_access_events.sql");
const verify = read("tools/pipeline/verify-safe.ps1");
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const { resolveCurrentRevisionDocumentState, resolveCurrentRevisionDocumentWorkbenchModel } = await importSource(stateSource);
const doc = (id, revisionId, status, generationNumber) => ({ id, revisionId, status, generationNumber,
  documentType: "factory_instruction", displayDocumentNumber: id, fileSizeBytes: 100, generatedAt: null,
  accessTokenAvailable: false, inlineUrl: status === "generated" ? `/d/${id}` : null,
  downloadUrl: status === "generated" ? `/d/${id}?download=1` : null });
const revision = "current";
const n1 = doc("n1", revision, "generated", 1);
const n2 = doc("n2", revision, "revoked", 2);
const revoked = resolveCurrentRevisionDocumentState([n1, n2], revision);
const model = resolveCurrentRevisionDocumentWorkbenchModel([n1, n2], revision, "healthy");

assert.match(repository, /work_order\.document\.revoke/u); // 1 canonical owner
assert.match(repository, /d\.company_id=\$1/u); // 2 company
assert.match(repository, /d\.work_order_id=\$3::uuid/u); // 3 work order
assert.match(repository, /d\.work_order_revision_id=\$4::uuid/u); // 4 revision
assert.match(repository, /d\.id=\$2::uuid/u); // 5 document
assert.match(repository, /d\.generation_no=\$5/u); // 6 generation
assert.doesNotMatch(route + service, /objectKey|storage_object_key/u); // 7 no caller object key
assert.match(repository, /row\.status !== "generated" && row\.status !== "revoked"/u); // 8 legal states
assert.match(immutable, /generated.*revoked.*deleted/is); // 9 immutable guard retained
assert.doesNotMatch(repository, /UPDATE work_orders|revision\.issue/u); // 10 no recipe issue
assert.doesNotMatch(repository, /INSERT INTO work_order_revisions/u); // 11 no revision
assert.doesNotMatch(repository, /deletePdf|DELETE FROM.*object|storage_object_key\s*=/u); // 12 R2 delete zero
assert.match(repository, /status='revoked'/u); // 13 logical only
assert.doesNotMatch(repository, /putPdf|overwrite|CORRUPT/u); // 14 overwrite zero
assert.doesNotMatch(repository, /LIKE|prefix|wildcard/u); // 15 unrelated object zero
assert.doesNotMatch(repository, /production/i); // 16 prod R2 zero
assert.equal(revoked.state, "revoked"); // 17 revoked current
assert.equal(revoked.revoked?.id, "n2"); // 18 N1 fallback zero
assert.equal(resolveCurrentRevisionDocumentState([doc("old", "old-revision", "generated", 99), n2], revision).state, "revoked"); // 19 historical takeover zero
assert.equal(model.canView, false); // 20
assert.equal(model.canSave, false); // 21
assert.equal(model.canShare, false); // 22
assert.equal(model.viewerTarget, null); // 23
assert.equal(model.tokenTarget, null); // 24
assert.equal(model.canRetry, false); // 25 no auto regenerate
assert.match(repository, /UPDATE document_access_tokens SET revoked_at=COALESCE/u); // 26 token invalidation
assert.match(public011, /document\.status = 'generated'[\s\S]*document\.revoked_at IS NULL/u); // 27 old public resolver
assert.match(accessRepository, /status = 'generated' AND revoked_at IS NULL AND deleted_at IS NULL/u); // 28 new token denied
assert.match(repository, /generated_document_id=\$2::uuid AND revoked_at IS NULL/u); // 29 exact token only
assert.match(workbench, /tokenLoadGenerationRef\.current \+= 1/u); // 30 stale token result denied
assert.match(fileRoute, /status\s*=\s*'generated'[\s\S]*revoked_at IS NULL/u); // 31 file deny
assert.match(preview, /latest_document\.status='generated'[\s\S]*latest_document\.revoked_at IS NULL/u); // 32 preview deny
assert.match(public016, /document\.status = 'generated'[\s\S]*document\.revoked_at IS NULL/u); // 33 branded viewer
assert.equal(model.viewerDocumentId, null); // 34 native viewer target
assert.match(fileRoute, /status\s*=\s*'generated'[\s\S]*storage_object_key IS NOT NULL/u); // 35 bytes cannot bypass lifecycle
assert.match(repository, /work_order_command_receipts/u); // 36 replay
assert.match(repository, /row\.status !== "generated" && row\.status !== "revoked"/u); // 37 second safe
assert.match(repository, /FOR UPDATE OF d/u); // 38 concurrent serialization
assert.doesNotMatch(repository, /status='generated'.*WHERE.*status='revoked'/su); // 39 no resurrection
assert.doesNotMatch(repository, /UPDATE document_access_tokens SET revoked_at=NULL/u); // 40 no token resurrection
assert.match(workbench, /currentArtifactHealth !== "healthy"/u); // 41 healthy precondition
assert.match(workbench, /currentDocumentState\.canView/u); // 42 object usable before
assert.match(api, /revokeGeneratedDocument/u); // 43 revoke client
assert.doesNotMatch(repository, /storage_object_key\s*=\s*NULL/u); // 44 bytes retained
assert.equal(model.canView || model.canSave || model.canShare, false); // 45 access denied
assert.equal(model.tokenDocumentId, null); // 46 token denied
assert.match(repository, /generation_no=\(SELECT max\(latest\.generation_no\)/u); // 47 latest exact only
assert.match(verify, /workorder-v2-alpha79-current-revision-artifact-identity-contract/u); // 48 Stage1
assert.match(verify, /workorder-v2-alpha79-stage1-physical-harness-contract/u); // 49 Stage1.5
assert.match(verify, /workorder-v2-alpha79-stage2a-failure-retry-r2-cleanup-contract/u); // 50 Stage2A
assert.match(verify, /workorder-v2-alpha79-stage2b-missing-corrupt-recovery-contract/u); // 51 Stage2B
assert.match(verify, /workorder-v2-alpha78-sketch-pdf-output-fidelity-contract/u); // 52 alpha78
assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length, 22); // 53
for (const dependency of ["@shopify/react-native-skia", "react-native-reanimated", "react-native-gesture-handler", "react-native-worklets"]) assert.equal(mobilePackage.dependencies[dependency], undefined); // 54-57
assert.equal(appConfig.expo.extra.appVersion, "2.0.0-alpha.79"); // 58 finalized current version
assert.doesNotMatch(repository, /DELETE FROM generated_documents/u); // 59 Stage3B zero
assert.match(route, /permissionCode: "workorder\.update"/u); // 60 guard
assert.match(service, /getDocumentAccessRuntimeGuard\(\{ requireMutationApproval: true/u); // 61 runtime guard
assert.match(service, /input\.idempotencyKey !== clientRequestId/u); // 62 key equality
assert.match(repository, /result_generated_document_id=\$6::uuid/u); // 63 receipt identity
assert.match(repository, /INSERT INTO domain_events/u); // 64 event
assert.match(repository, /const changed = row\.status === "generated"/u); // 65 exactly once mutation
assert.match(workbench, /PDF 폐기 QA/u); // 66 external control
assert.match(workbench, /stage3aExternalQa/u); // 67 DEV-only
assert.match(workbench, /setDocumentViewerOpen\(false\)/u); // 68 viewer close
assert.match(workbench, /current-revision-document-revoked/u); // 69 reload projection
assert.match(preview, /ORDER BY d\.generation_no DESC,d\.id DESC/u); // 70 latest preview no fallback
const env = { WAFL_SERVER_RUNTIME_MODE: "dev", WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA67_CURRENT,
  WAFL_V2_DOCUMENT_VIEWER_ENABLED: "1", WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA67_CURRENT,
  WAFL_EXTERNAL_QA_ALPHA67_NTH_REORDER_MUTATION_ENABLED: "true" };
const path = "/api/v2/work-orders/00000000-0000-4000-8000-000000000079/documents/00000000-0000-4000-8000-000000000078/revoke";
assert.equal(isExternalQaPathAllowed(path, "POST", env), true); // 71
assert.equal(isTailscaleServePathAllowed(path, "POST", env), true); // 72
assert.equal(isExternalQaPathAllowed(path, "GET", env), false); // 73
console.log(JSON.stringify({ ok: true, contract: "workorder-v2-alpha79-stage3a-revoke-access-invalidation",
  assertions: 73, previousPermanentInventoryRetained: 297, addedPermanentChecks: 1,
  finalPermanentInventory: 298, r2Delete: 0, stage3b: 0, physicalResult: "PHYSICAL_RESULT_NOT_INFERRED" }));
