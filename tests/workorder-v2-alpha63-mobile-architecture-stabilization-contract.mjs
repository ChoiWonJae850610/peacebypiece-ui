import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const assetController = read("apps/mobile/features/work-orders/images/useWorkOrderAssetAuthoringController.ts");
const materialController = read("apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts");
const sizeSpecCoordination = read("apps/mobile/features/work-orders/size-color/useWorkOrderSizeSpecCoordination.ts");
const facade = read("apps/mobile/lib/apiClient.ts");
const transport = read("apps/mobile/lib/apiTransport.ts");
const mobileContract = read("apps/mobile/domain/mobileContract.ts");

assert.match(experience, /useWorkOrderAssetAuthoringController/);
assert.match(experience, /useWorkOrderMaterialAuthoringController/);
assert.match(experience, /useWorkOrderSizeSpecCoordination/);
assert.doesNotMatch(experience, /function nextImageRequestIdentity|async function acquireImage|async function acquireAttachment/);
assert.doesNotMatch(experience, /async function loadMaterials|async function saveMaterial|async function executeMaterialOrder/);
assert.match(assetController, /createExplicitMutationController/);
assert.match(assetController, /acquireWorkOrderImage|acquireWorkOrderAttachment/);
assert.match(assetController, /refreshProjection/);
assert.match(materialController, /async function refreshMaterialSnapshot/);
assert.match(materialController, /createSerializedMutationQueue|SerializedMutationQueue/);
assert.match(sizeSpecCoordination, /useSizeColorReadController/);
assert.match(sizeSpecCoordination, /useSizeColorStructureEditController/);

for (const domain of ["sessionApi", "workOrdersApi", "materialsApi", "sizeColorApi", "measurementApi", "assetsApi", "documentsApi"]) {
  assert.match(facade, new RegExp(`api/${domain}`));
}
assert.equal(facade.split(/\r?\n/).filter(Boolean).length, 9);
assert.match(transport, /export async function requestJson/);
assert.doesNotMatch(transport, /WorkOrderMaterial|WorkOrderSizeColor|MeasurementTemplate/);

for (const file of fs.readdirSync(path.join(root, "apps/mobile/lib/api")).filter((name) => name.endsWith("Api.ts"))) {
  const source = read(`apps/mobile/lib/api/${file}`);
  assert.match(source, /apiTransport/);
  assert.doesNotMatch(source, /from ["']\.\.\/apiClient["']/);
}

// mobileContract remains the intentionally shared wire DTO owner. It must not depend on feature or API modules.
assert.ok((mobileContract.match(/^export /gm) ?? []).length >= 50);
assert.doesNotMatch(mobileContract, /^import /m);

const graphRoot = path.join(root, "apps/mobile");
const sourceFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (/\.(?:ts|tsx)$/.test(entry.name)) sourceFiles.push(absolute);
  }
}
walk(graphRoot);
const canonical = (absolute) => path.relative(graphRoot, absolute).replaceAll("\\", "/").replace(/\.(?:ts|tsx)$/, "");
const nodes = new Set(sourceFiles.map(canonical));
const graph = new Map();
for (const absolute of sourceFiles) {
  const owner = canonical(absolute);
  const source = fs.readFileSync(absolute, "utf8");
  const edges = [];
  for (const match of source.matchAll(/(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g)) {
    const specifier = match[1];
    let candidate = null;
    if (specifier.startsWith("@/")) candidate = specifier.slice(2);
    else if (specifier.startsWith(".")) candidate = path.posix.normalize(path.posix.join(path.posix.dirname(owner), specifier));
    if (candidate && nodes.has(candidate)) edges.push(candidate);
    else if (candidate && nodes.has(`${candidate}/index`)) edges.push(`${candidate}/index`);
  }
  graph.set(owner, edges);
}
const visiting = new Set();
const visited = new Set();
function visit(node, trail) {
  if (visiting.has(node)) throw new Error(`mobile import cycle: ${[...trail, node].join(" -> ")}`);
  if (visited.has(node)) return;
  visiting.add(node);
  for (const edge of graph.get(node) ?? []) visit(edge, [...trail, node]);
  visiting.delete(node);
  visited.add(node);
}
for (const node of graph.keys()) visit(node, []);

console.log("workorder v2 alpha.63 mobile architecture stabilization contract: PASS");
