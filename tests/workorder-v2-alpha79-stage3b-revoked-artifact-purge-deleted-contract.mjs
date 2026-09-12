#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const read = (file) => fs.readFileSync(file, "utf8");
const importSource = (source) => import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText).toString("base64")}`);
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const match = (value, pattern, message) => { assert.match(value, pattern, message); checks += 1; };
const noMatch = (value, pattern, message) => { assert.doesNotMatch(value, pattern, message); checks += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };

const repository = read("lib/generated-documents/work-order-pdf/purgeRepository.ts");
const service = read("lib/generated-documents/work-order-pdf/purgeService.ts");
const coreSource = read("lib/generated-documents/work-order-pdf/purgeCore.ts");
const route = read("app/api/v2/work-orders/[workOrderId]/documents/[documentRef]/purge/route.ts");
const stateSource = read("apps/mobile/features/work-orders/documents/currentRevisionDocumentState.ts");
const api = read("apps/mobile/lib/api/documentsApi.ts");
const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const migration = read("db/v2/migrations/005_v2_documents_access_events.sql");
const transitions = read("lib/domain/work-orders/contracts/state-transitions.ts");
const fileRoute = read("lib/generated-documents/work-order-pdf/internalFileRoute.ts");
const preview = read("lib/domain/work-orders/read/previewTargetRepository.ts");
const detail = read("lib/domain/work-orders/read/detailRepository.ts");
const access = read("lib/generated-documents/document-access/repository.ts");
const config = read("lib/external-qa/configCore.mjs");
const stage3a = read("lib/generated-documents/work-order-pdf/revokeRepository.ts");

const core = await importSource(coreSource);
equal(core.resolveGeneratedDocumentPurgeStoragePlan({ lifecycle: "revoked", objectPresent: true }), "delete_then_finalize", "present revoked object is deleted first");
equal(core.resolveGeneratedDocumentPurgeStoragePlan({ lifecycle: "revoked", objectPresent: false }), "finalize_confirmed_absent", "revoked plus absence reconciles");
equal(core.resolveGeneratedDocumentPurgeStoragePlan({ lifecycle: "deleted", objectPresent: false }), "already_deleted", "deleted is terminal replay");
equal(core.resolveAmbiguousGeneratedDocumentDelete({ verification: "absent" }).mayFinalizeDeleted, true, "confirmed absence may finalize");
equal(core.resolveAmbiguousGeneratedDocumentDelete({ verification: "present" }).mustRemainRevoked, true, "present ambiguity remains revoked");
equal(core.resolveAmbiguousGeneratedDocumentDelete({ verification: "unknown" }).mustRemainRevoked, true, "unknown ambiguity remains revoked");

const stateModule = await importSource(stateSource.replace(/^import type .*\r?\n/u, ""));
const revisionId = "revision-current";
const doc = (id, status, generationNumber, revision = revisionId) => ({ id, revisionId: revision,
  documentType: "factory_instruction", generationNumber, displayDocumentNumber: `DOC-${generationNumber}`,
  status, fileSizeBytes: 10, generatedAt: "2026-01-01T00:00:00.000Z", accessTokenAvailable: false,
  inlineUrl: null, downloadUrl: null });
const deleted = stateModule.resolveCurrentRevisionDocumentWorkbenchModel([
  doc("older-generated", "generated", 1), doc("newest-deleted", "deleted", 2),
], revisionId, "healthy");
equal(deleted.state, "deleted", "newest deleted is authoritative");
equal(deleted.deleted.id, "newest-deleted", "deleted identity retained");
equal(deleted.generated, null, "older generated fallback is blocked");
equal(deleted.canView, false, "View 0");
equal(deleted.canSave, false, "Save 0");
equal(deleted.canShare, false, "Share 0");
equal(deleted.canRetry, false, "Retry 0");
equal(deleted.viewerTarget, null, "native Viewer 0");
equal(deleted.tokenTarget, null, "token UI 0");
equal(stateModule.resolveCurrentRevisionDocumentState([doc("historical", "generated", 99, "other"),
  doc("newest-deleted", "deleted", 2)], revisionId).state, "deleted", "historical Revision takeover 0");
match(detail, /LEFT JOIN generated_documents d\s+ON d\.company_id = \$1 AND d\.work_order_id = t\.id\s+AND \(\$4::timestamptz/u, "deleted audit row remains in document projection");

match(repository, /GENERATED_DOCUMENT_PURGE_COMMAND_CODE = "work_order\.document\.purge"/u, "canonical purge owner");
match(repository, /d\.company_id=\$1[\s\S]*d\.work_order_id=\$3::uuid[\s\S]*d\.work_order_revision_id=\$4::uuid[\s\S]*d\.generation_no=\$5/u, "exact company WorkOrder Revision document generation");
match(repository, /d\.id=\$2::uuid/u, "exact document id");
match(repository, /d\.generation_no=\(SELECT max/u, "newest attempt only");
match(repository, /row\.status !== "revoked" && row\.status !== "deleted"/u, "only revoked or deleted accepted");
match(repository, /storage_object_key/u, "server persisted key owner");
noMatch(route, /objectKey|storage_object_key/u, "caller arbitrary object key 0");
match(service, /prepared\.target\.objectKey/u, "service consumes trusted key");
match(service, /store\.headPdf\(prepared\.target\.objectKey\)/u, "exact HEAD");
match(service, /store\.deletePdf\(prepared\.target\.objectKey\)/u, "exact DELETE");
noMatch(service, /prefix|listObjects|deleteMany|wildcard/iu, "prefix wildcard bulk delete 0");
match(service, /headPdf\(prepared\.target\.objectKey\)[\s\S]*finalizeGeneratedDocumentPurgeV2/u, "absence precedes DB deleted");
match(repository, /SET status='deleted',deleted_at=COALESCE/u, "revoked to deleted timestamp");
match(repository, /AND status='revoked'/u, "generated direct purge 0");
match(migration, /status IN \('pending', 'generated', 'failed', 'revoked', 'deleted'\)/u, "deleted schema retained");
match(transitions, /from: "revoked", allowedTo: \["deleted"\]/u, "legal transition retained");
match(migration, /TG_OP = 'DELETE'[\s\S]*generated document rows use lifecycle status/u, "hard row delete 0");
noMatch(repository, /DELETE FROM generated_documents/u, "audit row retained");
noMatch(repository, /storage_object_key\s*=/u, "storage identity immutable");
noMatch(repository, /status='revoked'.*status='generated'/su, "status resurrection 0");
noMatch(service, /generateWorkOrder|putPdf/u, "auto-regenerate 0");
match(repository, /work_order_command_receipts/u, "idempotency receipt");
match(repository, /idempotency_conflict/u, "same-key conflict safe");
match(service, /withGeneratedDocumentPurgeLock/u, "rapid/concurrent process serialization");
match(repository, /UPDATE generated_documents[\s\S]*AND status='revoked'/u, "concurrent DB winner one");
match(repository, /INSERT INTO domain_events/u, "deleted event owner");
match(repository, /if \(target\.status === "revoked"\)[\s\S]*INSERT INTO domain_events/u, "event only on transition");
match(repository, /SELECT 1 FROM document_access_tokens[\s\S]*revoked_at IS NULL/u, "active token blocks purge");
noMatch(repository, /UPDATE document_access_tokens SET revoked_at=NULL/u, "token resurrection 0");
match(service, /catch \(deleteError\)[\s\S]*headPdf/u, "ambiguous delete re-HEAD");
match(service, /if \(!ambiguity\.mayFinalizeDeleted\) throw deleteError/u, "present ambiguity remains revoked");
match(service, /PDF_R2_EXACT_PURGE_VERIFICATION_FAILED/u, "false deleted prevention");
match(service, /afterObjectAbsentBeforeFinalize/u, "partial-failure injection seam");
match(repository, /target\.status === "deleted"[\s\S]*idempotentReplay: true/u, "already deleted replay");
match(fileRoute, /status\s*=\s*'generated'[\s\S]*revoked_at IS NULL[\s\S]*deleted_at IS NULL/u, "file denied");
match(preview, /latest_document\.status='generated'[\s\S]*latest_document\.revoked_at IS NULL[\s\S]*latest_document\.deleted_at IS NULL/u, "preview denied");
match(access, /status = 'generated' AND revoked_at IS NULL AND deleted_at IS NULL/u, "new token denied");
match(api, /purgeRevokedGeneratedDocument/u, "mobile canonical client");
match(api, /documents\/\$\{encodeURIComponent\(input\.documentId\)\}\/purge/u, "mobile exact route");
match(workbench, /PDF 삭제 QA/u, "DEV external-QA control");
match(workbench, /requestWaflDecision/u, "WAFL Decision retained");
match(workbench, /current-revision-document-deleted/u, "deleted authoritative reload state");
match(workbench, /현재 리비전의 PDF가 삭제되었습니다\./u, "deleted copy");
match(workbench, /stage3ExternalQa && currentDocumentState\.state === "revoked"/u, "control only revoked");
match(config, /documents\\\/\[0-9a-f-\]\{36\}\\\/purge/u, "external QA exact UUID route gate");
match(route, /permissionCode: "workorder\.update"/u, "permission guard");
match(service, /getDocumentAccessRuntimeGuard\(\{ requireMutationApproval: true/u, "DEV mutation guard");
match(service, /companyId.*workOrderId.*revisionId.*documentId.*generationNumber/su, "lock exact ownership identity");
match(stage3a, /status='revoked'/u, "Stage 3A retained");
noMatch(stage3a, /deletePdf/u, "Stage 3A remains logical-only");
match(read("tests/workorder-v2-alpha79-current-revision-artifact-identity-contract.mjs"), /workorder-v2-alpha79-current-revision-artifact-identity/iu, "Stage 1 retained");
match(read("tests/workorder-v2-alpha79-stage1-physical-harness-contract.mjs"), /workorder-v2-alpha79-stage1-physical/iu, "Stage 1.5 retained");
match(read("tests/workorder-v2-alpha79-stage2a-failure-retry-r2-cleanup-contract.mjs"), /workorder-v2-alpha79-stage2a/iu, "Stage 2A retained");
match(read("tests/workorder-v2-alpha79-stage2b-missing-corrupt-recovery-contract.mjs"), /workorder-v2-alpha79-stage2b/iu, "Stage 2B retained");
match(read("tests/workorder-v2-alpha79-stage3a-revoke-access-invalidation-contract.mjs"), /workorder-v2-alpha79-stage3a/iu, "Stage 3A contract retained");
match(read("tests/workorder-v2-alpha78-finalization-contract.mjs"), /alpha\.78/iu, "alpha.78 retained");
equal(fs.existsSync("db/v2/migrations/023_v2_generated_document_purge.sql"), false, "migration delta 0");
noMatch(service + repository, /sweeper|retention worker|cron/iu, "global retention worker 0");
noMatch(service + repository, /billing|share redesign/iu, "Share redesign and billing 0");
match(read("lib/constants/version.ts"), /2\.0\.0-alpha\.79/u, "APP_VERSION finalized");

ok(checks >= 69, `Stage 3B permanent inventory must contain at least 69 checks, got ${checks}`);
console.log(JSON.stringify({ contract: "workorder-v2-alpha79-stage3b-revoked-artifact-purge-deleted",
  checks, status: "PASS" }));
