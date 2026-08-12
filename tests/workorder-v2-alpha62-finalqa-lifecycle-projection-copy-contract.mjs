#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { act, createElement, useCallback, useReducer } from "../apps/mobile/node_modules/react/index.js";
import { createRoot } from "../apps/mobile/node_modules/react-dom/client.js";
import { materialLatestCopy, materialMutationFailureCopy, materialMutationSuccessCopy } from "../apps/mobile/domain/materialSemanticCopy.ts";
import { useExternalReelVisibilityLifecycle } from "../apps/mobile/features/inputs/reel-picker/useExternalReelVisibilityLifecycle.ts";
import { INITIAL_REEL_PICKER_STATE, reelPickerReducer } from "../apps/mobile/features/inputs/reel-picker/reelPickerState.ts";
import { measurementProjectionImpact } from "../apps/mobile/features/work-orders/size-color/measurementProjectionImpactPolicy.ts";
import { commitMeasurementProjectionTransition } from "../apps/mobile/features/work-orders/size-color/projectionVersionTransition.ts";
import { promoteSizeColorCacheProjection } from "../apps/mobile/features/work-orders/size-color/sizeColorCache.ts";
import { shouldStartSizeColorRequest, sizeColorRequestKey } from "../apps/mobile/features/work-orders/size-color/sizeColorQueryPolicy.ts";

const rootDirectory = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(rootDirectory, relativePath), "utf8");

function createEffectRoot() {
  const noop = () => undefined;
  const defaultView = { event: undefined, HTMLIFrameElement: function HTMLIFrameElement() {}, addEventListener: noop, removeEventListener: noop };
  const ownerDocument = { nodeType: 9, defaultView, addEventListener: noop, removeEventListener: noop, activeElement: null };
  const container = { nodeType: 1, nodeName: "DIV", tagName: "DIV", ownerDocument, addEventListener: noop, removeEventListener: noop, appendChild: noop, removeChild: noop, firstChild: null };
  ownerDocument.documentElement = container;
  globalThis.window = defaultView;
  globalThis.document = ownerDocument;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  return createRoot(container);
}

function verifyMountedRepeatedLifecycle(field, cycles) {
  const root = createEffectRoot();
  let latestState = INITIAL_REEL_PICKER_STATE;
  let closeWith = () => undefined;
  function Harness({ visible, value }) {
    const [state, dispatch] = useReducer(reelPickerReducer, INITIAL_REEL_PICKER_STATE);
    const onOpen = useCallback(() => dispatch({ type: "open", field, label: field, value, unit: field === "measurement-cell" ? "inch" : "", step: "1" }), [value]);
    const onExternalClose = useCallback(() => dispatch({ type: "cancel" }), []);
    const lifecycle = useExternalReelVisibilityLifecycle({
      visible,
      onOpen,
      onExternalClose,
    });
    latestState = state;
    closeWith = (action) => {
      if (!lifecycle.markCurrentSessionClosed()) return;
      dispatch({ type: action });
    };
    return null;
  }
  const render = (visible, value) => act(() => root.render(createElement(Harness, { visible, value })));
  render(false, "initial");
  let expectedOpen = 0;
  let expectedClose = 0;
  for (const action of ["cancel", "apply"]) {
    for (let index = 0; index < cycles; index += 1) {
      const value = `${field}-${action}-${index}`;
      render(true, value);
      expectedOpen += 1;
      assert.equal(latestState.phase, "open");
      assert.equal(latestState.selectedValue, value, "rising edge must use the latest external value");
      assert.equal(latestState.openCount, expectedOpen);
      act(() => closeWith(action));
      expectedClose += 1;
      assert.equal(latestState.phase, "closed");
      assert.equal(latestState.closeCount, expectedClose);
      render(false, value);
      assert.equal(latestState.closeCount, expectedClose, "visible=false after X/V must not close twice");
    }
  }
  act(() => root.unmount());
  return { open: expectedOpen, close: expectedClose, cancelCycles: cycles, applyCycles: cycles };
}

const vendorLifecycle = verifyMountedRepeatedLifecycle("material-partner", 3);
const inchLifecycle = verifyMountedRepeatedLifecycle("measurement-cell", 3);
const pickerSource = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const vendorSource = read("apps/mobile/features/materials/MaterialPartnerPickerSheet.tsx");
const inchSource = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const targetSource = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
assert.ok(pickerSource.includes("useExternalReelVisibilityLifecycle"));
assert.doesNotMatch(vendorSource, /key=|resetToken/);
for (const source of [vendorSource, inchSource, targetSource]) assert.ok(source.includes("WaflReelPickerSheet"));
assert.ok(vendorSource.includes('field="material-partner"'));
assert.ok(inchSource.includes('kind="eighth-inch"'));

function initialBundle(version) {
  return {
    matrix: { workOrderId: "work-order", revisionId: "revision", entityVersion: version, sizes: [{ id: "size", code: "L", displayLabel: "L", displayOrder: 0 }], colors: [{ id: "color", code: "navy", displayName: "남색", hexValue: "#000080", displayOrder: 0 }], quantityCells: [], matrixTotal: "0", projectionsMatch: true },
    specifications: { workOrderId: "work-order", revisionId: "revision", entityVersion: version, measurementUnit: "cm", templateId: null, templateVersionId: null, sourceTemplateModified: false, categoryCode: null, genderCode: null, sizes: [{ id: "size", code: "L", displayLabel: "L", displayOrder: 0 }], pomColumns: [{ id: "pom", code: "chest", displayName: "가슴단면", displayOrder: 0, measurementType: "length" }], cells: [] },
  };
}

async function verifyProjectionCommand(command) {
  let currentVersion = 10;
  let cache = {
    [sizeColorRequestKey("work-order", currentVersion)]: { status: "loaded", bundle: initialBundle(currentVersion), errorMessage: null, touchedAt: 1 },
  };
  const requests = { command: 1, sizeColorGet: 0, sizeSpecGet: 0, wholeTabReload: 0, templateListGet: 0 };
  if (command === "set-cell") {
    cache = promoteSizeColorCacheProjection(cache, {
      workOrderId: "work-order",
      currentVersion,
      nextVersion: currentVersion,
      updater: (bundle) => ({ ...bundle, specifications: { ...bundle.specifications, cells: [{ sizeRowId: "size", pomColumnId: "pom", displayValue: "52", decimalValue: "52" }] } }),
      touchedAt: 2,
    });
  }
  if (command === "set-unit") {
    cache = promoteSizeColorCacheProjection(cache, {
      workOrderId: "work-order",
      currentVersion,
      nextVersion: currentVersion,
      updater: (bundle) => ({ ...bundle, specifications: { ...bundle.specifications, measurementUnit: "inch" } }),
      touchedAt: 2,
    });
  }
  const impact = await commitMeasurementProjectionTransition({
    command,
    nextVersion: 11,
    promoteProjection(nextVersion) {
      cache = promoteSizeColorCacheProjection(cache, { workOrderId: "work-order", currentVersion, nextVersion, updater: (bundle) => bundle, touchedAt: 3 });
    },
    reconcileEntityVersion(nextVersion) {
      currentVersion = nextVersion;
      const status = cache[sizeColorRequestKey("work-order", nextVersion)]?.status ?? "not-loaded";
      if (shouldStartSizeColorRequest("initial", status, false)) {
        requests.sizeColorGet += 1;
        requests.sizeSpecGet += 1;
        requests.wholeTabReload += 1;
      }
    },
    async refreshSizeSpec(nextVersion) {
      requests.sizeSpecGet += 1;
      cache = promoteSizeColorCacheProjection(cache, {
        workOrderId: "work-order",
        currentVersion: nextVersion,
        nextVersion,
        updater: (bundle) => ({ ...bundle, specifications: { ...bundle.specifications, templateId: "applied-template", cells: [{ sizeRowId: "size", pomColumnId: "pom", displayValue: "54", decimalValue: "54" }] } }),
        touchedAt: 4,
      });
    },
  });
  if (impact.templateList === "refresh-separately") requests.templateListGet += 1;
  const promoted = cache[sizeColorRequestKey("work-order", 11)]?.bundle;
  assert.ok(promoted, `${command} must create the next-version cache before the downstream effect`);
  assert.equal(requests.sizeColorGet, 0);
  assert.equal(requests.sizeSpecGet, command === "apply-template" ? 1 : 0);
  assert.equal(requests.wholeTabReload, 0);
  if (command === "set-cell") assert.equal(promoted.specifications.cells[0]?.decimalValue, "52");
  if (command === "set-unit") assert.equal(promoted.specifications.measurementUnit, "inch");
  if (command === "apply-template") assert.equal(promoted.specifications.templateId, "applied-template");
  return { impact, requests };
}

const commands = ["set-cell", "set-unit", "apply-template", "save-company-template", "update-company-template"];
const projectionEvidence = Object.fromEntries(await Promise.all(commands.map(async (command) => [command, await verifyProjectionCommand(command)])));
for (const command of commands) assert.deepEqual(projectionEvidence[command].impact, measurementProjectionImpact(command));
const beforeRequestCounts = {
  "set-cell": { command: 1, sizeColorGet: 1, sizeSpecGet: 1, wholeTabReload: 1, templateListGet: 0 },
  "set-unit": { command: 1, sizeColorGet: 0, sizeSpecGet: 0, wholeTabReload: 0, templateListGet: 0 },
  "apply-template": { command: 1, sizeColorGet: 1, sizeSpecGet: 2, wholeTabReload: 1, templateListGet: 0 },
  "save-company-template": { command: 1, sizeColorGet: 1, sizeSpecGet: 1, wholeTabReload: 1, templateListGet: 1 },
  "update-company-template": { command: 1, sizeColorGet: 1, sizeSpecGet: 1, wholeTabReload: 1, templateListGet: 1 },
};
const afterRequestCounts = Object.fromEntries(commands.map((command) => [command, projectionEvidence[command].requests]));

assert.equal(materialMutationSuccessCopy("fabric", "create"), "원단 정보를 추가했습니다.");
assert.equal(materialMutationSuccessCopy("fabric", "edit"), "원단 정보를 수정했습니다.");
assert.equal(materialMutationSuccessCopy("accessory", "create"), "부자재 정보를 추가했습니다.");
assert.equal(materialMutationSuccessCopy("accessory", "edit"), "부자재 정보를 수정했습니다.");
for (const copy of [
  materialMutationSuccessCopy("fabric", "delete"),
  materialLatestCopy("fabric", "load-failed"),
  materialMutationFailureCopy("fabric", "edit"),
]) assert.doesNotMatch(copy, /원단를/);

const templateSheet = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
for (const rejected of ["현재 완성 스펙의 항목과 일치하는 값을", "작업지시서 사이즈는 그대로 유지됩니다", "아래 V를 누를 때만 변경됩니다", "summaryTitle", "summaryText"]) assert.doesNotMatch(templateSheet, new RegExp(rejected));
assert.doesNotMatch(read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts"), /resetToken|setResetToken/);

console.log(JSON.stringify({
  checkpoint: "ALPHA62_FINALQA_LIFECYCLE_PROJECTION_COPY_CONTRACT_PASS",
  mountedLifecycle: { vendor: vendorLifecycle, inch: inchLifecycle },
  projectionEvidence,
  requestCounts: { before: beforeRequestCounts, after: afterRequestCounts },
  wholeTabReload: 0,
  resetTokenConsumers: 0,
}));
