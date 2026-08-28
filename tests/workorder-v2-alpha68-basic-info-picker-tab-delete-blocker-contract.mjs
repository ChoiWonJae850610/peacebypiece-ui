import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { createWorkOrderDraftBatchCoordinator } from "../apps/mobile/application/draftBatchCoordinator.ts";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const deleteRoute = read("lib/domain/work-orders/command/draftDeleteRoute.ts");
const deleteRuntime = read("scripts/run-wafl-v2-alpha68-draft-delete-runtime.mjs");

assert.match(overview, /onApplyPicker: \(override: Partial<BasicInfoDraft>, dependentResetConfirmed\?: boolean\) => void/u);
assert.doesNotMatch(overview, /onApply=\{\(value\) => \{[\s\S]{0,180}onChangeDraft\("categoryMajor"[\s\S]{0,180}onSave/u);
assert.doesNotMatch(overview, /onApply=\{\(value\) => \{[\s\S]{0,180}onChangeDraft\("categoryDetail"[\s\S]{0,180}onSave/u);
assert.match(experience, /async function applyBasicInfoPicker[\s\S]{0,220}await saveBasicInfo\(override, null, null, false, dependentResetConfirmed\)/u);
assert.doesNotMatch(experience, /applyBasicInfoPicker[\s\S]{0,180}flushSection\("overview"/u);
assert.match(experience, /categoryResetIntentRef\.current = \{ workOrderId: detail\.header\.id, targetAudience: next\.targetAudience, categoryMajor: next\.categoryMajor, resetApplied: false \};[\s\S]{0,300}draftBatch\.stage\("overview"\)/u);
assert.doesNotMatch(experience, /onConfirm: \(\) => \{[\s\S]{0,760}draftBatch\.flushSection\("overview", "explicit"\)/u);
assert.match(experience, /!categoryResetIntent\?\.resetApplied[\s\S]{0,160}patch\.resetCategoryDependents = true/u);
assert.match(experience, /const currentDetail = detailRef\.current/u);
assert.match(experience, /const patch = buildPatch\(latestDetail\)/u);
assert.match(experience, /draftBatch\.discardSection\("overview"\)/u);
assert.match(experience, /activeBasicSessionRef\.current = null;[\s\S]{0,180}discardSection/u);

let saves = 0;
const explicit = createWorkOrderDraftBatchCoordinator();
explicit.register("overview", async () => { saves += 1; return true; });
explicit.stage("overview", { categoryDetail: "팬츠" });
const explicitResult = await explicit.flushSection("overview", "explicit");
assert.equal(explicitResult.committed, true);
assert.equal(saves, 1, "one picker apply must produce one logical save");
assert.equal(explicit.isDirty("overview"), false);
assert.equal(explicit.status("overview"), "saved");

let bypassMutations = 0;
const confirmation = createWorkOrderDraftBatchCoordinator();
confirmation.register("overview", async () => { bypassMutations += 1; return true; });
await new Promise((resolve) => setTimeout(resolve, 35));
assert.equal(bypassMutations, 0, "category confirmation must exist before any dirty autosave generation");
assert.equal(confirmation.isDirty("overview"), false);

let shouldFail = true;
let attempts = 0;
const recovery = createWorkOrderDraftBatchCoordinator();
recovery.register("overview", async () => { attempts += 1; return !shouldFail; });
recovery.stage("overview", { categoryDetail: "슬랙스" });
assert.equal((await recovery.flushSection("overview", "tab-change")).committed, false);
assert.equal(recovery.status("overview"), "error");
assert.equal(recovery.isDirty("overview"), true);
shouldFail = false;
assert.equal((await recovery.flushSection("overview", "explicit")).committed, true);
assert.equal(attempts, 2);
assert.equal(recovery.isDirty("overview"), false);

const discard = createWorkOrderDraftBatchCoordinator();
discard.register("overview", async () => false);
discard.stage("overview", { categoryMajor: "상의" });
assert.equal((await discard.flushSection("overview", "tab-change")).committed, false);
assert.equal(discard.discardSection("overview"), true);
assert.equal(discard.isDirty("overview"), false);
assert.equal(discard.status("overview"), "idle");
assert.equal((await discard.flushAll("tab-change")), true, "canonical reload/discard must remove the navigation dead-end");

assert.match(experience, /deletedDraftWorkOrderIdsRef\.current\.add\(deleted\.workOrderId\)/u);
assert.match(experience, /page\.items\.filter\(\(item\) => !deletedDraftWorkOrderIdsRef\.current\.has\(item\.workOrderId\)\)/u);
assert.match(experience, /if \(deletedDraftWorkOrderIdsRef\.current\.has\(item\.workOrderId\)\) return/u);
assert.match(deleteRoute, /target\.status !== "draft" \|\| target\.revision_status !== "draft"/u);
assert.match(deleteRoute, /deleteWorkOrderImageFamilyViaWorker/u);
assert.match(deleteRoute, /deleteR2ObjectViaWorker/u);
assert.match(deleteRuntime, /assert\.equal\(remove\.json\?\.data\?\.deleted, true\)/u);
assert.match(deleteRuntime, /coreReadAfterDelete: missing\.response\.status/u);
assert.match(deleteRuntime, /listResidual: 0/u);
assert.match(deleteRuntime, /replayStatus: replay\.response\.status/u);

console.log("workorder v2 alpha68 basic-info picker/tab/delete blocker contract passed");
