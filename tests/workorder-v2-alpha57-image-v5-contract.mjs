#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (relativePath) => fs.readFileSync(relativePath, "utf8");

const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const mobileContract = read("apps/mobile/domain/mobileContract.ts");
const apiClient = read("apps/mobile/lib/apiClient.ts");
const detailRepository = read("lib/domain/work-orders/read/detailRepository.ts");
const imageRoute = read("lib/domain/work-orders/command/imageCommandRoute.ts");
const imageRepository = read("lib/domain/work-orders/command/imageCommandRepository.ts");
const preCorrection = read(".tmp/a57-v5-pre-correction-diagnostic.mjs");
const runtimeQa = read("scripts/run-wafl-v2-alpha57-image-v5-runtime-qa.mjs");

for (const marker of [
  "work-order-image-compact-actions",
  "work-order-image-library",
  "work-order-image-camera",
  "work-order-image-sketch",
  "work-order-image-attachment",
  "work-order-image-previous",
  "work-order-image-next",
  "work-order-image-thumbnail-strip",
  "work-order-attachment-list",
  "work-order-factory-delivery-memo",
]) assert.match(gallery, new RegExp(marker));

for (const label of [
  "사진",
  "카메라",
  "스케치",
  "첨부",
  "대표 지정",
  "현재 대표",
  "첨부 목록",
  "공장 전달 메모",
]) assert.match(gallery, new RegExp(label));

assert.match(gallery, /selectedIndex \+ 1/);
assert.match(gallery, /props\.onSetRepresentative\(selected\)/);
assert.match(gallery, /props\.onDelete\(selected\)/);
assert.doesNotMatch(gallery, /첫 이미지만 자동 대표/, "historical implementation help copy must not be required in the customer UI");
assert.match(experience, /첫 이미지를 등록하고 대표이미지로 지정했습니다/);
assert.match(experience, /다른 이미지가 자동으로 대표 지정되지는 않습니다/);
assert.match(overview, /attachments=\{props\.attachments\}/);
assert.match(overview, /factoryDeliveryMemo=\{detail\.revision\.factoryDeliveryMemo\}/);

assert.match(mobileContract, /type WorkOrderAttachmentAsset/);
assert.match(apiClient, /item\.assetType === "attachment"/);
assert.match(apiClient, /attachments: attachments\.map/);
assert.match(detailRepository, /factory_delivery_memo/);
assert.match(detailRepository, /factoryDeliveryMemo/);

assert.match(imageRoute, /if \(!isR2WorkerUploadConfigured\(\)\)/);
assert.match(imageRoute, /const upload = createR2WorkerUploadProxyUrl/);
assert.doesNotMatch(imageRoute, /createR2PresignedPutUrl|isR2Configured|S3Client|PutObjectCommand|cloudflarestorage/);
assert.match(imageRepository, /SET is_representative = false[\s\S]*SET is_representative = true/);
assert.match(imageRepository, /SET is_current_representative = false[\s\S]*SET is_current_representative = true/);

for (const source of [preCorrection, runtimeQa]) {
  for (const field of [
    "source",
    "localUri",
    "filename",
    "mimeType",
    "fileSize",
    "workerRoute",
    "r2Operation",
    "status",
    "contentType",
    "responseBody",
    "errorCode",
    "correlationId",
    "elapsedMs",
    "directR2Access",
    "workerBypass",
  ]) assert.match(source, new RegExp(`\\b${field}\\b`));
}
assert.match(preCorrection, /responseText, ""/);
assert.match(preCorrection, /mappedMessage: "요청한 정보를 찾을 수 없습니다\."/);
assert.match(runtimeQa, /correctionCycle: 1/);
assert.match(runtimeQa, /r2Put: 2/);
assert.match(runtimeQa, /r2Delete: 0/);
assert.match(runtimeQa, /representativeDeleteLeavesNoPrimary/);
assert.doesNotMatch(runtimeQa, /bucket\.put|bucket\.delete|S3Client|PutObjectCommand|DeleteObjectCommand/);

console.log("PASS workorder-v2-alpha57-image-v5-contract");
