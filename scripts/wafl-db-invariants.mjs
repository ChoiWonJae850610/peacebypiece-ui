import assert from "node:assert/strict";

const DEFAULT_AUDIT_FIELDS = new Set(["updated_at", "updated_by", "updatedAt", "updatedBy"]);

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function snapshotRow(row) {
  return structuredClone(row);
}

export function changedFields(before, after) {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  return [...keys].filter((key) => JSON.stringify(stable(before?.[key])) !== JSON.stringify(stable(after?.[key]))).sort();
}

export function assertOnlyFieldsChanged(before, after, allowedFields, options = {}) {
  const allowed = new Set([...allowedFields, ...(options.includeDefaultAuditFields === false ? [] : DEFAULT_AUDIT_FIELDS)]);
  const actual = changedFields(before, after);
  const unexpected = actual.filter((field) => !allowed.has(field));
  assert.deepEqual(unexpected, [], `Unexpected changed fields: ${unexpected.join(", ") || "none"}`);
  if (options.requireAnyChange !== false) assert.ok(actual.length > 0, "Expected at least one changed field");
  return actual;
}

export function assertFieldsUnchanged(before, after, fields) {
  for (const field of fields) {
    assert.deepEqual(stable(after?.[field]), stable(before?.[field]), `Field changed unexpectedly: ${field}`);
  }
}

export function assertUndefinedPatchPreserves(before, patch, after) {
  for (const [field, value] of Object.entries(patch)) {
    if (value === undefined) assert.deepEqual(stable(after?.[field]), stable(before?.[field]), `Undefined patch changed field: ${field}`);
  }
}

export function assertNullPatchClears(patch, after) {
  for (const [field, value] of Object.entries(patch)) {
    if (value === null) assert.equal(after?.[field], null, `Null patch did not clear field: ${field}`);
  }
}

export function assertRollbackRestored(before, afterFailure, ignoredFields = []) {
  const ignored = new Set(ignoredFields);
  const beforeComparable = Object.fromEntries(Object.entries(before).filter(([key]) => !ignored.has(key)));
  const afterComparable = Object.fromEntries(Object.entries(afterFailure).filter(([key]) => !ignored.has(key)));
  assert.deepEqual(stable(afterComparable), stable(beforeComparable), "Rollback did not restore the original row");
}

export function assertTenantIsolation({ actorCompanyId, targetCompanyId, beforeTargetRows, afterTargetRows }) {
  assert.notEqual(actorCompanyId, targetCompanyId, "Tenant isolation test requires two different companies");
  assert.deepEqual(stable(afterTargetRows), stable(beforeTargetRows), `Target company ${targetCompanyId} data changed during actor company ${actorCompanyId} mutation`);
}
