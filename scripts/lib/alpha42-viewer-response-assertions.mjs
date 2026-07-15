import assert from "node:assert/strict";

export const ALPHA42_ZERO_CALL_COMPLETION_BUDGET = Object.freeze({
  apiRequest: 0,
  databaseQuery: 0,
  databaseMutation: 0,
  pdfGet: 0,
  r2Put: 0,
  r2Delete: 0,
  tokenAccessUpdate: 0,
  eventInsert: 0,
});

export const ALPHA42_STORED_COMPANY_B_RESPONSE = Object.freeze({
  status: 404,
  body: Object.freeze({
    ok: false,
    message: "The requested resource was not found.",
    code: "WAFL_NOT_FOUND",
  }),
});

export const ALPHA42_COMPANY_H_RESOURCE_HIDING_FIXTURE = Object.freeze({
  status: 404,
  body: Object.freeze({
    ok: false,
    message: "The requested resource was not found.",
    code: "WAFL_NOT_FOUND",
  }),
});

export const ALPHA42_COMPANY_C_FORBIDDEN_FIXTURE = Object.freeze({
  status: 403,
  body: Object.freeze({
    ok: false,
    error: "COMPANY_APPROVAL_PENDING",
    code: "COMPANY_APPROVAL_PENDING",
    reason: "approval_pending",
    accessBlocked: true,
  }),
});

const FORBIDDEN_IDENTITY_KEYS = new Set([
  "generatedDocumentId",
  "workOrderId",
  "revisionId",
  "storageObjectKey",
  "storage_object_key",
  "signedUrl",
  "signed_url",
  "tokenHash",
  "token_hash",
]);

function assertNoInternalIdentity(value, forbiddenValues = []) {
  const serialized = JSON.stringify(value);
  for (const forbidden of forbiddenValues.filter(Boolean)) {
    assert.equal(serialized.includes(String(forbidden)), false, "negative-response-identity-leak");
  }
  const visit = (current) => {
    if (!current || typeof current !== "object") return;
    for (const [key, child] of Object.entries(current)) {
      assert.equal(FORBIDDEN_IDENTITY_KEYS.has(key), false, `negative-response-internal-key:${key}`);
      visit(child);
    }
  };
  visit(value);
}

export function assertPublicViewerNotFoundResponse(result, forbiddenValues = []) {
  assert.equal(result?.status, 404, "public-viewer-not-found-status");
  assert.equal(result?.body?.error?.code, "NOT_FOUND", "public-viewer-not-found-code");
  assert.equal(Object.hasOwn(result?.body ?? {}, "code"), false, "public-viewer-workspace-shape-forbidden");
  assertNoInternalIdentity(result.body, forbiddenValues);
}

export function assertWorkspaceNotFoundResponse(result, forbiddenValues = []) {
  assert.equal(result?.status, 404, "workspace-not-found-status");
  assert.equal(result?.body?.code, "WAFL_NOT_FOUND", "workspace-not-found-code");
  assert.equal(result?.body?.error?.code, undefined, "workspace-public-shape-forbidden");
  assertNoInternalIdentity(result.body, forbiddenValues);
}

export function assertWorkspaceForbiddenResponse(result, forbiddenValues = []) {
  assert.equal(result?.status, 403, "workspace-forbidden-status");
  assert.equal(result?.body?.code, "COMPANY_APPROVAL_PENDING", "workspace-forbidden-code");
  assert.equal(result?.body?.error, "COMPANY_APPROVAL_PENDING", "workspace-forbidden-error");
  assert.equal(result?.body?.reason, "approval_pending", "workspace-forbidden-reason");
  assert.equal(result?.body?.accessBlocked, true, "workspace-forbidden-flag");
  assertNoInternalIdentity(result.body, forbiddenValues);
}

export function assertAlpha42NegativeIsolationZeroBudget(actual) {
  assert.deepEqual(actual, ALPHA42_ZERO_CALL_COMPLETION_BUDGET, "negative-isolation-budget-mismatch");
}
