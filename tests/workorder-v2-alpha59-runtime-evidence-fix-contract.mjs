import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  BASIC_INFO_PATCH_RECEIPT_CONTRACT,
  validateAccountingStep,
  validateImmutableFixtureOwnership,
} from "../scripts/lib/alpha59-runtime-accounting.mjs";
import { inspectSamePositionInlineCoreFieldSources } from "../scripts/lib/alpha58-runtime-evidence.mjs";

const state = (workOrderVersion, revisionVersion, events, receipts) => ({
  workOrderVersion,
  revisionVersion,
  events,
  receipts,
});

const marker = "QA A59 picker drag isolated 20260804-ABCDEF12";
const createdChildIds = {
  sizes: ["size-1"],
  colors: ["color-1"],
  quantities: ["color-1:size-1"],
  specs: [],
  materials: ["material-1"],
  accessories: ["accessory-1"],
};

test("basic-info PATCH source contract records Event independently from Receipt", () => {
  const commands = fs.readFileSync("lib/domain/work-orders/contracts/commands.ts", "utf8");
  const validation = fs.readFileSync("lib/domain/work-orders/command/validation.ts", "utf8");
  const repository = fs.readFileSync("lib/domain/work-orders/command/commandRepository.ts", "utf8");
  const normative = fs.readFileSync("docs/project/app-v2/16-workorder-api-command-read-model-contracts.md", "utf8");

  assert.match(commands, /PatchWorkOrderBasicInfoCommand\s*=\s*VersionedWorkOrderCommand/);
  assert.match(validation, /clientRequestId[\s\S]*expectedVersion[\s\S]*patch/);
  const patchStart = repository.indexOf("export async function patchWorkOrderBasicInfoV2");
  const patchEnd = repository.indexOf("\nexport async function ", patchStart + 1);
  const patchRepository = repository.slice(patchStart, patchEnd < 0 ? repository.length : patchEnd);
  assert.match(patchRepository, /domain_events/);
  assert.doesNotMatch(patchRepository, /work_order_command_receipts|reserveWorkOrderCommandReceipt/);
  assert.match(patchRepository, /idempotentReplay:\s*false/);
  assert.match(normative, /patch\/current-revision\/event/);
  assert.deepEqual(BASIC_INFO_PATCH_RECEIPT_CONTRACT.expectedDeltas, {
    workOrderVersion: 1,
    revisionVersion: 1,
    events: 1,
    receipts: 0,
  });

  const step = validateAccountingStep({
    key: "product-name-inline-patch",
    expectedSemantic: "changed",
    expectedDeltas: BASIC_INFO_PATCH_RECEIPT_CONTRACT.expectedDeltas,
    before: state(1, 1, 1, 1),
    after: state(2, 2, 2, 1),
    httpStatus: 200,
    replay: false,
    contractBasis: BASIC_INFO_PATCH_RECEIPT_CONTRACT,
  });
  assert.equal(step.pass, true);
  assert.equal(step.deltas.events, 1);
  assert.equal(step.deltas.receipts, 0);
  assert.equal(step.contractBasis.commandCode, "work_order.patch_basic_info");

  const falseParity = validateAccountingStep({
    key: "product-name-false-parity",
    expectedSemantic: "changed",
    expectedDeltas: { workOrderVersion: 1, revisionVersion: 1, events: 1, receipts: 1 },
    before: state(1, 1, 1, 1),
    after: state(2, 2, 2, 1),
    httpStatus: 200,
    replay: false,
  });
  assert.equal(falseParity.pass, false);
  assert.ok(falseParity.failures.includes("RECEIPTS_DELTA_MISMATCH"));
});

test("fixture cleanup ownership survives productName mutation and rejects foreign identity", () => {
  const valid = validateImmutableFixtureOwnership({
    companyId: "wafl-fn-company-a",
    workOrderId: "work-order-1",
    revisionId: "revision-1",
    creationMarker: marker,
    originalProductName: marker,
    current: {
      companyId: "wafl-fn-company-a",
      workOrderId: "work-order-1",
      revisionId: "revision-1",
      currentRevisionId: "revision-1",
      productName: `${marker} inline`,
      status: "draft",
      revisionStatus: "draft",
    },
    createdChildIds,
    observedChildIds: { ...createdChildIds, sizes: [], colors: [], quantities: [], specs: [], materials: [], accessories: [] },
  });
  assert.equal(valid.fixture.productNameChanged, true);
  assert.equal(valid.fixture.currentProductName, `${marker} inline`);
  assert.equal(valid.fixture.pass, true);

  assert.throws(() => validateImmutableFixtureOwnership({
    companyId: "wafl-fn-company-a",
    workOrderId: "work-order-1",
    revisionId: "revision-1",
    creationMarker: marker,
    originalProductName: marker,
    current: {
      companyId: "foreign-company",
      workOrderId: "work-order-1",
      revisionId: "revision-1",
      currentRevisionId: "revision-1",
      productName: marker,
      status: "draft",
      revisionStatus: "draft",
    },
    createdChildIds,
    observedChildIds: { ...createdChildIds, sizes: [], colors: [], quantities: [], specs: [], materials: [], accessories: [] },
  }), /FIXTURE_COMPANY_OWNERSHIP_MISMATCH/);

  assert.throws(() => validateImmutableFixtureOwnership({
    companyId: "wafl-fn-company-a",
    workOrderId: "work-order-1",
    revisionId: "revision-1",
    creationMarker: marker,
    originalProductName: marker,
    current: {
      companyId: "wafl-fn-company-a",
      workOrderId: "work-order-1",
      revisionId: "revision-1",
      currentRevisionId: "revision-1",
      productName: marker,
      status: "draft",
      revisionStatus: "draft",
    },
    createdChildIds,
    observedChildIds: { sizes: ["unrecorded-size"], colors: [], quantities: [], specs: [], materials: [], accessories: [] },
  }), /FIXTURE_OBSERVED_SIZES_NOT_RECORDED/);
});

test("Runtime runner uses the same exact-ID child cleanup and no mutable-name parent predicate", () => {
  const source = fs.readFileSync("scripts/run-wafl-v2-alpha59-size-color-structure-runtime-qa.mjs", "utf8");
  assert.match(source, /changedWithoutReceipt\("product-name-inline-patch", BASIC_INFO_PATCH_RECEIPT_CONTRACT\)/);
  assert.doesNotMatch(source, /product-name-marker-restore/);
  assert.match(source, /currentProductName:\s*inlineProductName/);
  assert.match(source, /cleanupExactFixtureChildren\(client,[\s\S]*mode:\s*"normal"/);
  assert.match(source, /cleanupExactFixtureChildren\(client,[\s\S]*mode:\s*"finally-fallback"/);
  assert.doesNotMatch(source, /UPDATE work_orders SET current_revision_id=NULL[\s\S]{0,240}product_name=/);
  assert.doesNotMatch(source, /DELETE FROM work_orders[\s\S]{0,240}product_name=/);
  assert.doesNotMatch(source, /assert\.equal\(fixture\.product_name, input\.fixtureMarker\)/);
  assert.match(source, /validateImmutableFixtureOwnership\(/);
});

function inlineMarkerSources() {
  return {
    overview: fs.readFileSync("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx", "utf8"),
    materialView: fs.readFileSync("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx", "utf8"),
    materialEditor: fs.readFileSync("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx", "utf8"),
    controlledInline: fs.readFileSync("apps/mobile/components/ControlledInlineEditValue.tsx", "utf8"),
    reelPicker: fs.readFileSync("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx", "utf8"),
    display: fs.readFileSync("apps/mobile/lib/mobileDisplay.ts", "utf8"),
    experience: [
      fs.readFileSync("apps/mobile/features/MobileWorkOrderExperience.tsx", "utf8"),
      fs.readFileSync("apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts", "utf8"),
    ].join("\n"),
  };
}

test("same-position unit-price marker accepts canonical number-pad behavior and records every sub-check", () => {
  const sources = inlineMarkerSources();
  const staleDecimalPadAssertion = /MaterialInlineField[^\n]+field="unitPrice"[^\n]+keyboardType="decimal-pad"/.test(sources.materialView)
    && /<EditorField field="unitPrice" keyboardType="decimal-pad"/.test(sources.materialEditor);
  assert.equal(staleDecimalPadAssertion, false, "the pre-fix exact decimal-pad marker reproduces the stale failure");

  const evidence = inspectSamePositionInlineCoreFieldSources(sources);
  assert.equal(evidence.passed, true, evidence.failureKeys.join(","));
  assert.deepEqual(evidence.failureKeys, []);
  assert.deepEqual(evidence.subchecks.map((check) => check.key), [
    "same-position-text-input",
    "canonical-number-pad",
    "not-modal-only",
    "inline-actions-hidden",
    "submit-blur-dedupe",
    "background-duplicate-zero",
    "won-view-formatting",
    "material-accessory-symmetry",
    "failure-conflict-restore",
  ]);
  assert.ok(evidence.subchecks.every((check) => check.evidence.length > 0));

  const runner = fs.readFileSync("scripts/run-wafl-v2-alpha59-size-color-structure-runtime-qa.mjs", "utf8");
  assert.match(runner, /inspectSamePositionInlineCoreFieldSources\(/);
  assert.match(runner, /sourceBehavior:\s*samePositionInlineEvidence/);
  assert.doesNotMatch(runner, /field="unitPrice"[^\n]+keyboardType="decimal-pad"/);
});

test("same-position unit-price marker blocks stale keyboards, modal/action regressions, duplicate saves, formatting loss, and asymmetric consumers", () => {
  const sources = inlineMarkerSources();
  const expectBlocked = (changed, failureKey) => {
    const evidence = inspectSamePositionInlineCoreFieldSources({ ...sources, ...changed });
    assert.equal(evidence.passed, false, failureKey);
    assert.ok(evidence.failureKeys.includes(failureKey), `${failureKey}: ${evidence.failureKeys.join(",")}`);
  };

  expectBlocked({
    materialView: sources.materialView.replace('keyboardType="number-pad" label="단가"', 'keyboardType="decimal-pad" label="단가"'),
  }, "canonical-number-pad");
  expectBlocked({
    materialEditor: sources.materialEditor.replace('keyboardType="number-pad" label=', 'keyboardType="default" label='),
  }, "canonical-number-pad");
  expectBlocked({
    reelPicker: `${sources.reelPicker}\nconst forbidden = reelTarget.field === "unitPrice";`,
  }, "not-modal-only");
  expectBlocked({
    controlledInline: sources.controlledInline.replace("{!inlineCommit ? <View style={styles.actions}>", "{inlineCommit ? <View style={styles.actions}>")
  }, "inline-actions-hidden");
  expectBlocked({
    controlledInline: sources.controlledInline.replace("function handleCancel()", "onSave(value);\n  function handleCancel()"),
  }, "submit-blur-dedupe");
  expectBlocked({
    materialView: sources.materialView.replace("displayValue={formatWon(calculationDraft.unitPrice)}", "displayValue={calculationDraft.unitPrice}"),
  }, "won-view-formatting");
  expectBlocked({
    overview: sources.overview.replace("materialType={materialType}", 'materialType="fabric"'),
  }, "material-accessory-symmetry");
});
