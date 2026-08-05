import assert from "node:assert/strict";

const SEMANTICS = new Set(["changed", "no-op", "rejected", "replay"]);
const DELTA_KEYS = ["workOrderVersion", "revisionVersion", "events", "receipts"];
const FIXTURE_CHILD_KEYS = ["sizes", "colors", "quantities", "specs", "materials", "accessories"];
export const ACCOUNTING_STEP_KEY_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export function normalizeCanonicalIntegerEvidence(value, label = "INTEGER_EVIDENCE") {
  let normalized;
  if (typeof value === "number") {
    normalized = value;
  } else if (typeof value === "string" && /^(?:0|[1-9][0-9]*)$/.test(value)) {
    normalized = Number(value);
  } else {
    throw new TypeError(`${label}_INVALID`);
  }
  if (!Number.isSafeInteger(normalized) || normalized < 0) {
    throw new TypeError(`${label}_INVALID`);
  }
  return normalized;
}

export function createEmptyCurrentRunAccountingEvidence() {
  return {
    steps: [],
    summary: {
      workOrderVersion: 0,
      revisionVersion: 0,
      events: 0,
      receipts: 0,
      changed: 0,
      noOp: 0,
      rejected: 0,
      replay: 0,
      steps: 0,
      priorFixtureIds: [],
      priorTemporaryMarker: null,
    },
  };
}

export const BASIC_INFO_PATCH_RECEIPT_CONTRACT = Object.freeze({
  commandCode: "work_order.patch_basic_info",
  idempotency: "client-request-id-without-command-receipt",
  replay: "not-supported",
  expectedDeltas: Object.freeze({
    workOrderVersion: 1,
    revisionVersion: 1,
    events: 1,
    receipts: 0,
  }),
  sourceBasis: Object.freeze([
    "PatchWorkOrderBasicInfoCommand extends VersionedWorkOrderCommand",
    "basic-info validation accepts clientRequestId without Idempotency-Key",
    "patchWorkOrderBasicInfoV2 appends domain event without command receipt",
    "alpha.46 retained save evidence records Event +1 and Receipt +0",
  ]),
});

function normalizedFixtureChildIds(value, label) {
  const result = {};
  for (const key of FIXTURE_CHILD_KEYS) {
    const ids = [...(value?.[key] ?? [])].map(String);
    assert.ok(ids.every(Boolean), `${label}_${key.toUpperCase()}_ID_REQUIRED`);
    assert.equal(new Set(ids).size, ids.length, `${label}_${key.toUpperCase()}_DUPLICATE_ID`);
    result[key] = ids;
  }
  return result;
}

export function validateImmutableFixtureOwnership(input) {
  const companyId = String(input?.companyId ?? "");
  const workOrderId = String(input?.workOrderId ?? "");
  const revisionId = String(input?.revisionId ?? "");
  const creationMarker = String(input?.creationMarker ?? "");
  const originalProductName = String(input?.originalProductName ?? "");
  assert.ok(companyId && workOrderId && revisionId, "FIXTURE_IMMUTABLE_IDENTITY_REQUIRED");
  assert.match(creationMarker, /^QA A59 picker drag isolated [0-9]{8}-[A-F0-9]{8}$/, "FIXTURE_CREATION_MARKER_INVALID");
  assert.equal(originalProductName, creationMarker, "FIXTURE_ORIGINAL_PRODUCT_NAME_MISMATCH");

  const current = {
    companyId: String(input?.current?.companyId ?? input?.current?.company_id ?? ""),
    workOrderId: String(input?.current?.workOrderId ?? input?.current?.id ?? ""),
    revisionId: String(input?.current?.revisionId ?? input?.current?.revision_id ?? ""),
    currentRevisionId: String(input?.current?.currentRevisionId ?? input?.current?.current_revision_id ?? ""),
    productName: String(input?.current?.productName ?? input?.current?.product_name ?? ""),
    status: String(input?.current?.status ?? ""),
    revisionStatus: String(input?.current?.revisionStatus ?? input?.current?.revision_status ?? ""),
  };
  assert.equal(current.companyId, companyId, "FIXTURE_COMPANY_OWNERSHIP_MISMATCH");
  assert.equal(current.workOrderId, workOrderId, "FIXTURE_WORK_ORDER_OWNERSHIP_MISMATCH");
  assert.equal(current.revisionId, revisionId, "FIXTURE_REVISION_OWNERSHIP_MISMATCH");
  assert.equal(current.currentRevisionId, revisionId, "FIXTURE_CURRENT_REVISION_MISMATCH");
  assert.equal(current.status, "draft", "FIXTURE_WORK_ORDER_NOT_DRAFT");
  assert.equal(current.revisionStatus, "draft", "FIXTURE_REVISION_NOT_DRAFT");

  const createdChildIds = normalizedFixtureChildIds(input?.createdChildIds, "FIXTURE_CREATED");
  const observedChildIds = normalizedFixtureChildIds(input?.observedChildIds, "FIXTURE_OBSERVED");
  for (const key of FIXTURE_CHILD_KEYS) {
    const created = new Set(createdChildIds[key]);
    assert.ok(
      observedChildIds[key].every((id) => created.has(id)),
      `FIXTURE_OBSERVED_${key.toUpperCase()}_NOT_RECORDED`,
    );
  }

  return {
    fixture: {
      companyId,
      workOrderId,
      revisionId,
      creationMarker,
      originalProductName,
      currentProductName: current.productName,
      productNameChanged: current.productName !== originalProductName,
      status: current.status,
      revisionStatus: current.revisionStatus,
      pass: true,
    },
    children: {
      createdIds: createdChildIds,
      observedIds: observedChildIds,
      duplicateCount: 0,
      foreignIdCount: 0,
      pass: true,
    },
  };
}

export function createExactColorOrdinalQueue(input) {
  assert.ok(Array.isArray(input) && input.length > 0, "EXACT_COLOR_QUEUE_REQUIRED");
  const snapshot = input.map((entry, index) => {
    const displayName = String(entry?.displayName ?? "").trim();
    const hexValue = String(entry?.hexValue ?? "").trim();
    assert.ok(displayName.length > 0, "EXACT_COLOR_DISPLAY_NAME_REQUIRED");
    assert.match(hexValue, /^#[0-9A-F]{6}$/i, "EXACT_COLOR_HEX_INVALID");
    const ordinal = index + 1;
    const asciiToken = `exact-color-${ordinal}`;
    return Object.freeze({
      ordinal,
      displayName,
      hexValue,
      requestIdentityClass: asciiToken,
      stepKey: asciiToken,
    });
  });
  return Object.freeze(snapshot);
}

export function validateColorCleanupOwnership(input) {
  const companyId = String(input?.companyId ?? "");
  const workOrderId = String(input?.workOrderId ?? "");
  const revisionId = String(input?.revisionId ?? "");
  const fixtureMarker = String(input?.fixtureMarker ?? "");
  assert.ok(companyId && workOrderId && revisionId, "COLOR_CLEANUP_FIXTURE_IDENTITY_REQUIRED");
  assert.match(fixtureMarker, /^QA A59 picker drag isolated [0-9]{8}-[A-F0-9]{8}$/, "COLOR_CLEANUP_FIXTURE_MARKER_INVALID");

  const prefixSyntheticColorIds = [...(input?.prefixSyntheticColorIds ?? [])].map(String);
  const exactSequenceColors = [...(input?.exactSequenceColors ?? [])].map((entry) => ({
    id: String(entry?.id ?? ""),
    ordinal: Number(entry?.ordinal),
    stepKey: String(entry?.stepKey ?? ""),
    displayName: String(entry?.displayName ?? ""),
  }));
  const expectedPrefixCount = Number(input?.expectedPrefixCount);
  const expectedExactCount = Number(input?.expectedExactCount);
  assert.ok(Number.isSafeInteger(expectedPrefixCount) && expectedPrefixCount >= 0, "COLOR_CLEANUP_PREFIX_EXPECTED_COUNT_INVALID");
  assert.ok(Number.isSafeInteger(expectedExactCount) && expectedExactCount >= 0, "COLOR_CLEANUP_EXACT_EXPECTED_COUNT_INVALID");
  assert.equal(prefixSyntheticColorIds.length, expectedPrefixCount, "COLOR_CLEANUP_PREFIX_RECORDED_COUNT_MISMATCH");
  assert.equal(exactSequenceColors.length, expectedExactCount, "COLOR_CLEANUP_EXACT_RECORDED_COUNT_MISMATCH");

  const exactSequenceColorIds = exactSequenceColors.map((entry) => entry.id);
  const combinedIds = [...prefixSyntheticColorIds, ...exactSequenceColorIds];
  const uniqueIds = new Set(combinedIds);
  assert.ok(combinedIds.every(Boolean), "COLOR_CLEANUP_RECORDED_ID_REQUIRED");
  assert.equal(new Set(prefixSyntheticColorIds).size, prefixSyntheticColorIds.length, "COLOR_CLEANUP_PREFIX_DUPLICATE_ID");
  assert.equal(new Set(exactSequenceColorIds).size, exactSequenceColorIds.length, "COLOR_CLEANUP_EXACT_DUPLICATE_ID");
  assert.equal(uniqueIds.size, combinedIds.length, "COLOR_CLEANUP_SET_OVERLAP_OR_DUPLICATE");

  const colorRows = [...(input?.colorRows ?? [])].map((row) => ({
    id: String(row?.id ?? ""),
    companyId: String(row?.companyId ?? row?.company_id ?? ""),
    workOrderId: String(row?.workOrderId ?? row?.work_order_id ?? ""),
    revisionId: String(row?.revisionId ?? row?.revision_id ?? ""),
    displayName: String(row?.displayName ?? row?.display_name ?? ""),
  }));
  assert.equal(colorRows.length, combinedIds.length, "COLOR_CLEANUP_ROW_COUNT_MISMATCH");
  assert.equal(new Set(colorRows.map((row) => row.id)).size, colorRows.length, "COLOR_CLEANUP_ROW_DUPLICATE_ID");
  const rowsById = new Map(colorRows.map((row) => [row.id, row]));
  assert.ok(combinedIds.every((id) => rowsById.has(id)), "COLOR_CLEANUP_RECORDED_ROW_MISSING");
  const foreignRows = colorRows.filter((row) => (
    row.companyId !== companyId || row.workOrderId !== workOrderId || row.revisionId !== revisionId
  ));
  assert.equal(foreignRows.length, 0, "COLOR_CLEANUP_FOREIGN_OWNERSHIP");

  const prefixRows = prefixSyntheticColorIds.map((id) => rowsById.get(id));
  assert.ok(prefixRows.every((row) => /^A59-QA-COLOR-.+/.test(row.displayName)), "COLOR_CLEANUP_PREFIX_MARKER_MISMATCH");
  const expectedExactDisplayNames = ["화이트", "아이보리", "그레이"];
  assert.ok(exactSequenceColors.every((entry, index) => (
    entry.ordinal === index + 1
      && entry.stepKey === `exact-color-${index + 1}`
      && ACCOUNTING_STEP_KEY_PATTERN.test(entry.stepKey)
      && entry.displayName === expectedExactDisplayNames[index]
      && rowsById.get(entry.id)?.displayName === entry.displayName
      && !/^A59-QA-COLOR-/.test(entry.displayName)
  )), "COLOR_CLEANUP_EXACT_SEQUENCE_MAPPING_MISMATCH");

  return {
    fixture: { companyId, workOrderId, revisionId, marker: fixtureMarker },
    prefix: {
      ids: prefixSyntheticColorIds,
      rows: prefixRows.map((row) => ({ id: row.id, marker: row.displayName })),
      expectedCount: expectedPrefixCount,
      pass: true,
    },
    exactSequence: {
      ids: exactSequenceColorIds,
      rows: exactSequenceColors,
      expectedCount: expectedExactCount,
      pass: true,
    },
    union: {
      ids: combinedIds,
      uniqueIdCount: uniqueIds.size,
      duplicateCount: combinedIds.length - uniqueIds.size,
      foreignIdCount: foreignRows.length,
      pass: true,
    },
  };
}

function normalizedState(value, label) {
  assert.ok(value && typeof value === "object", `${label}_STATE_REQUIRED`);
  return Object.fromEntries(DELTA_KEYS.map((key) => {
    const number = Number(value[key]);
    assert.ok(Number.isSafeInteger(number) && number >= 0, `${label}_${key}_INVALID`);
    return [key, number];
  }));
}

function normalizedDeltas(value) {
  assert.ok(value && typeof value === "object", "EXPECTED_DELTAS_REQUIRED");
  return Object.fromEntries(DELTA_KEYS.map((key) => {
    const number = Number(value[key]);
    assert.ok(Number.isSafeInteger(number) && number >= 0, `EXPECTED_${key}_DELTA_INVALID`);
    return [key, number];
  }));
}

function sameOrder(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function semanticFromEvidence({ httpStatus, replay, deltas }) {
  if (httpStatus >= 400) return "rejected";
  if (replay) return "replay";
  if (DELTA_KEYS.every((key) => deltas[key] === 0)) return "no-op";
  if (deltas.workOrderVersion === 1
    && deltas.revisionVersion === 1
    && deltas.events === 1
    && new Set([0, 1]).has(deltas.receipts)) return "changed";
  return "invalid";
}

export function validateAccountingStep(input) {
  assert.match(String(input?.key ?? ""), ACCOUNTING_STEP_KEY_PATTERN, "ACCOUNTING_STEP_KEY_INVALID");
  assert.ok(SEMANTICS.has(input.expectedSemantic), "EXPECTED_SEMANTIC_INVALID");
  assert.ok(Number.isSafeInteger(input.httpStatus) && input.httpStatus >= 100 && input.httpStatus <= 599, "HTTP_STATUS_INVALID");
  const before = normalizedState(input.before, "BEFORE");
  const after = normalizedState(input.after, "AFTER");
  const expectedDeltas = normalizedDeltas(input.expectedDeltas);
  const deltas = Object.fromEntries(DELTA_KEYS.map((key) => [key, after[key] - before[key]]));
  const payloadOrder = Array.isArray(input.payloadOrder) ? [...input.payloadOrder].map(String) : [];
  const beforeOrder = Array.isArray(input.beforeOrder) ? [...input.beforeOrder].map(String) : [];
  const afterOrder = Array.isArray(input.afterOrder) ? [...input.afterOrder].map(String) : [];
  const actualSemantic = semanticFromEvidence({
    httpStatus: input.httpStatus,
    replay: input.replay === true,
    deltas,
  });
  const failures = [];

  if (actualSemantic !== input.expectedSemantic) failures.push("SEMANTIC_MISMATCH");
  for (const key of DELTA_KEYS) {
    if (deltas[key] !== expectedDeltas[key]) failures.push(`${key.toUpperCase()}_DELTA_MISMATCH`);
  }
  if (input.expectedSemantic === "changed" && input.httpStatus >= 300) failures.push("CHANGED_HTTP_NOT_SUCCESS");
  if (input.expectedSemantic === "no-op" && input.httpStatus >= 300) failures.push("NO_OP_HTTP_NOT_SUCCESS");
  if (input.expectedSemantic === "replay" && (input.httpStatus >= 300 || input.replay !== true)) failures.push("REPLAY_EVIDENCE_MISSING");
  if (input.expectedSemantic === "rejected" && input.httpStatus < 400) failures.push("REJECTED_HTTP_NOT_ERROR");

  const hasOrderEvidence = payloadOrder.length > 0 || beforeOrder.length > 0 || afterOrder.length > 0;
  if (hasOrderEvidence) {
    if (!(payloadOrder.length && beforeOrder.length && afterOrder.length)) failures.push("ORDER_EVIDENCE_INCOMPLETE");
    if (input.expectedSemantic === "changed") {
      if (sameOrder(payloadOrder, beforeOrder)) failures.push("CHANGED_PAYLOAD_MATCHES_CURRENT_ORDER");
      if (!sameOrder(payloadOrder, afterOrder)) failures.push("CHANGED_RESULT_ORDER_MISMATCH");
    }
    if (input.expectedSemantic === "no-op") {
      if (!sameOrder(payloadOrder, beforeOrder)) failures.push("NO_OP_PAYLOAD_DIFFERS_FROM_CURRENT_ORDER");
      if (!sameOrder(payloadOrder, afterOrder)) failures.push("NO_OP_RESULT_ORDER_MISMATCH");
    }
  }

  return {
    key: input.key,
    expectedSemantic: input.expectedSemantic,
    payloadOrder,
    before,
    after,
    deltas,
    httpResult: input.httpStatus,
    actualSemantic,
    contractBasis: input.contractBasis ?? null,
    pass: failures.length === 0,
    failures,
  };
}

export function summarizeValidatedStepLedger(steps) {
  assert.ok(Array.isArray(steps) && steps.length > 0, "ACCOUNTING_STEP_LEDGER_EMPTY");
  const failed = steps.filter((step) => step?.pass !== true);
  assert.equal(failed.length, 0, `UNVALIDATED_ACCOUNTING_STEP:${failed.map((step) => step?.key ?? "unknown").join(",")}`);
  const summary = {
    workOrderVersion: 0,
    revisionVersion: 0,
    events: 0,
    receipts: 0,
    changed: 0,
    noOp: 0,
    rejected: 0,
    replay: 0,
    steps: steps.length,
  };
  for (const step of steps) {
    for (const key of DELTA_KEYS) summary[key] += step.deltas[key];
    summary[step.actualSemantic === "no-op" ? "noOp" : step.actualSemantic] += 1;
  }
  return summary;
}
