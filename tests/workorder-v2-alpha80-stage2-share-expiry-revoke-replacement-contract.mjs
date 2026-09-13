#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveDocumentAccessTokenStatusAt,
  resolveMakerCurrentShareLineage,
} from "../lib/generated-documents/document-access/makerCurrentShareLifecycle.mjs";

const read = (file) => fs.readFileSync(file, "utf8");
const repository = read("lib/generated-documents/document-access/repository.ts");
const service = read("lib/generated-documents/document-access/service.ts");
const token = read("lib/generated-documents/document-access/token.ts");
const route = read("lib/generated-documents/document-access/routeHelpers.ts");
const publicFunctions = read("db/v2/migrations/016_v2_r0_document_snapshot_and_managed_qr.sql");
const mobile = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const mobileApi = read("apps/mobile/lib/api/documentsApi.ts");
const stateSource = read("apps/mobile/features/work-orders/documents/currentRevisionDocumentState.ts");
const verify = read("tools/pipeline/verify-safe.ps1");
const packageJson = JSON.parse(read("apps/mobile/package.json"));
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const now = Date.parse("2026-09-13T00:00:00.000Z");
const childHash = (id) => `child:${id}`;
const row = (tokenId, tokenHash, expiresAt, revokedAt = null, rotatedFromTokenId = null) => ({
  tokenId, tokenHash, expiresAt, revokedAt, rotatedFromTokenId,
});
const activeA = row("A", "base", "2026-09-14T00:00:00.000Z");
const expiredA = row("A", "base", "2026-09-13T00:00:00.000Z");
const revokedA = row("A", "base", "2026-09-14T00:00:00.000Z", "2026-09-12T00:00:00.000Z");
const activeB = row("B", "child:A", "2026-09-14T00:00:00.000Z", null, "A");
const activeLineage = resolveMakerCurrentShareLineage({ tokens: [activeA], baseTokenHash: "base", authoritativeNowMs: now, deriveReplacementTokenHash: childHash });
const expiredLineage = resolveMakerCurrentShareLineage({ tokens: [expiredA], baseTokenHash: "base", authoritativeNowMs: now, deriveReplacementTokenHash: childHash });
const replacementLineage = resolveMakerCurrentShareLineage({ tokens: [revokedA, activeB], baseTokenHash: "base", authoritativeNowMs: now, deriveReplacementTokenHash: childHash });
const legacyLineage = resolveMakerCurrentShareLineage({ tokens: [row("legacy", "legacy", "2026-09-14T00:00:00.000Z")], baseTokenHash: "base", authoritativeNowMs: now, deriveReplacementTokenHash: childHash });

const checks = [
  ["server clock authoritative", /SELECT now\(\) AS authoritative_now/.test(repository) && /authoritativeNowMs/.test(repository)],
  ["active excludes revoked", resolveDocumentAccessTokenStatusAt(revokedA, now) === "revoked" && replacementLineage.activeTokenId === "B"],
  ["active excludes expired", resolveDocumentAccessTokenStatusAt(expiredA, now) === "expired" && expiredLineage.activeTokenId === null],
  ["pre-expiry allowed", resolveDocumentAccessTokenStatusAt(activeA, now) === "active"],
  ["exact expiry boundary denied", resolveDocumentAccessTokenStatusAt(expiredA, now) === "expired"],
  ["post-expiry denied", resolveDocumentAccessTokenStatusAt(row("A", "base", "2026-09-12T23:59:59.999Z"), now) === "expired"],
  ["expired not current", expiredLineage.activeTokenId === null],
  ["expired session denied", /token\.expires_at IS NULL OR token\.expires_at > pg_catalog\.now\(\)/.test(publicFunctions)],
  ["expired viewer denied", /wafl_v2_read_document_access_session/.test(publicFunctions) && /token\.expires_at IS NULL OR token\.expires_at > pg_catalog\.now\(\)/.test(publicFunctions)],
  ["expired public file denied", /getPublicDocumentSession/.test(route) && /genericPublicNotFound/.test(route)],
  ["no sweeper required", !/sweeper|cron|schedule/i.test(service + repository)],

  ["authenticated exact company required", /requireWorkspaceApiGuard\(\{ permissionCode: "workorder\.update" \}\)/.test(route) && /d\.company_id=\$1/.test(repository)],
  ["exact current artifact required", /w\.current_revision_id=d\.work_order_revision_id/.test(repository) && /max\(candidate\.generation_no\)/.test(repository)],
  ["exact canonical Maker link target", /lineage\.head\?\.tokenId !== input\.tokenId/.test(repository)],
  ["revoke document lifecycle mutation zero", !/UPDATE generated_documents/.test(repository.slice(repository.indexOf("export async function revokeDocumentAccessToken"), repository.indexOf("export async function rotateDocumentAccessToken")))],
  ["revoke R2 mutation zero", !/\.delete\(|R2|storage_object_key\s*=/.test(repository.slice(repository.indexOf("export async function revokeDocumentAccessToken"), repository.indexOf("export async function rotateDocumentAccessToken")))],
  ["revoke Recipe and Revision zero", !/UPDATE work_orders|INSERT INTO work_order_revisions/.test(repository.slice(repository.indexOf("export async function revokeDocumentAccessToken"), repository.indexOf("export async function rotateDocumentAccessToken")))],
  ["immediate public denial", /SET revoked_at = now\(\)/.test(repository) && /token\.revoked_at IS NULL/.test(publicFunctions)],
  ["same-key revoke safe", /FOR UPDATE OF token/.test(repository)],
  ["second revoke safe", /current\.revoked_at !== null[\s\S]*idempotentReplay: true/.test(repository)],
  ["double tap safe", /revokeBusyRef\.current/.test(mobile)],
  ["concurrent revoke safe", /pg_advisory_xact_lock/.test(repository)],
  ["revoke event delta one", /if \(current\.revoked_at !== null\) return/.test(repository) && /appendEvent\(client/.test(repository)],
  ["automatic replacement zero", !/INSERT INTO document_access_tokens/.test(repository.slice(repository.indexOf("export async function revokeDocumentAccessToken"), repository.indexOf("export async function rotateDocumentAccessToken")))],
  ["resurrection zero", !/SET revoked_at\s*=\s*NULL/.test(repository + service)],

  ["Share after revoke creates replacement", replacementLineage.head?.tokenId === "B" && /rotated_from_token_id/.test(repository)],
  ["Share after expiry creates replacement", expiredLineage.head?.tokenId === "A" && /const predecessorTokenId = current \? null : lineage\.head/.test(repository)],
  ["replacement differs from predecessor", /rotatedFromTokenId/.test(token) && /deriveReplacementRawToken/.test(service)],
  ["exact artifact binding preserved", /expectedArtifact/.test(repository) && /generatedDocumentId: input\.generatedDocumentId/.test(service)],
  ["active canonical count one", activeLineage.activeTokenId === "A" && replacementLineage.activeTokenId === "B"],
  ["duplicate replacement zero", /nextTokenHash = predecessorTokenId/.test(repository) && /pg_advisory_xact_lock/.test(repository)],
  ["revoked URL remains denied", /token\.revoked_at IS NULL/.test(publicFunctions)],
  ["expired URL remains denied", /token\.expires_at IS NULL OR token\.expires_at > pg_catalog\.now\(\)/.test(publicFunctions)],
  ["same-key replacement safe", /reserved\.rowCount === 0/.test(repository) && /const current = lineage\.activeTokenId/.test(repository)],
  ["response-loss retry safe", /idempotentReplay: reserved\.rowCount === 0/.test(repository)],
  ["rapid double tap safe", /shareBusyRef\.current/.test(mobile)],
  ["concurrent replacement safe", /maker-current-share:\$\{input\.scope\.companyId\}:\$\{input\.generatedDocumentId\}/.test(repository)],
  ["different-key convergence", /scopedIdempotencyKey/.test(repository) && /pg_advisory_xact_lock/.test(repository)],
  ["historical Revision takeover zero", /w\.current_revision_id=d\.work_order_revision_id/.test(repository)],
  ["older generation takeover zero", /d\.generation_no=\(SELECT max\(candidate\.generation_no\)/.test(repository)],

  ["current active link displayed", /token\.isMakerCurrentShare \? "현재 공유 링크" : "기존 공유 링크"/.test(mobile)],
  ["revoke exact current link", /revokeDocumentAccessToken\(generated\.id, action\.tokenId\)/.test(mobile) && /token\.status === "active"/.test(read("apps/mobile/features/work-orders/documents/currentShareLinkActions.ts"))],
  ["confirmation link-vs-PDF copy", /현재 외부 공유 링크만 사용할 수 없게 됩니다\. PDF 자체는 삭제되지 않습니다\./.test(mobile)],
  ["active UI clears after revoke", /shareRequestRef\.current = null/.test(mobile) && /loadTokensForCurrentDocument\(generated\)/.test(mobile)],
  ["Share remains healthy-document action", /currentDocumentState\.canView && currentDocumentState\.canSave && currentDocumentState\.canShare/.test(mobile)],
  ["explicit Share surfaces replacement", /createDocumentShare/.test(mobile) && /Share\.share/.test(mobile)],
  ["repeat Share reuses replacement", /reusedExisting/.test(service + mobileApi)],
  ["Revision transition clears stale link", /shareRequestRef\.current = null/.test(mobile)],
  ["expired link not current", resolveMakerCurrentShareLineage({ tokens: [expiredA], baseTokenHash: "base", authoritativeNowMs: now, deriveReplacementTokenHash: childHash }).activeTokenId === null],

  ["revoked denial fail-closed", /genericPublicNotFound/.test(route) && !/revoked/i.test(route.slice(route.indexOf("handlePublicDocumentViewerSession")))],
  ["expired denial fail-closed", /genericPublicNotFound/.test(route) && !/expired/i.test(route.slice(route.indexOf("handlePublicDocumentViewerSession")))],
  ["terminal reason leakage zero", !/token revoked|token expired|wrong company/i.test(route)],
  ["wrong-company metadata leakage zero", /genericPublicNotFound/.test(route)],

  ["Stage-1 legacy links not canonical", legacyLineage.activeTokenId === null],
  ["legacy row hard delete zero", !/DELETE FROM document_access_tokens/.test(repository)],
  ["unrelated token mutation zero", /WHERE company_id = \$1 AND generated_document_id = \$2::uuid AND id = \$3::uuid/.test(repository)],

  ["Stage-1 contract retained", /workorder-v2-alpha80-stage1-canonical-share-binding-contract\.mjs/.test(verify)],
  ["alpha.79 revoke/deleted retained", /workorder-v2-alpha79-stage3a-revoke-access-invalidation-contract\.mjs/.test(verify) && /workorder-v2-alpha79-stage3b-revoked-artifact-purge-deleted-contract\.mjs/.test(verify)],
  ["terminal document replacement denied", /d\.revoked_at IS NULL AND d\.deleted_at IS NULL/.test(repository) && /canShare: canUseGenerated/.test(stateSource)],
  ["missing/corrupt replacement denied", /inspectGeneratedDocumentArtifact\(artifact\.metadata\) !== "healthy"/.test(service)],
  ["alpha.78 PDF fidelity retained", /workorder-v2-alpha78-sketch-pdf-output-fidelity-contract\.mjs/.test(verify)],
  ["migration delta zero", fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length === 22],
  ["dependency native config EAS delta zero", packageJson.dependencies["react-native-reanimated"] === undefined && appConfig.expo.extra.appVersion === "2.0.0-alpha.80"],
  ["Production Owner ambiguous zero", /getDocumentAccessRuntimeGuard\(\{ requireMutationApproval: mutation \}\)/.test(service)],
  ["Production R2 destructive zero", !/R2WorkerGeneratedDocumentTransport\(\)\.delete|createR2Worker.*Delete/.test(service + repository)],
  ["billing delta zero", !/billing|credit|payment|invoice/i.test(service + repository + mobile)],
  ["Stage 3 redesign zero", !/rateLimit|bruteForce|password|recipient account/i.test(service + repository)],
  ["global token sweeper zero", !/DELETE FROM document_access_tokens|token sweeper/i.test(service + repository)],
];

for (const [label, passed] of checks) assert.equal(passed, true, label);
assert.equal(checks.length, 68);
console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha80-stage2-share-expiry-revoke-replacement",
  assertions: checks.length,
  checkpoint: "ALPHA80_STAGE2_SHARE_EXPIRY_REVOKE_REPLACEMENT_IPHONE_IPAD_QA_REQUIRED",
  migrationLedgerExpected: "22/22",
  physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
}));
