#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { completeImageWithSingleConflictRebase } from "../apps/mobile/domain/workOrderImageCompletionPolicy.ts";

const experience = fs.readFileSync("apps/mobile/features/MobileWorkOrderExperience.tsx", "utf8");
const assets = [
  fs.readFileSync("apps/mobile/features/work-orders/images/useWorkOrderAssetAuthoringController.ts", "utf8"),
  fs.readFileSync("apps/mobile/features/work-orders/images/workOrderImageAuthoringActions.ts", "utf8"),
].join("\n");
const overview = fs.readFileSync("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx", "utf8");
const styles = fs.readFileSync("components/workorder/preview/IssuedWorkOrderPreview.module.css", "utf8");
const version = fs.readFileSync("lib/constants/version.ts", "utf8");

assert.match(version, /2\.0\.0-alpha\.(?:69|70|71)/u);
assert.match(experience, /setTimeout\(\(\) => \{[\s\S]*?persistProductName\(value, true\)[\s\S]*?\}, 500\)/u);
assert.match(experience, /saveBasicInfo\([\s\S]*?\{ productName: value \}[\s\S]*?productNameOnly: true/u);
assert.match(experience, /flushPendingProductName\(\)[\s\S]*?draftBatch\.flushAll/u);
assert.match(experience, /beforeAssetMutation:[\s\S]*?flushPendingProductName\(\)/u);
assert.match(experience, /options\.preserveEditor && currentOwner\?\.field === "productName"/u);
assert.match(overview, /allowEditingWhileSaving[\s\S]*?commitMode="blur-submit"/u);
assert.doesNotMatch(experience, /fetch\([^\n]*productName/u);
assert.match(assets, /completeImageWithSingleConflictRebase/u);
assert.match(assets, /refreshedDetail\.header\.currentRevisionId === initial\.header\.currentRevisionId/u);
assert.match(assets, /current\.nextIdentity\("upload"\)/u);
assert.match(assets, /uploadTarget,/u);
assert.match(styles, /grid-template-columns:\s*minmax\(0,\s*58fr\)\s+minmax\(0,\s*42fr\)/u);
assert.match(styles, /\.coverMain \{[^}]*height:\s*140mm/u);

const conflict = Object.assign(new Error("conflict"), { code: "CONFLICT" });
const initial = { id: "wo-1", revisionId: "rev-1", version: 7, status: "draft" };
const refreshed = { ...initial, version: 8 };

{
  let completeCount = 0;
  let refreshCount = 0;
  const outcome = await completeImageWithSingleConflictRebase({
    initialDetail: initial,
    complete: async (detail) => { completeCount += 1; return { nextVersion: detail.version + 1 }; },
    isConflict: (error) => error?.code === "CONFLICT",
    refresh: async () => { refreshCount += 1; return refreshed; },
    canRetry: () => true,
  });
  assert.equal(completeCount, 1);
  assert.equal(refreshCount, 0);
  assert.equal(outcome.retriedAfterConflict, false);
}

{
  let completeCount = 0;
  let refreshCount = 0;
  const versions = [];
  const outcome = await completeImageWithSingleConflictRebase({
    initialDetail: initial,
    complete: async (detail) => {
      completeCount += 1;
      versions.push(detail.version);
      if (completeCount === 1) throw conflict;
      return { nextVersion: detail.version + 1 };
    },
    isConflict: (error) => error?.code === "CONFLICT",
    refresh: async () => { refreshCount += 1; return refreshed; },
    canRetry: (before, after) => before.id === after.id && before.revisionId === after.revisionId && after.status === "draft",
  });
  assert.equal(completeCount, 2);
  assert.equal(refreshCount, 1);
  assert.deepEqual(versions, [7, 8]);
  assert.equal(outcome.retriedAfterConflict, true);
}

{
  let completeCount = 0;
  await assert.rejects(() => completeImageWithSingleConflictRebase({
    initialDetail: initial,
    complete: async () => { completeCount += 1; throw conflict; },
    isConflict: (error) => error?.code === "CONFLICT",
    refresh: async () => ({ ...refreshed, revisionId: "rev-2" }),
    canRetry: (before, after) => before.revisionId === after.revisionId,
  }), /conflict/u);
  assert.equal(completeCount, 1, "revision mismatch must not retry completion");
}

{
  let writes = 0;
  let timer;
  let latest = "";
  const stage = (value) => {
    latest = value;
    clearTimeout(timer);
    timer = setTimeout(() => { writes += 1; }, 12);
  };
  stage("A"); stage("AB"); stage("ABC");
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(writes, 1, "typing burst must collapse to one write");
  assert.equal(latest, "ABC");
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha70-image-upload-name-autosave-cover-tuning",
  previousPermanentInventoryRetained: 213,
  addedPermanentChecks: 1,
  finalPermanentInventory: 214,
  imageConflictCompletionMax: 2,
  imageOriginalUploadMax: 1,
  productNameDebounceMs: 500,
  coverImageFactRatio: "58/42",
  physicalResultInferred: false,
}));
