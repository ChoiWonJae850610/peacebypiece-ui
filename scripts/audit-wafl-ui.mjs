import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_ROOTS = ["app", "components", "features", "lib"];
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const FORBIDDEN_PATTERNS = [
  { label: "legacy App UI component", pattern: /\bApp(?:Badge|Button|Card|InlineSelectEditor|ListRow|NumberInput|ResponsiveSurface|ResponsiveWorkspace|Section|SegmentedTabs|Select|Separator|Sheet|Toaster|Tooltip)\b/ },
  { label: "legacy workorder device hook", pattern: /useWorkOrderDeviceType/ },
];
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
}

if (failures.length > 0) {
  console.error("WAFL UI audit failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`WAFL UI audit passed (${files.length} source files).`);
console.log(`Classified native-control files: ${nativeControls.length}`);
for (const file of nativeControls) console.log(`- ${file}`);
