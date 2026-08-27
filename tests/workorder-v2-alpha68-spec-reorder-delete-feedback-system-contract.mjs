import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { createWaflDecisionGuard, resolveWaflDecisionOpeningValue } from "../apps/mobile/domain/waflDecisionPolicy.ts";
import { resolveWaflBasicSpecRecommendationCategory } from "../apps/mobile/domain/workOrderCategoryPolicy.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

assert.equal(resolveWaflBasicSpecRecommendationCategory("B"), "B", "already-decoded Bottoms code must not be decoded twice");
for (const category of ["T", "B", "O", "D"]) assert.equal(resolveWaflBasicSpecRecommendationCategory(category), category);
for (const category of [null, undefined, "", "M", "wafl-c1|M|B"]) assert.equal(resolveWaflBasicSpecRecommendationCategory(category), null);

assert.equal(resolveWaflDecisionOpeningValue(), "safe");
let cancellations = 0;
let mutations = 0;
const dismissed = createWaflDecisionGuard(() => { cancellations += 1; }, () => { mutations += 1; });
assert.equal(dismissed.dismiss(), true);
assert.equal(dismissed.dismiss(), false);
assert.equal(cancellations, 1);
assert.equal(mutations, 0, "backdrop/back/drag dismissal must not mutate");

const safe = createWaflDecisionGuard(() => { cancellations += 1; }, () => { mutations += 1; });
assert.equal(safe.apply("safe"), false);
assert.equal(mutations, 0, "safe option plus V must not mutate");
assert.equal(safe.apply("action"), false, "a committed decision cannot be replayed");

const action = createWaflDecisionGuard(() => { cancellations += 1; }, () => { mutations += 1; });
assert.equal(action.apply("action"), true);
assert.equal(action.apply("action"), false);
assert.equal(mutations, 1, "action option plus V must execute exactly once");

const decision = read("apps/mobile/features/feedback/WaflDecisionSheet.tsx");
const inputSheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const alertHost = read("apps/mobile/features/feedback/WaflAlertHost.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const deleteRoute = read("lib/domain/work-orders/command/draftDeleteRoute.ts");
const sizeColor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const templateRepository = read("lib/domain/work-orders/measurement/templateRepository.ts");

assert.match(decision, /title="WAFL INPUT"/u);
assert.match(decision, /WaflOptionReel/u);
assert.match(decision, /showCancelAction=\{false\}/u);
assert.doesNotMatch(decision, /WaflSheetActionButtons/u);
assert.match(inputSheet, /showCancelAction = true/u, "ordinary WAFL INPUT must retain dual X\/V by default");
assert.match(inputSheet, /showCancel=\{showCancelAction\}/u);
assert.match(alertHost, /durationMs \?\? 1200/u);
assert.match(alertHost, /pointerEvents="none"/u);
assert.doesNotMatch(alertHost, /Pressable|Button/u);
assert.match(experience, /WaflDecisionSheet decision=\{actionConfirmation\}/u);
assert.match(experience, /WaflFeedbackHost/u);

assert.match(sizeColor, /resolveWaflBasicSpecRecommendationCategory\(categoryCode\)/u);
assert.doesNotMatch(sizeColor, /decodeWorkOrderProductType\(category\)/u);
assert.match(templateRepository, /FROM work_orders w/u);
assert.match(templateRepository, /decodeWorkOrderMajorCategoryCode\(target\?\.product_type_code \?\? null\)/u);
assert.match(templateRepository, /getWaflBasicSpecTemplate\(categoryCode as WorkOrderMajorCategoryCode \| null, itemCode\)/u);
assert.match(deleteRoute, /SELECT \$1,'work_order',\$2::text/u);
assert.match(deleteRoute, /entity_id=\$2::text/u);

const nativeAlertInventory = [];
for (const relative of [
  "apps/mobile/features/MobileWorkOrderExperience.tsx",
  "apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts",
  "apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx",
  "apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx",
  "apps/mobile/features/feedback/confirmWaflAction.ts",
  "apps/mobile/features/feedback/confirmWaflDestructiveAction.ts",
]) if (/Alert\.alert/u.test(read(relative))) nativeAlertInventory.push(relative);
assert.deepEqual(nativeAlertInventory, [], "unintentional native/system Maker confirmations and notices must be zero");

console.log("workorder v2 alpha68 spec recommendation, Reorder delete, and WAFL feedback system contract passed");
