#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const service = read("lib/generated-documents/work-order-pdf/generationService.ts");
const transport = read("lib/generated-documents/work-order-pdf/r2WorkerTransport.ts");
const objectStore = read("lib/generated-documents/work-order-pdf/objectStore.ts");
const publicRoute = read("app/api/v2/work-orders/[workOrderId]/documents/generate/route.ts");
const devRoute = read("app/api/dev/a79-stage2a-generation-failure/route.ts");
const devRunner = read("scripts/run-wafl-v2-alpha79-stage2a-failure-retry-r2-cleanup.mjs");
const mobileApi = read("apps/mobile/lib/api/documentsApi.ts");
const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const currentState = read("apps/mobile/features/work-orders/documents/currentRevisionDocumentState.ts");
const immutableMigration = read("db/v2/migrations/005_v2_documents_access_events.sql");
const verifySafe = read("tools/pipeline/verify-safe.ps1");
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const appConfig = JSON.parse(read("apps/mobile/app.json"));

assert.match(service, /export type GenerationExecutionHooks/u); // 1 hook type
assert.match(service, /execution: GenerationExecutionOptions = \{\}/u); // 2 default absent
assert.doesNotMatch(publicRoute, /failpoint|FAIL_BEFORE_OBJECT_PUT|GenerationExecutionHooks/u); // 3 public selector zero
assert.doesNotMatch(mobileApi, /failpoint|FAIL_BEFORE_OBJECT_PUT|FAIL_AFTER_OBJECT_PUT/u); // 4 mobile selector zero
assert.match(devRoute, /assertLocalOnlyRouteHost\(\)/u); // 5 local-only runner
assert.match(devRoute, /externalQa\.enabled[\s\S]*externalQa\.production/u); // 6 production closed
assert.match(devRoute, /isMakerQaCapabilityEnabled\(process\.env, MAKER_QA_CAPABILITY\.DOCUMENT_R0\)[\s\S]*requireWorkspaceApiGuard\(\{ permissionCode: "workorder\.update" \}\)/u); // 7 canonical DEV capability + tenant permission guard
assert.match(devRoute, /scenario !== "FAIL_BEFORE_OBJECT_PUT"[\s\S]*"FAIL_AFTER_OBJECT_PUT_BEFORE_FINALIZE"/u); // 8 bounded scenarios
assert.match(devRoute, /generateIssuedWorkOrderDocument\([\s\S]*\{ hooks, objectStore: trackingStore \}/u); // 9 direct service injection
assert.match(service, /beforeObjectPut\?/u); // 10 before-put hook
assert.match(service, /afterObjectPutBeforeFinalize\?/u); // 11 after-put hook

assert.match(service, /beforeObjectPut[\s\S]*await store\.putPdf/u); // 12 before hook ordering
assert.match(devRoute, /FAIL_BEFORE_OBJECT_PUT[\s\S]*trackingStore\.counts\.put === 0/u); // 13 before put zero
assert.match(devRoute, /FAIL_BEFORE_OBJECT_PUT[\s\S]*trackingStore\.counts\.delete === 0/u); // 14 before delete zero
assert.match(service, /status='failed',failure_code/u); // 15 failed state
assert.doesNotMatch(devRoute, /issueWorkOrder|revisions\/issue/u); // 16 Recipe issue zero
assert.doesNotMatch(devRoute, /INSERT INTO work_order_revisions|createWorkOrder/u); // 17 new Revision zero

assert.match(service, /await store\.putPdf[\s\S]*exactCreatedObjectKey = objectKey/u); // 18 put then journal
assert.match(service, /store\.headPdf\(objectKey\)[\s\S]*PDF_R2_OBJECT_PREEXISTING/u); // 19 pre-existing guard
assert.match(service, /afterObjectPutBeforeFinalize[\s\S]*withWaflV2TenantWriteTransaction/u); // 20 failpoint before finalize
assert.match(service, /generatedFinalizationStarted = true[\s\S]*if \(exactCreatedObjectKey && !generatedFinalizationStarted && !generatedFinalizationCompleted\)/u); // 21 cleanup only before any ambiguous finalization transaction
assert.match(service, /store\.deletePdf\(exactCreatedObjectKey\)/u); // 22 exact delete
assert.match(service, /store\.headPdf\(exactCreatedObjectKey\)[\s\S]*PDF_R2_EXACT_CLEANUP_VERIFICATION_FAILED/u); // 23 absent verify
assert.match(devRoute, /key !== this\.exactCreatedKey[\s\S]*NON_OWNED_DELETE_FORBIDDEN/u); // 24 unrelated delete zero
assert.match(devRoute, /counts\.put === 1 && trackingStore\.counts\.delete === 1 && exactObjectAbsent/u); // 25 after-put exact counts
assert.match(devRoute, /A79_STAGE2A_EXACT_CLEANUP_INCOMPLETE/u); // 26 cleanup cannot silently pass

const retryBody = workbench.slice(workbench.indexOf("async function retryGeneration"), workbench.indexOf("async function shareDocument"));
assert.match(retryBody, /generateAndReconcile\("retry-generation"\)/u); // 27 existing retry path
assert.doesNotMatch(retryBody, /issueWorkOrderR0/u); // 28 no reissue
assert.match(workbench, /resolveCurrentRevisionDocumentWorkbenchModel/u); // 29 current selector
assert.match(currentState, /viewTarget: canUseGenerated \? generated : null/u); // 30 healthy View current; broken suppressed
assert.match(workbench, /currentDocumentState\.saveTarget/u); // 31 Save current
assert.match(workbench, /currentDocumentState\.shareTarget/u); // 32 Share current
assert.match(workbench, /currentDocumentState\.viewerTarget/u); // 33 Viewer current
assert.match(workbench, /currentDocumentState\.tokenTarget/u); // 34 token current

assert.match(service, /work_order_command_receipts/u); // 35 idempotency receipts
assert.match(service, /pg_advisory_xact_lock/u); // 36 advisory lock
assert.match(service, /ORDER BY generation_no DESC, id DESC[\s\S]*pendingIsCurrent/u); // 37 newest active attempt guard
assert.match(immutableMigration, /generated_documents_immutable_guard/u); // 38 immutable generated guard
assert.match(verifySafe, /workorder-v2-alpha79-current-revision-artifact-identity-contract\.mjs/u); // 39 Stage 1 retained
assert.match(verifySafe, /workorder-v2-alpha79-stage1-physical-harness-contract\.mjs/u); // 40 Stage 1.5 retained
assert.match(verifySafe, /workorder-v2-alpha78-sketch-pdf-output-fidelity-contract\.mjs/u); // 41 alpha.78 fidelity retained

assert.match(transport, /deleteR2ObjectViaWorker\(\{ key: assertKey\(key\) \}\)/u); // 42 canonical exact-key transport
assert.match(objectStore, /deletePdf\(key: string\): Promise<void>/u); // 43 store contract retained
assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length, 22); // 44 migration zero
assert.equal(appConfig.expo.extra.appVersion, "2.0.0-alpha.79"); // 45 finalized current version
assert.equal(mobilePackage.dependencies["@shopify/react-native-skia"], undefined); // 46 dependency delta zero
assert.match(devRunner, /FAIL_BEFORE_OBJECT_PUT[\s\S]*FAIL_AFTER_OBJECT_PUT_BEFORE_FINALIZE/u); // 47 DEV runner injection
assert.match(verifySafe, /workorder-v2-alpha79-stage2b-missing-corrupt-recovery-contract\.mjs/u); // 48 Stage 2B additive; Stage 3 still absent

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha79-stage2a-failure-retry-r2-cleanup",
  assertions: 48,
  checkpoint: "ALPHA79_STAGE2A_FAILURE_RETRY_R2_CLEANUP_IPHONE_IPAD_QA_REQUIRED",
  publicFailpointSelector: 0,
  mobileFailpointSelector: 0,
  productionR2DestructiveMutation: 0,
  stage2b: 1,
  stage3: 0,
  physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
}));
