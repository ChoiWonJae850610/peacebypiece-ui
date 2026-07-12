#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const required = [
  "apps/mobile/utils/previewLink.ts",
  "apps/mobile/components/ProductionCardMock.tsx",
  "apps/mobile/constants/mockProductionCard.ts",
  "app/api/v2/work-orders/documents/[documentNumber]/preview-target/route.ts",
  "app/(workspace)/workspace/documents/[documentNumber]/preview/page.tsx",
  "components/workorder/preview/DocumentNumberPreviewResolver.tsx",
  "lib/domain/work-orders/read/previewTargetService.ts",
  "lib/domain/work-orders/read/previewTargetRepository.ts",
];
for (const file of required) assert.ok(fs.existsSync(path.join(root, file)), `missing alpha.29 file: ${file}`);

const helper = read(required[0]);
const mobile = read(required[1]);
const mock = read(required[2]);
const apiRoute = read(required[3]);
const resolver = read(required[5]);
const service = read(required[6]);
const repository = read(required[7]);
const runner = read("scripts/run-wafl-v2-alpha29-mobile-preview-entry.mjs");

assert.match(helper, /EXPO_PUBLIC_WAFL_WEB_BASE_URL/);
assert.match(helper, /encodeURIComponent\(identity\.issuedDocumentNumber\)/);
assert.match(helper, /process\.env\.NODE_ENV === "production"/);
assert.match(helper, /window\.open\(target\.url, "_blank", "noopener,noreferrer"\)/);
assert.match(helper, /window\.location\.assign\(target\.url\)/);
assert.match(helper, /Linking\.canOpenURL/);
assert.match(helper, /Linking\.openURL/);
assert.doesNotMatch(helper, /[?&](token|companyId|storageKey)=|access_token|signed/i);

assert.equal((mock.match(/issuedDocumentNumber:/g) ?? []).length, 1, "document number must have one mock metadata source");
assert.match(mock, /WAFN-26FWA-A25CMD-260711-001-R0/);
assert.doesNotMatch(mobile, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
assert.match(mobile, /workOrderState === "issued" \? onOpenPreview : onOpenOrderConfirm/);
assert.match(mobile, /<WorkOrderConfirmPanel[\s\S]*onPreview=\{openPreview\}/);
assert.match(mobile, /<DocumentWorkbench[\s\S]*onOpenPreview=\{onOpenPreview\}/);
assert.match(mobile, /<IconButton label="보기" icon="eye" onPress=\{onOpenPreview\}/);
assert.match(mobile, /발행된 작업지시서에서 미리보기를 사용할 수 있습니다/);
assert.match(mobile, /발행된 문서에서 보기 기능을 사용할 수 있습니다/);
assert.doesNotMatch(mobile, /onPress=\{onOpenPreview\}[\s\S]{0,240}<Pressable/);

assert.match(apiRoute, /export async function GET/);
assert.match(apiRoute, /requireWorkspaceApiGuard\(\{ permissionCode: "workorder\.read" \}\)/);
assert.match(apiRoute, /getWorkOrderV2ReadRuntimeGuard/);
assert.doesNotMatch(apiRoute, /export async function (POST|PATCH|PUT|DELETE)/);
assert.match(service, /DOCUMENT_NUMBER/);
assert.match(service, /generic|NOT_FOUND/i);
assert.doesNotMatch(service, /companyId.*searchParams|searchParams.*companyId/);
assert.match(repository, /withWaflV2TenantReadOnlyTransaction/);
assert.match(repository, /w\.company_id = \$1/);
assert.match(repository, /w\.document_number_base = \$2/);
assert.match(repository, /r\.revision_no = \$3/);
assert.match(repository, /w\.status IN \('issued','revised','completed'\)/);
assert.match(repository, /r\.revision_status IN \('finalized','superseded'\)/);
assert.doesNotMatch(repository, /^\s*(INSERT|UPDATE|DELETE|MERGE|TRUNCATE|DROP|ALTER)\b/im);
assert.match(resolver, /\/workspace\/workorders\/\$\{encodeURIComponent\(body\.data\.workOrderId\)\}\/revisions\/\$\{encodeURIComponent\(body\.data\.revisionId\)\}\/preview/);
assert.doesNotMatch(`${helper}\n${resolver}`, /createQr|uploadToR2|generatePdf|storage_object_key|raw token/i);
assert.match(runner, /BEGIN READ ONLY/);
assert.match(runner, /method:"GET"/);
assert.doesNotMatch(runner, /method:\s*["'`](POST|PATCH|PUT|DELETE)/);
assert.doesNotMatch(runner, /^\s*(INSERT|UPDATE|DELETE|MERGE|TRUNCATE|DROP|ALTER)\b/im);
assert.match(runner, /read-only-mobile-preview-entry-mutated-database/);
assert.match(runner, /REQUIRED_FINGERPRINT = "01e5dcc7fea3"/);

console.log("workorder v2 alpha.29 mobile preview entry contract: PASS");
