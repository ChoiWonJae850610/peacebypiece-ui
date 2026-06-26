#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import {
  createR2WorkerSignature,
  createR2WorkerSignedUrl,
  normalizeWorkerBaseUrl,
} from "../lib/storage/r2/r2WorkerSignature.mjs";

const appHelper = fs.readFileSync("lib/storage/r2/r2WorkerUpload.ts", "utf8");
const simulator = fs.readFileSync("tools/simulator/commands/attachment-lifecycle.mjs", "utf8");

const key = "companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00002/design/sample.png";
const secret = "unit-test-secret";
const expiresAt = 1777777777;
const contentType = "image/png";

const expectedPutSignature = crypto
  .createHmac("sha256", secret)
  .update(["PUT", key, contentType, String(expiresAt)].join("\n"))
  .digest("hex");
const expectedGetSignature = crypto
  .createHmac("sha256", secret)
  .update(["GET", key, String(expiresAt)].join("\n"))
  .digest("hex");
const expectedDeleteSignature = crypto
  .createHmac("sha256", secret)
  .update(["DELETE", key, String(expiresAt)].join("\n"))
  .digest("hex");

assert.equal(normalizeWorkerBaseUrl("https://worker.example.test///"), "https://worker.example.test");
assert.equal(createR2WorkerSignature({ secret, method: "PUT", key, contentType, expiresAt }), expectedPutSignature);
assert.equal(createR2WorkerSignature({ secret, method: "GET", key, expiresAt }), expectedGetSignature);
assert.equal(createR2WorkerSignature({ secret, method: "DELETE", key, expiresAt }), expectedDeleteSignature);

const putUrl = new URL(createR2WorkerSignedUrl({
  uploadUrl: "https://worker.example.test/upload/",
  secret,
  method: "PUT",
  key,
  contentType,
  expiresAt,
}));
assert.equal(putUrl.searchParams.get("key"), key);
assert.equal(putUrl.searchParams.get("expires"), String(expiresAt));
assert.equal(putUrl.searchParams.get("contentType"), contentType);
assert.equal(putUrl.searchParams.get("signature"), expectedPutSignature);

const deleteUrl = new URL(createR2WorkerSignedUrl({
  uploadUrl: "https://worker.example.test/upload/",
  secret,
  method: "DELETE",
  key,
  expiresAt,
}));
assert.equal(deleteUrl.searchParams.get("signature"), expectedDeleteSignature);
assert.equal(deleteUrl.searchParams.has("contentType"), false);

assert.match(appHelper, /createR2WorkerSignedUrl/);
assert.match(simulator, /createR2WorkerSignedUrl/);
assert.match(simulator, /arrayBuffer\(\)/);
assert.match(simulator, /content-type/);
assert.match(simulator, /WORKER_FILE_NOT_FOUND/);
assert.match(simulator, /status === 404/);
assert.match(simulator, /method: "DELETE"/);
assert.doesNotMatch(simulator, /ListObjectsV2Command|HeadObjectCommand|@aws-sdk\/client-s3/);

console.log("r2 worker signature contract passed: shared helper, exact-key GET byte verification, delete missing-object check");
