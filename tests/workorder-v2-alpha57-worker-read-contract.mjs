#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (relativePath) => fs.readFileSync(relativePath, "utf8");

const pagination = read("lib/domain/work-orders/contracts/pagination.ts");
const detailService = read("lib/domain/work-orders/read/detailService.ts");
const mobileApi = read("apps/mobile/lib/apiClient.ts");
const imageRuntimeQa = read("scripts/run-wafl-v2-alpha57-work-order-image-runtime-qa.mjs");
const diagnostic = read("scripts/run-wafl-v2-alpha57-worker-read-diagnostic.mjs");
const fileRoute = read("lib/workorder/attachments/attachmentFileRoute.ts");
const v2ImageRoute = read("app/api/v2/work-orders/images/file/route.ts");
const workerAdapter = read("lib/storage/r2/r2WorkerUpload.ts");
const worker = read("cloudflare/r2-upload-worker.js");

assert.match(pagination, /WORK_ORDER_TAB_MAX_LIMIT = 50/);
assert.match(detailService, /Number\(value\) > WORK_ORDER_TAB_MAX_LIMIT/);
assert.match(detailService, /code: "LIMIT_EXCEEDED"/);
assert.match(mobileApi, /\/assets\?limit=50/);
assert.doesNotMatch(mobileApi, /\/assets\?limit=100/);
assert.match(imageRuntimeQa, /\/assets\?limit=50/);
assert.doesNotMatch(imageRuntimeQa, /\/assets\?limit=100/);
assert.match(diagnostic, /\/assets\?limit=50/);
assert.doesNotMatch(diagnostic, /\/assets\?limit=100/);

assert.match(v2ImageRoute, /handleWorkOrderAttachmentFileGet/);
assert.match(fileRoute, /createR2WorkerFileUrl/);
assert.match(fileRoute, /isR2WorkerUploadConfigured/);
assert.match(fileRoute, /R2_WORKER_UPLOAD_NOT_CONFIGURED/);
assert.doesNotMatch(fileRoute, /getR2Object|createR2SdkFileResponse|isR2Configured|S3Client|r2\.cloudflarestorage\.com/);
assert.ok(
  fileRoute.indexOf("isR2WorkerUploadConfigured()") < fileRoute.indexOf("R2_WORKER_UPLOAD_NOT_CONFIGURED"),
  "file transport must use Worker or fail closed",
);

assert.match(workerAdapter, /createR2WorkerFileUrl/);
assert.match(workerAdapter, /method: "GET"/);
assert.match(worker, /const object = await bucket\.get\(key\)/);
assert.match(worker, /WORKER_FILE_NOT_FOUND/);
assert.match(worker, /INVALID_WORKER_FILE_REQUEST/);

for (const field of [
  "sequence",
  "timestamp",
  "layer",
  "endpoint",
  "method",
  "request",
  "workerRoute",
  "r2Operation",
  "objectIdentifier",
  "responseStatus",
  "contentType",
  "responseBody",
  "errorCode",
  "requestId",
  "correlationId",
  "elapsedMs",
  "directR2Access",
  "workerBypass",
]) assert.match(diagnostic, new RegExp(`\\b${field}\\b`));

assert.ok(
  diagnostic.indexOf('layer: "worker-direct"') < diagnostic.indexOf('layer: "next-worker"'),
  "Worker direct probes must be defined before Next adapter probes",
);
assert.ok(
  diagnostic.indexOf('layer: "next-worker"') < diagnostic.indexOf('"assets-read"'),
  "Next adapter probes must precede app-facing assets",
);
assert.match(diagnostic, /assertZeroMutation\(before, after\)/);
assert.match(diagnostic, /r2Put: 0/);
assert.match(diagnostic, /r2Delete: 0/);
assert.match(diagnostic, /directR2S3Access: 0/);
assert.doesNotMatch(diagnostic, /bucket\.put|bucket\.delete|PutObjectCommand|DeleteObjectCommand|S3Client/);

console.log("PASS workorder-v2-alpha57-worker-read-contract");
