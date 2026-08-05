import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  ACCOUNTING_STEP_KEY_PATTERN,
  createExactColorOrdinalQueue,
  summarizeValidatedStepLedger,
  validateAccountingStep,
} from "../scripts/lib/alpha59-runtime-accounting.mjs";

const state = (workOrderVersion, revisionVersion, events, receipts) => ({
  workOrderVersion,
  revisionVersion,
  events,
  receipts,
});

test("changed reorder and same-index HTTP 200 no-op are distinct ledger semantics", () => {
  const changed = validateAccountingStep({
    key: "color-changed-reorder",
    expectedSemantic: "changed",
    expectedDeltas: { workOrderVersion: 1, revisionVersion: 1, events: 1, receipts: 1 },
    payloadOrder: ["color-b", "color-a"],
    beforeOrder: ["color-a", "color-b"],
    afterOrder: ["color-b", "color-a"],
    before: state(10, 10, 8, 7),
    after: state(11, 11, 9, 8),
    httpStatus: 200,
    replay: false,
  });
  const noOp = validateAccountingStep({
    key: "color-same-index-no-op",
    expectedSemantic: "no-op",
    expectedDeltas: { workOrderVersion: 0, revisionVersion: 0, events: 0, receipts: 0 },
    payloadOrder: ["color-b", "color-a"],
    beforeOrder: ["color-b", "color-a"],
    afterOrder: ["color-b", "color-a"],
    before: state(11, 11, 9, 8),
    after: state(11, 11, 9, 8),
    httpStatus: 200,
    replay: false,
  });

  assert.equal(changed.actualSemantic, "changed");
  assert.equal(noOp.actualSemantic, "no-op");
  assert.equal(changed.pass, true);
  assert.equal(noOp.pass, true);
  assert.deepEqual(summarizeValidatedStepLedger([changed, noOp]), {
    workOrderVersion: 1,
    revisionVersion: 1,
    events: 1,
    receipts: 1,
    changed: 1,
    noOp: 1,
    rejected: 0,
    replay: 0,
    steps: 2,
  });
});

test("rejected and replay requests contribute zero to final mutation accounting", () => {
  const before = state(20, 20, 18, 16);
  const rejected = validateAccountingStep({
    key: "stale-rejected",
    expectedSemantic: "rejected",
    expectedDeltas: { workOrderVersion: 0, revisionVersion: 0, events: 0, receipts: 0 },
    payloadOrder: [],
    before,
    after: before,
    httpStatus: 409,
    replay: false,
  });
  const replay = validateAccountingStep({
    key: "size-create-replay",
    expectedSemantic: "replay",
    expectedDeltas: { workOrderVersion: 0, revisionVersion: 0, events: 0, receipts: 0 },
    payloadOrder: [],
    before,
    after: before,
    httpStatus: 200,
    replay: true,
  });

  assert.deepEqual(summarizeValidatedStepLedger([rejected, replay]), {
    workOrderVersion: 0,
    revisionVersion: 0,
    events: 0,
    receipts: 0,
    changed: 0,
    noOp: 0,
    rejected: 1,
    replay: 1,
    steps: 2,
  });
});

test("HTTP 200 alone cannot make a same-index step count as changed", () => {
  const unchanged = state(21, 21, 20, 18);
  const step = validateAccountingStep({
    key: "known-old-runner-defect",
    expectedSemantic: "changed",
    expectedDeltas: { workOrderVersion: 1, revisionVersion: 1, events: 1, receipts: 1 },
    payloadOrder: ["color-a", "color-b"],
    beforeOrder: ["color-a", "color-b"],
    afterOrder: ["color-a", "color-b"],
    before: unchanged,
    after: unchanged,
    httpStatus: 200,
    replay: false,
  });

  assert.equal(step.actualSemantic, "no-op");
  assert.equal(step.pass, false);
  assert.throws(() => summarizeValidatedStepLedger([step]), /UNVALIDATED_ACCOUNTING_STEP/);
});

test("exact color display names stay in request evidence while identities and accounting keys use stable ASCII ordinals", () => {
  const queue = createExactColorOrdinalQueue([
    { displayName: "화이트", hexValue: "#FFFFFF" },
    { displayName: "아이보리", hexValue: "#F5F0E6" },
    { displayName: "그레이", hexValue: "#8A8F98" },
  ]);

  assert.equal(Object.isFrozen(queue), true);
  assert.equal(queue.every(Object.isFrozen), true);
  assert.deepEqual(queue.map((entry) => entry.displayName), ["화이트", "아이보리", "그레이"]);
  assert.deepEqual(queue.map((entry) => entry.ordinal), [1, 2, 3]);
  assert.deepEqual(queue.map((entry) => entry.requestIdentityClass), ["exact-color-1", "exact-color-2", "exact-color-3"]);
  assert.deepEqual(queue.map((entry) => entry.stepKey), ["exact-color-1", "exact-color-2", "exact-color-3"]);
  assert.equal(new Set(queue.map((entry) => entry.requestIdentityClass)).size, 3);
  assert.equal(new Set(queue.map((entry) => entry.stepKey)).size, 3);
  assert.equal(queue.every((entry) => ACCOUNTING_STEP_KEY_PATTERN.test(entry.requestIdentityClass)), true);
  assert.equal(queue.every((entry) => ACCOUNTING_STEP_KEY_PATTERN.test(entry.stepKey)), true);
  assert.equal(queue.some((entry) => /[^\x00-\x7F]/.test(entry.requestIdentityClass)), false);
  assert.equal(queue.some((entry) => /[^\x00-\x7F]/.test(entry.stepKey)), false);

  assert.throws(() => validateAccountingStep({
    key: "exact-color-화이트",
    expectedSemantic: "changed",
    expectedDeltas: { workOrderVersion: 1, revisionVersion: 1, events: 1, receipts: 1 },
    before: state(1, 1, 0, 0),
    after: state(2, 2, 1, 1),
    httpStatus: 201,
    replay: false,
  }), /ACCOUNTING_STEP_KEY_INVALID/);

  for (const entry of queue) {
    const step = validateAccountingStep({
      key: entry.stepKey,
      expectedSemantic: "changed",
      expectedDeltas: { workOrderVersion: 1, revisionVersion: 1, events: 1, receipts: 1 },
      before: state(entry.ordinal, entry.ordinal, entry.ordinal - 1, entry.ordinal - 1),
      after: state(entry.ordinal + 1, entry.ordinal + 1, entry.ordinal, entry.ordinal),
      httpStatus: 201,
      replay: false,
    });
    assert.equal(step.pass, true);
  }
});

test("alpha59 Runtime runner derives changed and same-index color payloads from live order evidence", () => {
  const source = fs.readFileSync("scripts/run-wafl-v2-alpha59-size-color-structure-runtime-qa.mjs", "utf8");

  assert.match(source, /read-before-color-changed-reorder[\s\S]*\.colors\.map\(\(row\) => row\.id\)[\s\S]*\.reverse\(\)/);
  assert.match(source, /COLOR_CHANGED_REORDER_PAYLOAD_MUST_DIFFER[\s\S]*changedWithReceipt\("color-changed-reorder", "color"\)/);
  assert.match(source, /read-after-color-changed-reorder[\s\S]*orderedColorIds:\s*\[\.\.\.colorOrderAfterChanged\][\s\S]*zeroDelta\("color-same-index-no-op", "no-op", "color"\)/);
  assert.match(source, /summarizeValidatedStepLedger\(accountingSteps\)/);
  assert.match(source, /persistAccountingEvidence\(accountingSteps, accountingSummary\)/);
  assert.doesNotMatch(source, /expectedMutations|expectedReceipts/);
  assert.match(source, /identity\(colorRequest\.requestIdentityClass\)/);
  assert.match(source, /changedWithReceipt\(colorRequest\.stepKey\)/);
  assert.match(source, /displayName:\s*colorRequest\.displayName/);
  assert.doesNotMatch(source, /changedWithReceipt\(`exact-color-\$\{displayName\}`\)/);
});
