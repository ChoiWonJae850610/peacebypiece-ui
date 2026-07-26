#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";

import { createInlineEditFinalizationController } from "../apps/mobile/lib/inlineEditFinalization.ts";
import {
  createMaterialMemoDisclosureModel,
  MATERIAL_MEMO_COMPACT_LINES,
} from "../apps/mobile/features/materials/materialMemoDisclosureModel.ts";
import { createMaterialHeaderPresentation } from "../apps/mobile/features/materials/materialHeaderLayoutModel.ts";
import { formatQuantityParts } from "../apps/mobile/lib/mobileDisplay.ts";

const { Client } = pg;

const AUTO_MARKER = "ALPHA55_AUTO_MATERIAL_ORDER_LIFECYCLE";
const DEVICE_MARKER = "ALPHA55_DEVICE_MATERIAL_ORDER_LIFECYCLE";
const ZERO_ORDER_MARKER = "ALPHA55_AUTO_ZERO_ORDER_LIFECYCLE";
const UNIT_LAYOUT_MARKER = "ALPHA55_UNIT_LAYOUT_EDITABLE_MATERIAL";
const HEADER_LAYOUT_MARKER = "UNITEDITABLEMATERI";
const WRITE_VERIFY_MARKER = "ALPHA55_AUTO_WRITE_VERIFY_MATERIAL";
const MEMO_IME_MARKER = "ALPHA55_AUTO_MEMO_IME_DISPLAY";
const RESULT_PATH = path.join(
  process.cwd(),
  ".tmp",
  "wafl-external-qa",
  "alpha55-material-order-runtime-result.json",
);
const ZERO_ORDER_RESULT_PATH = path.join(
  process.cwd(),
  ".tmp",
  "wafl-external-qa",
  "alpha55-zero-order-runtime-result.json",
);
const UNIT_LAYOUT_RESULT_PATH = path.join(
  process.cwd(),
  ".tmp",
  "wafl-external-qa",
  "alpha55-unit-layout-create-runtime-result.json",
);
const HEADER_LAYOUT_READ_RESULT_PATH = path.join(
  process.cwd(),
  ".tmp",
  "wafl-external-qa",
  "alpha55-header-layout-read-runtime-result.json",
);
const WRITE_VERIFY_RESULT_PATH = path.join(
  process.cwd(),
  ".tmp",
  "wafl-external-qa",
  "alpha55-write-save-create-runtime-result.json",
);
const MEMO_IME_RESULT_PATH = path.join(
  process.cwd(),
  ".tmp",
  "wafl-external-qa",
  "alpha55-memo-ime-display-runtime-result.json",
);
const RUNTIME_QA_MODES = new Set([
  "material-order-lifecycle",
  "zero-order",
  "unit-layout-create",
  "header-layout-readonly",
  "create-only-recovery",
  "memo-ime-display",
]);
const EXPECTED_BEFORE = Object.freeze({
  workOrderVersion: 44,
  revisionVersion: 44,
  materialVersionSum: 22,
  materialRows: 3,
  events: 77,
  receipts: 28,
  migrationLedger: 13,
  legacyCancelled: 2,
  autoVersion: 1,
  deviceVersion: 1,
  retainedOriginalVersionSum: 20,
});

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function shortRef(value) {
  return sha256(value).slice(0, 12);
}

function readDatabaseUrl() {
  const text = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  const line = text.split(/\r?\n/).find((candidate) => /^\s*DATABASE_URL\s*=/.test(candidate));
  assert.ok(line, "database-url-missing");
  let value = line.replace(/^\s*DATABASE_URL\s*=\s*/, "").trim();
  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value;
}

function readEnvValue(name) {
  const text = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  const matcher = new RegExp(`^\\s*${name}\\s*=`);
  const line = text.split(/\r?\n/).find((candidate) => matcher.test(candidate));
  if (!line) return "";
  let value = line.replace(new RegExp(`^\\s*${name}\\s*=\\s*`), "").trim();
  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value;
}

function assertRunnerState() {
  const statePath = path.join(process.cwd(), ".tmp", "wafl-external-qa", "state.json");
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(state.status, "running");
  assert.equal(state.commandApi, "ready");
  assert.equal(state.mutationMode, "material-order-request-cancel-complete");
  const expectedRoles = state.runtimeQaMode === "memo-ime-display"
    ? ["expo", "next", "tailscale-serve"]
    : ["cloudflared", "expo", "next", "tailscale-serve"];
  assert.deepEqual(
    state.processes.map((record) => record.role).sort(),
    expectedRoles,
  );
  if (state.runtimeQaMode === "memo-ime-display") {
    assert.equal(state.previewTransport, "tailscale-serve-internal");
    assert.equal(state.quickTunnelReady, false);
  }
  for (const record of state.processes) {
    const marker = JSON.parse(fs.readFileSync(record.markerPath, "utf8"));
    assert.equal(marker.ownerMarker, state.ownerMarker);
    assert.equal(marker.pid, record.pid);
    assert.equal(marker.role, record.role);
    assert.equal(marker.executablePath, record.executablePath);
    assert.equal(marker.startedAtUtc, record.startedAtUtc);
    process.kill(Number(record.pid), 0);
  }
  return state;
}

function assertReadOnlyRunnerState() {
  const statePath = path.join(process.cwd(), ".tmp", "wafl-external-qa", "state.json");
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(state.status, "running");
  assert.equal(state.commandApi, "blocked");
  assert.equal(state.mutationMode, "read-only");
  assert.equal(state.processes.length, 4);
  for (const record of state.processes) {
    const marker = JSON.parse(fs.readFileSync(record.markerPath, "utf8"));
    assert.equal(marker.ownerMarker, state.ownerMarker);
    assert.equal(marker.pid, record.pid);
    assert.equal(marker.role, record.role);
    assert.equal(marker.executablePath, record.executablePath);
    assert.equal(marker.startedAtUtc, record.startedAtUtc);
    process.kill(Number(record.pid), 0);
  }
  return state;
}

async function snapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const rows = (await client.query(`
      SELECT w.company_id, w.id AS work_order_id, w.current_revision_id AS revision_id,
             w.entity_version AS work_order_version, r.entity_version AS revision_version,
             (SELECT count(*)::integer FROM work_order_material_lines m
               WHERE m.company_id = w.company_id AND m.revision_id = r.id) AS material_rows,
             (SELECT COALESCE(sum(m.entity_version), 0)::integer FROM work_order_material_lines m
               WHERE m.company_id = w.company_id AND m.revision_id = r.id) AS material_version_sum,
             (SELECT COALESCE(sum(m.entity_version), 0)::integer FROM work_order_material_lines m
               WHERE m.company_id = w.company_id AND m.revision_id = r.id
                 AND m.name <> ALL($1::text[])) AS retained_original_version_sum,
             (SELECT count(*)::integer FROM domain_events) AS event_count,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
             (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count,
             (SELECT count(*)::integer FROM work_order_material_lines WHERE status = 'cancelled') AS legacy_cancelled
        FROM work_orders w
        JOIN work_order_revisions r
          ON r.company_id = w.company_id AND r.id = w.current_revision_id
       WHERE w.status = 'draft'
         AND r.revision_status = 'draft'
         AND w.deleted_at IS NULL
         AND EXISTS (
           SELECT 1 FROM work_order_material_lines marker
            WHERE marker.company_id = w.company_id
              AND marker.revision_id = r.id
              AND marker.name = $2
         )
       LIMIT 1
    `, [[AUTO_MARKER, DEVICE_MARKER], AUTO_MARKER])).rows;
    assert.equal(rows.length, 1, "alpha55-current-draft-target-count");
    const parent = rows[0];
    const markers = (await client.query(`
      SELECT id, name, status, entity_version, archived_at, requested_at, cancelled_at,
             completed_at, supplier_partner_id, required_quantity::text,
             allowance_quantity::text, inventory_usage_quantity::text,
             order_quantity::text, unit_code, unit_price::text, amount::text, memo
        FROM work_order_material_lines
       WHERE company_id = $1
         AND revision_id = $2::uuid
         AND name = ANY($3::text[])
       ORDER BY name, id
    `, [parent.company_id, parent.revision_id, [AUTO_MARKER, DEVICE_MARKER]])).rows;
    assert.equal(markers.length, 2, "alpha55-marker-count");
    const legacyRows = (await client.query(`
      SELECT m.id, m.entity_version, m.cancelled_at, m.requested_at, m.completed_at,
             w.entity_version AS work_order_version, r.entity_version AS revision_version
        FROM work_order_material_lines m
        JOIN work_order_revisions r
          ON r.company_id = m.company_id AND r.id = m.revision_id
        JOIN work_orders w
          ON w.company_id = r.company_id AND w.id = r.work_order_id
       WHERE m.status = 'cancelled'
       ORDER BY m.id
    `)).rows;
    await client.query("COMMIT");
    return {
      companyId: parent.company_id,
      workOrderId: parent.work_order_id,
      revisionId: parent.revision_id,
      workOrderVersion: Number(parent.work_order_version),
      revisionVersion: Number(parent.revision_version),
      materialRows: Number(parent.material_rows),
      materialVersionSum: Number(parent.material_version_sum),
      retainedOriginalVersionSum: Number(parent.retained_original_version_sum),
      events: Number(parent.event_count),
      receipts: Number(parent.receipt_count),
      migrationLedger: Number(parent.migration_count),
      legacyCancelled: Number(parent.legacy_cancelled),
      legacyFingerprint: sha256(JSON.stringify(legacyRows)),
      auto: markers.find((row) => row.name === AUTO_MARKER),
      device: markers.find((row) => row.name === DEVICE_MARKER),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function snapshotZeroOrder(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const rows = (await client.query(`
      SELECT w.company_id, w.id AS work_order_id, w.current_revision_id AS revision_id,
             w.entity_version AS work_order_version, r.entity_version AS revision_version,
             (SELECT count(*)::integer FROM work_order_material_lines m
               WHERE m.company_id=w.company_id AND m.revision_id=r.id) AS material_rows,
             (SELECT COALESCE(sum(m.entity_version),0)::integer FROM work_order_material_lines m
               WHERE m.company_id=w.company_id AND m.revision_id=r.id) AS material_version_sum,
             (SELECT COALESCE(sum(m.entity_version),0)::integer FROM work_order_material_lines m
               WHERE m.company_id=w.company_id AND m.revision_id=r.id AND m.name <> $1) AS non_zero_version_sum,
             (SELECT count(*)::integer FROM domain_events) AS event_count,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
             (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count,
             (SELECT count(*)::integer FROM work_order_material_lines WHERE status='cancelled') AS legacy_cancelled
        FROM work_orders w
        JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
       WHERE EXISTS (
         SELECT 1 FROM work_order_material_lines marker
          WHERE marker.company_id=w.company_id AND marker.revision_id=r.id AND marker.name=$1
       )
       LIMIT 1
    `, [ZERO_ORDER_MARKER])).rows;
    assert.equal(rows.length, 1, "zero-order-current-draft-target-count");
    const parent = rows[0];
    const markers = (await client.query(`
      SELECT id, name, status, entity_version, archived_at, requested_at, cancelled_at,
             completed_at, supplier_partner_id, required_quantity::text,
             allowance_quantity::text, inventory_usage_quantity::text,
             order_quantity::text, unit_code, unit_price::text, amount::text
        FROM work_order_material_lines
       WHERE company_id=$1 AND revision_id=$2::uuid
         AND name=ANY($3::text[])
       ORDER BY name, id
    `, [parent.company_id, parent.revision_id, [AUTO_MARKER, DEVICE_MARKER, ZERO_ORDER_MARKER]])).rows;
    assert.equal(markers.length, 3, "zero-order-marker-set");
    const legacyRows = (await client.query(`
      SELECT m.id, m.entity_version, m.cancelled_at, m.requested_at, m.completed_at,
             w.entity_version AS work_order_version, r.entity_version AS revision_version
        FROM work_order_material_lines m
        JOIN work_order_revisions r ON r.company_id=m.company_id AND r.id=m.revision_id
        JOIN work_orders w ON w.company_id=r.company_id AND w.id=r.work_order_id
       WHERE m.status='cancelled'
       ORDER BY m.id
    `)).rows;
    await client.query("COMMIT");
    return {
      companyId: parent.company_id,
      workOrderId: parent.work_order_id,
      revisionId: parent.revision_id,
      workOrderVersion: Number(parent.work_order_version),
      revisionVersion: Number(parent.revision_version),
      materialRows: Number(parent.material_rows),
      materialVersionSum: Number(parent.material_version_sum),
      nonZeroVersionSum: Number(parent.non_zero_version_sum),
      events: Number(parent.event_count),
      receipts: Number(parent.receipt_count),
      migrationLedger: Number(parent.migration_count),
      legacyCancelled: Number(parent.legacy_cancelled),
      legacyFingerprint: sha256(JSON.stringify(legacyRows)),
      auto: markers.find((row) => row.name === AUTO_MARKER),
      device: markers.find((row) => row.name === DEVICE_MARKER),
      zero: markers.find((row) => row.name === ZERO_ORDER_MARKER),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function assertZeroOrderBaseline(before) {
  assert.deepEqual({
    workOrderVersion: before.workOrderVersion,
    revisionVersion: before.revisionVersion,
    materialVersionSum: before.materialVersionSum,
    materialRows: before.materialRows,
    events: before.events,
    receipts: before.receipts,
    migrationLedger: before.migrationLedger,
    legacyCancelled: before.legacyCancelled,
  }, {
    workOrderVersion: 58,
    revisionVersion: 58,
    materialVersionSum: 36,
    materialRows: 4,
    events: 91,
    receipts: 35,
    migrationLedger: 13,
    legacyCancelled: 2,
  });
  assert.deepEqual([before.auto?.status, Number(before.auto?.entity_version)], ["completed", 6]);
  assert.deepEqual([before.device?.status, Number(before.device?.entity_version)], ["editing", 5]);
  assert.deepEqual([before.zero?.status, Number(before.zero?.entity_version)], ["editing", 1]);
  assert.equal(before.zero?.supplier_partner_id, null);
  assert.deepEqual([
    Number(before.zero?.required_quantity),
    Number(before.zero?.allowance_quantity),
    Number(before.zero?.inventory_usage_quantity),
    Number(before.zero?.order_quantity),
    Number(before.zero?.unit_price),
    Number(before.zero?.amount),
  ], [3, 0.5, 3.5, 0, 0, 0]);
  assert.equal(before.zero?.unit_code, "m");
  assert.equal(before.zero?.archived_at, null);
  assert.equal(before.nonZeroVersionSum, 35);
}

function assertZeroOrderStep(before, after) {
  assert.equal(after.workOrderVersion - before.workOrderVersion, 1);
  assert.equal(after.revisionVersion - before.revisionVersion, 1);
  assert.equal(after.materialVersionSum - before.materialVersionSum, 1);
  assert.equal(after.materialRows, before.materialRows);
  assert.equal(after.events - before.events, 1);
  assert.equal(after.receipts - before.receipts, 1);
  assert.equal(Number(after.zero.entity_version) - Number(before.zero.entity_version), 1);
  assert.equal(Number(after.auto.entity_version), Number(before.auto.entity_version));
  assert.equal(Number(after.device.entity_version), Number(before.device.entity_version));
  assert.equal(after.nonZeroVersionSum, before.nonZeroVersionSum);
  assert.equal(after.migrationLedger, before.migrationLedger);
  assert.equal(after.legacyCancelled, before.legacyCancelled);
  assert.equal(after.legacyFingerprint, before.legacyFingerprint);
}

function assertFixtureValues(row, marker) {
  assert.ok(row, `${marker}-missing`);
  assert.equal(row.name, marker);
  assert.equal(row.archived_at, null);
  assert.ok(row.supplier_partner_id);
  assert.equal(Number(row.required_quantity), 2);
  assert.equal(Number(row.allowance_quantity), 0.5);
  assert.equal(Number(row.inventory_usage_quantity), 0);
  assert.equal(Number(row.order_quantity), 2.5);
  assert.equal(row.unit_code, "m");
  assert.equal(Number(row.unit_price), 10_000);
  assert.equal(Number(row.amount), 25_000);
}

function assertBaseline(before) {
  assert.equal(before.workOrderVersion, EXPECTED_BEFORE.workOrderVersion);
  assert.equal(before.revisionVersion, EXPECTED_BEFORE.revisionVersion);
  assert.equal(before.materialVersionSum, EXPECTED_BEFORE.materialVersionSum);
  assert.equal(before.materialRows, EXPECTED_BEFORE.materialRows);
  assert.equal(before.events, EXPECTED_BEFORE.events);
  assert.equal(before.receipts, EXPECTED_BEFORE.receipts);
  assert.equal(before.migrationLedger, EXPECTED_BEFORE.migrationLedger);
  assert.equal(before.legacyCancelled, EXPECTED_BEFORE.legacyCancelled);
  assert.equal(Number(before.auto.entity_version), EXPECTED_BEFORE.autoVersion);
  assert.equal(Number(before.device.entity_version), EXPECTED_BEFORE.deviceVersion);
  assert.equal(before.retainedOriginalVersionSum, EXPECTED_BEFORE.retainedOriginalVersionSum);
  assert.equal(before.auto.status, "editing");
  assert.equal(before.device.status, "editing");
  assert.equal(before.auto.requested_at, null);
  assert.equal(before.auto.cancelled_at, null);
  assert.equal(before.auto.completed_at, null);
  assertFixtureValues(before.auto, AUTO_MARKER);
  assertFixtureValues(before.device, DEVICE_MARKER);
}

function assertStepDelta(before, after, expected) {
  assert.equal(after.workOrderVersion - before.workOrderVersion, 1);
  assert.equal(after.revisionVersion - before.revisionVersion, 1);
  assert.equal(after.materialVersionSum - before.materialVersionSum, 1);
  assert.equal(after.materialRows, before.materialRows);
  assert.equal(after.events - before.events, 1);
  assert.equal(after.receipts - before.receipts, expected.receiptDelta);
  assert.equal(Number(after.auto.entity_version) - Number(before.auto.entity_version), 1);
  assert.equal(Number(after.device.entity_version), Number(before.device.entity_version));
  assert.equal(after.retainedOriginalVersionSum, before.retainedOriginalVersionSum);
  assert.equal(after.migrationLedger, before.migrationLedger);
  assert.equal(after.legacyCancelled, before.legacyCancelled);
  assert.equal(after.legacyFingerprint, before.legacyFingerprint);
}

async function readNewEventCodes(client, workOrderId, count) {
  await client.query("BEGIN READ ONLY");
  try {
    const rows = (await client.query(`
      SELECT command_code
        FROM domain_events
       WHERE entity_type = 'work_order' AND entity_id = $1::text
       ORDER BY occurred_at DESC, id DESC
       LIMIT $2
    `, [workOrderId, count])).rows.reverse();
    await client.query("COMMIT");
    return rows.map((row) => row.command_code);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function readCancelReceiptCount(client, companyId, workOrderId) {
  await client.query("BEGIN READ ONLY");
  try {
    const count = Number((await client.query(`
      SELECT count(*)::integer AS count
        FROM work_order_command_receipts
       WHERE company_id = $1
         AND work_order_id = $2::uuid
         AND command_code = 'work_order.material.order_cancel'
         AND result_revision_id IS NOT NULL
         AND result_entity_version IS NOT NULL
    `, [companyId, workOrderId])).rows[0]?.count ?? 0);
    await client.query("COMMIT");
    return count;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function commandId(kind) {
  return `alpha55-auto-${kind}-${crypto.randomUUID()}`;
}

async function run() {
  const state = assertRunnerState();
  const client = new Client({
    connectionString: readDatabaseUrl(),
    application_name: "wafl-alpha55-material-order-runtime-qa",
  });
  await client.connect();
  let cookie = "";
  const requestLedger = [];

  async function jsonRequest(route, options = {}) {
    const response = await fetch(`https://${state.tailscaleServeHostname}${route}`, {
      method: options.method ?? "GET",
      redirect: "manual",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(45_000),
    });
    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`invalid-json-response:${response.status}`);
    }
    if (options.command) {
      requestLedger.push({
        command: options.command,
        method: options.method,
        status: response.status,
      });
    }
    return { response, body };
  }

  try {
    const before = await snapshot(client);
    assertBaseline(before);

    const authBefore = await jsonRequest("/api/auth/me");
    assert.equal(authBefore.response.status, 401);
    const autoConnect = await jsonRequest("/api/dev/mobile-connect/auto", { method: "POST" });
    assert.equal(autoConnect.response.status, 200);
    assert.equal(autoConnect.body?.connected, true);
    assert.ok(cookie);
    const me = await jsonRequest("/api/auth/me");
    assert.equal(me.response.status, 200);
    assert.equal(me.body?.authenticated, true);
    assert.equal(me.body?.user?.companyId, before.companyId);
    for (const permission of ["workorder.update", "material.order.request", "material.order.place"]) {
      assert.ok(me.body?.user?.permissionCodes?.includes(permission), `permission-missing:${permission}`);
    }

    const materialBasePath = `/api/v2/work-orders/${before.workOrderId}/materials/${before.auto.id}`;
    const materialListPath = `/api/v2/work-orders/${before.workOrderId}/materials?type=fabric&lifecycle=active&limit=30`;
    let current = before;

    const requestResult = await jsonRequest(`${materialBasePath}/order-request`, {
      method: "POST",
      command: "request",
      idempotencyKey: commandId("request"),
      body: {
        clientRequestId: commandId("request-client"),
        expectedVersion: current.workOrderVersion,
      },
    });
    assert.equal(requestResult.response.status, 200);
    assert.equal(requestResult.body?.data?.result?.status, "requested");
    let next = await snapshot(client);
    assertStepDelta(current, next, { receiptDelta: 1 });
    assert.equal(next.auto.status, "requested");
    assert.ok(next.auto.requested_at);
    const requestedRead = await jsonRequest(materialListPath);
    const requestedLine = requestedRead.body?.data?.items?.find((item) => item.id === next.auto.id);
    assert.equal(requestedLine?.status, "requested");
    assert.equal(requestedLine?.editable, false);
    assert.equal(requestedLine?.locked, true);
    current = next;

    const cancelResult = await jsonRequest(`${materialBasePath}/order-cancel`, {
      method: "POST",
      command: "cancel",
      idempotencyKey: commandId("cancel"),
      body: {
        clientRequestId: commandId("cancel-client"),
        expectedVersion: current.workOrderVersion,
        reason: "alpha.55 automated lifecycle cancellation",
      },
    });
    assert.equal(cancelResult.response.status, 200);
    assert.equal(cancelResult.body?.data?.result?.status, "editing");
    next = await snapshot(client);
    assertStepDelta(current, next, { receiptDelta: 1 });
    assert.equal(next.auto.status, "editing");
    assert.ok(next.auto.cancelled_at);
    const cancellationTimestamp = String(next.auto.cancelled_at);
    const cancelledRead = await jsonRequest(materialListPath);
    const cancelledLine = cancelledRead.body?.data?.items?.find((item) => item.id === next.auto.id);
    assert.equal(cancelledLine?.status, "editing");
    assert.equal(cancelledLine?.editable, true);
    assert.equal(cancelledLine?.locked, false);
    current = next;

    const patchResult = await jsonRequest(materialBasePath, {
      method: "PATCH",
      command: "controlled-edit",
      body: {
        clientRequestId: commandId("edit-client"),
        expectedVersion: current.workOrderVersion,
        patch: { memo: "ALPHA55 automated cancel-to-edit verification" },
      },
    });
    assert.equal(patchResult.response.status, 200);
    assert.equal(patchResult.body?.data?.result?.status, "editing");
    next = await snapshot(client);
    assertStepDelta(current, next, { receiptDelta: 0 });
    assert.equal(next.auto.memo, "ALPHA55 automated cancel-to-edit verification");
    assert.equal(String(next.auto.cancelled_at), cancellationTimestamp);
    current = next;

    const rerequestResult = await jsonRequest(`${materialBasePath}/order-request`, {
      method: "POST",
      command: "re-request",
      idempotencyKey: commandId("re-request"),
      body: {
        clientRequestId: commandId("re-request-client"),
        expectedVersion: current.workOrderVersion,
      },
    });
    assert.equal(rerequestResult.response.status, 200);
    assert.equal(rerequestResult.body?.data?.result?.status, "requested");
    next = await snapshot(client);
    assertStepDelta(current, next, { receiptDelta: 1 });
    assert.equal(next.auto.status, "requested");
    assert.equal(String(next.auto.cancelled_at), cancellationTimestamp);
    current = next;

    const completeResult = await jsonRequest(`${materialBasePath}/order-complete`, {
      method: "POST",
      command: "complete",
      idempotencyKey: commandId("complete"),
      body: {
        clientRequestId: commandId("complete-client"),
        expectedVersion: current.workOrderVersion,
      },
    });
    assert.equal(completeResult.response.status, 200);
    assert.equal(completeResult.body?.data?.result?.status, "completed");
    next = await snapshot(client);
    assertStepDelta(current, next, { receiptDelta: 1 });
    assert.equal(next.auto.status, "completed");
    assert.ok(next.auto.completed_at);
    assert.equal(String(next.auto.cancelled_at), cancellationTimestamp);
    const completedRead = await jsonRequest(materialListPath);
    const completedLine = completedRead.body?.data?.items?.find((item) => item.id === next.auto.id);
    assert.equal(completedLine?.status, "completed");
    assert.equal(completedLine?.editable, false);
    assert.equal(completedLine?.locked, true);

    assert.equal(next.workOrderVersion, 49);
    assert.equal(next.revisionVersion, 49);
    assert.equal(next.materialVersionSum, 27);
    assert.equal(next.events, 82);
    assert.equal(next.receipts, 32);
    assert.equal(Number(next.auto.entity_version), 6);
    assert.equal(Number(next.device.entity_version), 1);
    assert.equal(next.device.status, "editing");
    assert.equal(next.retainedOriginalVersionSum, 20);
    assert.equal(next.legacyCancelled, 2);
    assert.equal(next.legacyFingerprint, before.legacyFingerprint);
    assert.deepEqual(requestLedger.map((entry) => entry.command), [
      "request",
      "cancel",
      "controlled-edit",
      "re-request",
      "complete",
    ]);
    assert.ok(requestLedger.every((entry) => entry.status === 200));

    const eventCodes = await readNewEventCodes(client, before.workOrderId, 5);
    assert.deepEqual(eventCodes, [
      "work_order.material.order_request",
      "work_order.material.order_cancel",
      "work_order.material.patch",
      "work_order.material.order_request",
      "work_order.material.order_complete",
    ]);
    assert.equal(await readCancelReceiptCount(client, before.companyId, before.workOrderId), 1);

    const result = {
      status: "ALPHA55_AUTOMATED_MATERIAL_ORDER_LIFECYCLE_RUNTIME_PASS",
      actualKst: new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Seoul",
        dateStyle: "short",
        timeStyle: "medium",
        hour12: false,
      }).format(new Date()),
      workOrderRef: shortRef(before.workOrderId),
      automatedFixture: {
        marker: AUTO_MARKER,
        materialRef: shortRef(before.auto.id),
        initialState: "editing",
        finalState: "completed",
        finalVersion: Number(next.auto.entity_version),
      },
      deviceFixture: {
        marker: DEVICE_MARKER,
        materialRef: shortRef(before.device.id),
        state: next.device.status,
        version: Number(next.device.entity_version),
      },
      before: {
        workOrderVersion: before.workOrderVersion,
        revisionVersion: before.revisionVersion,
        materialVersionSum: before.materialVersionSum,
        events: before.events,
        receipts: before.receipts,
      },
      after: {
        workOrderVersion: next.workOrderVersion,
        revisionVersion: next.revisionVersion,
        materialVersionSum: next.materialVersionSum,
        events: next.events,
        receipts: next.receipts,
      },
      actionDelta: {
        request: { workOrder: 1, revision: 1, material: 1, event: 1, receipt: 1 },
        cancel: { workOrder: 1, revision: 1, material: 1, event: 1, receipt: 1 },
        controlledEdit: { workOrder: 1, revision: 1, material: 1, event: 1, receipt: 0 },
        rerequest: { workOrder: 1, revision: 1, material: 1, event: 1, receipt: 1 },
        complete: { workOrder: 1, revision: 1, material: 1, event: 1, receipt: 1 },
      },
      legacyCancelledUnchanged: true,
      newCancelledRows: 0,
      duplicateAutomaticUnknownMutation: 0,
      archiveDeleteRestoreMutation: 0,
      productionMutation: 0,
      requestLedger,
    };
    fs.writeFileSync(RESULT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(result));
  } finally {
    await client.end();
  }
}

async function runZeroOrder() {
  const state = assertRunnerState();
  const client = new Client({
    connectionString: readDatabaseUrl(),
    application_name: "wafl-alpha55-zero-order-runtime-qa",
  });
  await client.connect();
  let cookie = "";
  const requestLedger = [];

  async function jsonRequest(route, options = {}) {
    const response = await fetch(`https://${state.tailscaleServeHostname}${route}`, {
      method: options.method ?? "GET",
      redirect: "manual",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(45_000),
    });
    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
    const text = await response.text();
    const body = JSON.parse(text);
    if (options.command) requestLedger.push({ command: options.command, method: options.method, status: response.status });
    return { response, body };
  }

  try {
    const before = await snapshotZeroOrder(client);
    assertZeroOrderBaseline(before);
    const authBefore = await jsonRequest("/api/auth/me");
    assert.equal(authBefore.response.status, 401);
    const autoConnect = await jsonRequest("/api/dev/mobile-connect/auto", { method: "POST" });
    assert.equal(autoConnect.response.status, 200);
    assert.equal(autoConnect.body?.connected, true);
    assert.ok(cookie);
    const me = await jsonRequest("/api/auth/me");
    assert.equal(me.response.status, 200);
    assert.equal(me.body?.user?.companyId, before.companyId);

    const materialBasePath = `/api/v2/work-orders/${before.workOrderId}/materials/${before.zero.id}`;
    const materialListPath = `/api/v2/work-orders/${before.workOrderId}/materials?type=fabric&lifecycle=active&limit=30`;
    let current = before;

    const request = await jsonRequest(`${materialBasePath}/order-request`, {
      method: "POST",
      command: "request",
      idempotencyKey: commandId("zero-request"),
      body: { clientRequestId: commandId("zero-request-client"), expectedVersion: current.workOrderVersion },
    });
    assert.equal(request.response.status, 200);
    assert.equal(request.body?.data?.result?.status, "requested");
    let next = await snapshotZeroOrder(client);
    assertZeroOrderStep(current, next);
    assert.equal(next.zero.status, "requested");
    assert.ok(next.zero.requested_at);
    const requestedRead = await jsonRequest(materialListPath);
    const requestedLine = requestedRead.body?.data?.items?.find((item) => item.id === next.zero.id);
    assert.deepEqual([requestedLine?.status, requestedLine?.editable, requestedLine?.locked], ["requested", false, true]);
    current = next;

    const cancel = await jsonRequest(`${materialBasePath}/order-cancel`, {
      method: "POST",
      command: "cancel",
      idempotencyKey: commandId("zero-cancel"),
      body: {
        clientRequestId: commandId("zero-cancel-client"),
        expectedVersion: current.workOrderVersion,
        reason: "alpha.55 automated stock-covered zero-order cancellation",
      },
    });
    assert.equal(cancel.response.status, 200);
    assert.equal(cancel.body?.data?.result?.status, "editing");
    next = await snapshotZeroOrder(client);
    assertZeroOrderStep(current, next);
    assert.equal(next.zero.status, "editing");
    assert.ok(next.zero.cancelled_at);
    const cancellationTimestamp = String(next.zero.cancelled_at);
    const cancelledRead = await jsonRequest(materialListPath);
    const cancelledLine = cancelledRead.body?.data?.items?.find((item) => item.id === next.zero.id);
    assert.deepEqual([cancelledLine?.status, cancelledLine?.editable, cancelledLine?.locked], ["editing", true, false]);
    current = next;

    const rerequest = await jsonRequest(`${materialBasePath}/order-request`, {
      method: "POST",
      command: "re-request",
      idempotencyKey: commandId("zero-re-request"),
      body: { clientRequestId: commandId("zero-re-request-client"), expectedVersion: current.workOrderVersion },
    });
    assert.equal(rerequest.response.status, 200);
    assert.equal(rerequest.body?.data?.result?.status, "requested");
    next = await snapshotZeroOrder(client);
    assertZeroOrderStep(current, next);
    assert.equal(String(next.zero.cancelled_at), cancellationTimestamp);
    current = next;

    const complete = await jsonRequest(`${materialBasePath}/order-complete`, {
      method: "POST",
      command: "complete",
      idempotencyKey: commandId("zero-complete"),
      body: { clientRequestId: commandId("zero-complete-client"), expectedVersion: current.workOrderVersion },
    });
    assert.equal(complete.response.status, 200);
    assert.equal(complete.body?.data?.result?.status, "completed");
    next = await snapshotZeroOrder(client);
    assertZeroOrderStep(current, next);
    assert.equal(next.zero.status, "completed");
    assert.ok(next.zero.completed_at);
    assert.equal(String(next.zero.cancelled_at), cancellationTimestamp);
    const completedRead = await jsonRequest(materialListPath);
    const completedLine = completedRead.body?.data?.items?.find((item) => item.id === next.zero.id);
    assert.deepEqual([completedLine?.status, completedLine?.editable, completedLine?.locked], ["completed", false, true]);

    assert.deepEqual({
      workOrderVersion: next.workOrderVersion,
      revisionVersion: next.revisionVersion,
      materialVersionSum: next.materialVersionSum,
      events: next.events,
      receipts: next.receipts,
      zeroVersion: Number(next.zero.entity_version),
      zeroStatus: next.zero.status,
    }, {
      workOrderVersion: 62,
      revisionVersion: 62,
      materialVersionSum: 40,
      events: 95,
      receipts: 39,
      zeroVersion: 5,
      zeroStatus: "completed",
    });
    assert.deepEqual(requestLedger.map((entry) => entry.command), ["request", "cancel", "re-request", "complete"]);
    assert.ok(requestLedger.every((entry) => entry.status === 200));
    assert.deepEqual(await readNewEventCodes(client, before.workOrderId, 4), [
      "work_order.material.order_request",
      "work_order.material.order_cancel",
      "work_order.material.order_request",
      "work_order.material.order_complete",
    ]);
    assert.equal(await readCancelReceiptCount(client, before.companyId, before.workOrderId), 3);

    const result = {
      status: "ALPHA55_AUTOMATED_ZERO_ORDER_LIFECYCLE_RUNTIME_PASS",
      actualKst: new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Seoul",
        dateStyle: "short",
        timeStyle: "medium",
        hour12: false,
      }).format(new Date()),
      workOrderRef: shortRef(before.workOrderId),
      zeroOrderFixture: {
        marker: ZERO_ORDER_MARKER,
        materialRef: shortRef(before.zero.id),
        initialState: "editing",
        finalState: "completed",
        finalVersion: Number(next.zero.entity_version),
      },
      fixtureA: { state: next.auto.status, version: Number(next.auto.entity_version) },
      fixtureB: { state: next.device.status, version: Number(next.device.entity_version) },
      before: {
        workOrderVersion: before.workOrderVersion,
        revisionVersion: before.revisionVersion,
        materialVersionSum: before.materialVersionSum,
        events: before.events,
        receipts: before.receipts,
      },
      after: {
        workOrderVersion: next.workOrderVersion,
        revisionVersion: next.revisionVersion,
        materialVersionSum: next.materialVersionSum,
        events: next.events,
        receipts: next.receipts,
      },
      actionDelta: {
        request: { workOrder: 1, revision: 1, material: 1, event: 1, receipt: 1 },
        cancel: { workOrder: 1, revision: 1, material: 1, event: 1, receipt: 1 },
        rerequest: { workOrder: 1, revision: 1, material: 1, event: 1, receipt: 1 },
        complete: { workOrder: 1, revision: 1, material: 1, event: 1, receipt: 1 },
      },
      legacyCancelledUnchanged: true,
      newCancelledRows: 0,
      duplicateAutomaticUnknownMutation: 0,
      archiveDeleteRestoreMutation: 0,
      productionMutation: 0,
      requestLedger,
    };
    fs.writeFileSync(ZERO_ORDER_RESULT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(result));
  } finally {
    await client.end();
  }
}

async function snapshotUnitLayout(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const parents = (await client.query(`
      SELECT w.company_id, w.id AS work_order_id, w.current_revision_id AS revision_id,
             w.entity_version AS work_order_version, r.entity_version AS revision_version,
             w.status AS work_order_status, r.revision_status,
             (SELECT count(*)::integer FROM work_order_material_lines m
               WHERE m.company_id=w.company_id AND m.revision_id=r.id) AS material_rows,
             (SELECT COALESCE(sum(m.entity_version),0)::integer FROM work_order_material_lines m
               WHERE m.company_id=w.company_id AND m.revision_id=r.id) AS material_version_sum,
             (SELECT count(*)::integer FROM domain_events) AS event_count,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
             (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count,
             (SELECT count(*)::integer FROM work_order_material_lines WHERE status='cancelled') AS legacy_cancelled
        FROM work_orders w
        JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
       WHERE EXISTS (
         SELECT 1 FROM work_order_material_lines marker
          WHERE marker.company_id=w.company_id
            AND marker.revision_id=r.id
            AND marker.name=$1
       )
       LIMIT 1
    `, [DEVICE_MARKER])).rows;
    assert.equal(parents.length, 1, "unit-layout-current-draft-target-count");
    const parent = parents[0];
    const markerRows = (await client.query(`
      SELECT id, name, status, entity_version, archived_at, unit_code,
             required_quantity::text, allowance_quantity::text,
             inventory_usage_quantity::text, order_quantity::text,
             unit_price::text, amount::text
        FROM work_order_material_lines
       WHERE company_id=$1 AND revision_id=$2::uuid AND name=$3
       ORDER BY id
    `, [parent.company_id, parent.revision_id, UNIT_LAYOUT_MARKER])).rows;
    const legacyRows = (await client.query(`
      SELECT id, entity_version, cancelled_at, requested_at, completed_at
        FROM work_order_material_lines
       WHERE status='cancelled'
       ORDER BY id
    `)).rows;
    await client.query("COMMIT");
    return {
      companyId: parent.company_id,
      workOrderId: parent.work_order_id,
      revisionId: parent.revision_id,
      workOrderVersion: Number(parent.work_order_version),
      revisionVersion: Number(parent.revision_version),
      workOrderStatus: parent.work_order_status,
      revisionStatus: parent.revision_status,
      materialRows: Number(parent.material_rows),
      materialVersionSum: Number(parent.material_version_sum),
      events: Number(parent.event_count),
      receipts: Number(parent.receipt_count),
      migrationLedger: Number(parent.migration_count),
      legacyCancelled: Number(parent.legacy_cancelled),
      legacyFingerprint: sha256(JSON.stringify(legacyRows)),
      markerRows,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function assertUnitLayoutDelta(before, after, expected) {
  assert.equal(after.workOrderVersion - before.workOrderVersion, 1);
  assert.equal(after.revisionVersion - before.revisionVersion, 1);
  assert.equal(after.materialVersionSum - before.materialVersionSum, 1);
  assert.equal(after.materialRows - before.materialRows, expected.materialRows);
  assert.equal(after.events - before.events, 1);
  assert.equal(after.receipts - before.receipts, expected.receipts);
  assert.equal(after.migrationLedger, before.migrationLedger);
  assert.equal(after.legacyCancelled, before.legacyCancelled);
  assert.equal(after.legacyFingerprint, before.legacyFingerprint);
}

async function runUnitLayoutCreate() {
  const state = assertRunnerState();
  const client = new Client({
    connectionString: readDatabaseUrl(),
    application_name: "wafl-alpha55-unit-layout-create-runtime-qa",
  });
  await client.connect();
  let cookie = "";
  const requestLedger = [];

  async function jsonRequest(route, options = {}) {
    const response = await fetch(`https://${state.tailscaleServeHostname}${route}`, {
      method: options.method ?? "GET",
      redirect: "manual",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(45_000),
    });
    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
    const text = await response.text();
    const body = JSON.parse(text);
    if (options.command) requestLedger.push({ command: options.command, method: options.method, status: response.status });
    return { response, body };
  }

  try {
    const before = await snapshotUnitLayout(client);
    assert.deepEqual({
      workOrderVersion: before.workOrderVersion,
      revisionVersion: before.revisionVersion,
      materialVersionSum: before.materialVersionSum,
      materialRows: before.materialRows,
      events: before.events,
      receipts: before.receipts,
      migrationLedger: before.migrationLedger,
      legacyCancelled: before.legacyCancelled,
    }, {
      workOrderVersion: 74,
      revisionVersion: 74,
      materialVersionSum: 52,
      materialRows: 4,
      events: 107,
      receipts: 47,
      migrationLedger: 13,
      legacyCancelled: 2,
    });
    assert.equal(before.workOrderStatus, "draft");
    assert.equal(before.revisionStatus, "draft");
    assert.equal(before.markerRows.length, 0, "unit-layout-marker-must-not-preexist");

    const authBefore = await jsonRequest("/api/auth/me");
    assert.equal(authBefore.response.status, 401);
    const autoConnect = await jsonRequest("/api/dev/mobile-connect/auto", { method: "POST" });
    assert.equal(autoConnect.response.status, 200);
    assert.equal(autoConnect.body?.connected, true);
    assert.ok(cookie);
    const me = await jsonRequest("/api/auth/me");
    assert.equal(me.response.status, 200);
    assert.equal(me.body?.user?.companyId, before.companyId);
    assert.ok(me.body?.user?.permissionCodes?.includes("workorder.update"));

    const materialCollectionPath = `/api/v2/work-orders/${before.workOrderId}/materials`;
    const create = await jsonRequest(materialCollectionPath, {
      method: "POST",
      command: "create",
      idempotencyKey: commandId("unit-layout-create"),
      body: {
        clientRequestId: commandId("unit-layout-create-client"),
        expectedVersion: before.workOrderVersion,
        materialType: "fabric",
        materialId: null,
        name: UNIT_LAYOUT_MARKER,
        partnerId: null,
        colorOption: "UNIT LAYOUT QA",
        usageArea: "retained synthetic unit layout verification",
        requiredQuantity: "2",
        allowanceQuantity: "0",
        inventoryUsageQuantity: "0",
        orderQuantity: "2",
        unitCode: "m",
        unitPrice: "10000",
        memo: "alpha.55 retained editable material for unit layout QA",
      },
    });
    assert.equal(create.response.status, 201);
    assert.equal(create.body?.ok, true);
    assert.equal(create.body?.data?.result?.status, "editing");
    assert.equal(create.body?.data?.result?.lineVersion, 1);
    assert.equal(create.body?.data?.result?.nextVersion, before.workOrderVersion + 1);
    const materialLineId = String(create.body?.data?.result?.materialLineId ?? "");
    assert.match(materialLineId, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    let current = await snapshotUnitLayout(client);
    assertUnitLayoutDelta(before, current, { materialRows: 1, receipts: 1 });
    assert.equal(current.markerRows.length, 1);
    assert.deepEqual([
      current.markerRows[0]?.id,
      current.markerRows[0]?.status,
      Number(current.markerRows[0]?.entity_version),
      current.markerRows[0]?.unit_code,
    ], [materialLineId, "editing", 1, "m"]);

    const patch = await jsonRequest(`${materialCollectionPath}/${materialLineId}`, {
      method: "PATCH",
      command: "unit-patch",
      body: {
        clientRequestId: commandId("unit-layout-patch-client"),
        expectedVersion: current.workOrderVersion,
        patch: { unitCode: "yd" },
      },
    });
    assert.equal(patch.response.status, 200);
    assert.equal(patch.body?.ok, true);
    assert.equal(patch.body?.data?.result?.status, "editing");
    assert.equal(patch.body?.data?.result?.lineVersion, 2);

    const after = await snapshotUnitLayout(client);
    assertUnitLayoutDelta(current, after, { materialRows: 0, receipts: 0 });
    assert.equal(after.markerRows.length, 1);
    assert.deepEqual([
      after.markerRows[0]?.id,
      after.markerRows[0]?.status,
      Number(after.markerRows[0]?.entity_version),
      after.markerRows[0]?.unit_code,
      Number(after.markerRows[0]?.required_quantity),
    ], [materialLineId, "editing", 2, "yd", 2]);
    assert.deepEqual(requestLedger, [
      { command: "create", method: "POST", status: 201 },
      { command: "unit-patch", method: "PATCH", status: 200 },
    ]);

    const list = await jsonRequest(`${materialCollectionPath}?type=fabric&lifecycle=active&limit=30`);
    assert.equal(list.response.status, 200);
    const line = list.body?.data?.items?.find((item) => item.id === materialLineId);
    assert.deepEqual([line?.name, line?.status, line?.editable, line?.locked, line?.unitCode], [
      UNIT_LAYOUT_MARKER,
      "editing",
      true,
      false,
      "yd",
    ]);

    const result = {
      status: "ALPHA55_MATERIAL_CREATE_UNIT_LAYOUT_RUNTIME_PASS",
      workOrderRef: shortRef(after.workOrderId),
      materialRef: shortRef(materialLineId),
      marker: UNIT_LAYOUT_MARKER,
      finalState: "editing",
      finalUnit: "yd",
      finalVersion: 2,
      baseline: {
        workOrderVersion: after.workOrderVersion,
        revisionVersion: after.revisionVersion,
        materialVersionSum: after.materialVersionSum,
        materialRows: after.materialRows,
        events: after.events,
        receipts: after.receipts,
      },
      delta: {
        workOrder: 2,
        revision: 2,
        materialVersion: 2,
        materialRows: 1,
        events: 2,
        receipts: 1,
      },
      requestLedger,
      legacyCancelledUnchanged: true,
      duplicateAutomaticUnknownMutation: 0,
      archiveDeleteRestoreMutation: 0,
      productionMutation: 0,
    };
    fs.writeFileSync(UNIT_LAYOUT_RESULT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(result));
  } finally {
    await client.end();
  }
}

function kstTimestamp() {
  return `${new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    dateStyle: "short",
    timeStyle: "medium",
    hour12: false,
  }).format(new Date())} +09:00`;
}

function createReadOnlySessionCookie(target) {
  const secret = readEnvValue("WAFL_SESSION_SECRET") || readEnvValue("GOOGLE_OAUTH_CLIENT_SECRET");
  assert.ok(secret, "header-read-session-secret-missing");
  const payload = {
    userId: target.user_id,
    companyId: target.company_id,
    companyMemberId: target.company_member_id,
    companyName: target.company_name,
    role: "company_admin",
    email: target.email,
    name: target.display_name || target.name,
    issuedAt: new Date().toISOString(),
    companyInvitationToken: null,
    googleSub: null,
    googlePictureUrl: null,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `wafl_auth_session=${encoded}.${signature}`;
}

async function snapshotHeaderLayoutRead(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const parents = (await client.query(`
      SELECT w.company_id, w.id AS work_order_id, w.current_revision_id AS revision_id,
             w.entity_version AS work_order_version, r.entity_version AS revision_version,
             (SELECT COALESCE(sum(m.entity_version),0)::integer
                FROM work_order_material_lines m
               WHERE m.company_id=w.company_id AND m.revision_id=r.id) AS material_version_sum,
             (SELECT count(*)::integer FROM domain_events) AS event_count,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
             (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count,
             (SELECT count(*)::integer FROM work_order_material_lines WHERE status='cancelled') AS legacy_cancelled
        FROM work_orders w
        JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
       WHERE EXISTS (
         SELECT 1 FROM work_order_material_lines marker
          WHERE marker.company_id=w.company_id
            AND marker.revision_id=r.id
            AND marker.name=$1
       )
       LIMIT 1
    `, [HEADER_LAYOUT_MARKER])).rows;
    assert.equal(parents.length, 1, "header-read-current-target-count");
    const parent = parents[0];
    const markerRows = (await client.query(`
      SELECT id, name, status, entity_version, archived_at, unit_code
        FROM work_order_material_lines
       WHERE company_id=$1 AND revision_id=$2::uuid AND name=$3
       ORDER BY id
    `, [parent.company_id, parent.revision_id, HEADER_LAYOUT_MARKER])).rows;
    const sessionTargets = (await client.query(`
      SELECT u.id AS user_id, c.id AS company_id, c.name AS company_name,
             cm.id AS company_member_id, u.email, u.name, cm.display_name
        FROM company_members cm
        JOIN users u ON u.id=cm.user_id
        JOIN companies c ON c.id=cm.company_id
       WHERE c.id='wafl-fn-company-a'
         AND c.is_active=true
         AND u.is_active=true
         AND cm.status='approved'
         AND cm.role_template_code='company_admin'
    `)).rows;
    await client.query("COMMIT");
    assert.equal(markerRows.length, 1, "header-read-marker-count");
    assert.equal(sessionTargets.length, 1, "header-read-session-target-count");
    return {
      companyId: parent.company_id,
      workOrderId: parent.work_order_id,
      revisionId: parent.revision_id,
      workOrderVersion: Number(parent.work_order_version),
      revisionVersion: Number(parent.revision_version),
      materialVersionSum: Number(parent.material_version_sum),
      events: Number(parent.event_count),
      receipts: Number(parent.receipt_count),
      migrationLedger: Number(parent.migration_count),
      legacyCancelled: Number(parent.legacy_cancelled),
      material: markerRows[0],
      sessionTarget: sessionTargets[0],
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function headerReadBaseline(snapshot) {
  return [
    snapshot.workOrderVersion,
    snapshot.revisionVersion,
    snapshot.materialVersionSum,
    snapshot.events,
    snapshot.receipts,
    snapshot.migrationLedger,
    snapshot.legacyCancelled,
  ];
}

function safeReadSummary(label, body, workOrderRef, materialRef) {
  if (!body || typeof body !== "object") return { kind: "non-json" };
  if (body.ok === false) {
    return {
      ok: false,
      errorCode: body.error?.code ?? null,
      retryable: body.error?.retryable ?? null,
    };
  }
  if (label === "list") {
    const items = body.data?.items ?? [];
    return {
      ok: body.ok === true,
      itemCount: items.length,
      hasMore: body.data?.hasMore ?? null,
      targetPresent: items.some((item) => shortRef(item.workOrderId) === workOrderRef),
    };
  }
  if (label === "detail") {
    return {
      ok: body.ok === true,
      workOrderRef: shortRef(body.data?.header?.id ?? ""),
      revisionRef: shortRef(body.data?.header?.currentRevisionId ?? ""),
      status: body.data?.header?.status ?? null,
      entityVersion: body.data?.header?.entityVersion ?? null,
    };
  }
  const items = body.data?.items ?? [];
  const line = items.find((item) => shortRef(item.id) === materialRef);
  return {
    ok: body.ok === true,
    itemCount: items.length,
    targetPresent: Boolean(line),
    target: line
      ? {
          name: line.name,
          status: line.status,
          unit: line.unitCode,
          editable: line.editable,
          locked: line.locked,
        }
      : null,
  };
}

async function runHeaderLayoutRead() {
  assertReadOnlyRunnerState();
  const client = new Client({
    connectionString: readDatabaseUrl(),
    application_name: "wafl-alpha55-header-layout-read-runtime-qa",
  });
  await client.connect();

  try {
    const before = await snapshotHeaderLayoutRead(client);
    assert.deepEqual(headerReadBaseline(before), [97, 97, 75, 130, 48, 13, 2]);
    assert.deepEqual([
      before.material.name,
      before.material.status,
      Number(before.material.entity_version),
      before.material.unit_code,
      before.material.archived_at,
      shortRef(before.material.id),
    ], [HEADER_LAYOUT_MARKER, "editing", 23, "yd", null, "87952ac12155"]);

    const cookie = createReadOnlySessionCookie(before.sessionTarget);
    const workOrderRef = shortRef(before.workOrderId);
    const materialRef = shortRef(before.material.id);
    const requestRecords = [];

    async function getOnce(label, route) {
      const startedKST = kstTimestamp();
      let response;
      let body = null;
      let timeout = false;
      let transportError = null;
      try {
        response = await fetch(`http://127.0.0.1:3100${route}`, {
          method: "GET",
          redirect: "manual",
          cache: "no-store",
          headers: { Accept: "application/json", Cookie: cookie },
          signal: AbortSignal.timeout(45_000),
        });
        const text = await response.text();
        try {
          body = JSON.parse(text);
        } catch {
          body = null;
        }
      } catch (error) {
        timeout = error?.name === "TimeoutError";
        transportError = error?.name ?? "Error";
      }
      const record = {
        request: label,
        path: route.replace(/\/api\/v2\/work-orders\/[^/]+/, `/api/v2/work-orders/<${workOrderRef}>`),
        method: "GET",
        startedKST,
        endedKST: kstTimestamp(),
        timeout,
        status: response?.status ?? null,
        contentType: response?.headers.get("content-type") ?? null,
        errorCode: body?.error?.code ?? null,
        correlationRef: response?.headers.get("x-wafl-correlation-id")
          ? shortRef(response.headers.get("x-wafl-correlation-id"))
          : null,
        bodySummary: safeReadSummary(label, body, workOrderRef, materialRef),
        transportError,
      };
      requestRecords.push(record);
      console.log(JSON.stringify(record));
      return { record, body };
    }

    const list = await getOnce("list", "/api/v2/work-orders?limit=50");
    const listedTarget = (list.body?.data?.items ?? [])
      .find((item) => shortRef(item.workOrderId) === workOrderRef);
    assert.ok(listedTarget, "header-read-list-target-missing-after-record");

    const currentWorkOrderId = listedTarget.workOrderId;
    const detail = await getOnce(
      "detail",
      `/api/v2/work-orders/${encodeURIComponent(currentWorkOrderId)}`,
    );
    const currentRevisionId = detail.body?.data?.header?.currentRevisionId;
    assert.ok(currentRevisionId, "header-read-detail-revision-missing-after-record");

    const materials = await getOnce(
      "materials",
      `/api/v2/work-orders/${encodeURIComponent(currentWorkOrderId)}/materials?type=fabric&lifecycle=active&limit=30`,
    );
    const after = await snapshotHeaderLayoutRead(client);
    const assertionInput = {
      statuses: requestRecords.map((record) => record.status),
      workOrderRef,
      revisionRef: shortRef(currentRevisionId),
      materialRef,
      dbBefore: headerReadBaseline(before),
      dbAfter: headerReadBaseline(after),
      mutationMethods: 0,
    };
    console.log(JSON.stringify({ assertionInput }));

    assert.deepEqual(assertionInput.statuses, [200, 200, 200]);
    assert.deepEqual(assertionInput.dbAfter, assertionInput.dbBefore);
    const line = materials.body?.data?.items?.find((item) => shortRef(item.id) === materialRef);
    assert.deepEqual([
      line?.name,
      line?.status,
      line?.unitCode,
      line?.editable,
      line?.locked,
    ], [HEADER_LAYOUT_MARKER, "editing", "yd", true, false]);

    const result = {
      status: "ALPHA55_MATERIAL_HEADER_LAYOUT_RUNTIME_READ_PASS",
      rootCause: "stale-read-diagnostic-query-shape",
      requests: requestRecords,
      workOrderRef,
      revisionRef: shortRef(currentRevisionId),
      materialRef,
      baseline: headerReadBaseline(after),
      dbDelta: [0, 0, 0, 0, 0],
      mutationMethods: 0,
      secretOutput: false,
      cookieOutput: false,
    };
    fs.writeFileSync(HEADER_LAYOUT_READ_RESULT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(result));
  } finally {
    await client.end();
  }
}

async function snapshotWriteVerify(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const parents = (await client.query(`
      SELECT w.company_id, w.id AS work_order_id, w.current_revision_id AS revision_id,
             w.entity_version AS work_order_version, r.entity_version AS revision_version,
             (SELECT count(*)::integer FROM work_order_material_lines m
               WHERE m.company_id=w.company_id AND m.revision_id=r.id) AS material_rows,
             (SELECT COALESCE(sum(m.entity_version),0)::integer FROM work_order_material_lines m
               WHERE m.company_id=w.company_id AND m.revision_id=r.id) AS material_version_sum,
             (SELECT count(*)::integer FROM domain_events) AS event_count,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
             (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count,
             (SELECT count(*)::integer FROM work_order_material_lines WHERE status='cancelled') AS legacy_cancelled
        FROM work_orders w
        JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
       WHERE EXISTS (
         SELECT 1 FROM work_order_material_lines marker
          WHERE marker.company_id=w.company_id
            AND marker.revision_id=r.id
            AND marker.name=$1
       )
       LIMIT 1
    `, [HEADER_LAYOUT_MARKER])).rows;
    assert.equal(parents.length, 1, "write-verify-parent-count");
    const parent = parents[0];
    const rows = (await client.query(`
      SELECT id, name, status, entity_version, archived_at, unit_code, memo
        FROM work_order_material_lines
       WHERE company_id=$1
         AND revision_id=$2::uuid
         AND name=ANY($3::text[])
       ORDER BY name, id
    `, [parent.company_id, parent.revision_id, [HEADER_LAYOUT_MARKER, WRITE_VERIFY_MARKER]])).rows;
    await client.query("COMMIT");
    return {
      companyId: parent.company_id,
      workOrderId: parent.work_order_id,
      revisionId: parent.revision_id,
      workOrderVersion: Number(parent.work_order_version),
      revisionVersion: Number(parent.revision_version),
      materialRows: Number(parent.material_rows),
      materialVersionSum: Number(parent.material_version_sum),
      events: Number(parent.event_count),
      receipts: Number(parent.receipt_count),
      migrationLedger: Number(parent.migration_count),
      legacyCancelled: Number(parent.legacy_cancelled),
      editable: rows.find((row) => row.name === HEADER_LAYOUT_MARKER),
      created: rows.filter((row) => row.name === WRITE_VERIFY_MARKER),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function writeVerifyBaseline(snapshot) {
  return [
    snapshot.workOrderVersion,
    snapshot.revisionVersion,
    snapshot.materialVersionSum,
    snapshot.materialRows,
    snapshot.events,
    snapshot.receipts,
    snapshot.migrationLedger,
    snapshot.legacyCancelled,
  ];
}

async function runCreateOnlyRecovery() {
  const state = assertRunnerState();
  const client = new Client({
    connectionString: readDatabaseUrl(),
    application_name: "wafl-alpha55-create-only-recovery-runtime-qa",
  });
  await client.connect();
  let cookie = "";
  const requestLedger = [];

  function kstTimestamp() {
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date()).replace(" ", "T") + "+09:00";
  }

  function safeResponseSummary(body) {
    if (body?.ok === true) {
      return {
        ok: true,
        resultStatus: body?.data?.result?.status ?? null,
        lineVersion: body?.data?.result?.lineVersion ?? null,
        hasMaterialLineId: typeof body?.data?.result?.materialLineId === "string",
      };
    }
    return {
      ok: false,
      errorCode: body?.error?.code ?? null,
      fieldErrorFields: Array.isArray(body?.error?.fieldErrors)
        ? body.error.fieldErrors.map((entry) => String(entry?.field ?? "")).filter(Boolean)
        : [],
    };
  }

  async function jsonRequest(route, options = {}) {
    const startedKst = kstTimestamp();
    try {
      const response = await fetch(`https://${state.tailscaleServeHostname}${route}`, {
        method: options.method ?? "GET",
        redirect: "manual",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
          ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: AbortSignal.timeout(45_000),
      });
      const setCookies = response.headers.getSetCookie?.() ?? [];
      if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
      const text = await response.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
      if (options.command) {
        requestLedger.push({
          requestKind: options.command,
          endpoint: options.endpointLabel,
          method: options.method,
          status: response.status,
          contentType: response.headers.get("content-type"),
          apiErrorCode: body?.error?.code ?? null,
          responseBodySummary: safeResponseSummary(body),
          idempotencyKeyPresent: Boolean(options.idempotencyKey),
          startedKst,
          endedKst: kstTimestamp(),
          timeout: false,
          statementCount: response.headers.get("x-wafl-command-statement-count"),
        });
      }
      return { response, body };
    } catch (error) {
      if (options.command) {
        requestLedger.push({
          requestKind: options.command,
          endpoint: options.endpointLabel,
          method: options.method,
          status: null,
          contentType: null,
          apiErrorCode: null,
          responseBodySummary: { ok: false, errorCode: null, fieldErrorFields: [] },
          idempotencyKeyPresent: Boolean(options.idempotencyKey),
          startedKst,
          endedKst: kstTimestamp(),
          timeout: error?.name === "TimeoutError" || error?.name === "AbortError",
          statementCount: null,
        });
      }
      throw error;
    }
  }

  try {
    const before = await snapshotWriteVerify(client);
    assert.deepEqual(writeVerifyBaseline(before), [99, 99, 77, 5, 132, 48, 13, 2]);
    assert.deepEqual([
      before.editable?.status,
      Number(before.editable?.entity_version),
      before.editable?.unit_code,
      before.editable?.memo,
      before.editable?.archived_at,
      shortRef(before.editable?.id),
      before.created.length,
    ], [
      "editing",
      25,
      "m",
      "alpha.55 controlled write runtime verified",
      null,
      "87952ac12155",
      0,
    ]);

    const auth = await jsonRequest("/api/dev/mobile-connect/auto", { method: "POST" });
    assert.equal(auth.response.status, 200);
    assert.equal(auth.body?.connected, true);
    assert.ok(cookie);

    const basePath = `/api/v2/work-orders/${before.workOrderId}/materials`;
    const createIdempotencyKey = "alpha55.write-create-recovery.v99.marker-v1";
    const create = await jsonRequest(basePath, {
      method: "POST",
      command: "material-create",
      endpointLabel: `/api/v2/work-orders/${shortRef(before.workOrderId)}/materials`,
      idempotencyKey: createIdempotencyKey,
      body: {
        clientRequestId: "alpha55.write-create-recovery.client.v99",
        expectedVersion: before.workOrderVersion,
        materialType: "fabric",
        materialId: null,
        name: WRITE_VERIFY_MARKER,
        partnerId: null,
        colorOption: "WRITE QA",
        usageArea: "retained alpha.55 controlled write verification",
        requiredQuantity: "2",
        allowanceQuantity: "0",
        inventoryUsageQuantity: "0",
        orderQuantity: "2",
        unitCode: "yd",
        unitPrice: "10000",
        memo: "alpha.55 retained controlled write create",
      },
    });
    fs.writeFileSync(WRITE_VERIFY_RESULT_PATH, `${JSON.stringify({
      status: "ALPHA55_CREATE_ONLY_RECOVERY_DIAGNOSTIC",
      requestLedger,
    }, null, 2)}\n`, "utf8");
    assert.equal(create.response.status, 201);
    assert.equal(create.body?.data?.result?.status, "editing");
    assert.equal(create.body?.data?.result?.lineVersion, 1);
    const createdId = String(create.body?.data?.result?.materialLineId ?? "");
    assert.match(createdId, /^[0-9a-f-]{36}$/i);

    const after = await snapshotWriteVerify(client);
    assert.deepEqual(writeVerifyBaseline(after), [100, 100, 78, 6, 133, 49, 13, 2]);
    assert.deepEqual([
      after.editable?.status,
      Number(after.editable?.entity_version),
      after.editable?.unit_code,
      after.created.length,
      after.created[0]?.status,
      Number(after.created[0]?.entity_version),
      after.created[0]?.unit_code,
      shortRef(after.created[0]?.id),
    ], ["editing", 25, "m", 1, "editing", 1, "yd", shortRef(createdId)]);

    const readBack = await jsonRequest(`${basePath}?type=fabric&lifecycle=active&limit=30`);
    assert.equal(readBack.response.status, 200);
    const items = readBack.body?.data?.items ?? [];
    const editableLine = items.find((item) => item.id === before.editable.id);
    const createdLine = items.find((item) => item.id === createdId);
    assert.deepEqual([
      editableLine?.unitCode,
      editableLine?.memo,
      editableLine?.editable,
      createdLine?.name,
      createdLine?.unitCode,
      createdLine?.editable,
    ], [
      "m",
      "alpha.55 controlled write runtime verified",
      true,
      WRITE_VERIFY_MARKER,
      "yd",
      true,
    ]);
    assert.deepEqual(requestLedger, [
      {
        requestKind: "material-create",
        endpoint: `/api/v2/work-orders/${shortRef(before.workOrderId)}/materials`,
        method: "POST",
        status: 201,
        contentType: "application/json",
        apiErrorCode: null,
        responseBodySummary: {
          ok: true,
          resultStatus: "editing",
          lineVersion: 1,
          hasMaterialLineId: true,
        },
        idempotencyKeyPresent: true,
        startedKst: requestLedger[0].startedKst,
        endedKst: requestLedger[0].endedKst,
        timeout: false,
        statementCount: "7",
      },
    ]);

    const result = {
      status: "ALPHA55_CREATE_ONLY_RECOVERY_RUNTIME_PASS",
      workOrderRef: shortRef(after.workOrderId),
      updatedMaterialRef: shortRef(after.editable.id),
      createdMaterialRef: shortRef(createdId),
      updatedMaterial: {
        state: "editing",
        version: 25,
        unit: "m",
        memo: "alpha.55 controlled write runtime verified",
      },
      createdMaterial: {
        marker: WRITE_VERIFY_MARKER,
        state: "editing",
        version: 1,
        unit: "yd",
      },
      baseline: writeVerifyBaseline(after),
      delta: {
        workOrder: 1,
        revision: 1,
        materialVersion: 1,
        materialRows: 1,
        events: 1,
        receipts: 1,
      },
      requestLedger,
      duplicateAutomaticUnknownMutation: 0,
      archiveDeleteRestoreMutation: 0,
      productionMutation: 0,
    };
    fs.writeFileSync(WRITE_VERIFY_RESULT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(result));
  } finally {
    await client.end();
  }
}

async function snapshotMemoImeDisplay(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const parents = (await client.query(`
      SELECT w.company_id, w.id AS work_order_id, w.current_revision_id AS revision_id,
             w.entity_version AS work_order_version, r.entity_version AS revision_version,
             w.status AS work_order_status, r.revision_status,
             (SELECT count(*)::integer FROM work_order_material_lines m
               WHERE m.company_id=w.company_id AND m.revision_id=r.id) AS material_rows,
             (SELECT COALESCE(sum(m.entity_version),0)::integer FROM work_order_material_lines m
               WHERE m.company_id=w.company_id AND m.revision_id=r.id) AS material_version_sum,
             (SELECT count(*)::integer FROM domain_events) AS event_count,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
             (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count,
             (SELECT count(*)::integer FROM work_order_material_lines WHERE status='cancelled') AS legacy_cancelled
        FROM work_orders w
        JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
       WHERE EXISTS (
         SELECT 1 FROM work_order_material_lines marker
          WHERE marker.company_id=w.company_id
            AND marker.revision_id=r.id
            AND marker.name=$1
       )
       LIMIT 1
    `, [HEADER_LAYOUT_MARKER])).rows;
    assert.equal(parents.length, 1, "memo-ime-current-draft-parent-count");
    const parent = parents[0];
    const markerNames = [
      AUTO_MARKER,
      DEVICE_MARKER,
      ZERO_ORDER_MARKER,
      HEADER_LAYOUT_MARKER,
      WRITE_VERIFY_MARKER,
      MEMO_IME_MARKER,
    ];
    const markers = (await client.query(`
      SELECT id, name, status, entity_version, archived_at, requested_at, cancelled_at,
             completed_at, supplier_partner_id, required_quantity::text,
             allowance_quantity::text, inventory_usage_quantity::text,
             order_quantity::text, unit_code, unit_price::text, amount::text, memo
        FROM work_order_material_lines
       WHERE company_id=$1 AND revision_id=$2::uuid AND name=ANY($3::text[])
       ORDER BY name, id
    `, [parent.company_id, parent.revision_id, markerNames])).rows;
    const legacyRows = (await client.query(`
      SELECT id, entity_version, status, archived_at, requested_at, cancelled_at, completed_at
        FROM work_order_material_lines
       WHERE status='cancelled'
       ORDER BY id
    `)).rows;
    const sessionTargets = (await client.query(`
      SELECT u.id AS user_id, c.id AS company_id, c.name AS company_name,
             cm.id AS company_member_id, u.email, u.name, cm.display_name
        FROM company_members cm
        JOIN users u ON u.id=cm.user_id
        JOIN companies c ON c.id=cm.company_id
       WHERE c.id=$1
         AND c.is_active=true
         AND u.is_active=true
         AND cm.status='approved'
         AND cm.role_template_code='company_admin'
    `, [parent.company_id])).rows;
    assert.equal(sessionTargets.length, 1, "memo-ime-session-target-count");
    await client.query("COMMIT");
    return {
      companyId: parent.company_id,
      workOrderId: parent.work_order_id,
      revisionId: parent.revision_id,
      workOrderStatus: parent.work_order_status,
      revisionStatus: parent.revision_status,
      workOrderVersion: Number(parent.work_order_version),
      revisionVersion: Number(parent.revision_version),
      materialRows: Number(parent.material_rows),
      materialVersionSum: Number(parent.material_version_sum),
      events: Number(parent.event_count),
      receipts: Number(parent.receipt_count),
      migrationLedger: Number(parent.migration_count),
      legacyCancelled: Number(parent.legacy_cancelled),
      legacyFingerprint: sha256(JSON.stringify(legacyRows)),
      auto: markers.find((row) => row.name === AUTO_MARKER),
      device: markers.find((row) => row.name === DEVICE_MARKER),
      zero: markers.find((row) => row.name === ZERO_ORDER_MARKER),
      userTarget: markers.find((row) => row.name === HEADER_LAYOUT_MARKER),
      writeVerify: markers.find((row) => row.name === WRITE_VERIFY_MARKER),
      memoIme: markers.filter((row) => row.name === MEMO_IME_MARKER),
      sessionTarget: sessionTargets[0],
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function memoImeBaseline(snapshot) {
  return [
    snapshot.workOrderVersion,
    snapshot.revisionVersion,
    snapshot.materialVersionSum,
    snapshot.materialRows,
    snapshot.events,
    snapshot.receipts,
    snapshot.migrationLedger,
    snapshot.legacyCancelled,
  ];
}

function assertMemoImeStartingBaseline(before) {
  assert.deepEqual(memoImeBaseline(before), [103, 103, 81, 7, 136, 50, 13, 2]);
  assert.equal(before.workOrderStatus, "draft");
  assert.equal(before.revisionStatus, "draft");
  assert.deepEqual([
    before.userTarget?.status,
    Number(before.userTarget?.entity_version),
    before.userTarget?.unit_code,
    shortRef(before.userTarget?.id),
  ], ["editing", 27, "yd", "87952ac12155"]);
  assert.equal(
    before.userTarget?.memo,
    "alpha.55 controlled write runtime verified\nㄴㅇㅊㅋㄴㄴㄹㅎ",
  );
  assert.deepEqual([
    before.writeVerify?.status,
    Number(before.writeVerify?.entity_version),
    before.writeVerify?.archived_at,
  ], ["editing", 1, null]);
  assert.ok(before.auto?.supplier_partner_id, "memo-ime-approved-supplier-missing");
  assert.deepEqual([
    before.auto?.status,
    before.device?.status,
    before.zero?.status,
  ], ["completed", "completed", "completed"]);
  assert.equal(before.memoIme.length, 0, "memo-ime-marker-must-not-preexist");
}

function assertMemoImeStep(before, after, expected) {
  assert.equal(after.workOrderVersion - before.workOrderVersion, 1);
  assert.equal(after.revisionVersion - before.revisionVersion, 1);
  assert.equal(after.materialVersionSum - before.materialVersionSum, 1);
  assert.equal(after.materialRows - before.materialRows, expected.materialRows);
  assert.equal(after.events - before.events, 1);
  assert.equal(after.receipts - before.receipts, expected.receipts);
  assert.equal(after.migrationLedger, before.migrationLedger);
  assert.equal(after.legacyCancelled, before.legacyCancelled);
  assert.equal(after.legacyFingerprint, before.legacyFingerprint);
  assert.equal(Number(after.userTarget?.entity_version), Number(before.userTarget?.entity_version));
  assert.equal(after.userTarget?.memo, before.userTarget?.memo);
}

async function verifyMetroIosBundle(state) {
  const manifestResponse = await fetch(`http://127.0.0.1:${state.expoPort}/`, {
    headers: { Accept: "application/expo+json", "Expo-Platform": "ios" },
    signal: AbortSignal.timeout(60_000),
  });
  assert.equal(manifestResponse.status, 200);
  assert.match(manifestResponse.headers.get("content-type") ?? "", /application\/expo\+json/);
  const manifest = await manifestResponse.json();
  const launchAssetUrl = manifest?.launchAsset?.url;
  assert.equal(typeof launchAssetUrl, "string");
  const bundleResponse = await fetch(launchAssetUrl, { signal: AbortSignal.timeout(180_000) });
  assert.equal(bundleResponse.status, 200);
  assert.match(bundleResponse.headers.get("content-type") ?? "", /application\/javascript/);
  const bundleText = await bundleResponse.text();
  const markers = {
    memoDisclosure: bundleText.includes("material-memo-disclosure"),
    headerBadgeCluster: bundleText.includes("material-header-badge-cluster"),
  };
  assert.deepEqual(markers, { memoDisclosure: true, headerBadgeCluster: true });
  return {
    manifestStatus: manifestResponse.status,
    bundleStatus: bundleResponse.status,
    bundleBytes: Buffer.byteLength(bundleText),
    markers,
  };
}

async function runMemoImeDisplay() {
  const state = assertRunnerState();
  assert.equal(state.runtimeQaMode, "memo-ime-display");
  const client = new Client({
    connectionString: readDatabaseUrl(),
    application_name: "wafl-alpha55-memo-ime-display-runtime-qa",
  });
  await client.connect();
  let cookie = "";
  const requestLedger = [];
  const runtimeBaseUrl = `http://127.0.0.1:${state.nextPort}`;

  function safeResponseSummary(body) {
    return body?.ok === true
      ? {
          ok: true,
          status: body?.data?.result?.status ?? null,
          lineVersion: body?.data?.result?.lineVersion ?? null,
          nextVersion: body?.data?.result?.nextVersion ?? body?.data?.nextVersion ?? null,
        }
      : { ok: false, errorCode: body?.error?.code ?? null };
  }

  async function jsonRequest(route, options = {}) {
    const response = await fetch(`${runtimeBaseUrl}${route}`, {
      method: options.method ?? "GET",
      redirect: "manual",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(45_000),
    });
    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
    const text = await response.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
    if (options.command) {
      const record = {
        command: options.command,
        method: options.method,
        status: response.status,
        contentType: response.headers.get("content-type"),
        statementCount: response.headers.get("x-wafl-command-statement-count"),
        response: safeResponseSummary(body),
      };
      requestLedger.push(record);
      console.log(JSON.stringify(record));
    }
    return { response, body };
  }

  try {
    const before = await snapshotMemoImeDisplay(client);
    assertMemoImeStartingBaseline(before);

    const metro = await verifyMetroIosBundle(state);
    cookie = createReadOnlySessionCookie(before.sessionTarget);
    assert.ok(cookie);

    const materialCollectionPath = `/api/v2/work-orders/${before.workOrderId}/materials`;
    const create = await jsonRequest(materialCollectionPath, {
      method: "POST",
      command: "fixture-create",
      idempotencyKey: "alpha55.memo-ime-display.create.v103.marker-v1",
      body: {
        clientRequestId: "alpha55.memo-ime-display.create.client.v103",
        expectedVersion: before.workOrderVersion,
        materialType: "fabric",
        materialId: null,
        name: MEMO_IME_MARKER,
        partnerId: before.auto.supplier_partner_id,
        colorOption: "MEMO IME QA",
        usageArea: "alpha.55 memo IME runtime verification",
        requiredQuantity: "2",
        allowanceQuantity: "0",
        inventoryUsageQuantity: "0",
        orderQuantity: "2",
        unitCode: "yd",
        unitPrice: "10000",
        memo: null,
      },
    });
    assert.equal(create.response.status, 201);
    assert.equal(create.body?.data?.result?.status, "editing");
    const materialLineId = String(create.body?.data?.result?.materialLineId ?? "");
    assert.match(materialLineId, /^[0-9a-f-]{36}$/i);
    let current = await snapshotMemoImeDisplay(client);
    assertMemoImeStep(before, current, { materialRows: 1, receipts: 1 });
    assert.equal(current.memoIme.length, 1);
    assert.deepEqual([
      current.memoIme[0]?.id,
      current.memoIme[0]?.status,
      Number(current.memoIme[0]?.entity_version),
      current.memoIme[0]?.memo,
    ], [materialLineId, "editing", 1, null]);

    const materialPath = `${materialCollectionPath}/${materialLineId}`;
    const materialListPath = `${materialCollectionPath}?type=fabric&lifecycle=active&limit=30`;
    const requested = await jsonRequest(`${materialPath}/order-request`, {
      method: "POST",
      command: "request",
      idempotencyKey: "alpha55.memo-ime-display.request.v104",
      body: {
        clientRequestId: "alpha55.memo-ime-display.request.client.v104",
        expectedVersion: current.workOrderVersion,
      },
    });
    assert.equal(requested.response.status, 200);
    assert.equal(requested.body?.data?.result?.status, "requested");
    let next = await snapshotMemoImeDisplay(client);
    assertMemoImeStep(current, next, { materialRows: 0, receipts: 1 });
    assert.equal(next.memoIme[0]?.status, "requested");
    const requestedRead = await jsonRequest(materialListPath);
    let line = requestedRead.body?.data?.items?.find((item) => item.id === materialLineId);
    assert.deepEqual([line?.status, line?.editable, line?.locked], ["requested", false, true]);
    current = next;

    const cancelled = await jsonRequest(`${materialPath}/order-cancel`, {
      method: "POST",
      command: "cancel",
      idempotencyKey: "alpha55.memo-ime-display.cancel.v105",
      body: {
        clientRequestId: "alpha55.memo-ime-display.cancel.client.v105",
        expectedVersion: current.workOrderVersion,
        reason: "alpha.55 memo IME display runtime cancellation",
      },
    });
    assert.equal(cancelled.response.status, 200);
    assert.equal(cancelled.body?.data?.result?.status, "editing");
    next = await snapshotMemoImeDisplay(client);
    assertMemoImeStep(current, next, { materialRows: 0, receipts: 1 });
    assert.equal(next.memoIme[0]?.status, "editing");
    assert.ok(next.memoIme[0]?.cancelled_at);
    const cancellationTimestamp = String(next.memoIme[0].cancelled_at);
    const cancelledRead = await jsonRequest(materialListPath);
    line = cancelledRead.body?.data?.items?.find((item) => item.id === materialLineId);
    assert.deepEqual([line?.status, line?.editable, line?.locked], ["editing", true, false]);
    current = next;

    const noAutomaticSave = createInlineEditFinalizationController("");
    noAutomaticSave.observe("조합 중 ㄴㅇㅊ");
    assert.equal(noAutomaticSave.finalize("조합 중 ㄴㅇㅊ").shouldSave, false);

    const finalization = createInlineEditFinalizationController("");
    finalization.observe("alpha.55 자동 IME 저장 검증\nㅎㅏㄴㄱㅡㄹ 조합 중");
    assert.equal(finalization.requestSave(), true);
    assert.equal(finalization.requestSave(), false, "memo-ime-duplicate-check-must-be-ignored");
    const finalized = finalization.finalize("alpha.55 자동 IME 저장 검증\n한글 조합 완료 😀");
    assert.deepEqual(finalized, {
      shouldSave: true,
      value: "alpha.55 자동 IME 저장 검증\n한글 조합 완료 😀",
    });
    assert.doesNotMatch(finalized.value, /[ㄱ-ㅎㅏ-ㅣ]/u);
    assert.equal(finalization.finalize(finalized.value).shouldSave, false);

    const patched = await jsonRequest(materialPath, {
      method: "PATCH",
      command: "memo-patch",
      body: {
        clientRequestId: "alpha55.memo-ime-display.patch.client.v106",
        expectedVersion: current.workOrderVersion,
        patch: { memo: finalized.value },
      },
    });
    assert.equal(patched.response.status, 200);
    assert.equal(patched.body?.data?.result?.status, "editing");
    next = await snapshotMemoImeDisplay(client);
    assertMemoImeStep(current, next, { materialRows: 0, receipts: 0 });
    assert.equal(next.memoIme[0]?.memo, finalized.value);
    assert.equal(String(next.memoIme[0]?.cancelled_at), cancellationTimestamp);
    current = next;

    const rerequested = await jsonRequest(`${materialPath}/order-request`, {
      method: "POST",
      command: "re-request",
      idempotencyKey: "alpha55.memo-ime-display.re-request.v107",
      body: {
        clientRequestId: "alpha55.memo-ime-display.re-request.client.v107",
        expectedVersion: current.workOrderVersion,
      },
    });
    assert.equal(rerequested.response.status, 200);
    assert.equal(rerequested.body?.data?.result?.status, "requested");
    const after = await snapshotMemoImeDisplay(client);
    assertMemoImeStep(current, after, { materialRows: 0, receipts: 1 });
    assert.deepEqual(memoImeBaseline(after), [108, 108, 86, 8, 141, 54, 13, 2]);
    assert.deepEqual([
      after.memoIme[0]?.status,
      Number(after.memoIme[0]?.entity_version),
      after.memoIme[0]?.memo,
      String(after.memoIme[0]?.cancelled_at),
    ], ["requested", 5, finalized.value, cancellationTimestamp]);

    const finalRead = await jsonRequest(materialListPath);
    line = finalRead.body?.data?.items?.find((item) => item.id === materialLineId);
    assert.deepEqual([
      line?.status,
      line?.editable,
      line?.locked,
      line?.memo,
    ], ["requested", false, true, finalized.value]);

    assert.equal(MATERIAL_MEMO_COMPACT_LINES, 2);
    const compactMemo = createMaterialMemoDisclosureModel(3, false);
    const expandedMemo = createMaterialMemoDisclosureModel(3, true);
    assert.deepEqual(
      [compactMemo.hasOverflow, compactMemo.numberOfLines, expandedMemo.hasOverflow, expandedMemo.numberOfLines],
      [true, 2, true, null],
    );
    const header = createMaterialHeaderPresentation({
      name: MEMO_IME_MARKER.repeat(3),
      unitCode: "yd",
      statusLabel: "발주요청",
    });
    assert.deepEqual(header.badgeCluster.map((badge) => badge.kind), ["unit", "status"]);
    assert.equal(header.maxNameLines, 2);
    const quantity = formatQuantityParts("2", "yd");
    assert.deepEqual([quantity.value, quantity.unit], ["2", "yd"]);

    assert.deepEqual(requestLedger.map((record) => record.command), [
      "fixture-create",
      "request",
      "cancel",
      "memo-patch",
      "re-request",
    ]);
    assert.equal(requestLedger.filter((record) => record.command === "memo-patch").length, 1);
    assert.ok(requestLedger.every((record) => record.status === 200 || record.status === 201));
    assert.deepEqual(await readNewEventCodes(client, before.workOrderId, 5), [
      "work_order.material.create",
      "work_order.material.order_request",
      "work_order.material.order_cancel",
      "work_order.material.patch",
      "work_order.material.order_request",
    ]);

    const result = {
      status: "ALPHA55_MEMO_IME_DISPLAY_RUNTIME_PASS",
      mode: "memo-ime-display",
      runtime: {
        processRoles: state.processes.map((record) => record.role).sort(),
        previewTransport: state.previewTransport,
        metro,
      },
      workOrderRef: shortRef(before.workOrderId),
      materialRef: shortRef(materialLineId),
      userTargetRef: shortRef(before.userTarget.id),
      before: memoImeBaseline(before),
      after: memoImeBaseline(after),
      delta: {
        workOrder: 5,
        revision: 5,
        materialVersion: 5,
        materialRows: 1,
        events: 5,
        receipts: 4,
      },
      fixture: {
        marker: MEMO_IME_MARKER,
        state: "requested",
        version: 5,
        memo: finalized.value,
        cancellationHistoryPreserved: true,
      },
      imeFinalization: {
        automaticSave: 0,
        duplicateCheckIgnored: true,
        compatibilityJamoRemaining: 0,
        memoPatch: 1,
      },
      memoDisclosure: { compactMemo, expandedMemo },
      header: {
        maxNameLines: header.maxNameLines,
        badgeOrder: header.badgeCluster.map((badge) => badge.kind),
        quantitySingleRow: true,
      },
      legacyCancelledUnchanged: true,
      duplicateAutomaticUnknownMutation: 0,
      archiveDeleteRestoreMutation: 0,
      productionMutation: 0,
      requestLedger,
    };
    fs.writeFileSync(MEMO_IME_RESULT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(result));
  } finally {
    await client.end();
  }
}

function resolveRuntimeQaMode(argv) {
  const modeIndex = argv.indexOf("--mode");
  if (modeIndex >= 0) {
    const mode = argv[modeIndex + 1];
    assert.ok(mode && RUNTIME_QA_MODES.has(mode), `unsupported-runtime-qa-mode:${mode ?? "missing"}`);
    return mode;
  }
  if (argv.includes("--create-only-recovery")) return "create-only-recovery";
  if (argv.includes("--header-layout-readonly")) return "header-layout-readonly";
  if (argv.includes("--unit-layout-create")) return "unit-layout-create";
  if (argv.includes("--zero-order")) return "zero-order";
  return "material-order-lifecycle";
}

const runtimeQaMode = resolveRuntimeQaMode(process.argv.slice(2));
if (runtimeQaMode === "create-only-recovery") {
  await runCreateOnlyRecovery();
} else if (runtimeQaMode === "header-layout-readonly") {
  await runHeaderLayoutRead();
} else if (runtimeQaMode === "unit-layout-create") {
  await runUnitLayoutCreate();
} else if (runtimeQaMode === "zero-order") {
  await runZeroOrder();
} else if (runtimeQaMode === "memo-ime-display") {
  await runMemoImeDisplay();
} else {
  await run();
}
