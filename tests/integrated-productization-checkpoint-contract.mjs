import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const listView = read("components/system/signup/SystemSignupReviewListView.tsx");
const detailView = read("components/system/signup/SystemSignupReviewDetailView.tsx");
const actions = read("components/system/signup/SystemSignupReviewDetailActions.tsx");
const systemCatalog = read("app/(system)/system/catalog/page.tsx");
const companyCatalog = read("components/catalog/CompanyCatalogSettingsClient.tsx");
const workspaceCatalogPage = read("app/(workspace)/workspace/settings/catalog/page.tsx");
const signupApprovalRunner = read("scripts/run-signup-approval-provisioning-integration.mjs");
const catalogRunner = read("scripts/run-system-catalog-provisioning-integration.mjs");
const pdfPolicy = read("lib/workorder/pdf/workOrderPdfPolicy.ts");
const pdfViewerRoute = read("app/api/workorders/[workOrderId]/generated/order-request-pdf/[attachmentId]/view/route.ts");
const worker = read("cloudflare/r2-upload-worker.js");
const layout = read("app/layout.tsx");

for (const source of [listView, detailView, actions, systemCatalog, companyCatalog, workspaceCatalogPage]) {
  assert.equal(source.includes("\uFFFD"), false, "checkpoint UI copy must not contain replacement characters");
}

assert.match(layout, /title: "WAFL 0\.24\.29"/);

assert.match(listView, /SystemSignupReviewListView/);
assert.match(listView, /overflow-x-auto/);
assert.match(listView, /bounded pagination|limit \{result\.pagination\.limit\}/);
assert.match(listView, /break-words/);

assert.match(detailView, /ConsentEvidenceStatus/);
assert.match(detailView, /Google email_verified가 false입니다/);
assert.match(detailView, /certificateViewerPath/);
assert.match(detailView, /inline viewer/);
assert.doesNotMatch(detailView, /storageKey|signedUrl|r2Url|googleSubjectRaw/i);

assert.match(actions, /compare-and-set/);
assert.match(actions, /REASON_MAX_LENGTH = 600/);
assert.match(actions, /provisioningPlan/);
assert.match(actions, /approveEligibility/);

assert.match(systemCatalog, /SystemCatalogPage/);
assert.match(systemCatalog, /SystemShell/);
assert.match(companyCatalog, /minmax\(0,1fr\)/);
assert.match(companyCatalog, /break-words/);
assert.match(workspaceCatalogPage, /CompanyCatalogSettingsClient/);

assert.match(signupApprovalRunner, /SIGNUP_APPROVAL_PROVISIONING_RESULT/);
assert.match(signupApprovalRunner, /residualR2Objects: 0/);
assert.match(signupApprovalRunner, /TRIAL_STORAGE_LIMIT_BYTES = 100 \* 1024 \* 1024/);
assert.match(signupApprovalRunner, /TRIAL_MEMBER_LIMIT = 3/);
assert.doesNotMatch(signupApprovalRunner, /fetch\(|putR2Object|deleteR2Object/);

assert.match(catalogRunner, /SYSTEM_CATALOG_INTEGRATION_RESULT/);
assert.match(catalogRunner, /underwearDefaultInactive: "PASS"/);
assert.match(catalogRunner, /accessoriesDefaultInactive: "PASS"/);
assert.match(catalogRunner, /residualR2Objects: 0/);

assert.match(pdfPolicy, /vendor_share/);
assert.match(pdfPolicy, /kakao_share/);
assert.match(pdfPolicy, /dueDate/);
assert.match(pdfPolicy, /WORK_ORDER_PDF_DUE_DATE_REQUIRED/);
assert.match(pdfViewerRoute, /getCurrentWaflSession/);
assert.match(pdfViewerRoute, /Content-Disposition/);
assert.match(pdfViewerRoute, /inline/);
assert.doesNotMatch(pdfViewerRoute, /signedUrl|createR2WorkerFileUrl|NextResponse\.redirect/);
assert.match(worker, /const WORKER_VERSION = "0\.13\.71"/);

console.log("integrated productization checkpoint contract passed");
