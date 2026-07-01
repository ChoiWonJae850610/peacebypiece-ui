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

const validPngKey = "signup-applications/app_0-24-26-a/business-registration/file_0-24-26-a.png";
const validJpgKey = "signup-applications/app_0-24-26-a/business-registration/file_0-24-26-a.jpg";
const validPdfKey = "signup-applications/app_0-24-26-a/business-registration/file_0-24-26-a.pdf";

assert.match(workerSource, /const WORKER_VERSION = "0\.13\.71"/, "Worker patch version must be bumped");
assert.ok(
  workerSource.includes("const SIGNUP_APPLICATION_CERTIFICATE_KEY_PATTERN = /^signup-applications\\/[^/]+\\/business-registration\\/[^/]+\\.(png|jpg|pdf)$/i;"),
  "signup certificate key pattern must be explicit",
);
assert.match(workerSource, /isSignupApplicationCertificateKey/, "signup certificate key helper must be explicit");
assert.match(workerSource, /isAllowedSignupApplicationCertificate/, "signup certificate file policy helper must be explicit");
assert.doesNotMatch(workerSource, /signup-applications\/\.\*|signup-applications\\\/\.\*/, "signup certificate policy must not use a generic catch-all");
assert.doesNotMatch(workerSource, /R2_WORKER_UPLOAD_SECRET\s*=\s*["']|https:\/\/.*workers\.dev|r2\.cloudflarestorage\.com/, "Worker must not hard-code secrets or endpoints");

assert.equal(await putStatus(validPngKey, "image/png"), 200, "valid signup PNG key must be accepted");
assert.equal(await putStatus(validJpgKey, "image/jpeg"), 200, "valid signup JPG key must be accepted");
assert.equal(await putStatus(validPdfKey, "application/pdf"), 200, "valid signup PDF key must be accepted");
assert.equal(await methodStatus("GET", validPdfKey), 404, "signed GET contract must remain accepted before object existence check");
assert.equal(await methodStatus("DELETE", validPdfKey), 200, "signed DELETE contract must remain accepted");

for (const key of [
  "signup-applications/app/business-registration/file.jpeg",
  "signup-applications/app/business-registration/file.webp",
  "signup-applications/app/business-registration/file.svg",
  "signup-applications/app/business-registration/file.html",
  "signup-applications/app/business-registration/file.js",
  "signup-applications/app/business-registration/file.exe",
  "signup-applications/app/business-registration/file.jfif",
  "signup-applications/app/business-registration/file",
  "signup-applications/app/business-registration/file.",
  "signup-applications/app/certificate/file.png",
  "signup-applications/app/business-registration/nested/file.png",
  "/signup-applications/app/business-registration/file.png",
  "signup-applications/app/../business-registration/file.png",
  "signup-applications\\app\\business-registration\\file.png",
  "signup-applications-extra/app/business-registration/file.png",
]) {
  assert.equal(await putStatus(key, "image/png"), 400, `${key} must be rejected`);
}

assert.equal(await putStatus(validPngKey, "application/pdf"), 400, "PNG key with PDF MIME must be rejected");
assert.equal(await putStatus(validPdfKey, "image/jpeg"), 400, "PDF key with JPEG MIME must be rejected");
assert.equal(await putStatus(validPngKey, "image/png", 10 * 1024 * 1024 + 1), 400, "signup certificate over 10MB must be rejected");
assert.equal(await putStatus(validPngKey, "image/png", 32, { signature: "bad-signature" }), 401, "invalid signature must be rejected");
assert.equal(await putStatus(validPngKey, "image/png", 32, { expires: 1, signature: signature("PUT", validPngKey, "image/png") }), 401, "expired signature must be rejected");

assert.equal(await putStatus("companies/wafl-fn-company-b/workorders/wafl-fn-company-b-workorder-00002/design/sample.png", "image/png"), 200, "existing workorder attachment key must remain accepted");
assert.equal(await putStatus("companies/wafl-fn-company-a/onboarding/business-license/sample.pdf", "application/pdf"), 200, "existing onboarding key must remain accepted");
assert.equal(await putStatus("companies/wafl-fn-company-a/company-files/business_registration/sample.pdf", "application/pdf"), 200, "existing company file key must remain accepted");

console.log("r2 upload worker signup certificate policy contract: OK");
