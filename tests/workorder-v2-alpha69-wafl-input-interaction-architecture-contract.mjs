import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  beginWaflPresentationFirstOperation,
  waitForWaflPresentationBoundary,
} from "../apps/mobile/application/waflPresentationBoundary.ts";
import { createWaflDecisionGuard } from "../apps/mobile/domain/waflDecisionPolicy.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const presentationEvents = [];
const scheduledFrames = [];
const presentation = beginWaflPresentationFirstOperation({
  enterPending: () => presentationEvents.push("pending:on"),
  present: () => waitForWaflPresentationBoundary((callback) => scheduledFrames.push(callback)),
});
assert.deepEqual(presentationEvents, ["pending:on"], "pending must be owned synchronously at acceptance");
assert.equal(scheduledFrames.length, 1);
scheduledFrames.shift()();
assert.equal(scheduledFrames.length, 1, "presentation requires a committed frame after the first scheduled frame");
scheduledFrames.shift()();
await presentation;
presentationEvents.push("content:fetch", "mutation:apply", "pending:off");
assert.deepEqual(presentationEvents, ["pending:on", "content:fetch", "mutation:apply", "pending:off"]);

let safeCount = 0;
let commandCount = 0;
const safeGuard = createWaflDecisionGuard(() => { safeCount += 1; }, () => { commandCount += 1; });
assert.equal(safeGuard.apply("safe"), false);
assert.deepEqual({ safeCount, commandCount }, { safeCount: 1, commandCount: 0 });
const actionGuard = createWaflDecisionGuard(() => { safeCount += 1; }, () => { commandCount += 1; });
assert.equal(actionGuard.apply("action"), true);
assert.equal(actionGuard.apply("action"), false);
assert.equal(commandCount, 1);

const inputSheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const decisionChoice = read("apps/mobile/features/feedback/WaflDecisionChoiceBody.tsx");
const decisionSheet = read("apps/mobile/features/feedback/WaflDecisionSheet.tsx");
const structure = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const templates = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
const controller = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const fullView = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");

assert.match(inputSheet, /renderedChildren = decision \? <WaflDecisionChoiceBody/u);
assert.match(inputSheet, /effectiveTitle = decision \? "WAFL INPUT" : title/u);
assert.match(inputSheet, /showCancel=\{decision \? false : showCancelAction\}/u);
assert.doesNotMatch(inputSheet, /<WaflDecisionOverlay/u, "active sheet must not layer the centered card overlay");
assert.match(decisionChoice, /WaflOptionReel/u);
assert.doesNotMatch(decisionChoice, /\bModal\b|Pressable|styles\.card/u);
assert.match(decisionSheet, /WaflDecisionChoiceBody/u, "standalone and active-sheet decisions share one reel body");
assert.equal((decisionChoice.match(/<WaflOptionReel/g) ?? []).length, 1, "one rendered reel owner");

for (const source of [structure, overview]) assert.match(source, /WaflDecisionChoiceState/u);
assert.doesNotMatch(structure, /confirmWaflDestructiveAction/u, "company catalog removal inside a chooser stays in the same sheet");
assert.doesNotMatch(templates, /confirmWaflDestructiveAction/u, "saved-template disable inside a sheet stays in the same sheet");
assert.match(structure, /catalogRemovalDecision/u);
assert.match(templates, /disableDecision/u);
assert.match(structure, /resolveStagedReplacementImpact/u);
assert.match(structure, /return impact\.hasLoss \? impact : null/u, "zero-loss remains immediate");

const templateApplyStart = controller.lastIndexOf("onApplyMeasurementTemplate");
const templateApply = controller.slice(templateApplyStart, controller.indexOf("onSaveMeasurementTemplate", templateApplyStart));
assert.match(templateApply, /templateApplyActive\.current/u);
assert.match(templateApply, /presentationBeforeRequest|undefined, true/u);
assert.ok(templateApply.indexOf("getMeasurementTemplateContent") < templateApply.indexOf("mutateMeasurement"));
assert.match(controller, /beginWaflPresentationFirstOperation/u);
assert.ok(controller.indexOf("enterPending") < controller.indexOf("const commandResult = await request"));
assert.match(controller, /finally \{[\s\S]*setBusy\(false\);[\s\S]*setPendingScope\(null\)/u);

assert.match(reel, /keyboardAutoExpand=\{renderPath === "numeric-keypad"\}/u);
assert.doesNotMatch(reel, /keyboardMode="directInput"/u, "numeric reel remains the intentional staged X\/V exception");
assert.match(fullView, /ControlledInlineEditValue/u);
assert.match(fullView, /bodyScrollable=\{fullView === "spec"\}/u);
assert.match(inputSheet, /resolveWaflDirectInputTapPersistence/u);
assert.match(inputSheet, /WaflDirectInputKeyboardAccessory/u);
assert.match(inputSheet, /beginSheetClose/u);

const remainingGlobalDecisionCallsites = [
  "apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts",
  "apps/mobile/features/work-orders/images/useWorkOrderAssetAuthoringController.ts",
].filter((relative) => /confirmWaflDestructiveAction/u.test(read(relative)));
assert.deepEqual(remainingGlobalDecisionCallsites, [
  "apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts",
  "apps/mobile/features/work-orders/images/useWorkOrderAssetAuthoringController.ts",
], "only standalone material/image actions retain the global Decision owner");

console.log("alpha69 WAFL INPUT presentation-first blocker and same-sheet destructive-choice architecture contract: PASS");
