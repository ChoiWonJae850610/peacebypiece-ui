import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { runWaflProcessingAction } from "../apps/mobile/application/waflActionExecution.ts";
import { runWaflTemplateApplyContentFirst } from "../apps/mobile/application/waflTemplateApplyLifecycle.ts";
import { resolveWaflSheetBodyScrollEnabled } from "../apps/mobile/domain/waflSheetDetentPolicy.ts";
import { runWorkOrderListReorderFlow } from "../apps/mobile/domain/workOrderListReorderFlow.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

assert.equal(resolveWaflSheetBodyScrollEnabled({ bodyScrollable: true, decisionVisible: false }), true);
assert.equal(resolveWaflSheetBodyScrollEnabled({ bodyScrollable: true, decisionVisible: true }), false);
assert.equal(resolveWaflSheetBodyScrollEnabled({ bodyScrollable: false, decisionVisible: false }), false);

const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
assert.match(sheet, /effectiveBodyScrollable = resolveWaflSheetBodyScrollEnabled/u);
assert.match(sheet, /sizing === "contentFit" && \(decision \|\| \(!contentFit\.overflow/u);
assert.match(sheet, /effectiveBodyScrollable \? <ScrollView/u);
assert.doesNotMatch(read("apps/mobile/features/feedback/WaflDecisionChoiceBody.tsx"), /\bScrollView\b/u);
assert.match(read("apps/mobile/features/inputs/reel-picker/WaflOptionReel.tsx"), /<FlatList/u);

const actionEvents = [];
await runWaflProcessingAction({
  processingMessage: "처리 중",
  successMessage: "완료",
  onProcessing: (message) => actionEvents.push(message ? "pending:on" : "pending:off"),
  onSuccess: () => actionEvents.push("success"),
  present: async () => { actionEvents.push("presented"); },
  command: async () => { actionEvents.push("command"); return true; },
});
assert.deepEqual(actionEvents, ["pending:on", "presented", "command", "pending:off", "success"]);

const failureEvents = [];
await assert.rejects(() => runWaflProcessingAction({
  processingMessage: "처리 중",
  successMessage: "완료",
  onProcessing: (message) => failureEvents.push(message ? "pending:on" : "pending:off"),
  onSuccess: () => failureEvents.push("unexpected-success"),
  present: async () => { failureEvents.push("presented"); },
  command: async () => { failureEvents.push("command"); throw new Error("expected"); },
}), /expected/u);
assert.deepEqual(failureEvents, ["pending:on", "presented", "command", "pending:off"]);

const reorderEvents = [];
await runWorkOrderListReorderFlow({
  onProcessing: (value) => reorderEvents.push(value ? "pending:on" : "pending:off"),
  present: async () => { reorderEvents.push("presented"); },
  loadSourceCore: async () => { reorderEvents.push("source"); return { eligible: true }; },
  validateSource: (source) => source.eligible,
  createAndOpenAuthoritativeResult: async () => { reorderEvents.push("create-open"); return true; },
});
assert.deepEqual(reorderEvents, ["pending:on", "presented", "source", "create-open", "pending:off"]);

const templateEvents = [];
let contentGets = 0;
let mutations = 0;
let publishedContent = null;
const templateOutcome = await runWaflTemplateApplyContentFirst({
  fetchContent: async () => { contentGets += 1; templateEvents.push("fetch"); return { templateId: "system-top", templateVersion: 1 }; },
  applyTemplate: async () => { mutations += 1; templateEvents.push("mutation"); return { nextVersion: 4 }; },
  isCurrent: (content) => content.templateId === "system-top",
  publishAppliedContent: (content) => { publishedContent = content; templateEvents.push("publish"); },
});
templateEvents.push("refresh");
assert.deepEqual(templateEvents, ["fetch", "mutation", "publish", "refresh"]);
assert.equal(templateOutcome.published, true);
assert.equal(contentGets, 1);
assert.equal(mutations, 1);
assert.deepEqual(publishedContent, { templateId: "system-top", templateVersion: 1 });

let failedPublishCount = 0;
await assert.rejects(() => runWaflTemplateApplyContentFirst({
  fetchContent: async () => ({ templateId: "system-top" }),
  applyTemplate: async () => { throw new Error("mutation failed"); },
  isCurrent: () => true,
  publishAppliedContent: () => { failedPublishCount += 1; },
}), /mutation failed/u);
assert.equal(failedPublishCount, 0);

let stalePublishCount = 0;
const staleOutcome = await runWaflTemplateApplyContentFirst({
  fetchContent: async () => ({ templateId: "stale" }),
  applyTemplate: async () => ({ nextVersion: 5 }),
  isCurrent: () => false,
  publishAppliedContent: () => { stalePublishCount += 1; },
});
assert.equal(staleOutcome.published, false);
assert.equal(stalePublishCount, 0);

const controller = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
const applyBlock = controller.slice(controller.lastIndexOf("onApplyMeasurementTemplate"), controller.indexOf("onSaveMeasurementTemplate", controller.lastIndexOf("onApplyMeasurementTemplate")));
assert.match(applyBlock, /runWaflTemplateApplyContentFirst/u);
assert.ok(applyBlock.indexOf("publishAppliedContent") < applyBlock.indexOf("return outcome.result"));
assert.match(controller, /appliedTemplateContent\.current\?\.templateId === templateLoadId/u);

const actionRunner = read("apps/mobile/application/waflActionExecution.ts");
assert.match(actionRunner, /beginWaflPresentationFirstOperation/u);
assert.ok(actionRunner.indexOf("beginWaflPresentationFirstOperation") < actionRunner.indexOf("const result = await input.command"));
for (const source of [
  read("apps/mobile/features/MobileWorkOrderExperience.tsx"),
  read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx"),
  read("apps/mobile/features/work-orders/production/productionCategorySwitchPolicy.ts"),
]) assert.match(source, /beginWaflPresentationFirstOperation/u);
for (const source of [actionRunner, controller]) assert.doesNotMatch(source, /setTimeout\([^,]+,\s*(200|300|500)/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha69-destructive-scroll-global-blocker-lifecycle",
  decisionParentScrollable: false,
  actionPresentationFirst: true,
  templateGets: contentGets,
  templateMutations: mutations,
  stalePromotion: stalePublishCount,
  status: "PASS",
}));
