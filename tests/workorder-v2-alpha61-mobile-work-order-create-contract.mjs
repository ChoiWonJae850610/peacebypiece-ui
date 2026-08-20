#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { readMobileApiSource } from "./helpers/mobile-api-source.mjs";
import path from "node:path";

import {
  reconcileCreatedWorkOrderListItem,
  resolveWorkOrderCreateAttempt,
} from "../apps/mobile/domain/workOrderCreatePolicy.ts";
import { validateWorkOrderProductName } from "../apps/mobile/domain/workOrderValidation.ts";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const item = (workOrderId, productName) => ({
  workOrderId,
  productName,
  displayDocumentNumber: null,
  status: "draft",
  dueDate: null,
  totalQuantity: 0,
  estimatedAmountSummary: { currency: "KRW", estimatedTotal: "0" },
  representativeThumbnail: null,
  incompleteMaterialSummary: { incompleteFabricCount: 0, incompleteAccessoryCount: 0 },
  processCount: 0,
  latestDocumentStatus: null,
  updatedAt: "2026-08-10T00:00:00.000Z",
});

assert.equal(validateWorkOrderProductName(""), "제품명은 1자 이상 200자 이하여야 합니다.");
assert.equal(validateWorkOrderProductName(" "), "제품명은 1자 이상 200자 이하여야 합니다.");
assert.equal(validateWorkOrderProductName("신규 티셔츠"), null);
assert.ok(validateWorkOrderProductName("x".repeat(201)));

const first = resolveWorkOrderCreateAttempt(null, "신규 티셔츠", false, "one");
const replay = resolveWorkOrderCreateAttempt(first, "신규 티셔츠", false, "two");
const changed = resolveWorkOrderCreateAttempt(first, "다른 티셔츠", false, "three");
assert.equal(replay, first);
assert.notEqual(changed.idempotencyKey, first.idempotencyKey);
assert.deepEqual(reconcileCreatedWorkOrderListItem([item("old", "기존"), item("new", "이전")], item("new", "신규")), [item("new", "신규"), item("old", "기존")]);

const api = readMobileApiSource();
const mutation = read("apps/mobile/features/work-orders/workOrderMutationController.ts");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const list = read("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx");
const sheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const guard = read("lib/domain/work-orders/command/runtimeGuard.ts");
const service = read("lib/domain/work-orders/command/commandService.ts");
const sizeColorService = read("lib/domain/work-orders/command/sizeColorStructureCommandService.ts");
const runner = read("tools/dev/start-wafl-external-qa.ps1");

assert.match(api, /createWorkOrderDraft[\s\S]+method: "POST"[\s\S]+\/api\/v2\/work-orders/);
assert.match(api, /body: \{ clientRequestId: command\.clientRequestId, productName: command\.productName, isSample: command\.isSample \}/);
assert.match(api, /idempotencyKey,/);
assert.doesNotMatch(api, /body: \{[^}]*companyId/);
assert.match(mutation, /createDraft\(command: CreateWorkOrderDraftInput, idempotencyKey: string\)/);
assert.match(list, /accessibilityLabel="새 작업지시서 만들기"/);
assert.match(sheet, /WaflInputSheet/);
assert.match(sheet, /새 작업지시서 만들기 취소/);
assert.match(experience, /createMutation\.tryBegin\(\) !== "started"/);
assert.match(experience, /resolveWorkOrderCreateAttempt/);
assert.match(experience, /reconcileCreatedWorkOrderListItem/);
assert.match(experience, /workOrderQueryController\.detail\(created\.result\.workOrderId\)/);
assert.match(experience, /setCreateError\(customerMessage\(error\)\)/);
assert.match(guard, /WAFL_V2_ALPHA61_MOBILE_WORK_ORDER_CREATE_MUTATION_APPROVAL/);
assert.match(guard, /getWorkOrderV2CreateMutationRuntimeGuard/);
assert.match(guard, /getWorkOrderV2SizeColorStructureMutationRuntimeGuard/);
assert.match(service, /requireWorkOrderCreateMutationApproval\(\)/);
assert.match(service, /requireSizeColorStructureMutationApproval\(\)/);
assert.match(sizeColorService, /requireSizeColorStructureMutationApproval\(\)/);
assert.doesNotMatch(sizeColorService, /WAFL_V2_ALPHA(?:59|60)_/, "size/color service must reuse the canonical runtime guard instead of owning approval literals");
assert.match(runner, /EnableAlpha61MobileWorkOrderCreateMutation/);
assert.match(runner, /mobile-work-order-create/);

console.log("WAFL v2 alpha.61 mobile WorkOrder create contract: PASS");
