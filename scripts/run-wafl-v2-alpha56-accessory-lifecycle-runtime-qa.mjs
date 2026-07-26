#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

import { createInlineEditFinalizationController } from "../apps/mobile/lib/inlineEditFinalization.ts";
import {
  createMaterialMemoDisclosureModel,
  MATERIAL_MEMO_COMPACT_LINES,
} from "../apps/mobile/features/materials/materialMemoDisclosureModel.ts";
import { createMaterialHeaderPresentation } from "../apps/mobile/features/materials/materialHeaderLayoutModel.ts";
import { formatQuantityParts } from "../apps/mobile/lib/mobileDisplay.ts";

const { Client } = pg;

const FABRIC_TARGET = "UNITEDITABLEMATERI";
const SUPPLIER_SOURCE = "ALPHA55_AUTO_MATERIAL_ORDER_LIFECYCLE";
const AUTO_MARKER = "ALPHA56_AUTO_ACCESSORY_LIFECYCLE";
const AUTO_UPDATED_MARKER = `${AUTO_MARKER}_UPDATED`;
const ZERO_MARKER = "ALPHA56_AUTO_ACCESSORY_ZERO_ORDER";
const DEVICE_MARKER = "ALPHA56_DEVICE_ACCESSORY_LIFECYCLE";
const FIXTURE_MARKERS = [AUTO_MARKER, ZERO_MARKER, DEVICE_MARKER];
const FIXTURE_NAMES = [AUTO_MARKER, AUTO_UPDATED_MARKER, ZERO_MARKER, DEVICE_MARKER];
const RESULT_PATH = path.join(
  process.cwd(),
  ".tmp",
  "wafl-external-qa",
  "alpha56-accessory-lifecycle-runtime-result.json",
);

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

function assertRunnerState() {
  const statePath = path.join(process.cwd(), ".tmp", "wafl-external-qa", "state.json");
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(state.status, "running");
  assert.equal(state.runtimeQaMode, "accessory-lifecycle-parity");
  assert.equal(state.commandApi, "ready");
  assert.equal(state.mutationMode, "accessory-lifecycle-parity");
  assert.equal(state.previewTransport, "tailscale-serve-internal");
  assert.equal(state.quickTunnelReady, false);
  assert.equal(state.tailscaleServeReady, true);
  assert.equal(state.developerAutoConnectReady, true);
  assert.deepEqual(
    state.processes.map((record) => record.role).sort(),
    ["expo", "next", "tailscale-serve"],
  );
  for (const record of state.processes) {
    const marker = JSON.parse(fs.readFileSync(record.markerPath, "utf8"));
    assert.equal(marker.ownerMarker, state.ownerMarker);
    assert.equal(marker.pid, record.pid);
    assert.equal(marker.role, record.role);
    process.kill(Number(record.pid), 0);
  }
  return state;
}

function materialFingerprint(row) {
  if (!row) return null;
  return sha256(JSON.stringify({
    id: row.id,
    name: row.name,
    materialType: row.material_type,
    status: row.status,
    entityVersion: Number(row.entity_version),
    archivedAt: row.archived_at,
    requestedAt: row.requested_at,
    cancelledAt: row.cancelled_at,
    completedAt: row.completed_at,
    supplierPartnerId: row.supplier_partner_id,
    requiredQuantity: row.required_quantity,
    allowanceQuantity: row.allowance_quantity,
    inventoryUsageQuantity: row.inventory_usage_quantity,
    orderQuantity: row.order_quantity,
    unitCode: row.unit_code,
    unitPrice: row.unit_price,
    amount: row.amount,
    memo: row.memo,
  }));
}

async function snapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const parents = (await client.query(`
      SELECT w.company_id, w.id AS work_order_id, w.current_revision_id AS revision_id,
             w.entity_version AS work_order_version, r.entity_version AS revision_version,
             w.status AS work_order_status, r.revision_status,
             (SELECT count(*)::integer FROM work_order_material_lines m
               WHERE m.company_id=w.company_id AND m.revision_id=r.id) AS material_rows,
             (SELECT count(*)::integer FROM work_order_material_lines m
               WHERE m.company_id=w.company_id AND m.revision_id=r.id
                 AND m.material_type='accessory') AS accessory_rows,
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
    `, [FABRIC_TARGET])).rows;
    assert.equal(parents.length, 1, "alpha56-current-draft-parent-count");
    const parent = parents[0];
    const rows = (await client.query(`
      SELECT id, name, material_type, status, entity_version, archived_at, requested_at,
             cancelled_at, completed_at, supplier_partner_id, required_quantity::text,
             allowance_quantity::text, inventory_usage_quantity::text,
             order_quantity::text, unit_code, unit_price::text, amount::text, memo
        FROM work_order_material_lines
       WHERE company_id=$1 AND revision_id=$2::uuid
         AND name=ANY($3::text[])
       ORDER BY name, id
    `, [parent.company_id, parent.revision_id, [
      FABRIC_TARGET,
      SUPPLIER_SOURCE,
      ...FIXTURE_NAMES,
    ]])).rows;
    const legacyRows = (await client.query(`
      SELECT id, entity_version, status, archived_at, requested_at, cancelled_at, completed_at
        FROM work_order_material_lines
       WHERE status='cancelled'
       ORDER BY id
    `)).rows;
    await client.query("COMMIT");
    const fabricTarget = rows.find((row) => row.name === FABRIC_TARGET);
    const supplierSource = rows.find((row) => row.name === SUPPLIER_SOURCE);
    return {
      companyId: parent.company_id,
      workOrderId: parent.work_order_id,
      revisionId: parent.revision_id,
      workOrderStatus: parent.work_order_status,
      revisionStatus: parent.revision_status,
      workOrderVersion: Number(parent.work_order_version),
      revisionVersion: Number(parent.revision_version),
      materialRows: Number(parent.material_rows),
      accessoryRows: Number(parent.accessory_rows),
      materialVersionSum: Number(parent.material_version_sum),
      events: Number(parent.event_count),
      receipts: Number(parent.receipt_count),
      migrationLedger: Number(parent.migration_count),
      legacyCancelled: Number(parent.legacy_cancelled),
      legacyFingerprint: sha256(JSON.stringify(legacyRows)),
      fabricTarget,
      fabricFingerprint: materialFingerprint(fabricTarget),
      supplierPartnerId: supplierSource?.supplier_partner_id ?? null,
      fixtures: rows.filter((row) => FIXTURE_NAMES.includes(row.name)),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function baseline(snapshotValue) {
  return [
    snapshotValue.workOrderVersion,
    snapshotValue.revisionVersion,
    snapshotValue.materialVersionSum,
    snapshotValue.materialRows,
    snapshotValue.events,
    snapshotValue.receipts,
    snapshotValue.migrationLedger,
    snapshotValue.legacyCancelled,
  ];
}

function fixture(snapshotValue, marker) {
  return snapshotValue.fixtures.find((row) => (
    row.name === marker || (marker === AUTO_MARKER && row.name === AUTO_UPDATED_MARKER)
  ));
}

function assertStartingBaseline(before) {
  assert.deepEqual(baseline(before), [109, 109, 87, 8, 142, 54, 13, 2]);
  assert.equal(before.workOrderStatus, "draft");
  assert.equal(before.revisionStatus, "draft");
  assert.equal(before.accessoryRows, 0, "accessory-fixture-must-not-preexist");
  assert.equal(before.fixtures.length, 0, "alpha56-fixture-marker-must-not-preexist");
  assert.ok(before.supplierPartnerId, "alpha56-approved-supplier-missing");
  assert.deepEqual([
    before.fabricTarget?.material_type,
    before.fabricTarget?.status,
    Number(before.fabricTarget?.entity_version),
    before.fabricTarget?.archived_at,
    before.fabricTarget?.unit_code,
    before.fabricTarget?.memo,
  ], [
    "fabric",
    "editing",
    28,
    null,
    "yd",
    "alpha.55 iPhone write QA 한글 완료",
  ]);
}

function assertStep(before, after, expected) {
  assert.equal(after.workOrderVersion - before.workOrderVersion, expected.mutated ? 1 : 0);
  assert.equal(after.revisionVersion - before.revisionVersion, expected.mutated ? 1 : 0);
  assert.equal(after.materialVersionSum - before.materialVersionSum, expected.mutated ? 1 : 0);
  assert.equal(after.materialRows - before.materialRows, expected.materialRows ?? 0);
  assert.equal(after.events - before.events, expected.mutated ? 1 : 0);
  assert.equal(after.receipts - before.receipts, expected.receipts ?? 0);
  assert.equal(after.migrationLedger, before.migrationLedger);
  assert.equal(after.legacyCancelled, before.legacyCancelled);
  assert.equal(after.legacyFingerprint, before.legacyFingerprint);
  assert.equal(after.fabricFingerprint, before.fabricFingerprint);
}

async function readNewEventCodes(client, workOrderId, count) {
  await client.query("BEGIN READ ONLY");
  try {
    const rows = (await client.query(`
      SELECT command_code
        FROM domain_events
       WHERE entity_type='work_order' AND entity_id=$1::text
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
    accessoryLabel: bundleText.includes("부자재"),
    memoDisclosure: bundleText.includes("material-memo-disclosure"),
    headerBadgeCluster: bundleText.includes("material-header-badge-cluster"),
  };
  assert.deepEqual(markers, {
    accessoryLabel: true,
    memoDisclosure: true,
    headerBadgeCluster: true,
  });
  return {
    manifestStatus: manifestResponse.status,
    bundleStatus: bundleResponse.status,
    bundleBytes: Buffer.byteLength(bundleText),
    markers,
  };
}

function safeResponseSummary(body) {
  return body?.ok === true
    ? {
        ok: true,
        materialType: body?.data?.result?.materialType ?? null,
        status: body?.data?.result?.status ?? null,
        lifecycle: body?.data?.result?.lifecycle ?? null,
        lineVersion: body?.data?.result?.lineVersion ?? null,
      }
    : {
        ok: false,
        errorCode: body?.error?.code ?? null,
        fieldErrorFields: Array.isArray(body?.error?.fieldErrors)
          ? body.error.fieldErrors.map((entry) => String(entry?.field ?? "")).filter(Boolean)
          : [],
      };
}

async function run() {
  const state = assertRunnerState();
  const client = new Client({
    connectionString: readDatabaseUrl(),
    application_name: "wafl-alpha56-accessory-lifecycle-runtime-qa",
  });
  await client.connect();
  let cookie = "";
  const requestLedger = [];
  const runtimeBaseUrl = `https://${state.tailscaleServeHostname}`;

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
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
    if (options.command) {
      requestLedger.push({
        command: options.command,
        method: options.method,
        status: response.status,
        response: safeResponseSummary(body),
        idempotencyKeyPresent: Boolean(options.idempotencyKey),
        statementCount: response.headers.get("x-wafl-command-statement-count"),
      });
    }
    return { response, body };
  }

  function createBody(snapshotValue, marker, values) {
    return {
      clientRequestId: `alpha56.${marker.toLowerCase()}.create.client.v${snapshotValue.workOrderVersion}`,
      expectedVersion: snapshotValue.workOrderVersion,
      materialType: "accessory",
      materialId: null,
      name: marker,
      partnerId: values.partnerId,
      colorOption: values.colorOption,
      usageArea: values.usageArea,
      requiredQuantity: values.requiredQuantity,
      allowanceQuantity: values.allowanceQuantity,
      inventoryUsageQuantity: values.inventoryUsageQuantity,
      orderQuantity: values.orderQuantity,
      unitCode: values.unitCode,
      unitPrice: values.unitPrice,
      memo: values.memo,
    };
  }

  async function command(route, options) {
    return jsonRequest(route, {
      ...options,
      idempotencyKey: options.idempotencyKey
        ?? (options.method === "POST" ? `alpha56.${options.command}.v${options.expectedVersion}` : undefined),
      body: {
        clientRequestId: `alpha56.${options.command}.client.v${options.expectedVersion}`,
        expectedVersion: options.expectedVersion,
        ...(options.reason ? { reason: options.reason } : {}),
        ...(options.patch ? { patch: options.patch } : {}),
      },
    });
  }

  try {
    const before = await snapshot(client);
    assertStartingBaseline(before);
    const metro = await verifyMetroIosBundle(state);

    const authBefore = await jsonRequest("/api/auth/me");
    assert.equal(authBefore.response.status, 401);
    const auth = await jsonRequest("/api/dev/mobile-connect/auto", { method: "POST" });
    assert.equal(auth.response.status, 200);
    assert.equal(auth.body?.connected, true);
    assert.ok(cookie);
    const me = await jsonRequest("/api/auth/me");
    assert.equal(me.response.status, 200);
    assert.equal(me.body?.authenticated, true);

    const collectionPath = `/api/v2/work-orders/${before.workOrderId}/materials`;
    const accessoryReadPath = `${collectionPath}?type=accessory&lifecycle=active&limit=30`;
    const fabricReadPath = `${collectionPath}?type=fabric&lifecycle=active&limit=30`;
    let current = before;

    const normalCreate = await jsonRequest(collectionPath, {
      method: "POST",
      command: "normal-create",
      idempotencyKey: "alpha56.normal-create.v109",
      body: createBody(current, AUTO_MARKER, {
        partnerId: current.supplierPartnerId,
        colorOption: "BLACK / 20mm",
        usageArea: "허리 밴드",
        requiredQuantity: "2",
        allowanceQuantity: "0.5",
        inventoryUsageQuantity: "0",
        orderQuantity: "2.5",
        unitCode: "m",
        unitPrice: "10000",
        memo: "alpha.56 accessory create",
      }),
    });
    assert.equal(normalCreate.response.status, 201);
    assert.equal(normalCreate.body?.data?.result?.materialType, "accessory");
    assert.equal(normalCreate.body?.data?.result?.status, "editing");
    const normalId = String(normalCreate.body?.data?.result?.materialLineId ?? "");
    assert.match(normalId, /^[0-9a-f-]{36}$/i);
    let next = await snapshot(client);
    assertStep(current, next, { mutated: true, materialRows: 1, receipts: 1 });
    assert.deepEqual([
      fixture(next, AUTO_MARKER)?.material_type,
      fixture(next, AUTO_MARKER)?.status,
      Number(fixture(next, AUTO_MARKER)?.entity_version),
    ], ["accessory", "editing", 1]);
    current = next;

    const accessoryRead = await jsonRequest(accessoryReadPath);
    const fabricRead = await jsonRequest(fabricReadPath);
    assert.equal(accessoryRead.response.status, 200);
    assert.equal(fabricRead.response.status, 200);
    assert.equal(accessoryRead.body?.data?.materialType, "accessory");
    assert.equal(fabricRead.body?.data?.materialType, "fabric");
    assert.ok(accessoryRead.body?.data?.items?.some((item) => item.id === normalId));
    assert.ok(!fabricRead.body?.data?.items?.some((item) => item.id === normalId));
    assert.ok(fabricRead.body?.data?.items?.some((item) => item.name === FABRIC_TARGET));

    const noAutomaticSave = createInlineEditFinalizationController("");
    noAutomaticSave.observe("조합 중 ㄴㅇㅊ");
    assert.equal(noAutomaticSave.finalize("조합 중 ㄴㅇㅊ").shouldSave, false);
    const finalization = createInlineEditFinalizationController("");
    finalization.observe("alpha.56 부자재 메모\nㅎㅏㄴㄱㅡㄹ 조합 중");
    assert.equal(finalization.requestSave(), true);
    assert.equal(finalization.requestSave(), false, "accessory-memo-duplicate-check-must-be-ignored");
    const finalizedMemo = finalization.finalize("alpha.56 부자재 메모\n한글 조합 완료 😀");
    assert.deepEqual(finalizedMemo, {
      shouldSave: true,
      value: "alpha.56 부자재 메모\n한글 조합 완료 😀",
    });
    assert.doesNotMatch(finalizedMemo.value, /[ㄱ-ㅎㅏ-ㅣ]/u);

    const normalPath = `${collectionPath}/${normalId}`;
    const normalPatch = await command(normalPath, {
      method: "PATCH",
      command: "normal-memo-update",
      expectedVersion: current.workOrderVersion,
      patch: {
        name: AUTO_UPDATED_MARKER,
        colorOption: "NAVY / 20mm",
        usageArea: "허리·소매",
        requiredQuantity: "3",
        allowanceQuantity: "0.5",
        inventoryUsageQuantity: "0.5",
        orderQuantity: "3",
        unitCode: "m",
        unitPrice: "12000",
        memo: finalizedMemo.value,
      },
    });
    assert.equal(normalPatch.response.status, 200);
    assert.equal(normalPatch.body?.data?.result?.materialType, "accessory");
    next = await snapshot(client);
    assertStep(current, next, { mutated: true, receipts: 0 });
    assert.equal(Number(fixture(next, AUTO_MARKER)?.entity_version), 2);
    assert.equal(fixture(next, AUTO_MARKER)?.memo, finalizedMemo.value);
    current = next;

    const archived = await command(`${normalPath}/archive`, {
      method: "POST",
      command: "normal-archive",
      expectedVersion: current.workOrderVersion,
    });
    assert.equal(archived.response.status, 200);
    assert.equal(archived.body?.data?.result?.lifecycle, "archived");
    next = await snapshot(client);
    assertStep(current, next, { mutated: true, receipts: 1 });
    assert.ok(fixture(next, AUTO_MARKER)?.archived_at);
    current = next;

    const restored = await command(`${normalPath}/restore`, {
      method: "POST",
      command: "normal-restore",
      expectedVersion: current.workOrderVersion,
    });
    assert.equal(restored.response.status, 200);
    assert.equal(restored.body?.data?.result?.lifecycle, "active");
    next = await snapshot(client);
    assertStep(current, next, { mutated: true, receipts: 1 });
    assert.equal(fixture(next, AUTO_MARKER)?.archived_at, null);
    current = next;

    const requested = await command(`${normalPath}/order-request`, {
      method: "POST",
      command: "normal-request",
      expectedVersion: current.workOrderVersion,
    });
    assert.equal(requested.response.status, 200);
    assert.equal(requested.body?.data?.result?.status, "requested");
    next = await snapshot(client);
    assertStep(current, next, { mutated: true, receipts: 1 });
    assert.equal(fixture(next, AUTO_MARKER)?.status, "requested");
    current = next;

    const cancelled = await command(`${normalPath}/order-cancel`, {
      method: "POST",
      command: "normal-cancel",
      expectedVersion: current.workOrderVersion,
      reason: "alpha.56 accessory lifecycle cancellation",
    });
    assert.equal(cancelled.response.status, 200);
    assert.equal(cancelled.body?.data?.result?.status, "editing");
    next = await snapshot(client);
    assertStep(current, next, { mutated: true, receipts: 1 });
    assert.equal(fixture(next, AUTO_MARKER)?.status, "editing");
    assert.ok(fixture(next, AUTO_MARKER)?.cancelled_at);
    const cancellationTimestamp = String(fixture(next, AUTO_MARKER).cancelled_at);
    current = next;

    const postCancelPatch = await command(normalPath, {
      method: "PATCH",
      command: "normal-post-cancel-update",
      expectedVersion: current.workOrderVersion,
      patch: { colorOption: "NAVY / 25mm" },
    });
    assert.equal(postCancelPatch.response.status, 200);
    next = await snapshot(client);
    assertStep(current, next, { mutated: true, receipts: 0 });
    assert.equal(String(fixture(next, AUTO_MARKER)?.cancelled_at), cancellationTimestamp);
    current = next;

    const rerequested = await command(`${normalPath}/order-request`, {
      method: "POST",
      command: "normal-re-request",
      expectedVersion: current.workOrderVersion,
    });
    assert.equal(rerequested.response.status, 200);
    next = await snapshot(client);
    assertStep(current, next, { mutated: true, receipts: 1 });
    assert.equal(fixture(next, AUTO_MARKER)?.status, "requested");
    current = next;

    const completed = await command(`${normalPath}/order-complete`, {
      method: "POST",
      command: "normal-complete",
      expectedVersion: current.workOrderVersion,
    });
    assert.equal(completed.response.status, 200);
    next = await snapshot(client);
    assertStep(current, next, { mutated: true, receipts: 1 });
    assert.deepEqual([
      fixture(next, AUTO_MARKER)?.status,
      Number(fixture(next, AUTO_MARKER)?.entity_version),
      String(fixture(next, AUTO_MARKER)?.cancelled_at),
      fixture(next, AUTO_MARKER)?.order_quantity,
      fixture(next, AUTO_MARKER)?.amount,
    ], ["completed", 9, cancellationTimestamp, "3.000", "36000.00"]);
    current = next;

    const zeroCreate = await jsonRequest(collectionPath, {
      method: "POST",
      command: "zero-create",
      idempotencyKey: `alpha56.zero-create.v${current.workOrderVersion}`,
      body: createBody(current, ZERO_MARKER, {
        partnerId: null,
        colorOption: "STOCK COVERED",
        usageArea: "라벨",
        requiredQuantity: "2",
        allowanceQuantity: "0",
        inventoryUsageQuantity: "2",
        orderQuantity: "0",
        unitCode: "장",
        unitPrice: "0",
        memo: "재고 충당 zero-order",
      }),
    });
    assert.equal(zeroCreate.response.status, 201);
    const zeroId = String(zeroCreate.body?.data?.result?.materialLineId ?? "");
    const zeroPath = `${collectionPath}/${zeroId}`;
    next = await snapshot(client);
    assertStep(current, next, { mutated: true, materialRows: 1, receipts: 1 });
    current = next;

    for (const transition of [
      ["zero-request", "order-request", "requested"],
      ["zero-cancel", "order-cancel", "editing"],
      ["zero-re-request", "order-request", "requested"],
      ["zero-complete", "order-complete", "completed"],
    ]) {
      const [commandName, routeKind, expectedStatus] = transition;
      const response = await command(`${zeroPath}/${routeKind}`, {
        method: "POST",
        command: commandName,
        expectedVersion: current.workOrderVersion,
        ...(routeKind === "order-cancel" ? { reason: "alpha.56 zero-order cancellation" } : {}),
      });
      assert.equal(response.response.status, 200);
      assert.equal(response.body?.data?.result?.status, expectedStatus);
      next = await snapshot(client);
      assertStep(current, next, { mutated: true, receipts: 1 });
      current = next;
    }
    assert.deepEqual([
      fixture(current, ZERO_MARKER)?.status,
      Number(fixture(current, ZERO_MARKER)?.entity_version),
      fixture(current, ZERO_MARKER)?.order_quantity,
      fixture(current, ZERO_MARKER)?.amount,
      fixture(current, ZERO_MARKER)?.supplier_partner_id,
    ], ["completed", 5, "0.000", "0.00", null]);

    const deviceCreate = await jsonRequest(collectionPath, {
      method: "POST",
      command: "device-create-demand-zero",
      idempotencyKey: `alpha56.device-create.v${current.workOrderVersion}`,
      body: createBody(current, DEVICE_MARKER, {
        partnerId: null,
        colorOption: "DEVICE QA",
        usageArea: "아이폰 부자재 QA",
        requiredQuantity: "0",
        allowanceQuantity: "0",
        inventoryUsageQuantity: "0",
        orderQuantity: "0",
        unitCode: "개",
        unitPrice: "0",
        memo: "alpha.56 iPhone QA 준비",
      }),
    });
    assert.equal(deviceCreate.response.status, 201);
    const deviceId = String(deviceCreate.body?.data?.result?.materialLineId ?? "");
    const devicePath = `${collectionPath}/${deviceId}`;
    next = await snapshot(client);
    assertStep(current, next, { mutated: true, materialRows: 1, receipts: 1 });
    current = next;

    const demandZeroBlocked = await command(`${devicePath}/order-request`, {
      method: "POST",
      command: "device-demand-zero-request-blocked",
      expectedVersion: current.workOrderVersion,
    });
    assert.equal(demandZeroBlocked.response.status, 400);
    assert.equal(demandZeroBlocked.body?.error?.code, "VALIDATION_ERROR");
    next = await snapshot(client);
    assertStep(current, next, { mutated: false, receipts: 0 });
    current = next;

    const deviceReady = await command(devicePath, {
      method: "PATCH",
      command: "device-ready-update",
      expectedVersion: current.workOrderVersion,
      patch: {
        partnerId: current.supplierPartnerId,
        requiredQuantity: "2",
        allowanceQuantity: "0.5",
        inventoryUsageQuantity: "0",
        orderQuantity: "2.5",
        unitPrice: "10000",
      },
    });
    assert.equal(deviceReady.response.status, 200);
    next = await snapshot(client);
    assertStep(current, next, { mutated: true, receipts: 0 });
    current = next;

    assert.deepEqual(baseline(current), [125, 125, 103, 11, 158, 67, 13, 2]);
    assert.equal(current.accessoryRows, 3);
    assert.deepEqual([
      fixture(current, DEVICE_MARKER)?.status,
      Number(fixture(current, DEVICE_MARKER)?.entity_version),
      fixture(current, DEVICE_MARKER)?.order_quantity,
      fixture(current, DEVICE_MARKER)?.amount,
      Boolean(fixture(current, DEVICE_MARKER)?.supplier_partner_id),
    ], ["editing", 2, "2.500", "25000.00", true]);

    const finalAccessoryRead = await jsonRequest(accessoryReadPath);
    const finalFabricRead = await jsonRequest(fabricReadPath);
    assert.equal(finalAccessoryRead.response.status, 200);
    assert.equal(finalFabricRead.response.status, 200);
    const accessoryItems = finalAccessoryRead.body?.data?.items ?? [];
    const fabricItems = finalFabricRead.body?.data?.items ?? [];
    assert.ok(FIXTURE_MARKERS.every((marker) => accessoryItems.some((item) => item.name === marker || item.name === AUTO_UPDATED_MARKER)));
    assert.ok(!fabricItems.some((item) => FIXTURE_NAMES.includes(item.name)));
    assert.ok(fabricItems.some((item) => item.name === FABRIC_TARGET));

    assert.equal(MATERIAL_MEMO_COMPACT_LINES, 2);
    const compactMemo = createMaterialMemoDisclosureModel(3, false);
    const expandedMemo = createMaterialMemoDisclosureModel(3, true);
    assert.deepEqual(
      [compactMemo.hasOverflow, compactMemo.numberOfLines, expandedMemo.hasOverflow, expandedMemo.numberOfLines],
      [true, 2, true, null],
    );
    const header = createMaterialHeaderPresentation({
      name: DEVICE_MARKER.repeat(3),
      unitCode: "개",
      statusLabel: "발주 전",
    });
    assert.deepEqual(header.badgeCluster.map((badge) => badge.kind), ["unit", "status"]);
    assert.equal(header.maxNameLines, 2);
    const quantity = formatQuantityParts("2.5", "개");
    assert.deepEqual([quantity.value, quantity.unit], ["2.5", "개"]);

    const expectedEvents = [
      "work_order.material.create",
      "work_order.material.patch",
      "work_order.material.archive",
      "work_order.material.restore",
      "work_order.material.order_request",
      "work_order.material.order_cancel",
      "work_order.material.patch",
      "work_order.material.order_request",
      "work_order.material.order_complete",
      "work_order.material.create",
      "work_order.material.order_request",
      "work_order.material.order_cancel",
      "work_order.material.order_request",
      "work_order.material.order_complete",
      "work_order.material.create",
      "work_order.material.patch",
    ];
    assert.deepEqual(await readNewEventCodes(client, before.workOrderId, expectedEvents.length), expectedEvents);
    assert.equal(requestLedger.length, 17);
    assert.equal(requestLedger.filter((record) => record.method === "PATCH").length, 3);
    assert.equal(requestLedger.filter((record) => record.command === "normal-memo-update").length, 1);
    assert.equal(requestLedger.filter((record) => record.status === 400).length, 1);
    assert.equal(requestLedger.filter((record) => record.status === 200 || record.status === 201).length, 16);

    const result = {
      status: "ALPHA56_ACCESSORY_LIFECYCLE_PARITY_RUNTIME_PASS",
      mode: "accessory-lifecycle-parity",
      runtime: {
        processRoles: state.processes.map((record) => record.role).sort(),
        previewTransport: state.previewTransport,
        metro,
      },
      workOrderRef: shortRef(before.workOrderId),
      fabricTargetRef: shortRef(before.fabricTarget.id),
      before: baseline(before),
      after: baseline(current),
      delta: {
        workOrder: 16,
        revision: 16,
        materialVersion: 16,
        materialRows: 3,
        events: 16,
        receipts: 13,
      },
      fixtures: {
        automated: { marker: AUTO_UPDATED_MARKER, state: "completed", version: 9 },
        zeroOrder: { marker: ZERO_MARKER, state: "completed", version: 5, amount: "0.00" },
        device: { marker: DEVICE_MARKER, state: "editing", version: 2 },
      },
      requestCounts: {
        total: 17,
        successful: 16,
        create: 3,
        patch: 3,
        archive: 1,
        restore: 1,
        requestAttempts: 5,
        requestSucceeded: 4,
        cancel: 2,
        complete: 2,
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
      fabricTargetUnchanged: true,
      hardDeleteMutation: 0,
      duplicateAutomaticUnknownMutation: 0,
      productionMutation: 0,
      requestLedger,
    };
    fs.mkdirSync(path.dirname(RESULT_PATH), { recursive: true });
    fs.writeFileSync(RESULT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(result));
  } finally {
    await client.end();
  }
}

await run();
