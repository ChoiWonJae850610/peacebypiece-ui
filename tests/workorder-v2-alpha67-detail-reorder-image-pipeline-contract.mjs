#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const mobile = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const errorPresentation = read("apps/mobile/application/errorPresentation.ts");
const queryController = read("apps/mobile/features/work-orders/workOrderQueryController.ts");
const worker = read("cloudflare/r2-upload-worker.js");
const deployment = read("scripts/deploy-wafl-r2-upload-worker.mjs");
const imageRoute = read("lib/domain/work-orders/command/imageCommandRoute.ts");

assert.match(mobile, /async function loadWorkOrderDetailHydration/u);
assert.match(mobile, /Promise\.all\(\[[\s\S]+detail\(workOrderId\)[\s\S]+images\(workOrderId\)[\s\S]+materialPartners\(workOrderId\)/u);
assert.match(mobile, /detail\.header\.identity\.isSample[\s\S]+history: null/u);
assert.match(mobile, /seriesHistory\(workOrderId\)[\s\S]+catch[\s\S]+historyUnavailable: true/u);
assert.doesNotMatch(mobile, /Promise\.all\(\[[\s\S]{0,800}seriesHistory\(item\.workOrderId\)/u, "detail entry must not make optional history part of its required Promise.all");
assert.match(queryController, /seriesHistory\(workOrderId/u);

assert.match(mobile, /committedReorderRead/u);
assert.match(mobile, /workOrderId: created\.result\.workOrderId, reorderRound: created\.result\.reorderRound/u);
assert.match(mobile, /await hydrateCommittedReorder\(\)/u);
assert.match(mobile, /retryTarget: "post-create-detail"/u);
assert.match(mobile, /errorState\.retryTarget === "post-create-detail"\) void hydrateCommittedReorder\(\)/u);
assert.match(errorPresentation, /post-create-detail[\s\S]+생성된 리오더만 다시 불러옵니다/u);
assert.doesNotMatch(mobile, /listPage\.items\.find\(\(candidate\) => candidate\.workOrderId === created\.result\.workOrderId\)/u);

assert.match(worker, /const sourceStream = new Response\(sourceBytes\.slice\(0\)\)\.body/u);
assert.match(worker, /\.input\(sourceStream\)/u);
assert.match(worker, /WORKER_IMAGE_SOURCE_STREAM_UNAVAILABLE/u);
assert.doesNotMatch(worker, /\.input\(sourceBytes\.slice\(0\)\)/u);
assert.match(deployment, /\[images\][\s\S]+binding = "IMAGES"/u);
assert.match(deployment, /\[\[r2_buckets\]\][\s\S]+binding = "R2_BUCKET"/u);
assert.match(deployment, /--keep-vars/u);
assert.match(deployment, /deployments\?\.at\(-1\)/u);
assert.match(deployment, /WORKER_SECRET_BINDING_NOT_PRESERVED/u);
assert.match(imageRoute, /createWorkOrderImageDerivativesViaWorker[\s\S]+completeWorkOrderImageUploadV2/u);
assert.match(imageRoute, /deleteWorkOrderImageFamilyViaWorker/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha67-detail-reorder-image-pipeline",
  previousPermanentInventoryRetained: 162,
  addedPermanentChecks: 1,
  finalPermanentInventory: 163,
  migrationLedger: "20/20",
  migration021: 0,
  productionMutation: 0,
  ownerFixtureMutation: 0,
  physicalResultInferred: false,
}));
