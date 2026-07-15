#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

import { prepareAlpha42RepresentativeImage } from "../scripts/lib/alpha42-representative-image.mjs";

const worker = fs.readFileSync("cloudflare/r2-upload-worker.js", "utf8");
const runner = fs.readFileSync("scripts/run-wafl-v2-alpha42-realistic-issued-embedded-qr-runtime.mjs", "utf8");
const helper = fs.readFileSync("scripts/lib/alpha42-representative-image.mjs", "utf8");

assert.match(worker, /design: \["image\/jpeg", "image\/png", "image\/webp"\]/);
assert.doesNotMatch(worker, /design: \[[^\]]*image\/svg\+xml/);
assert.match(worker, /WORKER_FILE_POLICY_REJECTED/);
assert.match(runner, /prepareAlpha42RepresentativeImage/);
assert.match(runner, /\$\{image\.contentSha256\.slice\(0, 24\)\}\$\{image\.extension\}/);
assert.match(runner, /imageFilename: image\.filename/);
assert.match(runner, /imageMimeType: image\.mimeType/);
assert.match(runner, /WORKER_FILE_POLICY_REJECTED/);
assert.match(runner, /continuation-preflight/);
assert.match(runner, /continuationMutationBudget/);
assert.match(helper, /from "@playwright\/test"/);
assert.match(helper, /OUTPUT_MIME_TYPE = "image\/png"/);
assert.match(helper, /OUTPUT_FILENAME = "linen-round-dress-sketch\.png"/);
assert.doesNotMatch(helper, /fetch\(|https?:\/\//);

const first = await prepareAlpha42RepresentativeImage();
const second = await prepareAlpha42RepresentativeImage();
assert.equal(first.mimeType, "image/png");
assert.equal(first.extension, ".png");
assert.equal(first.filename, "linen-round-dress-sketch.png");
assert.equal(first.width, 920);
assert.equal(first.height, 920);
assert.ok(first.fileSizeBytes > 0 && first.fileSizeBytes <= 10 * 1024 * 1024);
assert.equal(first.fileSizeBytes, first.bytes.byteLength);
assert.deepEqual(first.bytes.subarray(0, 8), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
assert.match(first.sourceSha256, /^[a-f0-9]{64}$/);
assert.match(first.contentSha256, /^[a-f0-9]{64}$/);
assert.equal(first.contentSha256, crypto.createHash("sha256").update(first.bytes).digest("hex"));
assert.equal(second.contentSha256, first.contentSha256, "alpha42 representative PNG must be deterministic");
assert.equal(second.bytes.byteLength, first.bytes.byteLength);

console.log(JSON.stringify({
  result: "workorder v2 alpha.42 representative image transport contract: PASS",
  format: first.extension,
  mimeType: first.mimeType,
  width: first.width,
  height: first.height,
  fileSizeBytes: first.bytes.byteLength,
  sourceSha256: first.sourceSha256,
  contentSha256: first.contentSha256,
  deterministic: true,
  networkRequests: 0,
  r2Mutation: false,
}));
