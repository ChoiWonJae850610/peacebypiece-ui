#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  assertFieldsUnchanged,
  assertNullPatchClears,
  assertOnlyFieldsChanged,
  assertRollbackRestored,
  assertTenantIsolation,
  assertUndefinedPatchPreserves,
  snapshotRow,
} from "../scripts/wafl-db-invariants.mjs";

const companyA = "wafl-fn-company-a";
const companyB = "wafl-fn-company-b";

const original = {
  id: "wafl-fn-workorder-a-001",
  company_id: companyA,
  name: "기본 작업지시서",
  status: "draft",
  due_date: "2026-07-01",
  memo: "유지",
  inventory: { fabric: 10 },
  updated_at: "2026-06-18T00:00:00.000Z",
  updated_by: "wafl-fn-member-a-admin",
};

function applyPatch(row, patch) {
  const next = snapshotRow(row);
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) next[key] = value;
  }
  next.updated_at = "2026-06-18T01:00:00.000Z";
  next.updated_by = "wafl-fn-member-a-editor";
  return next;
}

const dueDateBefore = snapshotRow(original);
const dueDateAfter = applyPatch(dueDateBefore, { due_date: "2026-07-15" });
assertOnlyFieldsChanged(dueDateBefore, dueDateAfter, ["due_date"]);
assertFieldsUnchanged(dueDateBefore, dueDateAfter, ["name", "status", "company_id", "inventory", "memo"]);

const undefinedAfter = applyPatch(original, { memo: undefined, due_date: "2026-07-20" });
assertUndefinedPatchPreserves(original, { memo: undefined }, undefinedAfter);
assert.equal(undefinedAfter.memo, "유지");

const nullAfter = applyPatch(original, { memo: null });
assertNullPatchClears({ memo: null }, nullAfter);
assert.equal(nullAfter.memo, null);

const optimistic = applyPatch(original, { due_date: "2026-08-01" });
const rolledBack = snapshotRow(original);
assert.notDeepEqual(optimistic, original);
assertRollbackRestored(original, rolledBack);

const companyBBefore = [{ id: "wafl-fn-workorder-b-001", company_id: companyB, due_date: "2026-08-10" }];
const companyBAfter = snapshotRow(companyBBefore);
assertTenantIsolation({
  actorCompanyId: companyA,
  targetCompanyId: companyB,
  beforeTargetRows: companyBBefore,
  afterTargetRows: companyBAfter,
});

assert.equal(companyBBefore[0].company_id, companyB);
console.log("WAFL functions DB contract tests passed: 5 scenarios");
