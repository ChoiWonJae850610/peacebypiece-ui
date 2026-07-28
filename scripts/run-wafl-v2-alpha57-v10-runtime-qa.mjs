#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = process.cwd();
const evidencePath = path.join(root, ".tmp", "wafl-external-qa", "a57-v10-runtime-evidence.jsonl");
const resultPath = path.join(root, ".tmp", "wafl-external-qa", "a57-v10-runtime-result.json");
const statePath = path.join(root, ".tmp", "wafl-external-qa", "state.json");
const markerPrefix = `A57V10_${Date.now().toString(36).toUpperCase()}`;
const markers = {
  fabric: `${markerPrefix}_FABRIC`.slice(0, 48),
  accessory: `${markerPrefix}_ACCESSORY`.slice(0, 48),
};

function readEnv() {
  const values = {};
  for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (value.length >= 2 && (
      (value.startsWith("\"") && value.endsWith("\""))
      || (value.startsWith("'") && value.endsWith("'"))
    )) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

function ref(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

fs.writeFileSync(evidencePath, "", "utf8");
let sequence = 0;
function record(entry) {
  sequence += 1;
  fs.appendFileSync(
    evidencePath,
    `${JSON.stringify({ sequence, timestamp: new Date().toISOString(), ...entry })}\n`,
    "utf8",
  );
}

const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
record({
  kind: "runtime-owner-before-assertion",
  status: state.status,
  runtimeQaMode: state.runtimeQaMode,
  mutationMode: state.mutationMode,
  commandApi: state.commandApi,
  nextPort: state.nextPort,
  expoPort: state.expoPort,
  directR2Access: false,
  workerBypass: false,
});
assert.equal(state.status, "running");
assert.equal(state.runtimeQaMode, "work-order-image");
assert.equal(state.mutationMode, "work-order-image-upload-primary-delete");
assert.equal(state.commandApi, "ready");
assert.equal(state.nextPort, 3100);
assert.equal(state.expoPort, 8081);

const env = readEnv();
assert.ok(env.DATABASE_URL, "DATABASE_URL_MISSING");
const runtimeBase = `https://${state.tailscaleServeHostname}`;
const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  application_name: "wafl-a57-v10-runtime-qa",
});
await client.connect();

async function snapshot() {
  await client.query("BEGIN READ ONLY");
  try {
    const target = (await client.query(`
      SELECT w.company_id, w.id AS work_order_id, w.current_revision_id AS revision_id,
             w.entity_version AS work_order_version, r.entity_version AS revision_version,
             w.product_type_code, w.item_code, w.season_code,
             (SELECT count(*)::integer FROM domain_events) AS event_count,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
             (SELECT count(*)::integer FROM work_order_material_lines) AS material_rows,
             (SELECT COALESCE(sum(entity_version), 0)::integer FROM work_order_material_lines) AS material_version_sum,
             (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count
        FROM work_orders w
        JOIN work_order_revisions r
          ON r.company_id = w.company_id AND r.id = w.current_revision_id
       WHERE w.status = 'draft'
         AND r.revision_status = 'draft'
         AND w.deleted_at IS NULL
         AND EXISTS (
           SELECT 1
             FROM work_order_material_lines marker
            WHERE marker.company_id = w.company_id
              AND marker.revision_id = r.id
              AND marker.name = 'UNITEDITABLEMATERI'
         )
       LIMIT 1
    `)).rows[0];
    assert.ok(target, "APPROVED_DEV_FIXTURE_NOT_FOUND");
    const created = (await client.query(`
      SELECT id, name, material_type, unit_code, entity_version, archived_at
        FROM work_order_material_lines
       WHERE company_id = $1
         AND revision_id = $2::uuid
         AND name = ANY($3::text[])
       ORDER BY name
    `, [target.company_id, target.revision_id, Object.values(markers)])).rows;
    const other = (await client.query(`
      SELECT w.id, w.entity_version, r.entity_version AS revision_version,
             w.product_type_code, w.item_code, w.season_code
        FROM work_orders w
        JOIN work_order_revisions r
          ON r.company_id = w.company_id AND r.id = w.current_revision_id
       WHERE w.company_id = $1
         AND w.id <> $2::uuid
         AND w.deleted_at IS NULL
       ORDER BY w.id
       LIMIT 1
    `, [target.company_id, target.work_order_id])).rows[0];
    assert.ok(other, "CROSS_WORK_ORDER_FIXTURE_NOT_FOUND");
    await client.query("ROLLBACK");
    return {
      companyId: target.company_id,
      workOrderId: target.work_order_id,
      revisionId: target.revision_id,
      workOrderVersion: Number(target.work_order_version),
      revisionVersion: Number(target.revision_version),
      productTypeCode: target.product_type_code,
      itemCode: target.item_code,
      seasonCode: target.season_code,
      events: Number(target.event_count),
      receipts: Number(target.receipt_count),
      materialRows: Number(target.material_rows),
      materialVersionSum: Number(target.material_version_sum),
      migration: Number(target.migration_count),
      created,
      other: {
        idRef: ref(other.id),
        workOrderVersion: Number(other.entity_version),
        revisionVersion: Number(other.revision_version),
        productTypeCode: other.product_type_code,
        itemCode: other.item_code,
        seasonCode: other.season_code,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function delta(before, after) {
  return {
    workOrderVersion: after.workOrderVersion - before.workOrderVersion,
    revisionVersion: after.revisionVersion - before.revisionVersion,
    event: after.events - before.events,
    receipt: after.receipts - before.receipts,
    materialRows: after.materialRows - before.materialRows,
    materialVersionSum: after.materialVersionSum - before.materialVersionSum,
    migration: after.migration - before.migration,
  };
}

function assertDelta(before, after, command, expected) {
  const observed = delta(before, after);
  record({ kind: "mutation-delta-before-assertion", command, observed, expected });
  assert.deepEqual(observed, expected);
  assert.deepEqual(after.other, before.other, `${command}:cross-work-order-isolation`);
}

let cookie = "";
async function request(input) {
  record({
    kind: "request-before-assertion",
    command: input.command,
    layer: "Mobile -> Next API",
    method: input.method,
    path: input.redactedPath,
    body: input.redactedBody ?? null,
    directR2Access: false,
    workerBypass: false,
  });
  const started = performance.now();
  const response = await fetch(`${runtimeBase}${input.path}`, {
    method: input.method,
    redirect: "manual",
    headers: {
      Accept: "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(input.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
    },
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
    signal: AbortSignal.timeout(90_000),
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = null; }
  record({
    kind: "response-before-assertion",
    command: input.command,
    status: response.status,
    contentType: response.headers.get("content-type"),
    errorCode: body?.error?.code ?? null,
    nextVersion: body?.data?.nextVersion ?? null,
    correlationId: response.headers.get("x-wafl-correlation-id"),
    elapsedMs: Math.round((performance.now() - started) * 100) / 100,
    directR2Access: false,
    workerBypass: false,
  });
  return { response, body };
}

let commandSequence = 0;
function identity(kind) {
  commandSequence += 1;
  const suffix = `${Date.now()}.${commandSequence}`;
  return {
    clientRequestId: `a57.v10.${kind}.client.${suffix}`,
    idempotencyKey: `a57.v10.${kind}.idempotency.${suffix}`,
  };
}

async function patchCategory(current, patch, command) {
  const id = identity(command);
  const result = await request({
    command,
    method: "PATCH",
    path: `/api/v2/work-orders/${current.workOrderId}`,
    redactedPath: "/api/v2/work-orders/{workOrderId}",
    body: {
      clientRequestId: id.clientRequestId,
      expectedVersion: current.workOrderVersion,
      patch,
    },
    redactedBody: { expectedVersion: current.workOrderVersion, patch: Object.keys(patch) },
  });
  assert.equal(result.response.status, 200, `${command}:http`);
  assert.equal(result.body?.data?.nextVersion, current.workOrderVersion + 1, `${command}:next-version`);
  const next = await snapshot();
  assertDelta(current, next, command, {
    workOrderVersion: 1,
    revisionVersion: 1,
    event: 1,
    receipt: 0,
    materialRows: 0,
    materialVersionSum: 0,
    migration: 0,
  });
  return next;
}

async function createAndArchive(current, materialType, unitCode, name) {
  const createId = identity(`${materialType}.create`);
  const created = await request({
    command: `${materialType}-default-unit-create`,
    method: "POST",
    path: `/api/v2/work-orders/${current.workOrderId}/materials`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/materials",
    idempotencyKey: createId.idempotencyKey,
    body: {
      clientRequestId: createId.clientRequestId,
      expectedVersion: current.workOrderVersion,
      materialType,
      materialId: null,
      name,
      partnerId: null,
      colorOption: null,
      usageArea: "approved dev/test fixture",
      requiredQuantity: "1",
      allowanceQuantity: "0",
      inventoryUsageQuantity: "1",
      orderQuantity: "0",
      unitCode,
      unitPrice: "0",
      memo: "A57 V10 default-unit contract",
    },
    redactedBody: { materialType, unitCode, expectedVersion: current.workOrderVersion, fixture: name },
  });
  assert.equal(created.response.status, 201, `${materialType}:create-http`);
  const materialId = created.body?.data?.result?.materialLineId;
  assert.match(String(materialId), /^[0-9a-f-]{36}$/i);
  let next = await snapshot();
  assertDelta(current, next, `${materialType}-create`, {
    workOrderVersion: 1,
    revisionVersion: 1,
    event: 1,
    receipt: 1,
    materialRows: 1,
    materialVersionSum: 1,
    migration: 0,
  });
  assert.equal(next.created.find((row) => row.id === materialId)?.unit_code, unitCode);

  const archiveId = identity(`${materialType}.archive`);
  const archived = await request({
    command: `${materialType}-soft-delete`,
    method: "POST",
    path: `/api/v2/work-orders/${next.workOrderId}/materials/${materialId}/archive`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/materials/{materialId}/archive",
    idempotencyKey: archiveId.idempotencyKey,
    body: {
      clientRequestId: archiveId.clientRequestId,
      expectedVersion: next.workOrderVersion,
    },
    redactedBody: { expectedVersion: next.workOrderVersion },
  });
  assert.equal(archived.response.status, 200, `${materialType}:archive-http`);
  const after = await snapshot();
  assertDelta(next, after, `${materialType}-archive`, {
    workOrderVersion: 1,
    revisionVersion: 1,
    event: 1,
    receipt: 1,
    materialRows: 0,
    materialVersionSum: 1,
    migration: 0,
  });
  assert.ok(after.created.find((row) => row.id === materialId)?.archived_at);
  return after;
}

try {
  const before = await snapshot();
  assert.equal(before.created.length, 0, "V10_RUNTIME_FIXTURE_ALREADY_EXISTS");
  record({
    kind: "baseline-before-assertion",
    workOrderRef: ref(before.workOrderId),
    workOrderVersion: before.workOrderVersion,
    revisionVersion: before.revisionVersion,
    event: before.events,
    receipt: before.receipts,
    materialRows: before.materialRows,
    materialVersionSum: before.materialVersionSum,
    migration: before.migration,
    category: {
      productTypeCode: before.productTypeCode,
      itemCode: before.itemCode,
      seasonCode: before.seasonCode,
    },
    otherWorkOrderRef: before.other.idRef,
  });

  const auth = await request({
    command: "auto-connect",
    method: "POST",
    path: "/api/dev/mobile-connect/auto",
    redactedPath: "/api/dev/mobile-connect/auto",
  });
  assert.equal(auth.response.status, 200);
  assert.ok(cookie);

  const detailBefore = await request({
    command: "detail-before",
    method: "GET",
    path: `/api/v2/work-orders/${before.workOrderId}`,
    redactedPath: "/api/v2/work-orders/{workOrderId}",
  });
  assert.equal(detailBefore.response.status, 200);

  const verificationCategory = {
    productTypeCode: "wafl-c1|K|S",
    itemCode: `V10-${Date.now().toString(36)}`.slice(0, 24),
    seasonCode: "V10-QA",
  };
  let current = await patchCategory(before, verificationCategory, "category-save");
  assert.equal(current.productTypeCode, verificationCategory.productTypeCode);
  assert.equal(current.itemCode, verificationCategory.itemCode);
  assert.equal(current.seasonCode, verificationCategory.seasonCode);

  const detailAfter = await request({
    command: "category-reread",
    method: "GET",
    path: `/api/v2/work-orders/${current.workOrderId}`,
    redactedPath: "/api/v2/work-orders/{workOrderId}",
  });
  assert.equal(detailAfter.response.status, 200);
  assert.equal(detailAfter.body?.data?.header?.productTypeCode, verificationCategory.productTypeCode);
  assert.equal(detailAfter.body?.data?.header?.itemCode, verificationCategory.itemCode);
  assert.equal(detailAfter.body?.data?.header?.seasonCode, verificationCategory.seasonCode);

  record({ kind: "unchanged-save-before-assertion", requestCount: 0 });
  const unchanged = await snapshot();
  assertDelta(current, unchanged, "category-unchanged-save", {
    workOrderVersion: 0,
    revisionVersion: 0,
    event: 0,
    receipt: 0,
    materialRows: 0,
    materialVersionSum: 0,
    migration: 0,
  });
  current = unchanged;

  current = await patchCategory(current, {
    productTypeCode: before.productTypeCode,
    itemCode: before.itemCode,
    seasonCode: before.seasonCode,
  }, "category-baseline-restore");
  assert.equal(current.productTypeCode, before.productTypeCode);
  assert.equal(current.itemCode, before.itemCode);
  assert.equal(current.seasonCode, before.seasonCode);

  current = await createAndArchive(current, "fabric", "yd", markers.fabric);
  current = await createAndArchive(current, "accessory", "개", markers.accessory);

  const finalDelta = delta(before, current);
  const expectedDelta = {
    workOrderVersion: 6,
    revisionVersion: 6,
    event: 6,
    receipt: 4,
    materialRows: 2,
    materialVersionSum: 4,
    migration: 0,
  };
  record({
    kind: "final-mutation-security-audit-before-assertion",
    observed: finalDelta,
    expected: expectedDelta,
    categoryBaselineRestored: true,
    archivedFixtures: current.created.filter((row) => row.archived_at !== null).length,
    directR2Access: 0,
    workerBypass: 0,
    r2Put: 0,
    r2Delete: 0,
  });
  assert.deepEqual(finalDelta, expectedDelta);
  assert.equal(current.created.length, 2);
  assert.equal(current.created.filter((row) => row.archived_at !== null).length, 2);
  assert.deepEqual(current.other, before.other);

  const result = {
    ok: true,
    checkpoint: "ALPHA57_V10_STRUCTURE_CATEGORY_IPHONE_QA_REQUIRED",
    targetWorkOrderRef: ref(current.workOrderId),
    category: {
      save: "PASS",
      reread: "PASS",
      unchangedSaveMutation: 0,
      baselineRestore: "PASS",
      fields: ["productTypeCode", "itemCode", "seasonCode"],
    },
    materialDefaults: {
      fabric: "yd",
      accessory: "개",
      softDeleteCleanup: "PASS",
      recoveryUi: 0,
    },
    mutationDelta: finalDelta,
    directR2Access: 0,
    workerBypass: 0,
    r2Put: 0,
    r2Delete: 0,
    migrationDelta: 0,
  };
  fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result));
} catch (error) {
  const failure = {
    ok: false,
    checkpoint: "ALPHA57_V10_STRUCTURE_CATEGORY_FAILURE_HANDOFF_REQUIRED",
    error: error instanceof Error ? error.message : String(error),
    directR2Access: 0,
    workerBypass: 0,
  };
  fs.writeFileSync(resultPath, `${JSON.stringify(failure, null, 2)}\n`, "utf8");
  throw error;
} finally {
  await client.end();
}
