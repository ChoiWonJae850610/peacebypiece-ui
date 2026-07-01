#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import worker from "../cloudflare/r2-upload-worker.js";

const workerSource = fs.readFileSync("cloudflare/r2-upload-worker.js", "utf8");
const secret = "unit-test-secret";
const expires = Math.floor(Date.now() / 1000) + 300;

function signature(method, key, contentType = "application/octet-stream") {
  const payload = method === "PUT"
    ? ["PUT", key, contentType, String(expires)].join("\n")
    : [method, key, String(expires)].join("\n");
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function signedUrl(method, key, contentType = "application/octet-stream", overrides = {}) {
  const url = new URL("https://worker.example.test/upload");
  url.searchParams.set("key", key);
  url.searchParams.set("expires", String(overrides.expires ?? expires));
  url.searchParams.set("signature", overrides.signature ?? signature(method, key, contentType));
  if (method === "PUT") url.searchParams.set("contentType", contentType);
  return url.toString();
}

function createEnv() {
  const store = new Map();
  return {
    R2_WORKER_UPLOAD_SECRET: secret,
    R2_BUCKET: {
      async put(key, body, options) {
        store.set(key, {
          body,
          size: Number(body?.size ?? body?.byteLength ?? 1),
          httpMetadata: options?.httpMetadata ?? {},
        });
      },
      async get(key) {
        return store.get(key) ?? null;
      },
      async delete(key) {
        store.delete(key);
      },
    },
  };
}

async function putStatus(key, contentType, size = 32, options = {}) {
  const body = Buffer.alloc(size, 1);
  const request = new Request(signedUrl("PUT", key, contentType, options), {
    method: "PUT",
    headers: { "Content-Type": contentType, "Content-Length": String(size) },
    body,
  });
  const response = await worker.fetch(request, createEnv());
  return response.status;
}

async function methodStatus(method, key) {
  const request = new Request(signedUrl(method, key), { method });
  const response = await worker.fetch(request, createEnv());
  return response.status;
}

const validPdfKey = "companies/wafl-fn-company-a/workorders/wafl-fn-company-a-workorder-00001/pdf/pdf_0-24-28-a.pdf";

assert.match(workerSource, /const WORKER_VERSION = "0\.13\.71"/);
assert.match(workerSource, /const WORK_ORDER_PDF_KEY_PATTERN = \/\^companies\\\/\[\^\/]\+\\\/workorders\\\/\[\^\/]\+\\\/pdf\\\/\[\^\/]\+\\\.pdf\$\/i;/);
assert.match(workerSource, /function isWorkOrderPdfKey/);
assert.match(workerSource, /WORK_ORDER_PDF_POLICY/);
assert.doesNotMatch(workerSource, /companies\\\/\.\*workorders|pdf\\\/\.\*/);
assert.doesNotMatch(workerSource, /R2_WORKER_UPLOAD_SECRET\s*=\s*["']|https:\/\/.*workers\.dev|r2\.cloudflarestorage\.com/);

assert.equal(await putStatus(validPdfKey, "application/pdf"), 200, "valid workorder PDF key must be accepted");
assert.equal(await methodStatus("GET", validPdfKey), 404, "signed GET contract must remain unchanged");
assert.equal(await methodStatus("DELETE", validPdfKey), 200, "signed DELETE contract must remain unchanged");

for (const key of [
  "companies/c/workorders/w/pdf/file.jpeg",
  "companies/c/workorders/w/pdf/file",
  "companies/c/workorders/w/pdf/file.",
  "companies/c/workorders/w/pdf/nested/file.pdf",
  "/companies/c/workorders/w/pdf/file.pdf",
  "companies/c/workorders/w/pdf/../file.pdf",
  "companies\\c\\workorders\\w\\pdf\\file.pdf",
  "companies/c/workorders/w/pdfs/file.pdf",
]) {
  assert.equal(await putStatus(key, "application/pdf"), 400, `${key} must be rejected`);
}

assert.equal(await putStatus(validPdfKey, "image/png"), 400, "PDF key with PNG MIME must be rejected");
assert.equal(await putStatus(validPdfKey, "application/pdf", 10 * 1024 * 1024 + 1), 400, "PDF over 10MB must be rejected");
assert.equal(await putStatus(validPdfKey, "application/pdf", 32, { signature: "bad-signature" }), 401, "invalid signature must be rejected");

assert.equal(await putStatus("companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00002/design/sample.png", "image/png"), 200);
assert.equal(await putStatus("companies/wafl-fn-company-a/onboarding/business-license/sample.pdf", "application/pdf"), 200);
assert.equal(await putStatus("companies/wafl-fn-company-a/company-files/business_registration/sample.pdf", "application/pdf"), 200);
assert.equal(await putStatus("signup-applications/app_0-24-26-a/business-registration/file_0-24-26-a.pdf", "application/pdf"), 200);

console.log("r2 upload worker workorder PDF policy contract: OK");
