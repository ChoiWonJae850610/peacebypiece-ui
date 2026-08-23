#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  inspectUploadedWorkOrderImage,
  inspectWorkOrderPdfInlineImage,
} from "../lib/workorder/persistence/imageAssetIntegrity.mjs";

const read = (file) => fs.readFileSync(file, "utf8");
const mobile = read("apps/mobile/features/work-orders/images/workOrderImageAcquisition.ts");
const route = read("lib/domain/work-orders/command/imageCommandRoute.ts");
const repository = read("lib/domain/work-orders/command/imageCommandRepository.ts");
const generation = read("lib/generated-documents/work-order-pdf/generationService.ts");
const css = read("components/workorder/preview/IssuedWorkOrderPreview.module.css");
const currentState = read("docs/codex-current-state.md");
const apiContract = read("docs/project/app-v2/16-workorder-api-command-read-model-contracts.md");
const evidence = read("docs/project/app-v2/76-mobile-image-asset-integrity-pdf-evidence.md");
const runtimeQa = read("scripts/run-wafl-v2-alpha67-mobile-image-asset-integrity-pdf-retained-continuation.mjs");

assert.match(mobile, /const size = blob\.size/);
assert.doesNotMatch(mobile, /asset\.fileSize && asset\.fileSize > 0 \? asset\.fileSize : blob\.size/);
assert.match(route, /readR2ObjectViaWorker\(\{ key: storageObjectKey \}\)/);
assert.match(route, /inspectUploadedWorkOrderImage/);
assert.match(route, /incomingSizeBytes: actual\.sizeBytes/);
assert.match(route, /contentSha256: actual\.contentSha256/);
assert.match(repository, /\$12, NULL/);
assert.doesNotMatch(repository, /\$8, NULL, NULL/);

const payload = Buffer.from("wafl-mobile-image-object");
const uploaded = inspectUploadedWorkOrderImage({ declaredContentType: "image/png", actualContentType: "image/png", body: payload });
assert.equal(uploaded.sizeBytes, payload.byteLength);
assert.match(uploaded.contentSha256, /^[0-9a-f]{64}$/u);
assert.throws(() => inspectUploadedWorkOrderImage({ declaredContentType: "image/png", actualContentType: "image/jpeg", body: payload }), /CONTENT_TYPE_INVALID/);

const legacy = inspectWorkOrderPdfInlineImage({
  declaredContentType: "image/png",
  declaredSizeBytes: payload.byteLength + 7,
  declaredContentSha256: null,
  actualContentType: "image/png",
  body: payload,
});
assert.equal(legacy.mode, "legacy-compatible");
assert.equal(legacy.staleDeclaredSize, true);
const strict = inspectWorkOrderPdfInlineImage({
  declaredContentType: "image/png",
  declaredSizeBytes: uploaded.sizeBytes,
  declaredContentSha256: uploaded.contentSha256,
  actualContentType: "image/png",
  body: payload,
});
assert.equal(strict.mode, "strict");
assert.throws(() => inspectWorkOrderPdfInlineImage({
  declaredContentType: "image/png",
  declaredSizeBytes: uploaded.sizeBytes + 1,
  declaredContentSha256: uploaded.contentSha256,
  actualContentType: "image/png",
  body: payload,
}), /PDF_ASSET_INTEGRITY_INVALID/);
assert.throws(() => inspectWorkOrderPdfInlineImage({
  declaredContentType: "image/png",
  declaredSizeBytes: uploaded.sizeBytes,
  declaredContentSha256: "invalid-present-hash",
  actualContentType: "image/png",
  body: payload,
}), /PDF_ASSET_INTEGRITY_INVALID/);

assert.match(generation, /inspectWorkOrderPdfInlineImage/);
assert.match(generation, /PDF_PAGE_ORIENTATION_INVALID/);
assert.match(generation, /failure_code=\$3/);
assert.match(css, /\.coverPage \{ page: cover; width: min\(100%, 210mm\); min-height: 297mm;[\s\S]*overflow: hidden/);
assert.match(
  css,
  /\.representativeImage \{ display: block; width: 100%; height: 100%; object-fit: contain;[^}]*\}/,
);
assert.match(currentState, /mobile image asset integrity/iu);
assert.match(apiContract, /actual R2 object bytes/iu);
assert.match(evidence, /PHYSICAL_RESULT_NOT_INFERRED/);
assert.match(runtimeQa, /canonical\.size_bytes/);
assert.match(runtimeQa, /LEGACY/);
assert.match(runtimeQa, /content_sha256,null/);
assert.match(runtimeQa, /REORDER/);
assert.match(runtimeQa, /STRICT/);

console.log("workorder-v2-alpha67-mobile-image-asset-integrity-pdf-contract: PASS");
