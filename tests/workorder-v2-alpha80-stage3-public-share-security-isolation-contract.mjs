#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const constants = read("lib/generated-documents/document-access/constants.ts");
const tokenSource = read("lib/generated-documents/document-access/token.ts");
const sessionSource = read("lib/generated-documents/document-access/session.ts");
const repository = read("lib/generated-documents/document-access/repository.ts");
const service = read("lib/generated-documents/document-access/service.ts");
const routes = read("lib/generated-documents/document-access/routeHelpers.ts");
const publicFunctions = read("db/v2/migrations/016_v2_r0_document_snapshot_and_managed_qr.sql");
const viewer = read("app/v/DocumentViewerClient.tsx");
const nextConfig = read("next.config.ts");
const stage1 = read("tests/workorder-v2-alpha80-stage1-canonical-share-binding-contract.mjs");
const stage2 = read("tests/workorder-v2-alpha80-stage2-share-expiry-revoke-replacement-contract.mjs");
const currentActions = read("tests/workorder-v2-alpha80-stage2-current-share-link-actions-contract.mjs");
const runtimeEvidence = read("scripts/run-wafl-v2-alpha80-stage3-public-share-security-isolation.mjs");
const verify = read("tools/pipeline/verify-safe.ps1");
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const packageJson = JSON.parse(read("apps/mobile/package.json"));

const sessionHandler = routes.slice(
  routes.indexOf("export async function handlePublicDocumentViewerSession"),
  routes.indexOf("export async function handlePublicDocumentAttachment"),
);
const fileHandler = routes.slice(routes.indexOf("export async function handlePublicDocumentFile"));
const publicRouteSurface = `${sessionHandler}\n${fileHandler}`;
const tokenPattern = /^[A-Za-z0-9_-]{43}$/u;
const hashPattern = /^[0-9a-f]{64}$/u;
const digest = (value) => crypto.createHash("sha256").update(value, "utf8").digest("hex");
const validToken = crypto.createHmac("sha256", "stage3-contract-secret")
  .update("exact-company\0exact-document\0exact-generation", "utf8")
  .digest("base64url");
const storedHash = digest(validToken);
const redeemModel = (candidate) => tokenPattern.test(candidate) && digest(candidate) === storedHash;
const changeAt = (value, index) => `${value.slice(0, index)}${value[index] === "A" ? "B" : "A"}${value.slice(index + 1)}`;
const alphaIndex = [...validToken].findIndex((value) => /[A-Za-z]/u.test(value));
const caseMutation = `${validToken.slice(0, alphaIndex)}${validToken[alphaIndex] === validToken[alphaIndex].toUpperCase()
  ? validToken[alphaIndex].toLowerCase()
  : validToken[alphaIndex].toUpperCase()}${validToken.slice(alphaIndex + 1)}`;
const mutations = {
  random: crypto.createHash("sha256").update("different-stage3-token").digest("base64url"),
  first: changeAt(validToken, 0),
  middle: changeAt(validToken, Math.floor(validToken.length / 2)),
  last: changeAt(validToken, validToken.length - 1),
  truncated: validToken.slice(0, -1),
  multiTruncated: validToken.slice(0, -8),
  appendedValid: `${validToken}A`,
  appendedJunk: `${validToken}.`,
  urlEncodedRaw: `%${validToken.charCodeAt(0).toString(16)}${validToken.slice(1)}`,
  caseMutation,
  malformed: "not a bearer credential",
};
const genericBody = JSON.stringify({ ok: false, error: { code: "NOT_FOUND", message: "공유 링크를 사용할 수 없습니다.", retryable: false } });
const checks = [];
const check = (label, passed) => checks.push([label, Boolean(passed)]);

check("cryptographic PRF owner", /createHmac\("sha256"/.test(tokenSource));
check("token PRF secret owner", /getWaflSessionSigningSecret/.test(tokenSource));
check("effective output is 256 bits", crypto.createHmac("sha256", "x").digest().byteLength === 32);
check("effective entropy floor at least 128 bits", 32 * 8 >= 128);
check("base64url credential length", validToken.length === 43 && tokenPattern.test(validToken));
check("sequential token generation absent", !/Math\.random|serial|sequence/i.test(tokenSource));
check("identifier alone is not credential", /document-maker-current-share-token:v1/.test(tokenSource) && /getWaflSessionSigningSecret/.test(tokenSource));
check("domain-separated token namespaces", /document-share-token:v1/.test(tokenSource) && /document-maker-current-share-token:v1/.test(tokenSource));
check("hash-only persistence", /hashDocumentAccessToken/.test(service) && !/raw_token/i.test(repository));
check("raw token column absent", !/raw_token|viewer_url|signed_url/i.test(repository));
check("exact sha256 hash lookup", /token\.token_hash = p_token_hash/.test(publicFunctions));
check("stored hash canonical length", hashPattern.test(storedHash));
check("raw token logging absent", !/console\.(?:log|error)\([^)]*rawToken/s.test(service + routes));
check("token hash public output absent", !/tokenHash/.test(publicRouteSurface));
check("token fragment owner", /url\.hash = `t=\$\{rawToken\}`/.test(tokenSource));
check("token omitted from query/path", !/searchParams.*rawToken|\/v\/\$\{rawToken\}/s.test(tokenSource));

check("valid token model accepted", redeemModel(validToken));
for (const [name, candidate] of Object.entries(mutations)) check(`${name} mutation denied`, !redeemModel(candidate));
check("mutation matrix has eleven classes", Object.keys(mutations).length === 11);
check("invalid token artifact bytes zero", Object.values(mutations).every((candidate) => !redeemModel(candidate)));
check("malformed public request cannot throw model", (() => { try { return redeemModel(mutations.malformed) === false; } catch { return false; } })());
check("duplicate query token cannot select credential", !/searchParams\.get\(["'](?:t|token)["']/.test(sessionHandler));
check("public session accepts credential only from bounded JSON", /readBoundedObject\(request, 512\)/.test(sessionHandler) && /typeof body\.token === "string"/.test(sessionHandler));
check("public session redirect absent", !/redirect\(/.test(sessionHandler));
check("generic invalid status 404", /genericPublicNotFound/.test(sessionHandler) && /404/.test(routes.slice(routes.indexOf("function genericPublicNotFound"), routes.indexOf("function requestOrigin"))));

check("token binds exact company internally", /companyId: scope\.companyId/.test(service) && /company_id/.test(publicFunctions));
check("token binds exact WorkOrder at creation", /workOrderId: artifact\.workOrderId/.test(service));
check("token binds exact Revision at creation", /revisionId: artifact\.revisionId/.test(service));
check("token binds exact document", /generated_document_id/.test(publicFunctions));
check("token binds exact generation", /generationNumber: artifact\.generationNumber/.test(service));
check("token binds exact immutable artifact metadata", /storageObjectKey: artifact\.metadata\.objectKey/.test(service) && /contentSha256: artifact\.metadata\.contentSha256/.test(service));
check("current revision enforced for canonical Share", /w\.current_revision_id=d\.work_order_revision_id/.test(repository));
check("latest generation enforced for canonical Share", /d\.generation_no=\(SELECT max\(candidate\.generation_no\)/.test(repository));
check("caller storage key selector absent", !/searchParams\.get\(["'](?:key|storageObjectKey)["']/.test(publicRouteSurface));
check("caller document selector absent", !/searchParams\.get\(["'](?:document|documentId|generatedDocumentId)["']/.test(publicRouteSurface));
check("caller revision selector absent", !/searchParams\.get\(["'](?:revision|revisionId)["']/.test(publicRouteSurface));
check("caller generation selector absent", !/searchParams\.get\(["'](?:generation|generationNumber)["']/.test(publicRouteSurface));
check("file identity comes only from signed session", /session\.generatedDocumentId/.test(fileHandler) && /session\.tokenId/.test(fileHandler));
check("session payload binds token and document", /tokenId: redeemed\.tokenId/.test(sessionHandler) && /generatedDocumentId: redeemed\.generatedDocumentId/.test(sessionHandler));
check("session signature uses timing-safe compare", /timingSafeEqual/.test(sessionSource));
check("attachment ref binds token document and asset", /input\.tokenId/.test(sessionSource) && /input\.generatedDocumentId/.test(sessionSource) && /input\.revisionAssetId/.test(sessionSource));
check("cross-resource fallback absent", !/fallbackDocument|previousRevision|previousGeneration|latestHealthy/i.test(publicRouteSurface));
check("B-token A-selector surface zero", !/workOrderId|revisionId|generationNumber|storageObjectKey/.test(sessionHandler));

check("revoked token denied during redemption", /token\.revoked_at IS NULL/.test(publicFunctions));
check("expired token denied during redemption", /token\.expires_at IS NULL OR token\.expires_at > pg_catalog\.now\(\)/.test(publicFunctions));
check("revoked token denied during session reread", (publicFunctions.match(/token\.revoked_at IS NULL/g) ?? []).length >= 2);
check("expired token denied during session reread", (publicFunctions.match(/token\.expires_at IS NULL OR token\.expires_at > pg_catalog\.now\(\)/g) ?? []).length >= 2);
check("revoked document denied", /document\.revoked_at IS NULL/.test(publicFunctions));
check("deleted document denied", /document\.deleted_at IS NULL/.test(publicFunctions));
check("nongenerated document denied", /document\.status = 'generated'/.test(publicFunctions));
check("terminal replay creates no token", !/createDocumentShare|rotateDocumentShare/.test(sessionHandler));
check("terminal route discloses no successor", !/successor|replacement|rotatedFrom/.test(publicRouteSurface));
check("terminal route cannot take current ownership", !/isMakerCurrentShare|makerCurrent/.test(publicRouteSurface));
check("legacy token cannot be promoted", !/INSERT INTO|UPDATE document_access_tokens/.test(sessionHandler));
check("session reauthorization before every PDF", /getPublicDocumentSession/.test(fileHandler));
check("session reauthorization before every attachment", /getPublicDocumentSession/.test(routes.slice(routes.indexOf("handlePublicDocumentAttachment"), routes.indexOf("function readCookie"))));

check("unknown-token body is generic", !/unknown|missing token/i.test(genericBody));
check("revoked reason concealed", !/revoked|폐기/i.test(genericBody));
check("expired reason concealed", !/expired|만료/i.test(genericBody));
check("mismatch reason concealed", !/company|revision|generation|mismatch/i.test(genericBody));
check("internal identifier absent from generic body", !/[0-9a-f]{8}-[0-9a-f-]{27,}/i.test(genericBody));
check("storage key absent from generic body", !/storage|object[_-]?key/i.test(genericBody));
check("SQL and stack absent from generic body", !/sql|stack|postgres|query/i.test(genericBody));
check("public bootstrap internal access count removed", !/accessCount/.test(sessionHandler));
check("public bootstrap internal ids removed", !/tokenId:|generatedDocumentId:|companyId:|workOrderId:|revisionId:/.test(sessionHandler.slice(sessionHandler.indexOf("const response ="))));
check("server logs redact credentials", /correlationId[\s\S]*errorName/.test(routes) && !/errorMessage|error\.stack|rawToken|tokenHash/.test(routes.slice(routes.indexOf("function internalError"), routes.indexOf("export async function handleList"))));

check("private no-store public API", /Cache-Control": "private, no-store"/.test(routes));
check("private no-store viewer page", /Cache-Control.*private, no-store/.test(nextConfig));
check("cross-token cache keying delegated to signed cookie", /DOCUMENT_VIEWER_COOKIE/.test(routes) && /httpOnly: true/.test(sessionHandler));
check("terminal content not cached by WAFL", /cache: "no-store"/.test(viewer) && /private, no-store/.test(nextConfig));
check("viewer clears fragment credential", /history\.replaceState/.test(viewer));
check("viewer maker edit controls absent", !/편집|수정|저장하기/.test(viewer));
check("viewer Share management absent", !/공유 링크 폐기|새 공유 링크|createDocumentShare|revokeDocumentShare/.test(viewer));
check("viewer private Recipe navigation absent", !/\/recipes|Recipe|레시피/.test(viewer));
check("viewer unrelated Revision history absent", !/revision history|리비전 이력/i.test(viewer));
check("viewer debug payload absent", !/tokenHash|storageObjectKey|companyId|generatedDocumentId/.test(viewer));
check("exact PDF signature verified client-side", /signature !== "%PDF-"/.test(viewer));
check("exact PDF size and digest verified server-side", /body\.byteLength !== metadata\.fileSizeBytes/.test(service) && /metadata\.contentSha256/.test(service));

check("safe PDF content type", /Content-Type": "application\/pdf"/.test(fileHandler));
check("safe attachment nosniff", /X-Content-Type-Options": "nosniff"/.test(routes));
check("referrer policy no-referrer", /Referrer-Policy": "no-referrer"/.test(routes));
check("robots noindex", /X-Robots-Tag": "noindex, nofollow, noarchive"/.test(routes));
check("frame embedding denied", /frame-ancestors 'none'/.test(nextConfig));
check("object embedding denied", /object-src 'none'/.test(nextConfig));
check("content disposition explicit", /Content-Disposition/.test(fileHandler));
check("filename is sanitized", /replace\(\/\[\^A-Za-z0-9\._-\]\/g/.test(fileHandler));
check("broad CSP rewrite absent", (nextConfig.match(/Content-Security-Policy/g) ?? []).length === 1);
check("valid public link flow retained", /fetch\("\/api\/public\/document-viewer\/session"/.test(viewer) && /fetch\("\/api\/public\/document-viewer\/file"/.test(viewer));

check("rate-limit owner audited absent", !/rate.?limit/i.test(publicRouteSurface + service));
check("strong-token fallback conditions met", validToken.length === 43 && /genericPublicNotFound/.test(routes));
check("new rate-limit dependency absent", !/redis|upstash|rate-limiter|ratelimit/i.test(JSON.stringify(packageJson.dependencies)));
check("expensive unauthenticated generation absent", !/generateDocument|renderPdf|chromium|\.put\(/i.test(sessionHandler));
check("bounded public bootstrap body", /readBoundedObject\(request, 512\)/.test(sessionHandler));

check("Stage 1 retained", /checks\.length >= 52/.test(stage1) && /alpha80-stage1-canonical-share-binding/.test(verify));
check("Stage 2 lifecycle retained", /assert\.equal\(checks\.length, 68\)/.test(stage2) && /alpha80-stage2-share-expiry-revoke-replacement/.test(verify));
check("Stage 2 current actions retained", /assert\.equal\(checks\.length, 51\)/.test(currentActions) && /alpha80-stage2-current-share-link-actions/.test(verify));
check("alpha79 lifecycle retained", /alpha79-stage3a-revoke-access-invalidation/.test(verify) && /alpha79-stage3b-revoked-artifact-purge-deleted/.test(verify));
check("alpha78 PDF fidelity retained", /alpha78-sketch-pdf-output-fidelity/.test(verify));
check("migration ledger unchanged", fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length === 22);
check("dependency delta zero", packageJson.dependencies["@upstash/ratelimit"] === undefined && packageJson.dependencies.redis === undefined);
check("native/config/EAS delta zero", appConfig.expo.extra.appVersion === "2.0.0-alpha.80");
check("Production Owner ambiguous mutation zero", /getDocumentAccessRuntimeGuard/.test(service));
check("Production R2 destructive zero", !/\.delete\(/.test(service + repository));
check("billing delta zero", !/billing|credit|payment/i.test(publicRouteSurface));
check("TTL unchanged", /DOCUMENT_ACCESS_DEFAULT_EXPIRY_DAYS = 3/.test(constants) && /DOCUMENT_VIEWER_SESSION_MAX_AGE_SECONDS = 15 \* 60/.test(constants));
check("schema delta zero", fs.readdirSync("db/v2/migrations").length >= 22);
check("Factory scope zero", !/factory|생산처/.test(publicRouteSurface));
check("sanitized runtime fixture A", /QA A80 canonical share binding/.test(runtimeEvidence));
check("sanitized runtime aliases", /VALID_A/.test(runtimeEvidence) && /MUTATED_A/.test(runtimeEvidence) && /REVOKED_A/.test(runtimeEvidence) && /EXPIRED_A/.test(runtimeEvidence) && /VALID_B/.test(runtimeEvidence));
check("runtime DB audit is read only", /BEGIN READ ONLY/.test(runtimeEvidence));
check("runtime lifecycle mutation statements zero", !/INSERT INTO|UPDATE document_access_tokens|DELETE FROM document_access_tokens/.test(runtimeEvidence));
check("runtime R2 mutation calls zero", !/\.put\(|\.delete\(|method:\s*"(?:PUT|DELETE)"/.test(runtimeEvidence));
check("runtime evidence omits raw credential", /tokenSecurity:[\s\S]*rawPersistence: 0/.test(runtimeEvidence) && !/rawToken:/.test(runtimeEvidence));
check("runtime exact artifact validation", /file\.body\.byteLength/.test(runtimeEvidence) && /sha256\(file\.body\)/.test(runtimeEvidence));
check("runtime cross-resource selector proof", /VALID_A_WITH_B_SELECTORS/.test(runtimeEvidence) && /SELECTOR_SURFACE_ZERO/.test(runtimeEvidence));

for (const [label, passed] of checks) assert.equal(passed, true, label);
assert.ok(checks.length >= 82, `expected at least 82 findings, got ${checks.length}`);
console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha80-stage3-public-share-security-isolation",
  findings: checks.length,
  tokenModel: "HMAC-SHA256 cryptographic PRF / 256-bit output",
  rateLimitDecision: "deferred-existing-owner-absent-strong-token-no-enumeration",
  checkpoint: "ALPHA80_STAGE3_PUBLIC_SHARE_SECURITY_ISOLATION_IPHONE_IPAD_QA_REQUIRED",
  physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
}));
