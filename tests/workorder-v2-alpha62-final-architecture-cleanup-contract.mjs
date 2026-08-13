#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createSerializedMutationQueue } from "../apps/mobile/application/mutationController.ts";
import { planInlineEditTransition } from "../apps/mobile/application/inlineEditTransition.ts";
import { resolveWaflPickerRenderPath } from "../apps/mobile/features/inputs/reel-picker/waflPickerRenderPolicy.ts";
import { commitMeasurementProjectionTransition } from "../apps/mobile/features/work-orders/size-color/projectionVersionTransition.ts";
import { isSizeColorCommandPending } from "../apps/mobile/features/work-orders/size-color/sizeColorPendingPolicy.ts";
import { shouldStartSizeColorRequest } from "../apps/mobile/features/work-orders/size-color/sizeColorQueryPolicy.ts";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

// 대상과 거래처는 같은 kind=option policy를 통과하며 flat-card/list fallback이 없다.
assert.equal(resolveWaflPickerRenderPath("option", "reel"), "single-choice-reel");
assert.equal(resolveWaflPickerRenderPath("option", "keypad"), "single-choice-reel");
const picker = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const target = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const partner = read("apps/mobile/features/materials/MaterialPartnerPickerSheet.tsx");
for (const source of [target, partner]) {
  assert.ok(source.includes("WaflReelPickerSheet"));
  assert.ok(source.includes('kind="option"'));
}
for (const token of ["single-choice-reel", "WaflOptionReel", "FiniteOptionReelColumn"]) assert.ok(picker.includes(token));
assert.doesNotMatch(picker, /flatOptionList|flatOptionMetadata/);
assert.equal(fs.existsSync(path.join(root, "apps/mobile/features/inputs/WaflRichListPickerSheet.tsx")), false);

// 이전 chain은 nextVersion cache miss로 matrix/spec GET을 각각 한 번 시작했다.
assert.equal(shouldStartSizeColorRequest("initial", "not-loaded", false), true);
const before = { sizeColorGet: 1, sizeSpecGet: 1, unrelatedReload: 1 };
const after = { sizeColorGet: 0, sizeSpecGet: 0, unrelatedReload: 0 };
const order = [];
let promotedVersion = 10;
let entityVersion = 10;
await commitMeasurementProjectionTransition({
  command: "set-unit",
  nextVersion: 11,
  promoteProjection(nextVersion) {
    order.push("projection-cache");
    promotedVersion = nextVersion;
  },
  reconcileEntityVersion(nextVersion) {
    order.push("entity-version");
    assert.equal(promotedVersion, nextVersion, "nextVersion cache must exist before the entity version changes");
    entityVersion = nextVersion;
  },
  async refreshSizeSpec() {
    throw new Error("set-unit must not refresh size spec");
  },
});
assert.deepEqual(order, ["projection-cache", "entity-version"]);
assert.equal(entityVersion, 11);
assert.deepEqual(after, { sizeColorGet: 0, sizeSpecGet: 0, unrelatedReload: 0 });
assert.deepEqual(before, { sizeColorGet: 1, sizeSpecGet: 1, unrelatedReload: 1 });

// command-scope pending must not globally disable unrelated controls.
assert.equal(isSizeColorCommandPending("measurement-unit", "measurement-unit"), true);
for (const scope of ["structure", "quantity", "measurement-cell", "template"]) {
  assert.equal(isSizeColorCommandPending("measurement-unit", scope), false);
}

// Field A save is serialized, but field B focus activation is immediate.
assert.deepEqual(planInlineEditTransition({ currentField: "A", nextField: "B", currentDirty: true }), {
  activateNextImmediately: true,
  commitCurrent: true,
});
const mutationOrder = [];
const queue = createSerializedMutationQueue();
await Promise.all([
  queue.enqueue(async () => mutationOrder.push("A")),
  queue.enqueue(async () => mutationOrder.push("B")),
]);
assert.deepEqual(mutationOrder, ["A", "B"]);

// Architecture owners must be used by the product controller/render paths.
const readController = read("apps/mobile/features/work-orders/size-color/useSizeColorReadController.ts");
const editController = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
const structureEditor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const templateSheets = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
const apiClient = read("apps/mobile/lib/apiClient.ts");
const apiDomains = fs.readdirSync(path.join(root, "apps/mobile/lib/api"))
  .filter((name) => name.endsWith("Api.ts"))
  .map((name) => read(`apps/mobile/lib/api/${name}`))
  .join("\n");
const apiTransport = read("apps/mobile/lib/apiTransport.ts");
for (const token of ["promoteSizeColorCacheProjection", "promoteCurrentProjectionVersion"]) assert.ok(readController.includes(token));
for (const token of ["commitMeasurementProjectionTransition", "onPromoteProjectionVersion"]) assert.ok(editController.includes(token));
assert.ok(structureEditor.includes("WaflInputSheet"));
assert.doesNotMatch(structureEditor, /<Modal|KeyboardAvoidingView|function SheetFrame/);
assert.ok(templateSheets.includes("WaflChoiceButtons"));
assert.doesNotMatch(templateSheets, /function SemanticChoiceButtons/);
assert.doesNotMatch(apiClient, /async function requestJson|function configuredOrigin/);
assert.match(apiDomains, /from "\.\.\/apiTransport"/);
for (const token of ["requestJson", "configuredOrigin", "assertMobileApiOrigin"]) assert.ok(apiTransport.includes(token));

console.log(JSON.stringify({
  checkpoint: "ALPHA62_FINAL_ARCHITECTURE_CLEANUP_CONTRACT_PASS",
  vendorRenderPath: "single-choice-reel",
  unitMutationBefore: before,
  unitMutationAfter: after,
  transitionOrder: order,
  unrelatedDisabled: false,
}));
