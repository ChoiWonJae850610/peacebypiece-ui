import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  isPublicDocumentViewerPathAllowed,
  readExternalQaServerConfig,
  validatePublicDocumentViewerOrigin,
} from "../lib/external-qa/configCore.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const publicOrigin = "https://share.wafl.co.kr";
assert.equal(validatePublicDocumentViewerOrigin(publicOrigin), publicOrigin);
assert.throws(() => validatePublicDocumentViewerOrigin("https://example.trycloudflare.com"), /PUBLIC_DOCUMENT_VIEWER_BRANDED_ORIGIN_REQUIRED/);
assert.throws(() => validatePublicDocumentViewerOrigin("https://desktop-example.ts.net"), /PUBLIC_DOCUMENT_VIEWER_BRANDED_ORIGIN_REQUIRED/);
assert.throws(() => validatePublicDocumentViewerOrigin("http://share.wafl.co.kr"), /EXTERNAL_QA_HTTPS_REQUIRED/);

assert.equal(isPublicDocumentViewerPathAllowed("/v", "GET"), true);
assert.equal(isPublicDocumentViewerPathAllowed("/_next/static/chunks/app.js", "GET"), true);
assert.equal(isPublicDocumentViewerPathAllowed("/api/public/document-viewer/session", "POST"), true);
assert.equal(isPublicDocumentViewerPathAllowed("/api/public/document-viewer/file", "GET"), true);
assert.equal(isPublicDocumentViewerPathAllowed("/api/public/document-viewer/download", "HEAD"), true);
assert.equal(isPublicDocumentViewerPathAllowed("/api/public/document-viewer/attachment", "GET"), true);
assert.equal(isPublicDocumentViewerPathAllowed("/api/auth/me", "GET"), false);
assert.equal(isPublicDocumentViewerPathAllowed("/api/v2/work-orders", "GET"), false);
assert.equal(isPublicDocumentViewerPathAllowed("/workspace", "GET"), false);
assert.equal(isPublicDocumentViewerPathAllowed("/", "GET"), false);

const config = readExternalQaServerConfig({
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ENABLED: "true",
  WAFL_EXTERNAL_QA_ORIGIN: "https://external.example.com",
  WAFL_EXTERNAL_QA_HOST_ALLOWLIST: "external.example.com",
  WAFL_EXTERNAL_QA_RUN_TOKEN: "A".repeat(40),
  WAFL_PUBLIC_DOCUMENT_VIEWER_ORIGIN: publicOrigin,
});
assert.equal(config.publicDocumentViewer?.origin, publicOrigin);
assert.equal(config.publicDocumentViewer?.hostname, "share.wafl.co.kr");


const configDeclaration = read("lib/external-qa/configCore.d.mts");
assert.match(configDeclaration, /validatePublicDocumentViewerOrigin/);
assert.match(configDeclaration, /isPublicDocumentViewerPathAllowed/);
assert.match(configDeclaration, /readonly publicDocumentViewer: null \| \{/);

const proxy = read("proxy.ts");
assert.match(proxy, /qaConfig\.publicDocumentViewer/);
assert.match(proxy, /isPublicDocumentViewerPathAllowed\(request\.nextUrl\.pathname, request\.method\)/);

const routeHelpers = read("lib/generated-documents/document-access/routeHelpers.ts");
assert.match(routeHelpers, /WAFL_PUBLIC_DOCUMENT_VIEWER_ORIGIN/);
assert.match(routeHelpers, /assertPdfViewerOriginPolicy/);
assert.equal((routeHelpers.match(/origin: documentViewerOrigin\(request\),/g) ?? []).length, 3);

const runner = read("tools/dev/start-wafl-external-qa.ps1");
assert.match(runner, /\[string\]\$PublicDocumentViewerOrigin = "https:\/\/share\.wafl\.co\.kr"/);
assert.match(runner, /WAFL_PUBLIC_DOCUMENT_VIEWER_ORIGIN = \$publicDocumentViewerOriginNormalized/);
assert.match(runner, /PUBLIC_DOCUMENT_VIEWER_BRANDED_ORIGIN_REQUIRED/);

console.log("workorder-v2-alpha67-branded-public-viewer-domain-contract: PASS");
