#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { isExternalQaPathAllowed, isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";
import { MAKER_QA_APPROVAL } from "../lib/external-qa/makerQaCapabilities.mjs";

const read = (file) => fs.readFileSync(file, "utf8");
const uuid = "00000000-0000-4000-8000-000000000067";
const env = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA67_CURRENT,
  WAFL_V2_DOCUMENT_VIEWER_ENABLED: "1",
  WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA67_CURRENT,
  WAFL_EXTERNAL_QA_ALPHA67_NTH_REORDER_MUTATION_ENABLED: "true",
};

const transport = read("apps/mobile/lib/apiTransport.ts");
const api = read("apps/mobile/lib/api/documentsApi.ts");
const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const generation = read("lib/generated-documents/work-order-pdf/generationService.ts");
const accessRepository = read("lib/generated-documents/document-access/repository.ts");
const accessService = read("lib/generated-documents/document-access/service.ts");
const viewerTargetRoute = read("app/api/v2/work-orders/documents/[documentRef]/viewer-target/route.ts");
const internalFileRoute = read("lib/generated-documents/work-order-pdf/internalFileRoute.ts");
const publicViewer = read("app/v/DocumentViewerClient.tsx");
const currentState = read("docs/codex-current-state.md");
const apiContract = read("docs/project/app-v2/16-workorder-api-command-read-model-contracts.md");
const evidence = read("docs/project/app-v2/75-pdf-generation-retry-public-viewer-evidence.md");

assert.match(transport, /readonly timeoutMs\?: number/);
assert.match(transport, /MAX_REQUEST_TIMEOUT_MS = 120_000/);
assert.match(api, /DOCUMENT_GENERATION_REQUEST_TIMEOUT_MS = 120_000/);
assert.match(api, /documents\/generate[\s\S]*timeoutMs: DOCUMENT_GENERATION_REQUEST_TIMEOUT_MS/);
assert.match(workbench, /generateAndReconcile/);
assert.match(workbench, /status === "pending" \|\| item\.status === "generated"/);
assert.match(workbench, /retryGeneration[\s\S]*generateAndReconcile\("retry-generation"\)/);
assert.doesNotMatch(workbench.match(/async function retryGeneration[\s\S]*?\n  }/)?.[0] ?? "", /issueWorkOrderR0/);

assert.match(generation, /status='generated'[\s\S]*status='pending'/);
assert.match(generation, /return \{ row: current,[\s\S]*replay: true \}/);
assert.match(generation, /result_generated_document_id=\$6::uuid/);
assert.match(generation, /const generationNo = Number/);

assert.match(api, /getDocumentViewerTarget/);
assert.doesNotMatch(workbench, /Linking\.openURL\(target\.viewerUrl\)/, "public viewer is share-only after the in-app View decision");
assert.doesNotMatch(workbench, /label="보기"[^\n]*generated\.inlineUrl/);
assert.match(viewerTargetRoute, /handleGetDocumentViewerTarget/);
assert.match(accessRepository, /token_purpose = 'embedded_qr'/);
assert.match(accessRepository, /receipt\.command_code = 'work_order\.document\.generate'/);
assert.match(accessService, /deriveEmbeddedQrAccessToken/);
assert.match(accessService, /hashDocumentAccessToken\(rawToken\) !== identity\.tokenHash/);
assert.match(accessService, /createDocumentViewerUrl\(input\.origin, rawToken\)/);
assert.match(publicViewer, /\/api\/public\/document-viewer\/session/);
assert.match(publicViewer, /\/api\/public\/document-viewer\/file/);
assert.match(internalFileRoute, /requireWorkspaceApiGuard/);
const viewerTargetFunction = accessService.match(/export async function getDocumentViewerTarget[\s\S]*?\n}/)?.[0] ?? "";
assert.doesNotMatch(viewerTargetFunction, /storage_object_key|createR2WorkerFileUrl|R2WorkerGeneratedDocumentTransport/);

assert.equal(isExternalQaPathAllowed(`/api/v2/work-orders/documents/${uuid}/viewer-target`, "GET", env), true);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/documents/${uuid}/viewer-target`, "GET", env), true);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/documents/${uuid}/viewer-target`, "POST", env), false);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/documents/${uuid}/viewer-target`, "GET", {}), false);
assert.match(currentState, /bounded 120-second render budget/);
assert.match(apiContract, /viewer-target/);
assert.match(evidence, /PHYSICAL_RESULT_NOT_INFERRED/);

console.log("workorder-v2-alpha67-pdf-generation-retry-public-viewer-contract: PASS");
