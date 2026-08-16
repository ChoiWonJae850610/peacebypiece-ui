#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { readMobileApiSource } from "./helpers/mobile-api-source.mjs";

import { isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";
import { assertCanonicalWaflVersionConsistency } from "./helpers/wafl-v2-current-version.mjs";

const read = (relativePath) => fs.readFileSync(relativePath, "utf8");

assertCanonicalWaflVersionConsistency();

const appConfig = JSON.parse(read("apps/mobile/app.json"));
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const lockfile = read("apps/mobile/package-lock.json");
const acquisition = read("apps/mobile/features/work-orders/images/workOrderImageAcquisition.ts");
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const experience = [
  read("apps/mobile/features/MobileWorkOrderExperience.tsx"),
  read("apps/mobile/features/work-orders/images/useWorkOrderAssetAuthoringController.ts"),
].join("\n");
const list = read("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const apiClient = readMobileApiSource();
const queryController = read("apps/mobile/features/work-orders/workOrderQueryController.ts");
const mutationController = read("apps/mobile/features/work-orders/workOrderMutationController.ts");
const repository = read("lib/domain/work-orders/command/imageCommandRepository.ts");
const route = read("lib/domain/work-orders/command/imageCommandRoute.ts");
const attachmentPolicy = read("lib/workorder/persistence/workOrderAttachmentPolicy.ts");
const detailRepository = read("lib/domain/work-orders/read/detailRepository.ts");
const listRepository = read("lib/domain/work-orders/read/listRepository.ts");
const runtimeGuard = read("lib/domain/work-orders/command/runtimeGuard.ts");
const externalQa = read("lib/external-qa/configCore.mjs");
const runner = read("tools/dev/start-wafl-external-qa.ps1");
const runtimeQa = read("scripts/run-wafl-v2-alpha57-work-order-image-runtime-qa.mjs");

assert.equal(mobilePackage.dependencies["expo-image-picker"], "~55.0.22");
assert.match(lockfile, /"expo-image-picker": "~55\.0\.22"/);
assert.equal(mobilePackage.dependencies["expo-camera"], undefined);
assert.equal(mobilePackage.dependencies["expo-document-picker"], "~55.0.15");

const pickerPlugin = appConfig.expo.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === "expo-image-picker");
assert.ok(pickerPlugin, "expo-image-picker config plugin must be present");
assert.equal(typeof pickerPlugin[1].photosPermission, "string");
assert.ok(pickerPlugin[1].photosPermission.length > 0);
assert.equal(typeof pickerPlugin[1].cameraPermission, "string");
assert.ok(pickerPlugin[1].cameraPermission.length > 0);
assert.equal(pickerPlugin[1].microphonePermission, false);

assert.match(acquisition, /requestCameraPermissionsAsync\(\)/);
assert.match(acquisition, /requestMediaLibraryPermissionsAsync\(\)/);
assert.match(acquisition, /allowsEditing: false/);
assert.match(acquisition, /allowsMultipleSelection: false/);
assert.match(acquisition, /selectionLimit: 1/);
assert.match(acquisition, /result\.canceled[\s\S]*status: "cancelled"/);
assert.match(experience, /if \(acquired\.status === "cancelled"\) return/);
assert.match(experience, /if \(acquired\.status === "denied"\)[\s\S]*return/);
assert.ok(
  experience.indexOf('if (acquired.status === "cancelled") return') < experience.indexOf("prepareImageUpload"),
  "cancel must return before upload preparation",
);
assert.ok(
  experience.indexOf('if (acquired.status === "denied")') < experience.indexOf("prepareImageUpload"),
  "permission denial must return before upload preparation",
);

for (const marker of [
  "work-order-image-library",
  "work-order-image-camera",
  "work-order-image-primary-",
  "work-order-image-delete-",
]) assert.match(gallery, new RegExp(marker));
assert.match(gallery, /disabled=\{props\.busy \|\| selected\.isRepresentative\}/);
assert.match(gallery, /image\.isRepresentative/);
assert.match(overview, /WorkOrderImageGallery/);
assert.match(overview, /representativeImage/);
assert.match(list, /representativeThumbnail/);

for (const operation of [
  "getWorkOrderImages",
  "prepareWorkOrderImageUpload",
  "putWorkOrderImageBlob",
  "completeWorkOrderImageUpload",
  "setRepresentativeWorkOrderImage",
  "deleteWorkOrderImage",
]) assert.match(apiClient, new RegExp(operation));
assert.match(queryController, /images\(workOrderId: string\)/);
assert.match(mutationController, /prepareImageUpload/);
assert.match(mutationController, /completeImageUpload/);
assert.match(mutationController, /setRepresentativeImage/);
assert.match(mutationController, /deleteImage/);

for (const table of [
  "work_order_images",
  "work_order_revision_images",
  "work_order_command_receipts",
  "domain_events",
]) assert.match(repository, new RegExp(table));
assert.match(repository, /work_order\.image\.upload/);
assert.match(repository, /work_order\.image\.representative\.set/);
assert.match(repository, /work_order\.image\.delete/);
assert.match(repository, /UPDATE work_order_revision_images[\s\S]*SET is_representative = false[\s\S]*SET is_representative = true/);
assert.match(repository, /UPDATE work_order_images[\s\S]*SET is_current_representative = false[\s\S]*SET is_current_representative = true/);
assert.match(repository, /target\.representative_image_id === input\.imageId \? null : target\.representative_image_id/);
assert.doesNotMatch(repository, /CREATE TABLE|ALTER TABLE|DROP TABLE|TRUNCATE/i);
assert.match(repository, /automaticRepresentative:\s*autoRepresentative/);

assert.match(route, /ATTACHMENT_SCOPE\.design/);
assert.match(route, /IMAGE_UPLOAD_COMMAND_CODE/);
assert.match(route, /IMAGE_REPRESENTATIVE_COMMAND_CODE/);
assert.match(route, /IMAGE_DELETE_COMMAND_CODE/);
assert.match(route, /expectedVersion/);
assert.match(route, /idempotency/i);
assert.match(route, /validateAttachmentFile/);
assert.match(attachmentPolicy, /design: 10 \* 1024 \* 1024/);
assert.match(attachmentPolicy, /design: \["image\/jpeg", "image\/png", "image\/webp"\]/);

assert.match(detailRepository, /work_order_images/);
assert.match(detailRepository, /createV2WorkOrderImageFileProxyUrl/);
assert.match(listRepository, /representative_image_id/);
assert.match(listRepository, /createV2WorkOrderImageFileProxyUrl/);

const workOrderId = "11111111-1111-4111-8111-111111111111";
const imageId = "22222222-2222-4222-8222-222222222222";
const alpha57Env = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ALPHA57_WORK_ORDER_IMAGE_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.57-dev-test-work-order-image-runtime",
};
const uploadPath = `/api/v2/work-orders/${workOrderId}/images/upload`;
const completePath = `${uploadPath}/complete`;
const representativePath = `/api/v2/work-orders/${workOrderId}/images/${imageId}/representative`;
const deletePath = `/api/v2/work-orders/${workOrderId}/images/${imageId}/delete`;
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/assets`, "GET", alpha57Env), true);
assert.equal(isTailscaleServePathAllowed("/api/v2/work-orders/images/file", "GET", alpha57Env), true);
for (const path of [uploadPath, completePath, representativePath, deletePath]) {
  assert.equal(isTailscaleServePathAllowed(path, "POST", alpha57Env), true);
  assert.equal(isTailscaleServePathAllowed(path, "POST", { ...alpha57Env, WAFL_SERVER_RUNTIME_MODE: "production" }), false);
  assert.equal(isTailscaleServePathAllowed(path, "POST", { ...alpha57Env, WAFL_V2_COMMAND_MUTATION_APPROVED: "wrong" }), false);
}
assert.match(runtimeGuard, /WAFL_V2_ALPHA57_WORK_ORDER_IMAGE_MUTATION_APPROVAL/);
assert.match(externalQa, /makerAuthoringAssetMutationEnabled/);
assert.match(runner, /EnableAlpha57WorkOrderImageMutation/);
assert.match(runner, /work-order-image-upload-primary-delete/);
assert.match(runner, /"work-order-image"/);
assert.match(runtimeQa, /ALPHA57_AUTO_WORK_ORDER_IMAGE_ONE\.png/);
assert.match(runtimeQa, /ALPHA57_AUTO_WORK_ORDER_IMAGE_TWO\.png/);
assert.match(runtimeQa, /assertStartingBaseline\(before\)/);
assert.ok(
  runtimeQa.indexOf("assertStartingBaseline(before)") < runtimeQa.indexOf('"complete-one"'),
  "runtime baseline guard must precede the first DB mutation",
);
assert.match(runtimeQa, /representative-delete-must-not-auto-promote/);
assert.match(runtimeQa, /otherWorkOrderImageMutation/);
assert.match(runtimeQa, /schemaMigrationDelta/);
assert.match(runtimeQa, /r2ObjectPutCount: 2/);
assert.match(runtimeQa, /commandTransactions: 6/);
assert.equal((runtimeQa.match(/\/api\/dev\/mobile-connect\/auto/g) ?? []).length, 1);
assert.doesNotMatch(runtimeQa, /\b(TRUNCATE|DROP|ALTER TABLE)\b/i);

for (const forbidden of [
  "expo-camera",
  "EAS Update",
  "drawing canvas",
]) assert.doesNotMatch(`${acquisition}\n${gallery}\n${experience}\n${repository}\n${route}`, new RegExp(forbidden, "i"));

console.log("PASS workorder-v2-alpha57-work-order-image-contract");
