#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildWorkOrderShareMessage } from "../apps/mobile/features/work-orders/documents/documentShareMessage.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const viewer = read("apps/mobile/features/work-orders/documents/WaflAuthenticatedPdfViewer.tsx");
const transport = read("apps/mobile/features/work-orders/documents/authenticatedPdfTransport.ts");
const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const productionPolicy = read("apps/mobile/domain/productionOrderPolicy.ts");
const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
const publicViewer = read("app/v/DocumentViewerClient.tsx");
const browserQa = read("scripts/run-wafl-v2-alpha67-viewer-browser-qa.mjs");

for (const marker of ["onPageChanged", 'accessibilityLabel="작업지시서 보기 닫기"', "authenticated-pdf-viewer-footer"]) {
  assert.ok(viewer.includes(marker), `PDF_VIEWER_OWNER_MISSING:${marker}`);
}
assert.doesNotMatch(viewer, /authenticated-pdf-viewer-(?:previous|next)-page|accessibilityLabel="(?:이전|다음) 페이지"/u);
assert.match(viewer, /\$\{page\} \/ \$\{pageCount\}/u);

assert.match(productionPolicy, /status === "in_progress"[\s\S]*actions: input\.currentDraft \? \["cancel"\] : \[\]/u);
assert.doesNotMatch(productionPolicy, /\["complete",\s*"cancel"\]/u);
assert.doesNotMatch(production, /label: "완료"/u);
assert.doesNotMatch(production, /action === "complete"/u);

assert.match(workbench, /prepareAuthenticatedDocumentPdfForSave/u);
assert.match(workbench, /Share\.share\(\{[\s\S]*url: `file:\/\/\$\{saveFile\.path\}`/u);
assert.doesNotMatch(workbench, /Linking\.openURL/u);
assert.match(transport, /Accept: "application\/pdf"/u);
assert.match(transport, /contentType\.includes\("application\/pdf"\)/u);
assert.match(transport, /startsWith\("JVBERi0"\)/u);
assert.match(transport, /fs\.hash\(downloaded\.path, "sha256"\)/u);
assert.match(transport, /sourceHash !== destinationHash/u);
assert.match(transport, /fs\.unlink\(destination\)/u);
assert.doesNotMatch(transport, /viewer-target|access-tokens|storage_object_key|[?&](?:token|secret)=/iu);

for (const label of ["생성", "만료", "마지막 열람", "열람 횟수"]) {
  assert.match(workbench, new RegExp(`label: "${label}"`, "u"));
}
assert.match(workbench, /token\.lastAccessedAt \? formatDateTime\(token\.lastAccessedAt, "없음"\) : "없음"/u);
assert.match(workbench, /\$\{token\.accessCount\.toLocaleString\("ko-KR"\)\}회/u);

const viewerUrl = "https://example.invalid/v#t=opaque";
const message = buildWorkOrderShareMessage({ productName: "테스트 제품", totalQuantity: 24, dueDate: null, viewerUrl });
assert.equal(message.split(viewerUrl).length - 1, 1);
assert.match(message, /^WAFL에서 작업지시서를 공유했습니다\./u);
assert.match(message, /테스트 제품\n수량 24개 · 납기 미지정/u);
assert.match(message, /아래 링크에서 작업지시서를 확인해 주세요\.\nhttps:\/\/example\.invalid/u);
assert.doesNotMatch(message, /R0|revision|초대합니다|internal|작업지시서 ID/iu);
const publicShareCall = workbench.match(/await Share\.share\(\{[\s\S]*?buildWorkOrderShareMessage[\s\S]*?\}\);/u)?.[0] ?? "";
assert.ok(publicShareCall);
assert.doesNotMatch(publicShareCall, /\burl\s*:/u);

assert.doesNotMatch(publicViewer, /<object/u);
assert.match(publicViewer, /fetch\("\/api\/public\/document-viewer\/file"/u);
assert.match(publicViewer, /PublicPdfCanvasViewer/u);
assert.match(publicViewer, /new Uint8Array\(buffer\)/u);
assert.match(publicViewer, /href="\/api\/public\/document-viewer\/download"/u);
assert.match(browserQa, /getByTestId\("public-document-pdf-page-1"\)/u);
assert.match(browserQa, /inlinePdf200WithoutClick: true/u);
assert.match(browserQa, /INTERNAL_FILE_AUTH_WEAKENED/u);

const docs = [
  "docs/project/app-v2/11a-mobile-design-system-v2.md",
  "docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md",
  "docs/project/app-v2/16-workorder-api-command-read-model-contracts.md",
  "docs/project/app-v2/17-v2-api-contract-test-plan.md",
].map(read).join("\n");
assert.match(docs, /닫기|close/iu);
assert.match(docs, /BRANDED_PUBLIC_VIEWER_DOMAIN_DEFERRED/u);
assert.match(docs, /PHYSICAL_RESULT_NOT_INFERRED/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha67-document-ux-share-save",
  previousPermanentInventoryRetained: 169,
  addedPermanentChecks: 1,
  finalPermanentInventory: 170,
  physicalResultInferred: false,
}));
