import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_ROOTS = ["app", "components", "features", "lib"];
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const FORBIDDEN_PATTERNS = [
  { label: "legacy App UI component", pattern: /\bApp(?:Badge|Button|Card|InlineSelectEditor|ListRow|NumberInput|ResponsiveSurface|ResponsiveWorkspace|Section|SegmentedTabs|Select|Separator|Sheet|Toaster|Tooltip)\b/ },
  { label: "legacy workorder device hook", pattern: /useWorkOrderDeviceType/ },
];

const WORKSPACE_HEADER_FILES = new Set([
  "components/workorder/detail/WorkOrderHeaderSection.tsx",
  "components/workorder/detail/sections/device/WorkOrderDetailMobileHeaderSection.tsx",
  "components/workorder/detail/sections/device/WorkOrderDetailTabletHeaderSection.tsx",
  "features/material-orders/MaterialOrderDetailPanel.tsx",
]);


const MATERIAL_ORDER_STATUS_LITERAL_FILES = new Set([
  "app/api/material-orders/route.ts",
  "features/material-orders/MaterialOrderDraftEditor.tsx",
  "features/material-orders/MaterialOrderListPanel.tsx",
  "features/material-orders/hooks/useMaterialOrderDraftEditor.ts",
  "lib/material-orders/materialOrderWorkspaceClient.ts",
  "lib/material-orders/repository.ts",
]);

const MATERIAL_ORDER_STATUS_LITERAL_PATTERN = /["'](?:draft|review_requested|approved|order_placed|rejected|cancelled)["']/;


const WORK_ORDER_ATTACHMENT_HYDRATION_FILE = "lib/workorder/service/workOrderService.ts";
const WORKSPACE_VIEW_MODEL_FILE = "lib/workorder/workspace/buildWorkspaceViewModel.ts";


const INVENTORY_AREAS = [
  {
    key: "system",
    prefixes: ["app/(system)/", "components/system/", "lib/system/"],
  },
  {
    key: "admin",
    prefixes: ["app/(admin)/", "components/admin/", "lib/admin/"],
  },
  {
    key: "worker-workorder",
    prefixes: ["app/(workspace)/worker/", "components/workorder/", "features/workorders/", "lib/workorder/", "lib/hooks/workorder/"],
  },
  {
    key: "material-orders",
    prefixes: ["app/(workspace)/workspace/material-orders/", "features/material-orders/", "lib/material-orders/"],
  },
  {
    key: "user",
    prefixes: ["app/me/", "components/me/", "components/policy/", "app/(public)/", "components/public/"],
  },
];

const INVENTORY_PATTERNS = {
  nativeControls: /<(?:button|input|select|textarea|table|dialog)\b/g,
  directFetch: /\bfetch\s*\(/g,
  nativeConfirm: /\bwindow\.(?:confirm|alert|prompt)\s*\(/g,
  waflImports: /from\s+["'][^"']*(?:Wafl|common\/ui)/g,
};

function countMatches(content, pattern) {
  return content.match(pattern)?.length ?? 0;
}

function resolveInventoryArea(file) {
  return INVENTORY_AREAS.find((area) => area.prefixes.some((prefix) => file.startsWith(prefix))) ?? null;
}

const NATIVE_CONTROL_ALLOWLIST = new Set([
  "components/workorder/WorkOrderOverlay.tsx",
  "components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx",
]);

async function walk(relativeDir) {
  const absoluteDir = path.join(ROOT, relativeDir);
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name).replaceAll(path.sep, "/");
    if (entry.isDirectory()) files.push(...await walk(relativePath));
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(relativePath);
  }
  return files;
}

const files = (await Promise.all(SOURCE_ROOTS.map(async (root) => {
  try { return await walk(root); } catch { return []; }
}))).flat();

const failures = [];
const nativeControls = [];
const inventory = new Map(INVENTORY_AREAS.map((area) => [area.key, { files: 0, nativeControls: 0, directFetch: 0, nativeConfirm: 0, waflImports: 0 }]));
for (const file of files) {
  const content = await readFile(path.join(ROOT, file), "utf8");
  const inventoryArea = resolveInventoryArea(file);
  if (inventoryArea) {
    const summary = inventory.get(inventoryArea.key);
    summary.files += 1;
    summary.nativeControls += countMatches(content, INVENTORY_PATTERNS.nativeControls);
    summary.directFetch += countMatches(content, INVENTORY_PATTERNS.directFetch);
    summary.nativeConfirm += countMatches(content, INVENTORY_PATTERNS.nativeConfirm);
    summary.waflImports += countMatches(content, INVENTORY_PATTERNS.waflImports);
  }
  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(content)) failures.push(`${rule.label}: ${file}`);
  }
  if (/components\/workorder|features\/material-orders/.test(file) && /<(?:button|input|select|textarea)\b/.test(content)) {
    nativeControls.push(file);
    if (!NATIVE_CONTROL_ALLOWLIST.has(file)) failures.push(`unclassified native control: ${file}`);
  }
  if (WORKSPACE_HEADER_FILES.has(file) && /\.toLocaleString\s*\(/.test(content)) {
    failures.push(`direct number formatting in workspace header: ${file}`);
  }
  if (WORKSPACE_HEADER_FILES.has(file) && /(?:저장하는 중입니다|저장되었습니다|저장하지 못했습니다)/.test(content)) {
    failures.push(`direct save-feedback copy in workspace header: ${file}`);
  }
  if (MATERIAL_ORDER_STATUS_LITERAL_FILES.has(file) && MATERIAL_ORDER_STATUS_LITERAL_PATTERN.test(content)) {
    failures.push(`direct material-order status literal: ${file}`);
  }
  if (file === WORK_ORDER_ATTACHMENT_HYDRATION_FILE && /Promise\.all\([\s\S]*listSnapshotByWorkOrderId/.test(content)) {
    failures.push(`N+1 attachment snapshot hydration: ${file}`);
  }
  if (file === WORKSPACE_VIEW_MODEL_FILE && !/buildBaseWorkspaceContext\(/.test(content)) {
    failures.push(`workspace base context bypassed: ${file}`);
  }
}

if (failures.length > 0) {
  console.error("WAFL UI audit failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`WAFL UI audit passed (${files.length} source files).`);
console.log(`Classified native-control files: ${nativeControls.length}`);
for (const file of nativeControls) console.log(`- ${file}`);
console.log("WAFL adoption inventory (informational):");
for (const area of INVENTORY_AREAS) {
  const summary = inventory.get(area.key);
  console.log(
    `- ${area.key}: files=${summary.files}, native-controls=${summary.nativeControls}, direct-fetch=${summary.directFetch}, native-confirm=${summary.nativeConfirm}, wafl-imports=${summary.waflImports}`,
  );
}
