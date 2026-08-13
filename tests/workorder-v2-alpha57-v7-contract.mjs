import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const mobileConfig = JSON.parse(read("apps/mobile/app.json"));
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const experience = [
  read("apps/mobile/features/MobileWorkOrderExperience.tsx"),
  read("apps/mobile/features/work-orders/images/useWorkOrderAssetAuthoringController.ts"),
].join("\n");
const attachmentAcquisition = read("apps/mobile/features/work-orders/images/workOrderAttachmentAcquisition.ts");
const imageRepository = read("lib/domain/work-orders/command/imageCommandRepository.ts");
const attachmentRepository = read("lib/domain/work-orders/command/attachmentCommandRepository.ts");
const imageRoute = read("lib/domain/work-orders/command/imageCommandRoute.ts");
const attachmentRoute = read("lib/domain/work-orders/command/attachmentCommandRoute.ts");
const uploadProxy = read("app/api/v2/work-orders/files/upload/route.ts");
const worker = read("cloudflare/r2-upload-worker.js");
const r2Keys = read("lib/storage/r2/r2Keys.ts");
const readRepository = read("lib/domain/work-orders/read/detailRepository.ts");
const fileRoute = read("lib/workorder/attachments/attachmentFileRoute.ts");
const externalQaConfig = read("lib/external-qa/configCore.mjs");

assert.equal(mobilePackage.dependencies["expo-document-picker"], "~55.0.15");
assert.ok(mobileConfig.expo.plugins.includes("expo-document-picker"));
assert.match(attachmentAcquisition, /DocumentPicker\.getDocumentAsync/);
assert.match(attachmentAcquisition, /copyToCacheDirectory:\s*true/);
assert.match(attachmentAcquisition, /application\/pdf/);

assert.match(imageRoute, /createR2WorkerUploadProxyUrl/);
assert.match(imageRoute, /WORK_ORDER_IMAGE_WORKER_FAILED/);
assert.match(imageRoute, /WORK_ORDER_IMAGE_UPLOAD_COMPENSATION_FAILED/);
assert.match(attachmentRoute, /createR2WorkerUploadProxyUrl/);
assert.match(uploadProxy, /createR2WorkerUploadUrl/);
assert.match(uploadProxy, /request\.arrayBuffer\(\)/);
assert.doesNotMatch(uploadProxy, /R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY|S3Client/);

assert.match(worker, /WORKER_VERSION = "0\.13\.74"/);
assert.match(worker, /env\.IMAGES/);
assert.match(worker, /\.output\(\{ format: "image\/webp"/);
assert.match(worker, /width: 192/);
assert.match(worker, /width: 1280/);
assert.match(worker, /width: 2048/);
assert.match(worker, /sourceEtag/);
assert.match(worker, /Promise\.allSettled/);
assert.match(r2Keys, /thumbnails\/design/);
assert.match(r2Keys, /previews\/design/);
assert.match(readRepository, /thumbnailUrl/);
assert.match(readRepository, /previewUrl/);
assert.match(readRepository, /fullscreenUrl/);
assert.match(readRepository, /originalUrl/);
assert.match(fileRoute, /isWorkOrderImageDerivativeStorageKey/);

assert.match(imageRepository, /FOR UPDATE OF w, r/);
assert.match(imageRepository, /active_count/);
assert.match(imageRepository, /target\.representative_image_id === null/);
assert.match(imageRepository, /automaticRepresentative:\s*autoRepresentative/);
assert.match(imageRepository, /automaticPromotion:\s*false/);
assert.match(imageRepository, /thumbnail_object_key/);

assert.match(gallery, /PanResponder\.create/);
assert.match(gallery, /Modal/);
assert.match(gallery, /selected\.fullscreenUrl/);
assert.match(gallery, /selected\.originalUrl/);
assert.match(gallery, /onAcquireAttachment/);
assert.match(gallery, /onDeleteAttachment/);
assert.match(gallery, /onOpenAttachment/);
assert.match(gallery, /onSaveMemo/);
assert.doesNotMatch(gallery, /selected\.mimeType/);
assert.doesNotMatch(gallery, /selected\.sizeBytes/);
assert.doesNotMatch(gallery, /selected\.filename\}\<\/Text\>/);

assert.match(experience, /acquireWorkOrderAttachment/);
assert.match(experience, /completeAttachmentUpload/);
assert.match(experience, /deleteAttachment/);
assert.match(experience, /factoryDeliveryMemo/);
assert.match(attachmentRepository, /work_order_attachments/);
assert.match(attachmentRepository, /work_order_revision_attachments/);
assert.match(attachmentRoute, /deleteR2ObjectViaWorker/);
assert.match(externalQaConfig, /pathname === "\/api\/v2\/work-orders\/files\/upload"/);
assert.match(externalQaConfig, /attachments\\\/upload\(\?:\\\/complete\)\?/);
assert.match(externalQaConfig, /attachments\\\/\[0-9a-f\].+\\\/delete/);
assert.match(externalQaConfig, /\|\| alpha57WorkOrderImageEnabled\(env\)/);

for (const route of [
  "app/api/v2/work-orders/[workOrderId]/attachments/upload/route.ts",
  "app/api/v2/work-orders/[workOrderId]/attachments/upload/complete/route.ts",
  "app/api/v2/work-orders/[workOrderId]/attachments/[attachmentId]/delete/route.ts",
]) {
  assert.ok(fs.existsSync(path.join(root, route)), `${route} must exist`);
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha57-v7",
  nativeDependency: "expo-document-picker@~55.0.15",
  uploadBoundary: "Mobile -> Next API -> Worker -> R2",
  derivatives: ["thumbnail", "medium", "large"],
  migrationRequired: false,
}));
