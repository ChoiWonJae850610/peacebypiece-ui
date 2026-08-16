import assert from "node:assert/strict";
import fs from "node:fs";
import { readMobileApiSource } from "./helpers/mobile-api-source.mjs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const presentation = await import(pathToFileURL(path.join(
  root,
  "apps/mobile/features/work-orders/images/attachmentPresentation.ts",
)).href);
assert.equal(presentation.formatAttachmentBytes(0), "0B");
assert.equal(presentation.formatAttachmentBytes(12_400_000), "11.8MB");
assert.equal(presentation.attachmentListSummary([
  { sizeBytes: 1_048_576 },
  { sizeBytes: 524_288 },
  { sizeBytes: 0 },
]), "총 3개 · 1.5MB");

const experience = [
  read("apps/mobile/features/MobileWorkOrderExperience.tsx"),
  read("apps/mobile/features/work-orders/images/useWorkOrderAssetAuthoringController.ts"),
].join("\n");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const materialEditor = read("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx");
const toastHost = read("apps/mobile/components/WaflToastHost.tsx");

assert.equal((experience.match(/<WaflToastHost\b/g) ?? []).length, 1);
assert.match(toastHost, /durationMs = 3200/);
assert.match(toastHost, /success:[\s\S]*warning:[\s\S]*error:/);
assert.match(toastHost, /position: "absolute"/);
assert.doesNotMatch(overview, /savedBanner|lockedBannerText/);
assert.doesNotMatch(gallery, /props\.message\s*\?/);
assert.doesNotMatch(materials, /saveNotice\s*\?/);
assert.doesNotMatch(materialEditor, /state\.saveMessage\s*\?/);
assert.doesNotMatch(experience, /발주를 요청하고 있습니다|발주요청을 취소하고 있습니다|발주완료를 기록하고 있습니다/);

assert.match(gallery, /attachmentListSummary\(props\.attachments\)/);
assert.match(gallery, /attachment\.filename/);
assert.match(gallery, /formatAttachmentBytes\(attachment\.sizeBytes\)/);
assert.doesNotMatch(gallery, /selected\.filename|selected\.mimeType|selected\.sizeBytes/);

const apiClient = readMobileApiSource();
assert.match(apiClient, /issueWorkOrderAttachmentPreview/);
assert.match(experience, /issueAttachmentPreview\(input\.selected\.workOrderId, attachment\.id\)/);
assert.doesNotMatch(experience, /attachment\.viewUrl[\s\S]{0,120}Linking\.openURL/);

const previewToken = read("lib/workorder/attachments/attachmentPreviewToken.ts");
const previewRoute = read("lib/workorder/attachments/attachmentPreviewRoute.ts");
const fileRoute = read("lib/workorder/attachments/attachmentFileRoute.ts");
assert.match(previewToken, /ATTACHMENT_PREVIEW_TOKEN_TTL_SECONDS = 120/);
assert.match(previewToken, /createHmac\("sha256", getWaflSessionSigningSecret\(\)\)/);
assert.match(previewToken, /timingSafeEqual/);
assert.match(previewToken, /reason: "invalid" \| "expired"/);
assert.match(previewRoute, /companyId:[\s\S]*workOrderId,[\s\S]*attachmentId/);
assert.match(previewRoute, /status: verified\.reason === "expired" \? 410 : 404/);
assert.match(previewRoute, /createWorkOrderAttachmentWorkerFileResponse/);
assert.doesNotMatch(previewRoute, /getCurrentWaflSession|R2Client|S3Client|cloudflarestorage|amazonaws/);
assert.doesNotMatch(fileRoute, /getR2Object|createR2SdkFileResponse|S3Client/);

const externalConfig = read("lib/external-qa/configCore.mjs");
const runtimeGuard = read("lib/domain/work-orders/command/runtimeGuard.ts");
const materialService = read("lib/domain/work-orders/command/materialCommandService.ts");
assert.match(externalConfig, /makerAuthoringAssetMutationEnabled\(env\)[\s\S]*materials/);
assert.match(externalConfig, /attachments\\\/.*preview/);
assert.match(runtimeGuard, /getWorkOrderV2MaterialDraftMutationRuntimeGuard[\s\S]*MAKER_QA_CAPABILITY\.MATERIAL_DRAFT/);
assert.match(materialService, /requireMaterialDraftMutationApproval/);

assert.match(gallery, /Math\.abs\(gesture\.dx\) >= 8/);
assert.match(gallery, /distanceIntent = Math\.abs\(gesture\.dx\) >= 24/);
assert.match(gallery, /velocityIntent = Math\.abs\(gesture\.vx\) >= 0\.25/);
assert.match(gallery, /setSelectedId\(\(currentId\) =>/);
assert.match(gallery, /props\.images\.findIndex\(\(image\) => image\.id === currentId\)/);

const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
assert.match(reel, /decelerationRate="normal"/);
assert.match(reel, /lastCommittedIndexRef/);
assert.match(reel, /onMomentumScrollEnd=\{commitScrollIndex\}/);
assert.match(reel, /Math\.abs\(event\.nativeEvent\.velocity\?\.y \?\? 0\) < 0\.08/);
assert.doesNotMatch(reel, /disableIntervalMomentum/);
assert.match(reel, /snapToInterval=\{ITEM_HEIGHT\}/);
assert.match(reel, /숫자 직접 입력/);

for (const file of [
  "lib/workorder/attachments/attachmentPreviewRoute.ts",
  "lib/workorder/attachments/attachmentFileRoute.ts",
  "apps/mobile/lib/apiClient.ts",
  "lib/external-qa/configCore.mjs",
]) {
  const source = read(file);
  assert.doesNotMatch(source, /S3Client|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY|cloudflarestorage\.com|amazonaws\.com/);
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha57-v9",
  toastHosts: 1,
  attachmentPreviewTtlSeconds: 120,
  boundary: "Mobile -> Next API -> Worker -> R2",
  materialIngress: "alpha57 approved",
  swipe: "short-intent-one-snap",
  reel: "momentum-deduplicated",
}));
