#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const read = (file) => fs.readFileSync(file, "utf8");
const repository = read("lib/generated-documents/document-access/repository.ts");
const service = read("lib/generated-documents/document-access/service.ts");
const token = read("lib/generated-documents/document-access/token.ts");
const health = read("lib/generated-documents/work-order-pdf/artifactHealth.ts");
const route = read("lib/generated-documents/document-access/routeHelpers.ts");
const viewer = read("app/v/DocumentViewerClient.tsx");
const publicSession = read("db/v2/migrations/016_v2_r0_document_snapshot_and_managed_qr.sql");
const mobile = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const mobileApi = read("apps/mobile/lib/api/documentsApi.ts");
const runtimeRunner = read("scripts/run-wafl-v2-alpha80-stage1-canonical-share-binding.mjs");
const stateSource = read("apps/mobile/features/work-orders/documents/currentRevisionDocumentState.ts");
const immutableMigration = read("db/v2/migrations/005_v2_documents_access_events.sql");
const verify = read("tools/pipeline/verify-safe.ps1");
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const packageJson = JSON.parse(read("apps/mobile/package.json"));
const compiled = ts.transpileModule(stateSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { resolveCurrentRevisionDocumentWorkbenchModel } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const doc = (status, generationNumber = 2, revisionId = "revision-current") => ({
  id: `${status}-${generationNumber}`, revisionId, status, generationNumber,
  documentType: "factory_instruction", displayDocumentNumber: "QA-A80-R0",
  fileSizeBytes: status === "generated" ? 100 : null, generatedAt: status === "generated" ? "2026-09-13T00:00:00.000Z" : null,
  accessTokenAvailable: false, inlineUrl: status === "generated" ? "/file" : null, downloadUrl: status === "generated" ? "/download" : null,
});

const checks = [
  ["current Revision required", /w\.current_revision_id=d\.work_order_revision_id/.test(health) && /w\.current_revision_id=d\.work_order_revision_id/.test(repository)],
  ["newest generation required", /max\(candidate\.generation_no\)/.test(health) && /max\(candidate\.generation_no\)/.test(repository)],
  ["generated required", /d\.status='generated'/.test(health) && /d\.status='generated'/.test(repository)],
  ["healthy required", /inspectGeneratedDocumentArtifact\(artifact\.metadata\) !== "healthy"/.test(service)],
  ["pending denied", resolveCurrentRevisionDocumentWorkbenchModel([doc("pending")], "revision-current", "healthy").canShare === false],
  ["failed denied", resolveCurrentRevisionDocumentWorkbenchModel([doc("failed")], "revision-current", "healthy").canShare === false],
  ["missing denied", resolveCurrentRevisionDocumentWorkbenchModel([doc("generated")], "revision-current", "missing").canShare === false],
  ["corrupt denied", resolveCurrentRevisionDocumentWorkbenchModel([doc("generated")], "revision-current", "corrupt").canShare === false],
  ["transient denied", resolveCurrentRevisionDocumentWorkbenchModel([doc("generated")], "revision-current", "transient_error").canShare === false],
  ["revoked denied", resolveCurrentRevisionDocumentWorkbenchModel([doc("revoked")], "revision-current", "healthy").canShare === false],
  ["deleted denied", resolveCurrentRevisionDocumentWorkbenchModel([doc("deleted")], "revision-current", "healthy").canShare === false],
  ["historical Revision denied", resolveCurrentRevisionDocumentWorkbenchModel([doc("generated", 9, "revision-old")], "revision-current", "healthy").canShare === false],
  ["older generation denied", /candidate\.document_type=d\.document_type/.test(repository)],
  ["wrong company denied", /d\.company_id=\$1 AND d\.id=\$2::uuid/.test(health) && /d\.company_id=\$1 AND d\.id=\$2::uuid/.test(repository)],
  ["caller storage key absent", !/body\.(?:storageObjectKey|objectKey)|searchParams\.get\(["'](?:storageObjectKey|objectKey)/.test(route)],
  ["company binding", /maker-current-share:\$\{input\.scope\.companyId\}/.test(repository)],
  ["WorkOrder binding", /expected\.workOrderId/.test(repository) && /workOrderId: result\.workOrderId/.test(service)],
  ["Revision binding", /expected\.revisionId/.test(repository) && /revisionId: result\.revisionId/.test(service)],
  ["document binding", /generated_document_id=\$2::uuid/.test(repository)],
  ["generation binding", /expected\.generationNumber/.test(repository) && /generationNumber: result\.generationNumber/.test(service)],
  ["immutable issued output", /generated_documents_immutable_guard/.test(immutableMigration)],
  ["live Recipe leakage zero", !/product_name|due_date|quantity|current Recipe/.test(publicSession)],
  ["eligible active reuse", /const current = lineage\.activeTokenId/.test(repository) && /const inserted = current \? null : await client\.query/.test(repository)],
  ["repeated duplicate zero", /const nextTokenHash = predecessorTokenId/.test(repository) && /const inserted = current \? null : await client\.query/.test(repository)],
  ["same-key replay", /reserved\.rowCount === 0/.test(repository) && /request_sha256 !== input\.requestHash/.test(repository)],
  ["response-loss retry", /idempotentReplay: reserved\.rowCount === 0/.test(repository)],
  ["rapid double tap", /shareBusyRef\.current/.test(mobile)],
  ["concurrent safe", /pg_advisory_xact_lock\(hashtextextended/.test(repository)],
  ["different-key safe", /maker-current-share:\$\{input\.scope\.companyId\}:\$\{input\.generatedDocumentId\}/.test(repository)],
  ["wrong artifact reuse zero", /WHERE company_id=\$1 AND generated_document_id=\$2::uuid/.test(repository) && /loadCanonicalShareDocument/.test(repository)],
  ["token entropy retained", /createHmac\("sha256"/.test(token) && /base64url/.test(token)],
  ["hash-only persistence", /hashDocumentAccessToken\(rawToken\)/.test(service) && !/INSERT INTO document_access_tokens[\s\S]{0,240}rawToken/.test(repository)],
  ["token secret logging zero", !/console\.(?:log|error)\([^)]*(?:rawToken|viewerUrl|tokenHash)/.test(service + repository + route)],
  ["revoked access denied", /token\.revoked_at IS NULL/.test(publicSession)],
  ["deleted access denied", /document\.revoked_at IS NULL AND document\.deleted_at IS NULL/.test(publicSession)],
  ["create cannot resurrect", !/UPDATE generated_documents|SET revoked_at\s*=\s*NULL|SET deleted_at\s*=\s*NULL/.test(repository.slice(repository.indexOf("export async function createDocumentAccessToken"), repository.indexOf("export async function listDocumentAccessTokens")))],
  ["stale UI takeover zero", /currentGeneratedDocumentIdRef\.current !== shareTarget\.id/.test(mobile)],
  ["mobile current healthy exact", /const canUseGenerated = generated !== null && artifactHealth === "healthy"/.test(stateSource)],
  ["unhealthy terminal Share absent", /canShare: canUseGenerated/.test(stateSource)],
  ["repeated mobile reuse", /shareRequestRef\.current\?\.documentId === shareTarget\.id/.test(mobile)],
  ["transition clears state", /shareRequestRef\.current = null/.test(mobile)],
  ["mobile response identity", /created\.generatedDocumentId !== shareTarget\.id/.test(mobile) && /created\.generationNumber !== shareTarget\.generationNumber/.test(mobile)],
  ["public exact artifact", /p_generated_document_id/.test(publicSession) && /token\.generated_document_id = p_generated_document_id/.test(publicSession)],
  ["other WorkOrder content zero", !/work_orders|work_order_revisions/.test(viewer)],
  ["other Revision content zero", !/revisionId|currentRevision/.test(viewer)],
  ["other company access zero", /document\.company_id = token\.company_id/.test(publicSession)],
  ["Maker controls zero", !/revoke|rotate|edit|수정/.test(viewer)],
  ["alpha79 retained", /workorder-v2-alpha79-finalization-contract\.mjs/.test(verify)],
  ["alpha78 PDF retained", /workorder-v2-alpha78-sketch-pdf-output-fidelity-contract\.mjs/.test(verify)],
  ["migration delta zero", fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length === 22],
  ["dependency delta zero", packageJson.dependencies["react-native-reanimated"] === undefined],
  ["native config unchanged", appConfig.expo.extra.appVersion === "2.0.0-alpha.80"],
  ["API identity explicit", /generatedDocumentId: string;[\s\S]*workOrderId: string;[\s\S]*revisionId: string;[\s\S]*generationNumber: number/.test(mobileApi)],
  ["Production Owner ambiguous zero by route scope", /requireWorkspaceApiGuard\(\{ permissionCode: "workorder\.update" \}\)/.test(route)],
  ["billing delta zero", !/billing|credit|payment|invoice/i.test(service + repository + mobile)],
  ["Stage2 redesign zero", /DOCUMENT_MANUAL_SHARE_EXPIRY_DAY_CHOICES = \[3\]/.test(read("lib/generated-documents/document-access/constants.ts"))],
  ["Stage3 expansion zero", !/rateLimit|password|recipient|email/i.test(service + repository)],
  ["exact DEV fixture", /QA A80 canonical share binding/.test(runtimeRunner)],
  ["runtime concurrency", /Promise\.all\(Array\.from\(\{ length: 4 \}/.test(runtimeRunner)],
  ["runtime exact PDF hash", /createHash\("sha256"\)\.update\(publicFile\.body\)/.test(runtimeRunner)],
  ["retained terminal read only", /retainedTerminalReadOnly:[\s\S]*mutation: 0/.test(runtimeRunner)],
];

for (const [label, passed] of checks) assert.equal(passed, true, label);
assert.ok(checks.length >= 52);
console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha80-stage1-canonical-share-binding",
  assertions: checks.length,
  checkpoint: "ALPHA80_STAGE1_CANONICAL_SHARE_BINDING_IPHONE_IPAD_QA_REQUIRED",
  migrationLedgerExpected: "22/22",
  physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
}));
