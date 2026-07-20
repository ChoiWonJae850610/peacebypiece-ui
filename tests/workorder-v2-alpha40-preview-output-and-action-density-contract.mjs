#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const mobile = read("apps/mobile/components/ProductionCardMock.tsx");
const previewLink = read("apps/mobile/utils/previewLink.ts");
const documentRenderer = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
const actualPreview = read("components/workorder/preview/IssuedWorkOrderPreview.tsx");
const samplePreview = read("components/workorder/preview/SampleIssuedWorkOrderPreview.tsx");
const css = read("components/workorder/preview/IssuedWorkOrderPreview.module.css");
const sketch = read("public/dev-samples/linen-round-dress-sketch.svg");
const chromiumRenderer = read("lib/generated-documents/work-order-pdf/localChromiumRenderer.mts");
const samplePdfRoute = read("app/dev/workorder-preview-sample/pdf/route.ts");
const fileRoute = read("lib/generated-documents/work-order-pdf/internalFileRoute.ts");
const fileRouteEntry = read("app/api/v2/work-orders/documents/[documentRef]/file/route.ts");
const readModels = read("lib/domain/work-orders/contracts/read-models.ts");
const detailRepository = read("lib/domain/work-orders/read/detailRepository.ts");
const runtimeRunner = read("scripts/run-wafl-v2-alpha40-preview-output-readonly.mjs");

const version = read("lib/constants/version.ts").match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
assert.ok(["2.0.0-alpha.40", "2.0.0-alpha.41", "2.0.0-alpha.42", "2.0.0-alpha.43", "2.0.0-alpha.44", "2.0.0-alpha.45", "2.0.0-alpha.46", "2.0.0-alpha.47", "2.0.0-alpha.48", "2.0.0-alpha.49", "2.0.0-alpha.50", "2.0.0-alpha.51"].includes(version));
assert.equal(read("apps/mobile/constants/version.ts").match(/MOBILE_APP_VERSION\s*=\s*"([^"]+)"/)?.[1], version);
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const publicVersion = version.replace(/-.+$/, "");
assert.match(publicVersion, /^\d+\.\d+\.\d+$/);
assert.equal(appConfig.expo.version, publicVersion);
assert.equal(appConfig.expo.extra.appVersion, version);
assert.equal(JSON.parse(read("apps/mobile/package.json")).version, version);
assert.equal(JSON.parse(read("apps/mobile/package-lock.json")).version, version);
assert.equal(JSON.parse(read("apps/mobile/package-lock.json")).packages[""].version, version);

if (version === "2.0.0-alpha.40") {
  assert.match(mobile, /const compactActions = width <= 390/);
  assert.match(mobile, /numberOfLines=\{width < 360 \? 2 : 1\}/);
} else {
  assert.match(mobile, /const isTablet = width >= 760/);
  assert.match(mobile, /const compactActions = !isTablet/);
  assert.doesNotMatch(mobile, /numberOfLines=\{width < 360 \? 2 : 1\}/);
}
assert.match(mobile, /hitSlop=\{action \? \{ top: 6, bottom: 6, left: 3, right: 3 \}/);
const compactActionStyle = mobile.match(/iconActionButtonCompact:\s*\{[\s\S]*?\n\s*\}/)?.[0] ?? "";
for (const token of ["height: 30", "minWidth: 36", "width: 36", "paddingHorizontal: 4"]) assert.match(compactActionStyle, new RegExp(token));
assert.match(mobile, /materialOrderActions:[\s\S]*?gap: 3/);
assert.match(mobile, /materialDataRow:[\s\S]*?borderWidth: 1[\s\S]*?marginBottom: 10/);

assert.equal((previewLink.match(/window\.open\(/g) ?? []).length, 1);
assert.match(previewLink, /WEB_PREVIEW_OPEN_GUARD_MS/);
assert.match(previewLink, /webPreviewOpenPending/);
assert.doesNotMatch(previewLink, /window\.location\.(?:assign|replace)|location\.href\s*=/);
assert.match(previewLink, /Linking\.openURL/);

assert.match(documentRenderer, /<img[\s\S]*?data-wafl-representative-image="true"[\s\S]*?src=\{representativeImageSrc\}/);
assert.match(css, /\.representativeImage \{[\s\S]*?object-fit: contain/);
assert.doesNotMatch(documentRenderer, /backgroundImage|role="img"/);
assert.match(documentRenderer, /<svg aria-hidden="true" viewBox="0 0 14 14">/);
assert.match(documentRenderer, /<rect[\s\S]*?fill=\{color\.hexValue/);
assert.doesNotMatch(documentRenderer, /<i style=\{\{ backgroundColor/);
assert.match(chromiumRenderer, /HTMLImageElement/);
assert.match(chromiumRenderer, /representativeImage\.complete/);
assert.match(chromiumRenderer, /representativeImage\.naturalWidth > 0/);
assert.match(chromiumRenderer, /representativeImage\.naturalHeight > 0/);
assert.match(chromiumRenderer, /GlobalWorkerOptions\.workerSrc = pathToFileURL/);
assert.doesNotMatch(sketch, />IVORY<|>NAVY<|>BLACK<|색상 기준/);
assert.match(sketch, />앞면</);
assert.match(sketch, />뒷면</);

assert.doesNotMatch(`${actualPreview}\n${samplePreview}`, /window\.print\(/);
assert.match(actualPreview, /PDF 보기/);
assert.match(actualPreview, /다운로드/);
assert.match(actualPreview, /생성된 PDF 없음/);
assert.match(actualPreview, /generationNumber/);
assert.match(actualPreview, /DocumentShareControl generatedDocumentId/);
assert.match(samplePreview, /href="\/dev\/workorder-preview-sample\/pdf"/);
assert.match(samplePreview, /샘플 PDF 다운로드/);

for (const field of ["generationNumber", "fileSizeBytes", "generatedAt", "status", "displayDocumentNumber", "revisionId", "accessTokenAvailable", "inlineUrl", "downloadUrl"]) {
  assert.match(readModels, new RegExp(`readonly ${field}`));
}
assert.match(detailRepository, /d\.generation_no/);
assert.match(detailRepository, /d\.file_size_bytes/);
assert.match(detailRepository, /disposition=inline/);
assert.match(detailRepository, /disposition=attachment/);

assert.match(fileRouteEntry, /handleGetInternalGeneratedDocumentFile/);
assert.match(fileRoute, /requireWorkspaceApiGuard\(\{ permissionCode: "workorder\.read" \}\)/);
assert.match(fileRoute, /withWaflV2TenantReadOnlyTransaction/);
assert.match(fileRoute, /document\.company_id = \$1/);
assert.match(fileRoute, /document\.status = 'generated'/);
assert.match(fileRoute, /document\.revoked_at IS NULL/);
assert.match(fileRoute, /document\.deleted_at IS NULL/);
assert.match(fileRoute, /R2WorkerGeneratedDocumentTransport\(\)\.get/);
assert.match(fileRoute, /Content-Disposition/);
assert.match(fileRoute, /Content-Length/);
assert.match(fileRoute, /createHash\("sha256"\)/);
assert.match(fileRoute, /body\.subarray\(0, 5\).*"%PDF-"/s);
assert.doesNotMatch(fileRoute, /\.put\(|\.delete\(|INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM/i);

assert.match(samplePdfRoute, /isLocalOnlyRouteHostAllowed/);
assert.match(samplePdfRoute, /LocalChromiumIssuedWorkOrderPdfRenderer/);
assert.match(samplePdfRoute, /createAlpha37SamplePdfFoundation/);
assert.match(samplePdfRoute, /Content-Type": "application\/pdf"/);
assert.match(samplePdfRoute, /Content-Disposition/);
assert.doesNotMatch(samplePdfRoute, /DATABASE_URL|R2_WORKER|\.put\(|\.delete\(|INSERT\s+INTO|UPDATE\s+/i);

assert.match(runtimeRunner, /BEGIN READ ONLY/);
assert.match(runtimeRunner, /ALPHA40_INTERNAL_PDF_READ_ONLY_PASS/);
assert.match(runtimeRunner, /r2GetCount: 2/);
assert.match(runtimeRunner, /companyB: "NOT_FOUND"/);
assert.match(runtimeRunner, /companyH: "NOT_FOUND"/);
assert.match(runtimeRunner, /companyC: "COMPANY_APPROVAL_PENDING"/);
assert.doesNotMatch(runtimeRunner, /method:\s*"(?:POST|PATCH|PUT|DELETE)"|INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM|\.put\(|\.delete\(/i);

const alpha42ContractExists = fs.existsSync(path.join(root, "tests/workorder-v2-alpha42-realistic-issued-embedded-qr-contract.mjs"));
assert.equal(fs.readdirSync(path.join(root, "db/v2/migrations")).filter((name) => /^\d{3}_.*\.sql$/.test(name)).length, fs.existsSync(path.join(root, "db/v2/migrations/013_v2_material_line_archive_lifecycle.sql")) ? 13 : alpha42ContractExists ? 12 : 11);
console.log("workorder v2 alpha.40 preview output and action density contract: PASS");
