import assert from "node:assert/strict";
import fs from "node:fs";

import { isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";

const read = (file) => fs.readFileSync(file, "utf8");
const env = { WAFL_V2_MAKER_DOCUMENT_R0_ENABLED: "1", WAFL_V2_ALPHA64_DOCUMENT_R0_APPROVED: "2.0.0-alpha.64-dev-test-document-r0" };
assert.equal(isTailscaleServePathAllowed("/_next/static/chunks/app/v/page.js", "GET", env), true);
assert.equal(isTailscaleServePathAllowed("/_next/static/css/app.css", "HEAD", env), true);
assert.equal(isTailscaleServePathAllowed("/_next/static/chunks/app/v/page.js", "POST", env), false);
assert.equal(isTailscaleServePathAllowed("/unrelated-private-route", "GET", env), false);

const viewer = read("app/v/DocumentViewerClient.tsx");
assert.match(viewer, /VIEWER_SESSION_TIMEOUT_MS\s*=\s*15_000/);
assert.match(viewer, /AbortController/);
assert.match(viewer, /네트워크 상태를 확인한 뒤 다시 시도해 주세요/);
assert.match(viewer, /다시 시도/);
assert.match(viewer, /링크가 잘못되었거나 만료 또는 회수/);
const viewerPage = read("app/v/page.tsx");
assert.match(viewerPage, /WAFL 작업지시서/);
assert.match(viewerPage, /openGraph/);

const share = read("apps/mobile/features/work-orders/documents/documentShareMessage.ts");
const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
assert.match(share, /WAFL에서 작업지시서를 공유했습니다/);
assert.match(share, /수량.*납기/);
assert.match(share, /아래 링크에서 작업지시서를 확인해 주세요/);
assert.match(share, /^\s*input\.viewerUrl,/m);
assert.equal((share.match(/input\.viewerUrl/g) ?? []).length, 1);
assert.match(workbench, /message: buildWorkOrderShareMessage/);
assert.doesNotMatch(workbench, /url:\s*created\.viewerUrl/);
assert.match(workbench, /마지막 열람/);
assert.match(viewer, /PublicPdfCanvasViewer/);

const reset = read("scripts/run-wafl-v2-alpha67-viewer-share-reset-cleanbase.mjs");
for (const name of ["DB-BACKUP.json", "KEEP-MANIFEST.json", "DELETE-MANIFEST.json", "R2-DELETE-MANIFEST.json"]) assert.ok(reset.includes(name));
assert.match(reset, /DELETE_GRAPH_CHANGED_AFTER_MANIFEST/);
assert.match(reset, /ALPHA67_CLEANBASE_EXECUTE_NOOP_PASS/);
assert.match(reset, /noncanonical-or-ownership-unproven/);
assert.match(reset, /referenced-outside-target/);
assert.match(reset, /ALTER TABLE \$\{table\} DISABLE TRIGGER \$\{trigger\}/);
assert.match(reset, /ALTER TABLE \$\{table\} ENABLE TRIGGER \$\{trigger\}/);
assert.doesNotMatch(reset, /session_replication_role/i);
assert.doesNotMatch(reset, /DELETE\s+FROM\s+\w+\s*;|TRUNCATE/i);
assert.match(reset, /PRODUCTION_RUNTIME_FORBIDDEN/);
assert.match(reset, /R2_DELETE_RESIDUAL/);
assert.match(reset, /DOCUMENT_SEQUENCE_CHANGED/);

const browserQa = read("scripts/run-wafl-v2-alpha67-viewer-browser-qa.mjs");
assert.match(browserQa, /chromium\.launch/);
assert.match(browserQa, /NEXT_HYDRATION_ASSET_NOT_200/);
assert.match(browserQa, /VIEWER_STUCK_LOADING/);
assert.match(browserQa, /INTERNAL_FILE_AUTH_WEAKENED/);
assert.match(browserQa, /rawTokenLogged:\s*false/);
const runtimeCommon = read("tools/dev/wafl-external-qa-common.ps1");
const runtimeStatus = read("tools/dev/status-wafl-external-qa.ps1");
assert.match(runtimeCommon, /alpha67-cleanbase\.json/);
assert.match(runtimeCommon, /items\.Count -eq 0/);
assert.match(runtimeCommon, /alpha67-cleanbase-empty/);
assert.match(runtimeCommon, /current-company-list/);
assert.match(runtimeCommon, /current-work-order-reference/);
assert.match(runtimeStatus, /OwnerFixtureDetailHttp -in @\(200, 204\)/);
assert.match(runtimeStatus, /WorkOrder read target:/);

const docs = ["docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md", "docs/project/app-v2/16-workorder-api-command-read-model-contracts.md", "docs/project/app-v2/17-v2-api-contract-test-plan.md", "docs/project/app-v2/77-viewer-share-reset-cleanbase-evidence.md"].map(read).join("\n");
assert.match(docs, /browser hydration/i);
assert.match(docs, /KEEP.*DELETE.*R2/is);
assert.match(docs, /PHYSICAL_RESULT_NOT_INFERRED/);
console.log("workorder v2 alpha.67 viewer share reset clean-base contract: PASS");
