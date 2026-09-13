#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const mobile = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const model = read("apps/mobile/features/work-orders/documents/currentShareLinkActions.ts");
const mobileApi = read("apps/mobile/lib/api/documentsApi.ts");
const service = read("lib/generated-documents/document-access/service.ts");
const repository = read("lib/generated-documents/document-access/repository.ts");
const routeHelpers = read("lib/generated-documents/document-access/routeHelpers.ts");
const currentRoute = read("app/api/v2/work-orders/documents/[documentRef]/access-tokens/current/route.ts");
const lifecycleContract = read("tests/workorder-v2-alpha80-stage2-share-expiry-revoke-replacement-contract.mjs");
const stage1Contract = read("tests/workorder-v2-alpha80-stage1-canonical-share-binding-contract.mjs");
const verify = read("tools/pipeline/verify-safe.ps1");
const packageJson = JSON.parse(read("apps/mobile/package.json"));
const appConfig = JSON.parse(read("apps/mobile/app.json"));

const targetSlice = service.slice(service.indexOf("export async function getCurrentDocumentShareTarget"), service.indexOf("export async function getDocumentViewerTarget"));
const openSlice = mobile.slice(mobile.indexOf("async function openCurrentShareLink"), mobile.indexOf("function copyCurrentShareLink"));
const copySlice = mobile.slice(mobile.indexOf("function copyCurrentShareLink"), mobile.indexOf("async function shareCurrentShareLink"));
const shareSlice = mobile.slice(mobile.indexOf("async function shareCurrentShareLink"), mobile.indexOf("function confirmRevokeCurrentShare"));
const modelUrlCount = (model.match(/target\.viewerUrl/g) ?? []).length;

const checks = [
  ["single current canonical URL owner", /const \{ target \} = input/.test(model) && modelUrlCount === 4],
  ["Open uses canonical URL", /Linking\.openURL\(action\.openUrl\)/.test(openSlice)],
  ["Copy uses same URL", /Clipboard\.setString\(action\.copyUrl\)/.test(copySlice)],
  ["native Share uses same URL", /viewerUrl: action\.nativeShareUrl/.test(shareSlice)],
  ["revoke uses same canonical identity", /revokeDocumentAccessToken\(generated\.id, action\.tokenId\)/.test(mobile)],
  ["Open create zero", !/createDocumentShare|get-or-create|access-tokens.*POST/.test(openSlice)],
  ["Copy create zero", !/createDocumentShare|get-or-create|access-tokens.*POST/.test(copySlice)],
  ["current-link Share second link zero", !/createDocumentShare|get-or-create/.test(shareSlice)],
  ["read-only target token mutation zero", !/INSERT INTO|UPDATE document_access_tokens|DELETE FROM/.test(targetSlice)],
  ["read-only target document mutation zero", !/UPDATE generated_documents|INSERT INTO generated_documents|DELETE FROM generated_documents/.test(targetSlice)],
  ["read-only target R2 mutation zero", !/\.put\(|\.delete\(|upload/.test(targetSlice)],
  ["legacy URL selection zero", /token\.isMakerCurrentShare === true/.test(targetSlice) && /token\.status === "active"/.test(targetSlice)],
  ["revoked URL current display zero", /token\.status === "active"/.test(model)],
  ["expired URL current display zero", /token\.status === "active"/.test(model) && /activeTokenId/.test(repository)],
  ["revoked Open zero", /if \(!canonical\) return null/.test(model)],
  ["revoked Copy zero", /if \(!canonical\) return null/.test(model)],
  ["revoked current Share zero", /if \(!canonical\) return null/.test(model)],
  ["revoked Revoke action zero after refresh", /currentShareActions\?\.tokenId === token\.tokenId/.test(mobile)],
  ["expired current actions zero", /currentShareActions\?\.tokenId === token\.tokenId/.test(mobile) && /return null/.test(targetSlice)],
  ["replacement becomes all-action owner", /rotatedFromTokenId: current\.rotatedFromTokenId/.test(targetSlice) && modelUrlCount === 4],
  ["predecessor does not return", /token\.isMakerCurrentShare === true/.test(targetSlice)],
  ["top-level Share retained", /label="공유" onPress=\{\(\) => setShareSheetOpen\(true\)\}/.test(mobile)],
  ["PDF remains generated after link revoke", /PDF 자체는 삭제되지 않습니다/.test(mobile) && !/generated_documents/.test(mobile.slice(mobile.indexOf("function confirmRevokeCurrentShare"), mobile.indexOf("function confirmGeneratedDocumentRevoke")))],
  ["Stage 2 revoke retained", /revoke event delta one/.test(lifecycleContract) && /revokeDocumentAccessToken/.test(mobile)],
  ["Stage 2 expiry retained", /exact expiry boundary denied/.test(lifecycleContract) && /DOCUMENT_ACCESS_DEFAULT_EXPIRY_DAYS/.test(service)],
  ["Stage 1 canonical reuse retained", /eligible active reuse/.test(stage1Contract) && /reusedExisting/.test(service)],
  ["repeated native Share same URL", /nativeShareUrl: target\.viewerUrl/.test(model)],
  ["public exact artifact identity retained", /expectedArtifact/.test(targetSlice) && /loadCanonicalShareArtifact/.test(targetSlice)],
  ["internal token hash storage leakage zero", !/tokenHash|storageObjectKey|rawToken/.test(model + mobileApi)],
  ["phone overflow regression zero", /currentLinkActions: \{ flexDirection: "row", flexWrap: "wrap"/.test(mobile) && /width: "100%"/.test(mobile)],
  ["iPad mini layout regression zero", /currentLinkControls/.test(mobile) && !/useWindowDimensions|iPad|tablet/i.test(model)],
  ["migration delta zero", fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.*\.sql$/u.test(name)).length === 22],
  ["dependency native config EAS delta zero", packageJson.dependencies["expo-clipboard"] === undefined && appConfig.expo.extra.appVersion === "2.0.0-alpha.80"],
  ["Production Owner ambiguous zero", /requireWorkspaceApiGuard\(\{ permissionCode: "workorder\.update" \}\)/.test(routeHelpers)],
  ["Stage 3 redesign zero", !/rateLimit|recipient binding|password|watermark/i.test(model + targetSlice)],
  ["billing delta zero", !/billing|credit|payment|invoice/i.test(model + targetSlice)],
  ["explicit Open action present", /label="열기"/.test(mobile)],
  ["explicit Copy action present", /label="링크 복사"/.test(mobile)],
  ["explicit current Share action present", /label="공유하기"/.test(mobile)],
  ["explicit Revoke action present", /label="공유 링크 폐기"/.test(mobile)],
  ["current target endpoint is GET", /export async function GET/.test(currentRoute) && /handleGetCurrentDocumentShareTarget/.test(currentRoute)],
  ["current target read is no-store", /Cache-Control": "private, no-store"/.test(routeHelpers)],
  ["current target requires update permission", /handleGetCurrentDocumentShareTarget[\s\S]*permissionCode: "workorder\.update"/.test(routeHelpers)],
  ["current target exact revision", /revisionId: artifact\.revisionId/.test(targetSlice)],
  ["current target exact generation", /generationNumber: artifact\.generationNumber/.test(targetSlice)],
  ["model rejects stale document", /target\.generatedDocumentId !== input\.generatedDocumentId/.test(model)],
  ["model rejects stale revision", /target\.revisionId !== input\.revisionId/.test(model)],
  ["model rejects stale generation", /target\.generationNumber !== input\.generationNumber/.test(model)],
  ["authoritative refresh loads metadata and target", /Promise\.all\(\[[\s\S]*listDocumentAccessTokens[\s\S]*getCurrentDocumentShareTarget/.test(mobile)],
  ["revoke refresh clears current actions", /await loadTokensForCurrentDocument\(generated\)/.test(mobile)],
  ["verify includes current-link actions", /workorder-v2-alpha80-stage2-current-share-link-actions-contract\.mjs/.test(verify)],
];

for (const [label, passed] of checks) assert.equal(passed, true, label);
assert.equal(checks.length, 51);
console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha80-stage2-current-share-link-actions",
  assertions: checks.length,
  checkpoint: "ALPHA80_STAGE2_CURRENT_SHARE_LINK_ACTIONS_IPHONE_IPAD_REQA_REQUIRED",
  migrationLedgerExpected: "22/22",
  physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
}));
