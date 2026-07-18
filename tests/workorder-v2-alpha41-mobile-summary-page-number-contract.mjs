#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const mobile = read("apps/mobile/components/ProductionCardMock.tsx");
const documentRenderer = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
const css = read("components/workorder/preview/IssuedWorkOrderPreview.module.css");
const chromiumRenderer = read("lib/generated-documents/work-order-pdf/localChromiumRenderer.mts");
const pageOrientation = read("lib/generated-documents/work-order-pdf/pdfPageOrientation.mjs");
const samplePdfRoute = read("app/dev/workorder-preview-sample/pdf/route.ts");
const readonlyRunner = read("scripts/run-wafl-v2-alpha40-preview-output-readonly.mjs");

const version = read("lib/constants/version.ts").match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
const alpha42ContractExists = fs.existsSync(path.join(root, "tests/workorder-v2-alpha42-realistic-issued-embedded-qr-contract.mjs"));
assert.ok(version === "2.0.0-alpha.41" || (alpha42ContractExists && new Set(["2.0.0-alpha.42", "2.0.0-alpha.43", "2.0.0-alpha.44"]).has(version)));
assert.equal(read("apps/mobile/constants/version.ts").match(/MOBILE_APP_VERSION\s*=\s*"([^"]+)"/)?.[1], version);
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const publicVersion = version.replace(/-.+$/, "");
assert.match(publicVersion, /^\d+\.\d+\.\d+$/);
assert.equal(appConfig.expo.version, publicVersion);
assert.equal(appConfig.expo.extra.appVersion, version);
assert.equal(JSON.parse(read("apps/mobile/package.json")).version, version);
const mobileLock = JSON.parse(read("apps/mobile/package-lock.json"));
assert.equal(mobileLock.version, version);
assert.equal(mobileLock.packages[""].version, version);

const materialRow = mobile.match(/function MaterialRow\([\s\S]*?\n\}\n\ntype MaterialEditValues/)?.[0] ?? "";
assert.match(materialRow, /const isTablet = width >= 760/);
assert.match(materialRow, /const compactActions = !isTablet/);
assert.match(materialRow, /testID="material-order-summary-lines"/);
assert.match(materialRow, /testID="material-order-summary-primary"[\s\S]*?발주 \{orderQuantitySummary\} · 단가 \{unitPriceSummary\}/);
assert.match(materialRow, /testID="material-order-summary-amount"[\s\S]*?금액 \{amountSummary\}/);
assert.equal((materialRow.match(/testID="material-order-summary-(?:primary|amount)"/g) ?? []).length, 2);
assert.equal((materialRow.match(/numberOfLines=\{1\}/g) ?? []).length, 3);
assert.doesNotMatch(materialRow, /width < 360|width <= 390|text-overflow|ellipsizeMode/);
assert.match(materialRow, /caption=\{compactActions \? undefined : action\.caption\}/);
assert.match(materialRow, /label=\{`\$\{action\.label\} mock`\}/);
assert.match(mobile, /accessibilityLabel=\{mock \? `\$\{label\} mock 동작` : label\}/);
assert.match(mobile, /hitSlop=\{action \? \{ top: 6, bottom: 6, left: 3, right: 3 \}/);
assert.match(mobile, /materialOrderLineStack:[\s\S]*?flex: 1[\s\S]*?justifyContent: "center"[\s\S]*?minWidth: 0/);
assert.match(mobile, /materialOrderLineText:[\s\S]*?fontVariant: \["tabular-nums"\]/);
assert.match(mobile, /materialOrderActions:[\s\S]*?flexShrink: 0[\s\S]*?flexWrap: "nowrap"/);

assert.match(documentRenderer, /function RepeatedHeading\(\{ data \}/);
assert.doesNotMatch(documentRenderer, /displayDocumentNumber\} · \{pageNumber\}/);
assert.doesNotMatch(documentRenderer, /RepeatedHeading data=\{data\} pageNumber=/);
assert.match(documentRenderer, /const totalPages = contentPages\.length \+ 1/);
assert.match(documentRenderer, /function PageNumberFooter/);
assert.match(documentRenderer, /data-testid="workorder-page-number"/);
assert.match(documentRenderer, /\{pageNumber\} \/ \{totalPages\}/);
assert.match(documentRenderer, /PageNumberFooter pageNumber=\{1\} totalPages=\{totalPages\}/);
assert.match(documentRenderer, /PageNumberFooter pageNumber=\{pageIndex \+ 2\} totalPages=\{totalPages\}/);
assert.match(css, /\.page \{ position: relative;/);
assert.match(css, /\.pageNumberFooter \{[\s\S]*?position: absolute;[\s\S]*?left: 0;[\s\S]*?right: 0;[\s\S]*?bottom: 5\.5mm;[\s\S]*?text-align: center;/);
assert.match(css, /@media \(max-width: 760px\)[\s\S]*?padding: 18px 12px 36px[\s\S]*?\.pageNumberFooter \{ bottom: 10px; \}/);

assert.match(chromiumRenderer, /validatePdfPageOrientations\(pageOrientationEvidence\)/);
assert.match(chromiumRenderer, /PdfPageOrientationValidationError/);
assert.match(pageOrientation, /pageIndex === 0 \? "landscape" : "portrait"/);
assert.match(samplePdfRoute, /LocalChromiumIssuedWorkOrderPdfRenderer/);
assert.match(samplePdfRoute, /X-WAFL-PDF-Page-Count/);
assert.doesNotMatch(samplePdfRoute, /DATABASE_URL|\.put\(|\.delete\(|INSERT\s+INTO|UPDATE\s+/i);
assert.match(readonlyRunner, /BEGIN READ ONLY/);
assert.match(readonlyRunner, /r2GetCount: 2/);
assert.doesNotMatch(readonlyRunner, /method:\s*"(?:POST|PATCH|PUT|DELETE)"|INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM|\.put\(|\.delete\(/i);

assert.equal(fs.readdirSync(path.join(root, "db/v2/migrations")).filter((name) => /^\d{3}_.*\.sql$/.test(name)).length, alpha42ContractExists ? 12 : 11);
console.log("workorder v2 alpha.41 mobile summary and PDF page number contract: PASS");
