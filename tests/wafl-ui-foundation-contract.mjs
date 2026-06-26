import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

const storageMeter = read("components/common/ui/WaflStorageUsageMeter.tsx");
const uiIndex = read("components/common/ui/index.ts");
const adminDashboard = read("components/admin/dashboard/AdminOperationsDashboard.tsx");
const workspaceCards = read("components/admin/dashboard/AdminConsoleSections.tsx");
const planUsageCard = read("components/admin/files/summary/PlanUsageCard.tsx");
const workerPage = read("app/(workspace)/worker/page.tsx");
const workOrderEmpty = read("components/workorder/WorkOrderEmptyState.tsx");
const workOrderLoading = read("components/workorder/WorkOrderLoadingState.tsx");
const roadmapIndex = read("lib/internal/roadmap/index.ts");
const roadmapDetail = read("lib/internal/roadmap/roadmap-0.24.24.ts");
const version = read("lib/constants/version.ts");

for (const token of [
  "data-wafl-component=\"storage-usage-meter\"",
  "WaflStorageUsageTone",
  "WaflStorageUsageMeterDetail",
  "showCylinder",
  "clampPercent",
]) {
  if (!storageMeter.includes(token)) throw new Error(`storage meter token missing: ${token}`);
}

if (!uiIndex.includes("WaflStorageUsageMeter")) {
  throw new Error("common UI index does not export WaflStorageUsageMeter");
}

for (const source of [adminDashboard, planUsageCard]) {
  if (!source.includes("WaflStorageUsageMeter")) {
    throw new Error("storage usage screen does not use common WaflStorageUsageMeter");
  }
}

for (const token of [
  'href="/workspace/workorders"',
  'href="/workspace/material-orders"',
  "AdminEmptyState",
  "policySourceLabel",
  "memberUsageLabel",
]) {
  if (!adminDashboard.includes(token)) throw new Error(`admin dashboard token missing: ${token}`);
}

for (const token of [
  "min-h-[112px]",
  "2xl:grid-cols-3",
  "item.status === \"planned\"",
]) {
  if (!workspaceCards.includes(token)) throw new Error(`workspace card density token missing: ${token}`);
}
if (workspaceCards.includes("min-h-[132px]")) {
  throw new Error("legacy oversized workspace card height remains");
}

for (const token of ["WorkspaceShell", 'contentMode="fixed-md"', "hideTopbar", "WorkOrderWorkspace"]) {
  if (!workerPage.includes(token)) throw new Error(`worker route token missing: ${token}`);
}
if (!workOrderEmpty.includes("WaflWorkspaceEmptyPanel") || !workOrderLoading.includes("WaflWorkspaceLoadingPanel")) {
  throw new Error("worker/workorder empty-loading states do not use WAFL workspace state panels");
}

for (const forbidden of [
  "db/migrations/",
  "package-lock.json",
  "pnpm-lock.yaml",
  "cloudflare/pdf-generator-worker.js",
]) {
  if (roadmapDetail.includes(`changed:${forbidden}`)) {
    throw new Error(`forbidden boundary marker found: ${forbidden}`);
  }
}

if (!version.includes('APP_VERSION = "0.24.24.1"')) {
  throw new Error("APP_VERSION is not 0.24.24.1");
}
if (!roadmapIndex.includes("ROADMAP_0_24_24") || !roadmapIndex.includes("ROADMAP_0_24_24_1") || !roadmapIndex.includes('currentWorkVersion: "0.24.24.1"')) {
  throw new Error("0.24.24.1 roadmap is not registered as current work");
}

console.log("wafl ui foundation contract: OK");
