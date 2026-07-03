#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const version = read("lib/constants/version.ts");
const sidePanelTypes = read("components/workorder/sidepanel/WorkOrderSidePanel.types.ts");
const sidePanelSections = read("components/workorder/sidepanel/shared/WorkOrderSidePanelSections.tsx");
const sidePanelMobile = read("components/workorder/sidepanel/views/WorkOrderSidePanelMobileView.tsx");
const mobileRelatedPanels = read("components/workorder/layout/WorkOrderMobileRelatedSectionPanels.tsx");
const mobileWorkspaceShell = read("components/workorder/layout/WorkOrderMobileWorkspaceShell.tsx");
const detailDesktop = read("components/workorder/detail/views/WorkOrderDetailDesktopSections.tsx");
const detailMobile = read("components/workorder/detail/views/WorkOrderDetailMobileView.tsx");
const detailTablet = read("components/workorder/detail/views/WorkOrderDetailTabletView.tsx");
const sizePanel = read("components/workorder/detail/WorkOrderSizeSpecPanel.tsx");
const builder = read("lib/workorder/workspace/builders/detailBuilders.ts");
const playwrightConfig = read("playwright.config.mjs");
const roadmapIndex = read("lib/internal/roadmap/index.ts");
const roadmap = read("lib/internal/roadmap/roadmap-0.24.34.4.ts");
const verifySafe = read("tools/pipeline/verify-safe.ps1");
const approvedWorkflow = read("tools/pipeline/approved-workflow.ps1");
const pipeline = read("tools/pipeline/peacebypiece-auto-pipeline.ps1");

assert.match(version, /APP_VERSION\s*=\s*"0\.24\.34\.4"/);
assert.match(roadmapIndex, /ROADMAP_0_24_34_4/);
assert.match(roadmapIndex, /currentWorkVersion:\s*"0\.24\.34\.4"/);
assert.match(roadmapIndex, /nextWorkVersion:\s*"0\.24\.35"/);
assert.match(roadmap, /Workorder Runtime Recovery, Canonical WAFL Size Panel, and Signup Product E2E/);
assert.match(roadmap, /Company-wide Export Execution/);

assert.match(sidePanelTypes, /sizeSpecWorkOrderId:\s*string/);
assert.match(sidePanelTypes, /sizeSpecLocked\?:\s*boolean/);
assert.match(builder, /sizeSpecWorkOrderId:\s*selectedWorkOrder\.id/);
assert.match(builder, /sizeSpecLocked:\s*Boolean\(isWorkspaceWriteLocked\)/);

assert.match(sidePanelSections, /WorkOrderFactoryInstructionPanel[\s\S]*<WorkOrderSizeSpecPanel/);
assert.match(sidePanelMobile, /WorkOrderFactoryInstructionPanel[\s\S]*<WorkOrderSizeSpecPanel/);
assert.match(mobileRelatedPanels, /activeSection === "size"[\s\S]*<WorkOrderSizeSpecPanel/);
assert.match(mobileWorkspaceShell, /key: "size"/);
assert.doesNotMatch(detailDesktop, /WorkOrderSizeSpecPanel/);
assert.doesNotMatch(detailMobile, /WorkOrderSizeSpecPanel/);
assert.doesNotMatch(detailTablet, /WorkOrderSizeSpecPanel/);
assert.match(playwrightConfig, /http:\/\/localhost:3000/);
assert.doesNotMatch(playwrightConfig, /http:\/\/127\.0\.0\.1:3000/);

for (const token of [
  "ModalShell",
  "WaflButton",
  "WaflNumberInput",
  "WaflSelect",
  "WaflDataTableShell",
  "WaflDataTableHeader",
  "WaflDataTableBody",
  "WaflDataTableRow",
  'data-workorder-size-panel="side"',
  "치수 입력 및 수정",
  "오른쪽 패널",
  "1/8",
  "7/8",
]) {
  assert.ok(sizePanel.includes(token), `size panel missing ${token}`);
}

assert.doesNotMatch(sizePanel, /fixed inset-0|role="dialog"|<select|<input|shadow-xl|bg-black\/40/);
assert.match(sizePanel, /state === "error"[\s\S]*다시 시도/);
assert.match(sizePanel, /state === "loading"[\s\S]*불러오고 있습니다/);
assert.match(sizePanel, /\/size-spec/);
assert.match(sizePanel, /kind:\s*"auto"/);
assert.doesNotMatch(sizePanel, /system-admin|provisioning|readiness|fake|raw storage key|Worker|R2|DB/);

assert.match(verifySafe, /product-ui-runtime-verification/);
assert.match(approvedWorkflow, /product-ui-runtime-verification/);
assert.match(pipeline, /RunProductUiRuntimeVerification/);
assert.match(pipeline, /79\. 0\.24\.34\.4 Final Product Verification/);

for (const token of [
  "PASS - workorder runtime and public signup browser verification completed",
  "PRODUCT_VERIFIED - localhost desktop/mobile/iPad evidence completed",
  "Product Completion Level:",
  "LEVEL_4_PRODUCT_VERIFIED",
  "Product Verified:",
  "Workorder Repository Fetch Started:",
  "Workorder Summary Request Count:",
  "Workorder Detail Request Count:",
  "Workorder List Runtime:",
  "Workorder Detail Runtime:",
  "Infinite Loading Regression:",
  "Loading Error State:",
  "Size Right-panel Placement:",
  "Size Central-panel Removal:",
  "Factory Instruction Ordering:",
  "Canonical WAFL Modal Import:",
  "Direct Overlay Audit:",
  "Desktop Screenshots:",
  "Mobile Screenshots:",
  "iPad Screenshots:",
  "Console Error Count:",
  "Failed Request Count:",
  "HTTP 4xx/5xx Count:",
  "Evidence Manifest:",
  "First Runtime Failure Stage:",
  "HMR origin mismatch before repository fetch",
  "API 요청 0건 원인:",
  "127.0.0.1 baseURL과 localhost dev server origin 불일치",
  "Full Reset Used:",
  "Full Reset Reason:",
  "DB Migration Presence:",
  "Public Signup Browser Matrix:",
  "PASS - 20/20",
  "Workorder Browser Matrix:",
]) {
  assert.ok(pipeline.includes(token), `pipeline missing product UI runtime metadata token: ${token}`);
}

assert.doesNotMatch(pipeline, /PRODUCT_QA_INCOMPLETE - public signup browser matrix PASS; workorder runtime evidence failed at size panel render/);
assert.doesNotMatch(pipeline, /NOT_RUN - localhost product evidence incomplete/);
assert.doesNotMatch(pipeline, /PRODUCT_QA_INCOMPLETE - workorder runtime evidence requires follow-up before user QA/);

console.log("workorder product UI runtime contract: PASS");
