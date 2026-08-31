#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const boundary = read("apps/mobile/features/work-orders/images/workOrderMediaBoundary.ts");
const controller = read("apps/mobile/features/work-orders/images/useWorkOrderAssetAuthoringController.ts");
const imageAuthoring = read("apps/mobile/features/work-orders/images/workOrderImageAuthoringActions.ts");
const attachmentAuthoring = read("apps/mobile/features/work-orders/images/useWorkOrderAttachmentAuthoring.ts");
const projection = read("apps/mobile/features/work-orders/images/useWorkOrderAssetProjectionController.ts");
const facade = read("apps/mobile/lib/api/assetsApi.ts");
const imageApi = read("apps/mobile/lib/api/imageAssetsApi.ts");
const attachmentApi = read("apps/mobile/lib/api/attachmentAssetsApi.ts");
const uploadTransport = read("apps/mobile/lib/api/assetUploadTransport.ts");
const guardrails = read("docs/project/app-v2/drawing-architecture-guardrails.md");
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const currentState = read("docs/codex-current-state.md");
const roadmap = read("docs/project/app-v2/08-roadmap-2.0.md");

assert.match(overview, /readonly media: WorkOrderMediaBoundary/u);
for (const flatProp of [
  "readonly images:", "readonly attachments:", "readonly imageBusy:", "readonly imageBusyId:",
  "readonly onAcquireImage:", "readonly onAcquireAttachment:", "readonly onDeleteImage:",
]) {
  assert.ok(!overview.includes(flatProp), `flat media prop must be absent: ${flatProp}`);
}
assert.match(experience, /media=\{\{/u);
assert.match(boundary, /projection:[\s\S]*mutation:[\s\S]*imageActions:[\s\S]*attachmentActions:/u);
assert.doesNotMatch(experience, /drawing(Scene|Tool|Viewport|History|Selection)|sketch(Scene|Tool|Viewport)/iu);

assert.match(controller, /createExplicitMutationController/u);
assert.equal((controller.match(/createExplicitMutationController\(\)/gu) ?? []).length, 1, "media composition must own one mutation gate");
assert.match(controller, /useWorkOrderImageAuthoringActions/u);
assert.match(controller, /useWorkOrderAttachmentAuthoring/u);
assert.match(controller, /useWorkOrderAssetProjectionController/u);
assert.ok(controller.split(/\r?\n/u).length < 100, "compatibility controller should stay composition-only");

assert.match(imageAuthoring, /completeImageWithSingleConflictRebase/u);
assert.match(imageAuthoring, /reconcileImageUpload/u);
assert.match(imageAuthoring, /refreshProjection/u);
assert.match(attachmentAuthoring, /applyVersionedAttachmentOutputSelection/u);
assert.match(attachmentAuthoring, /refreshLatestProjection/u);
assert.match(projection, /refreshedDetail\.header\.entityVersion !== refreshedAssets\.entityVersion/u);
assert.match(projection, /hydrate\(refreshedAssets\.items, refreshedAssets\.attachments\)/u);

assert.match(facade, /from "\.\/imageAssetsApi"/u);
assert.match(facade, /from "\.\/attachmentAssetsApi"/u);
assert.match(facade, /from "\.\/assetReadApi"/u);
assert.match(facade, /from "\.\/assetUploadTransport"/u);
assert.match(imageApi, /\/images\/upload/u);
assert.doesNotMatch(imageApi, /\/attachments\//u);
assert.match(attachmentApi, /\/attachments\/upload/u);
assert.doesNotMatch(attachmentApi, /\/images\//u);
assert.match(uploadTransport, /body: blob/u);

for (const required of [
  "fixed logical world-canvas coordinate system",
  "inverse screen-to-world transform",
  "Zoom and pan update only the viewport transform",
  "Editable Scene data stays distinct from raster/SVG derivatives",
  "through an explicit adapter",
  "Device dimensions must never become logical canvas dimensions",
]) assert.ok(guardrails.includes(required), `missing Drawing guardrail: ${required}`);

assert.match(gallery, /"스케치, 준비 중"/u);
assert.match(gallery, /props\.drawingRendererPocEnabled \? "SVG Performance PoC" : "스케치"/u);
assert.match(gallery, /disabled=\{!props\.drawingRendererPocEnabled\}/u);
assert.match(gallery, /if \(props\.drawingRendererPocEnabled\) setDrawingPocVisible\(true\)/u);
for (const owner of [currentState, roadmap]) {
  assert.match(owner, /ALPHA71_PRE_DRAWING_ARCHITECTURE_REFACTOR_IPHONE_QA_REQUIRED/u);
  assert.match(owner, /PHYSICAL_RESULT_NOT_INFERRED/u);
  assert.match(owner, /2\.0\.0-alpha\.71/u);
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha71-pre-drawing-architecture",
  previousPermanentInventoryRetained: 217,
  addedPermanentChecks: 1,
  finalPermanentInventory: 218,
  behaviorDelta: 0,
  drawingImplementation: 0,
}));
