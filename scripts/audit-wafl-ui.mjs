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
for (const file of files) {
  const content = await readFile(path.join(ROOT, file), "utf8");
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
}

if (failures.length > 0) {
  console.error("WAFL UI audit failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`WAFL UI audit passed (${files.length} source files).`);
console.log(`Classified native-control files: ${nativeControls.length}`);
for (const file of nativeControls) console.log(`- ${file}`);
