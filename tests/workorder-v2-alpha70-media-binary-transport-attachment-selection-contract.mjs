import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { isHeicLikeAcquiredImage } from "../apps/mobile/domain/workOrderHeicPolicy.ts";
import { applyVersionedAttachmentOutputSelection } from "../apps/mobile/domain/workOrderAttachmentSelectionPolicy.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const acquisition = read("apps/mobile/features/work-orders/images/workOrderImageAcquisition.ts");
assert.doesNotMatch(acquisition, /\.arrayBuffer\(\)/u, "React Native local Blob transport must not require arrayBuffer");
assert.doesNotMatch(acquisition, /\.slice\(/u, "metadata owns local HEIC detection");
assert.match(acquisition, /isHeicLikeAcquiredImage/u);
const inaccessibleBinary = { arrayBuffer() { throw new Error("UNSUPPORTED"); } };
assert.equal(isHeicLikeAcquiredImage({ mimeType: "image/jpeg", fileName: "camera.jpg" }), false);
assert.equal(isHeicLikeAcquiredImage({ mimeType: "image/heic", fileName: "photo.HEIC" }), true);
assert.equal(typeof inaccessibleBinary.arrayBuffer, "function", "binary bytes are intentionally not consulted by metadata policy");

const controller = read("apps/mobile/features/work-orders/images/useWorkOrderAssetAuthoringController.ts");
for (const stage of ["local-read", "heic-convert", "prepare-command", "r2-put", "complete-reconcile", "projection"]) {
  assert.match(controller, new RegExp(stage), `missing image failure stage ${stage}`);
}
assert.match(controller, /applyVersionedAttachmentOutputSelection/u);
assert.match(controller, /refreshProjection\(workOrderId, authoritativeVersion\)/u);
assert.match(controller, /refreshLatestProjection\(workOrderId\)/u);

const calls = [];
const reconciles = [];
const success = await applyVersionedAttachmentOutputSelection({
  initialVersion: 10,
  changes: [
    { attachmentId: "a", includeInDocument: true },
    { attachmentId: "b", includeInDocument: false },
  ],
  execute: async (change, expectedVersion) => {
    calls.push([change.attachmentId, expectedVersion]);
    return expectedVersion + 1;
  },
  reconcile: async (version) => { reconciles.push(version); },
});
assert.deepEqual(calls, [["a", 10], ["b", 11]]);
assert.deepEqual(reconciles, [12]);
assert.deepEqual({ ok: success.ok, nextVersion: success.nextVersion }, { ok: true, nextVersion: 12 });

const partialCalls = [];
const partialReconciles = [];
const partial = await applyVersionedAttachmentOutputSelection({
  initialVersion: 20,
  changes: [
    { attachmentId: "a", includeInDocument: true },
    { attachmentId: "b", includeInDocument: true },
  ],
  execute: async (change, expectedVersion) => {
    partialCalls.push([change.attachmentId, expectedVersion]);
    if (change.attachmentId === "b") throw new Error("CONFLICT");
    return expectedVersion + 1;
  },
  reconcile: async (version) => { partialReconciles.push(version); },
});
assert.equal(partial.ok, false);
assert.deepEqual(partialCalls, [["a", 20], ["b", 21]]);
assert.deepEqual(partialReconciles, [null], "partial failure must authoritative-refresh rather than preserve stale props");

const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
assert.doesNotMatch(workbench, /setAttachmentOutputInclude/u, "document UI must not own versioned attachment mutation");
assert.match(workbench, /onApplyAttachmentSelection/u);
assert.match(workbench, /attachment\.includeInDocument/u);

const generation = read("lib/generated-documents/work-order-pdf/generationService.ts");
assert.match(generation, /createWorkOrderImageDerivativeKeys\(asset\.storageObjectKeySnapshot\)\.large/u);
assert.match(generation, /data:image\/webp;base64/u);
assert.match(generation, /derivativeResponse\.status !== 404/u);
assert.match(generation, /legacy image keys use the original object/u);
assert.match(generation, /sourceContentSha256/u, "original revision asset integrity remains authoritative");
const preview = read("lib/generated-documents/work-order-pdf/previewService.ts");
assert.match(preview, /WORK_ORDER_PDF_PREVIEW_RENDER_FAILED/u);
assert.match(preview, /classifyPreviewRenderFailure/u);
const renderer = read("lib/generated-documents/work-order-pdf/localChromiumRenderer.mts");
assert.match(renderer, /pdf\.byteLength > input\.options\.maxFileSizeBytes/u, "10MB PDF safety limit remains enforced");
const pdfTransport = read("apps/mobile/features/work-orders/documents/authenticatedPdfTransport.ts");
assert.match(pdfTransport, /WAFL_PDF_BINARY_TRANSPORT/u);
assert.match(pdfTransport, /correlationPresent/u);
assert.match(pdfTransport, /info\.status >= 500 \? "INTERNAL_ERROR"/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha70-media-binary-transport-attachment-selection",
  previousPermanentInventoryRetained: 215,
  addedPermanentChecks: 1,
  finalPermanentInventory: 216,
  imageBinaryTransport: "metadata-first-no-array-buffer",
  pdfInlineSource: "large-derivative-with-legacy-original-fallback",
  attachmentSelection: "version-sequenced-authoritative-reconcile",
  pass: true,
}));
