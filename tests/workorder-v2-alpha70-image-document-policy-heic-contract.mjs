import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  isHeicLikeAcquiredImage,
  isJpegImagePrefix,
} from "../apps/mobile/domain/workOrderHeicPolicy.ts";
import {
  selectSupplementalGalleryAssets,
} from "../lib/generated-documents/work-order-pdf/snapshot.ts";
import {
  paginateIssuedPdfAttachmentImages,
} from "../lib/generated-documents/work-order-pdf/paginationPolicy.ts";
import { isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";
import { isPdfAttachmentContent } from "../lib/workorder/persistence/attachmentContentPolicy.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const migration = read("db/v2/migrations/021_v2_work_order_image_output_include.sql");
assert.match(migration, /ADD COLUMN output_include boolean NOT NULL DEFAULT false/u);
assert.doesNotMatch(migration, /\b(?:DROP|TRUNCATE|DELETE)\b/iu);

const repository = read("lib/domain/work-orders/command/imageCommandRepository.ts");
assert.match(repository, /IMAGE_OUTPUT_INCLUDE_COMMAND_CODE/u);
assert.match(repository, /assertCurrentDraft\(target, input\.expectedVersion\)/u);
assert.match(repository, /revision_id = \$2::uuid AND image_id = \$3::uuid/u);
assert.match(repository, /output_include IS DISTINCT FROM \$4/u);
assert.match(repository, /reserveReceipt/u);
assert.match(repository, /completeReceipt/u);

const route = read("lib/domain/work-orders/command/imageCommandRoute.ts");
assert.match(route, /handleSetWorkOrderImageOutputInclude/u);
assert.match(route, /typeof body\.includeInDocument !== "boolean"/u);
assert.match(route, /readIdempotencyKey\(request\)/u);

const imageGallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
assert.match(imageGallery, /label="사진"/u);
assert.match(imageGallery, /label="카메라"/u);
assert.match(imageGallery, /label="스케치"/u);
assert.doesNotMatch(imageGallery, /label="첨부"/u);
assert.match(imageGallery, /selected\.isRepresentative/u);
assert.match(imageGallery, /selected\.includeInDocument \? "문서 포함됨" : "작업지시서 포함"/u);

const documents = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
assert.match(documents, /label="PDF 첨부"/u);
assert.match(documents, /label="전달 선택"/u);
assert.match(documents, /PDF 첨부는 작업지시서 PDF에 합쳐지지 않고 별도 전달 파일로 보관됩니다/u);

const acquisition = read("apps/mobile/features/work-orders/images/workOrderAttachmentAcquisition.ts");
assert.match(acquisition, /const PDF_MIME_TYPE = "application\/pdf"/u);
assert.match(acquisition, /type: PDF_MIME_TYPE/u);
assert.match(acquisition, /PDF 파일만 첨부할 수 있습니다/u);
const attachmentPolicy = read("lib/workorder/persistence/attachmentContentPolicy.mjs");
const attachmentRoute = read("lib/domain/work-orders/command/attachmentCommandRoute.ts");
assert.match(attachmentPolicy, /isPdfAttachmentContent/u);
assert.match(attachmentRoute, /readR2ObjectViaWorker\(\{ key: storageObjectKey \}\)/u);
assert.match(attachmentRoute, /uploaded\.body\.length === sizeBytes/u);
assert.match(attachmentRoute, /deleteR2ObjectViaWorker\(\{ key: storageObjectKey \}\)/u);

const heicAcquisition = read("apps/mobile/features/work-orders/images/workOrderImageAcquisition.ts");
assert.match(heicAcquisition, /UIImagePickerPreferredAssetRepresentationMode\.Compatible/u);
assert.match(heicAcquisition, /manipulateAsync\(asset\.uri, \[\], \{ compress: 1, format: SaveFormat\.JPEG \}\)/u);
assert.doesNotMatch(heicAcquisition, /\.arrayBuffer\(\)/u);
assert.match(heicAcquisition, /type: "image\/jpeg"/u);
assert.doesNotMatch(heicAcquisition, /resize:/u);

assert.equal(isHeicLikeAcquiredImage({ mimeType: "image/heic" }), true);
assert.equal(isHeicLikeAcquiredImage({ mimeType: "image/heif" }), true);
assert.equal(isHeicLikeAcquiredImage({ fileName: "LOOK.HEIC" }), true);
assert.equal(isHeicLikeAcquiredImage({ uri: "file:///look.HEIF" }), true);
assert.equal(isHeicLikeAcquiredImage({ prefix: Uint8Array.from([0, 0, 0, 24, 102, 116, 121, 112, 104, 101, 105, 99]) }), true);
assert.equal(isHeicLikeAcquiredImage({ mimeType: "image/jpeg", fileName: "look.jpg" }), false);
assert.equal(isJpegImagePrefix(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])), true);
assert.equal(isJpegImagePrefix(Uint8Array.from([0x89, 0x50, 0x4e, 0x47])), false);
assert.equal(isPdfAttachmentContent(Buffer.from("%PDF-1.7\n1 0 obj\n", "ascii")), true);
assert.equal(isPdfAttachmentContent(Uint8Array.from([0x89, 0x50, 0x4e, 0x47])), false);

const asset = (id, overrides = {}) => ({
  assetType: "image",
  revisionAssetId: id,
  companyId: "company",
  filename: `${id}.jpg`,
  mimeType: "image/jpeg",
  storageObjectKeySnapshot: `qa/${id}.jpg`,
  displayOrder: Number(id.replace(/\D/g, "")) || 0,
  isRepresentative: false,
  includeInDocument: true,
  sourceSizeBytes: 100,
  sourceContentSha256: null,
  ...overrides,
});
const inlineMimes = new Set(["image/jpeg", "image/png", "image/webp"]);
const fixture = [
  asset("rep0", { isRepresentative: true }),
  ...Array.from({ length: 11 }, (_, index) => asset(`image${index + 1}`)),
  asset("excluded20", { includeInDocument: false }),
  asset("legacy21", { assetType: "attachment" }),
  asset("pdf22", { assetType: "attachment", mimeType: "application/pdf", filename: "delivery.pdf" }),
];
const supplemental = selectSupplementalGalleryAssets(fixture, inlineMimes);
assert.equal(supplemental.some((item) => item.revisionAssetId === "rep0"), false, "representative must appear only on the cover");
assert.equal(supplemental.some((item) => item.revisionAssetId === "excluded20"), false);
assert.equal(supplemental.some((item) => item.revisionAssetId === "legacy21"), true, "legacy selected image attachments remain compatible");
assert.equal(supplemental.some((item) => item.revisionAssetId === "pdf22"), false, "PDF attachments are delivery files, not inline gallery pages");
assert.deepEqual(paginateIssuedPdfAttachmentImages(supplemental.filter((item) => item.assetType === "image")).map((page) => page.length), [10, 1]);

const copy = read("lib/domain/work-orders/command/copyCommandRepository.ts");
const reorder = read("lib/domain/work-orders/command/reorderCommandRepository.ts");
assert.match(copy, /work_order_revision_images\(company_id,revision_id,image_id,display_order,is_representative,output_include/u);
assert.match(reorder, /work_order_revision_images\(company_id,revision_id,image_id,display_order,is_representative,output_include/u);

const path = "/api/v2/work-orders/00000000-0000-4000-8000-000000000001/images/00000000-0000-4000-8000-000000000002/output-include";
const qaEnv = {
  NODE_ENV: "development",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.67-dev-test-nth-reorder-runtime",
  WAFL_EXTERNAL_QA_ALPHA67_NTH_REORDER_MUTATION_ENABLED: "true",
  WAFL_V2_DOCUMENT_VIEWER_ENABLED: "1",
  WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED: "2.0.0-alpha.67-dev-test-nth-reorder-runtime",
};
assert.equal(isTailscaleServePathAllowed(path, "PATCH", qaEnv), true);
assert.equal(isTailscaleServePathAllowed(path, "POST", qaEnv), false);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha70-image-document-policy-heic",
  previousPermanentInventoryRetained: 214,
  addedPermanentChecks: 1,
  finalPermanentInventory: 215,
  migration: "additive-021",
  heic: "compatible-plus-real-jpeg",
  galleryPages: [10, 1],
  pdfAttachmentInline: 0,
  pass: true,
}));
