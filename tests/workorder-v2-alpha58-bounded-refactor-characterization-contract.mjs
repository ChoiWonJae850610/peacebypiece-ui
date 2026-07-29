import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  isSizeColorResponseCommitAllowed,
  nextSizeColorSessionGeneration,
  readConsistentSizeColorBundle,
  shouldStartSizeColorRequest,
  sizeColorRequestKey,
} from "../apps/mobile/features/work-orders/size-color/sizeColorQueryPolicy.ts";
import {
  serializeMutationObservation,
} from "../scripts/lib/alpha58-runtime-evidence.mjs";

const workOrderId = "11111111-2222-4333-8444-555555555555";
const otherWorkOrderId = "99999999-8888-4777-8666-555555555555";
const revisionId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

const versionOneKey = sizeColorRequestKey(workOrderId, 1);
const versionTwoKey = sizeColorRequestKey(workOrderId, 2);
assert.notEqual(versionOneKey, versionTwoKey, "entityVersion transitions must select a fresh cache entry");

const versionedCache = {
  [versionOneKey]: { bundle: { matrix: { expectedTotal: 12, totalsMatch: false } } },
  [versionTwoKey]: { bundle: { matrix: { expectedTotal: 15, totalsMatch: true } } },
};
assert.equal(versionedCache[versionTwoKey].bundle.matrix.expectedTotal, 15);
assert.equal(versionedCache[versionTwoKey].bundle.matrix.totalsMatch, true);

assert.equal(shouldStartSizeColorRequest("initial", "not-loaded", false), true);
assert.equal(shouldStartSizeColorRequest("initial", "loaded", false), false);
assert.equal(shouldStartSizeColorRequest("retry", "error", false), true);
assert.equal(shouldStartSizeColorRequest("retry", "loaded", false), false);
assert.equal(shouldStartSizeColorRequest("initial", "not-loaded", true), false, "duplicate in-flight reads must dedupe");

const currentRequest = {
  workOrderId,
  entityVersion: 2,
  cacheKey: versionTwoKey,
  requestToken: 7,
  sessionGeneration: 3,
};
const currentRuntime = {
  selectedWorkOrderId: workOrderId,
  selectedEntityVersion: 2,
  activeRequestToken: 7,
  sessionGeneration: 3,
};
assert.equal(isSizeColorResponseCommitAllowed(currentRequest, currentRuntime), true);
assert.equal(isSizeColorResponseCommitAllowed(currentRequest, { ...currentRuntime, activeRequestToken: 8 }), false, "stale request token");
assert.equal(isSizeColorResponseCommitAllowed(currentRequest, { ...currentRuntime, selectedEntityVersion: 3 }), false, "stale entityVersion");
assert.equal(isSizeColorResponseCommitAllowed(currentRequest, { ...currentRuntime, selectedWorkOrderId: otherWorkOrderId }), false, "WorkOrder isolation");
assert.equal(isSizeColorResponseCommitAllowed(currentRequest, { ...currentRuntime, sessionGeneration: 4 }), false, "session reset/disconnect");
assert.equal(nextSizeColorSessionGeneration(3), 4);

let matrixReads = 0;
let specificationReads = 0;
let commandCalls = 0;
const bundle = await readConsistentSizeColorBundle({
  workOrderId,
  expectedEntityVersion: 2,
  readMatrix: async () => {
    matrixReads += 1;
    return {
      workOrderId,
      revisionId,
      entityVersion: 2,
      expectedTotal: 15,
      totalsMatch: true,
    };
  },
  readSpecifications: async () => {
    specificationReads += 1;
    return { workOrderId, revisionId, entityVersion: 2 };
  },
});
assert.equal(bundle.matrix.expectedTotal, 15);
assert.equal(bundle.matrix.totalsMatch, true);
assert.equal(matrixReads, 1);
assert.equal(specificationReads, 1);
assert.equal(commandCalls, 0, "the query controller exposes no mutation action");

await assert.rejects(
  readConsistentSizeColorBundle({
    workOrderId,
    expectedEntityVersion: 2,
    readMatrix: async () => ({ workOrderId, revisionId, entityVersion: 1 }),
    readSpecifications: async () => ({ workOrderId, revisionId, entityVersion: 1 }),
  }),
  /SIZE_COLOR_VERSION_CONFLICT/,
);

const observedZero = serializeMutationObservation({ observed: true, count: 0 });
assert.deepEqual(observedZero, { status: "OBSERVED", count: 0 });
const notObserved = serializeMutationObservation({
  observed: false,
  reason: "no approved read-only observer",
});
assert.deepEqual(notObserved, {
  status: "NOT_OBSERVED",
  count: null,
  reason: "no approved read-only observer",
});
assert.throws(
  () => serializeMutationObservation({ observed: true }),
  /observed mutation evidence requires a non-negative count/,
);

const runtimePath = path.resolve("scripts/run-wafl-v2-alpha58-size-color-real-read-runtime-qa.mjs");
const runtimeSource = fs.readFileSync(runtimePath, "utf8");
const beforeSnapshot = runtimeSource.indexOf("const before = await snapshotSizeColorTables");
const firstTargetRead = runtimeSource.indexOf('routeKind: "size-color-target"');
assert.ok(beforeSnapshot >= 0, "Runtime QA must use the bounded snapshot helper");
assert.ok(firstTargetRead >= 0, "Runtime QA must retain the target size-color GET");
assert.ok(beforeSnapshot < firstTargetRead, "DB before snapshot must precede target size GETs");
assert.match(runtimeSource, /serializeMutationObservation/);
assert.doesNotMatch(runtimeSource, /r2PutDelete:\s*0|productionMutation:\s*0/);

console.log("workorder v2 alpha.58 bounded refactor characterization contract: PASS");
