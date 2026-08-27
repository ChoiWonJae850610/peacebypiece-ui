import assert from "node:assert/strict";
import fs from "node:fs";

import { hydrateWorkOrderOpenChildren } from "../apps/mobile/domain/workOrderOpenHydrationPolicy.ts";

const detail = (version, sample = false) => ({ header: { id: "target-work-order", entityVersion: version, identity: { isSample: sample } } });
const projection = (version, value) => ({ entityVersion: version, value });
const noWait = async () => undefined;

async function run(input = {}) {
  return hydrateWorkOrderOpenChildren({
    initialDetail: input.initialDetail ?? detail(7),
    workOrderId: "target-work-order",
    detailVersion: (value) => value.header.entityVersion,
    isSample: (value) => value.header.identity.isSample,
    loadDetail: input.loadDetail ?? (async () => detail(7)),
    loadImages: input.loadImages ?? (async () => projection(7, "images")),
    loadPartners: input.loadPartners ?? (async () => projection(7, "partners")),
    loadHistory: input.loadHistory ?? (async () => ({ items: ["history"] })),
    waitBeforeRetry: noWait,
  });
}

const success = await run();
assert.equal(success.attempts, 1);
assert.deepEqual(success.unavailable, []);
assert.equal(success.images.value, "images");
assert.equal(success.partners.value, "partners");
assert.deepEqual(success.history, { items: ["history"] });

let imageAttempts = 0;
const recovered = await run({
  loadImages: async (id) => {
    assert.equal(id, "target-work-order");
    imageAttempts += 1;
    if (imageAttempts === 1) throw new Error("transient image read");
    return projection(7, "recovered-images");
  },
});
assert.equal(recovered.attempts, 2);
assert.equal(recovered.images.value, "recovered-images");
assert.deepEqual(recovered.unavailable, []);

const partnerFailure = await run({ loadPartners: async () => { throw new Error("partner read down"); } });
assert.equal(partnerFailure.detail.header.id, "target-work-order", "optional child failure must preserve core");
assert.equal(partnerFailure.partners, null);
assert.deepEqual(partnerFailure.unavailable, ["partners"]);

const historyFailure = await run({ loadHistory: async () => { throw new Error("history read down"); } });
assert.equal(historyFailure.detail.header.id, "target-work-order");
assert.deepEqual(historyFailure.unavailable, ["history"]);

let detailReloads = 0;
const reconciled = await run({
  initialDetail: detail(3),
  loadDetail: async () => { detailReloads += 1; return detail(4); },
  loadImages: async () => projection(4, "images-v4"),
  loadPartners: async () => projection(4, "partners-v4"),
});
assert.equal(detailReloads, 1);
assert.equal(reconciled.detail.header.entityVersion, 4);
assert.equal(reconciled.images.value, "images-v4");
assert.equal(reconciled.partners.value, "partners-v4");
assert.equal(reconciled.versionReconciled, true);
assert.deepEqual(reconciled.unavailable, []);

let sampleHistoryReads = 0;
const sample = await run({
  initialDetail: detail(7, true),
  loadDetail: async () => detail(7, true),
  loadHistory: async () => { sampleHistoryReads += 1; return { items: [] }; },
});
assert.equal(sampleHistoryReads, 0);
assert.equal(sample.history, null);
assert.deepEqual(sample.unavailable, []);

const mobile = fs.readFileSync("apps/mobile/features/MobileWorkOrderExperience.tsx", "utf8");
const lineage = fs.readFileSync("lib/domain/work-orders/read/lineageRepository.ts", "utf8");
const route = fs.readFileSync("lib/domain/work-orders/command/reorderRoute.ts", "utf8");
assert.match(mobile, /async function loadWorkOrderDetailHydration/u);
assert.match(mobile, /applyCoreWorkOrderOpen\(hydrated\.detail, item\)[\s\S]*reconcileOpenChildren/u);
assert.equal((mobile.match(/hydrateWorkOrderOpenChildren\(/gu) ?? []).length, 1, "all entry paths must share one child hydration owner");
assert.doesNotMatch(lineage, /e\.created_at AS deleted_at/u);
assert.match(lineage, /e\.occurred_at AS deleted_at/u);
assert.match(route, /WORK_ORDER_SERIES_HISTORY_READ_FAILED/u);
assert.match(route, /X-WAFL-Correlation-Id/u);

console.log(JSON.stringify({
  result: "WAFL_V2_ALPHA68_WORKORDER_OPEN_HYDRATION_BLOCKER_CONTRACT_PASS",
  childRetry: true,
  versionReconcile: true,
  optionalFailureCoreUsable: true,
  sharedOwner: true,
}));
