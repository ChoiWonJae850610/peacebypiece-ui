#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { resolveApprovedDraftTarget } from "../scripts/run-wafl-v2-alpha46-create-qa-draft.mjs";
import * as runtimeAccounting from "../scripts/lib/alpha59-runtime-accounting.mjs";

const root = process.cwd();
const prefixRowsBeforeFix = ["prefix-1", "prefix-2"];
const exactRowsBeforeFix = ["exact-1", "exact-2", "exact-3"];
const combinedRowsBeforeFix = [...prefixRowsBeforeFix, ...exactRowsBeforeFix];
assert.throws(
  () => assert.equal(prefixRowsBeforeFix.length, combinedRowsBeforeFix.length),
  /2 !== 5/,
  "legacy prefix-count versus combined-ID assertion must reproduce the cleanup ownership defect",
);
assert.equal(
  typeof runtimeAccounting.validateColorCleanupOwnership,
  "function",
  "separated cleanup ownership validator must exist",
);
const fixtureOwnership = {
  companyId: "company-a",
  workOrderId: "work-order-a",
  revisionId: "revision-a",
  fixtureMarker: "QA A59 picker drag isolated 20260804-A1B2C3D4",
};
const prefixSyntheticColorIds = ["prefix-1", "prefix-2"];
const exactSequenceColors = [
  { id: "exact-1", ordinal: 1, stepKey: "exact-color-1", displayName: "화이트" },
  { id: "exact-2", ordinal: 2, stepKey: "exact-color-2", displayName: "아이보리" },
  { id: "exact-3", ordinal: 3, stepKey: "exact-color-3", displayName: "그레이" },
];
const ownedRows = [
  { id: "prefix-1", ...fixtureOwnership, displayName: "A59-QA-COLOR-ONE" },
  { id: "prefix-2", ...fixtureOwnership, displayName: "A59-QA-COLOR-TWO" },
  { id: "exact-1", ...fixtureOwnership, displayName: "화이트" },
  { id: "exact-2", ...fixtureOwnership, displayName: "아이보리" },
  { id: "exact-3", ...fixtureOwnership, displayName: "그레이" },
];
const separatedOwnership = runtimeAccounting.validateColorCleanupOwnership({
  ...fixtureOwnership,
  prefixSyntheticColorIds,
  exactSequenceColors,
  expectedPrefixCount: 2,
  expectedExactCount: 3,
  colorRows: ownedRows,
});
assert.deepEqual(separatedOwnership.prefix.ids, prefixSyntheticColorIds);
assert.deepEqual(separatedOwnership.exactSequence.ids, exactSequenceColors.map((row) => row.id));
assert.equal(separatedOwnership.union.uniqueIdCount, 5);
assert.equal(separatedOwnership.union.duplicateCount, 0);
assert.equal(separatedOwnership.union.foreignIdCount, 0);
assert.throws(
  () => runtimeAccounting.validateColorCleanupOwnership({
    ...fixtureOwnership,
    prefixSyntheticColorIds,
    exactSequenceColors,
    expectedPrefixCount: 2,
    expectedExactCount: 3,
    colorRows: ownedRows.map((row) => row.id === "exact-3" ? { ...row, workOrderId: "foreign" } : row),
  }),
  /COLOR_CLEANUP_FOREIGN_OWNERSHIP/,
);
assert.throws(
  () => runtimeAccounting.validateColorCleanupOwnership({
    ...fixtureOwnership,
    prefixSyntheticColorIds,
    exactSequenceColors: exactSequenceColors.map((row) => row.id === "exact-3" ? { ...row, id: "exact-2" } : row),
    expectedPrefixCount: 2,
    expectedExactCount: 3,
    colorRows: ownedRows,
  }),
  /COLOR_CLEANUP_EXACT_DUPLICATE_ID/,
);
assert.throws(
  () => runtimeAccounting.validateColorCleanupOwnership({
    ...fixtureOwnership,
    prefixSyntheticColorIds,
    exactSequenceColors: exactSequenceColors.map((row) => row.id === "exact-3" ? { ...row, id: "unrecorded-but-same-name" } : row),
    expectedPrefixCount: 2,
    expectedExactCount: 3,
    colorRows: ownedRows,
  }),
  /COLOR_CLEANUP_RECORDED_ROW_MISSING/,
);
const isolatedName = "QA A59 picker drag isolated 20260802-A1B2C3D4";
const target = resolveApprovedDraftTarget({
  WAFL_V2_CONFIRMATION: "EXECUTE WAFL V2 ALPHA59 ISOLATED QA DRAFT CREATE",
  WAFL_V2_TEMPORARY_DRAFT_NAME: isolatedName,
  WAFL_V2_TEMPORARY_DRAFT_MARKER: isolatedName,
  WAFL_V2_TEMPORARY_DRAFT_CLIENT_REQUEST_ID: "a59-isolated-create-a1b2c3d4",
  WAFL_V2_TEMPORARY_DRAFT_IDEMPOTENCY_KEY: "a59-isolated-create-a1b2c3d4",
});

assert.deepEqual(target, {
  mode: "alpha59-isolated",
  productName: isolatedName,
  dueDate: null,
  totalQuantity: 0,
  clientRequestId: "a59-isolated-create-a1b2c3d4",
  idempotencyKey: "a59-isolated-create-a1b2c3d4",
});
assert.throws(
  () => resolveApprovedDraftTarget({
    WAFL_V2_CONFIRMATION: "EXECUTE WAFL V2 ALPHA59 ISOLATED QA DRAFT CREATE",
    WAFL_V2_TEMPORARY_DRAFT_NAME: "QA 기본정보 저장 검증 A",
    WAFL_V2_TEMPORARY_DRAFT_MARKER: "QA 기본정보 저장 검증 A",
    WAFL_V2_TEMPORARY_DRAFT_CLIENT_REQUEST_ID: "a59-isolated-create-a1b2c3d4",
    WAFL_V2_TEMPORARY_DRAFT_IDEMPOTENCY_KEY: "a59-isolated-create-a1b2c3d4",
  }),
  /isolated-name-prefix-mismatch/,
);

const runtime = fs.readFileSync(
  path.join(root, "scripts", "run-wafl-v2-alpha59-size-color-structure-runtime-qa.mjs"),
  "utf8",
);
assert.match(runtime, /QA A59 picker drag isolated/);
assert.match(runtime, /runTemporaryDraftProvisioner/);
assert.match(runtime, /cleanupTemporaryIsolatedDraft/);
assert.match(runtime, /finally\s*\{[\s\S]*cleanupTemporaryIsolatedDraft/);
assert.match(runtime, /cleanupValidatedColorOwnership/);
assert.match(runtime, /prefixSyntheticColorIds/);
assert.match(runtime, /exactSequenceColorRecords/);
assert.match(runtime, /UPDATE work_order_command_receipts[\s\S]*work_order_id\s*=\s*NULL[\s\S]*result_revision_id\s*=\s*NULL/);
assert.doesNotMatch(runtime, /DELETE\s+FROM\s+(?:public\.)?domain_events/i);
assert.doesNotMatch(runtime, /DELETE\s+FROM\s+(?:public\.)?work_order_command_receipts/i);
assert.match(runtime, /temporaryWorkOrder:\s*0/);
assert.match(runtime, /userOwnedMutation:\s*0/);
assert.match(runtime, /productionMutation:\s*0/);

console.log("workorder-v2 alpha.59 Runtime fixture safety contract: PASS");
