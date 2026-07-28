import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const mobileMemoPolicy = await import(pathToFileURL(path.join(
  root,
  "apps/mobile/domain/factoryDeliveryMemoPolicy.ts",
)).href);
assert.equal(mobileMemoPolicy.FACTORY_DELIVERY_MEMO_MAX_LENGTH, 500);
assert.equal(mobileMemoPolicy.factoryDeliveryMemoLength("한글\nmemo"), 7);
assert.equal(mobileMemoPolicy.clampFactoryDeliveryMemo("가".repeat(500)), "가".repeat(500));
assert.equal(mobileMemoPolicy.clampFactoryDeliveryMemo("가".repeat(501)), "가".repeat(500));
const surrogateBoundary = `${"a".repeat(499)}😀`;
const clampedSurrogate = mobileMemoPolicy.clampFactoryDeliveryMemo(surrogateBoundary);
assert.equal(clampedSurrogate.length, 499);
assert.doesNotMatch(clampedSurrogate, /[\uD800-\uDFFF]$/);

const serverMemoPolicy = read("lib/domain/work-orders/factoryDeliveryMemoPolicy.ts");
const validation = read("lib/domain/work-orders/command/validation.ts");
assert.match(serverMemoPolicy, /FACTORY_DELIVERY_MEMO_MAX_LENGTH\s*=\s*500/);
assert.match(validation, /factoryDeliveryMemo[\s\S]*FACTORY_DELIVERY_MEMO_MAX_LENGTH/);
assert.doesNotMatch(validation, /factoryDeliveryMemo[\s\S]{0,180}5_000/);

const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
assert.match(gallery, /work-order-factory-delivery-memo-input/);
assert.match(gallery, /onEndEditing=.*saveMemoInline/s);
assert.match(gallery, /clampFactoryDeliveryMemo/);
assert.match(gallery, /memoLength\}\s*\/\s*\{FACTORY_DELIVERY_MEMO_MAX_LENGTH\}/);
assert.match(gallery, /onSaveMemo:\s*\(memo: string\) => Promise<boolean>/);
assert.doesNotMatch(gallery, /공장 전달 메모 편집 취소|공장 전달 메모 저장|styles\.memoAction\b|>편집</);

const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
assert.match(experience, /saveFactoryDeliveryMemo\(memo: string\): Promise<boolean>/);
assert.match(experience, /factoryDeliveryMemoLength\(memo\) > FACTORY_DELIVERY_MEMO_MAX_LENGTH/);
assert.match(experience, /onSaveFactoryDeliveryMemo=\{saveFactoryDeliveryMemo\}/);

const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
assert.match(materials, /testID=\{`material-add-\$\{materialType\}`\}/);
assert.match(materials, /\{materialLabel\} 추가/);
assert.match(materials, /addButton:[\s\S]*width: "100%"/);
const actionCluster = materials.slice(
  materials.indexOf('<View testID="material-order-actions"'),
  materials.indexOf("</View>", materials.indexOf('<View testID="material-order-actions"')) + 7,
);
assert.ok(actionCluster.indexOf("actions.map") >= 0);
assert.ok(actionCluster.indexOf("orderPolicy.canEdit") >= 0);
assert.ok(actionCluster.indexOf("actions.map") < actionCluster.indexOf("orderPolicy.canEdit"));
assert.match(materials, /complete:\s*\{[\s\S]*label:\s*"발주완료"/);

const acquisition = read("apps/mobile/features/work-orders/images/workOrderImageAcquisition.ts");
for (const evidence of ["asset.mimeType", "blob.type", "asset.fileName", "asset.uri"]) {
  assert.match(acquisition, new RegExp(evidence.replace(".", "\\.")));
}
assert.match(acquisition, /ALLOWED_IMAGE_MIME_TYPES/);

const externalConfig = read("lib/external-qa/configCore.mjs");
assert.match(externalConfig, /alpha57WorkOrderImageEnabled/);
assert.match(externalConfig, /images\\\/upload/);
assert.match(externalConfig, /verb === "PATCH"[\s\S]*alpha57WorkOrderImageEnabled\(env\)/);

const runner = read("tools/dev/start-wafl-external-qa.ps1");
assert.match(runner, /EnableAlpha57WorkOrderImageMutation/);
assert.match(runner, /mutationMode = "work-order-image-upload-primary-delete"/);

for (const file of [
  "apps/mobile/lib/apiClient.ts",
  "app/api/v2/work-orders/files/upload/route.ts",
  "lib/domain/work-orders/command/imageCommandRoute.ts",
]) {
  const source = read(file);
  assert.doesNotMatch(source, /S3Client|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY|cloudflarestorage\.com|amazonaws\.com/);
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha57-v8",
  imageFailurePoint: "external-device read-only ingress returned non-JSON 404 before Next route",
  boundary: "Mobile -> Next API -> Worker -> R2",
  memoMaxLength: 500,
  materialAddButton: "full-width",
  materialActionOrder: "state-left-delete-right",
}));
