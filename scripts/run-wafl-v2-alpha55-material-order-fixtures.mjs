#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;

const AUTO_MARKER = "ALPHA55_AUTO_MATERIAL_ORDER_LIFECYCLE";
const DEVICE_MARKER = "ALPHA55_DEVICE_MATERIAL_ORDER_LIFECYCLE";
const ZERO_ORDER_MARKER = "ALPHA55_AUTO_ZERO_ORDER_LIFECYCLE";
const REQUIRED_CONFIRMATION = "CREATE WAFL ALPHA55 SYNTHETIC MATERIAL ORDER FIXTURES";
const REQUIRED_APPROVAL = "2.0.0-alpha.55-dev-test-mobile-material-order-lifecycle-runtime";
const REQUIRED_PREFIX = "wafl-fn";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const EXPECTED_BASELINE = Object.freeze({
  workOrderVersion: 42,
  revisionVersion: 42,
  materialVersionSum: 20,
  materialRows: 1,
  events: 75,
  receipts: 26,
  migrationLedger: 13,
  legacyCancelled: 2,
});
const EXPECTED_PARTIAL_BASELINE = Object.freeze({
  workOrderVersion: 43,
  revisionVersion: 43,
  materialVersionSum: 21,
  materialRows: 2,
  events: 76,
  receipts: 27,
  migrationLedger: 13,
  legacyCancelled: 2,
});

function fail(message) {
  throw new Error(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function shortRef(value) {
  return sha256(value).slice(0, 12);
}

function databaseIdentity(connectionString) {
  const parsed = new URL(connectionString);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  if (!new Set(["postgres:", "postgresql:"]).has(parsed.protocol) || !parsed.hostname || !databaseName) {
    fail("database-url-invalid");
  }
  return sha256(`${parsed.hostname}/${databaseName}`).slice(0, 12);
}

function assertGuard() {
  const runtime = String(process.env.WAFL_V2_RUNTIME ?? "").trim().toLowerCase();
  const connectionString = process.env.DATABASE_URL;
  const approvedFingerprint = String(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT ?? "").trim().toLowerCase();
  if (!ALLOWED_RUNTIMES.has(runtime)) fail("runtime-not-dev-test");
  if (!connectionString) fail("database-url-missing");
  if (String(process.env.WAFL_V2_TEST_PREFIX ?? "").trim() !== REQUIRED_PREFIX) fail("fixture-prefix-mismatch");
  if (process.env.WAFL_V2_READ_APPROVED !== "1" || process.env.WAFL_V2_READ_API_ENABLED !== "1") {
    fail("read-api-guard-missing");
  }
  if (process.env.WAFL_V2_COMMAND_API_ENABLED !== "1") fail("command-api-disabled");
  if (process.env.WAFL_V2_CONFIRMATION !== REQUIRED_CONFIRMATION) fail("confirmation-mismatch");
  if (process.env.WAFL_V2_COMMAND_MUTATION_APPROVED !== REQUIRED_APPROVAL) fail("mutation-approval-mismatch");
  const actualFingerprint = databaseIdentity(connectionString);
  if (!approvedFingerprint || approvedFingerprint !== actualFingerprint) fail("db-fingerprint-mismatch");
  return { connectionString, fingerprint: actualFingerprint };
}

function sessionSecret() {
  const value = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!value) fail("session-secret-missing");
  return value;
}

function createSessionCookie(actor) {
  const payload = {
    userId: actor.userId,
    companyId: actor.companyId,
    companyMemberId: actor.companyMemberId,
    companyName: "WAFL synthetic runtime company",
    role: "company_admin",
    email: `${actor.userId}@example.invalid`,
    name: "WAFL alpha55 fixture preparation",
    issuedAt: new Date().toISOString(),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret()).update(encoded).digest("base64url");
  return `wafl_auth_session=${encoded}.${signature}`;
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("free-port-unavailable")));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForServer(baseUrl, child, timeoutMs = 60_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (child.exitCode !== null) fail(`next-server-exited:${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/api/v2/work-orders?limit=1`, {
        redirect: "manual",
        signal: AbortSignal.timeout(5_000),
      });
      if (response.status === 401) return;
      if (response.status === 403) fail("next-server-runtime-guard-blocked");
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("next-server-")) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail("next-server-start-timeout");
}

async function stopOwnedChild(child) {
  if (!child || child.exitCode !== null) return;
  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.kill();
  await Promise.race([
    exited,
    new Promise((_, reject) => setTimeout(() => reject(new Error("owned-next-stop-timeout")), 15_000)),
  ]);
}

async function requestJson(baseUrl, routePath, actor, body, idempotencyKey) {
  const response = await fetch(`${baseUrl}${routePath}`, {
    method: "POST",
    redirect: "manual",
    headers: {
      Cookie: createSessionCookie(actor),
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    fail(`invalid-json-response:${response.status}`);
  }
  return {
    response,
    payload,
    replay: response.headers.get("X-WAFL-Idempotent-Replay") === "1",
    transactionCount: Number(response.headers.get("X-WAFL-Command-Transaction-Count") ?? 0),
  };
}

async function readContext(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const target = (await client.query(`
      SELECT w.company_id, w.id AS work_order_id, w.current_revision_id AS revision_id,
             w.entity_version AS work_order_version, r.entity_version AS revision_version,
             r.revision_status,
             (SELECT count(*)::integer
                FROM work_order_material_lines m
               WHERE m.company_id = w.company_id AND m.revision_id = r.id) AS material_rows,
             (SELECT COALESCE(sum(m.entity_version), 0)::integer
                FROM work_order_material_lines m
               WHERE m.company_id = w.company_id AND m.revision_id = r.id) AS material_version_sum
        FROM work_orders w
        JOIN work_order_revisions r
          ON r.company_id = w.company_id AND r.id = w.current_revision_id
       WHERE w.status = 'draft'
         AND r.revision_status = 'draft'
         AND w.deleted_at IS NULL
         AND (
           w.entity_version = $1
           OR EXISTS (
             SELECT 1
               FROM work_order_material_lines marker
              WHERE marker.company_id = w.company_id
                AND marker.revision_id = r.id
                AND marker.name = ANY($2::text[])
           )
         )
       ORDER BY CASE WHEN EXISTS (
         SELECT 1
           FROM work_order_material_lines marker
          WHERE marker.company_id = w.company_id
            AND marker.revision_id = r.id
            AND marker.name = ANY($2::text[])
       ) THEN 0 ELSE 1 END,
       w.updated_at DESC, w.id DESC
       LIMIT 1
    `, [EXPECTED_BASELINE.workOrderVersion, [AUTO_MARKER, DEVICE_MARKER]])).rows[0];
    assert.ok(target, "approved-current-draft-target-missing");

    const actor = (await client.query(`
      SELECT id AS company_member_id, user_id
        FROM company_members
       WHERE company_id = $1 AND status = 'approved'
       ORDER BY created_at, id
       LIMIT 1
    `, [target.company_id])).rows[0];
    assert.ok(actor, "approved-company-actor-missing");

    const supplier = (await client.query(`
      SELECT id
        FROM partners
       WHERE company_id = $1 AND COALESCE(is_active, true) = true
       ORDER BY created_at, id
       LIMIT 1
    `, [target.company_id])).rows[0];
    assert.ok(supplier, "approved-company-supplier-missing");

    const markers = (await client.query(`
      SELECT m.id, m.name, m.status, m.entity_version, m.archived_at,
             m.supplier_partner_id, m.required_quantity::text, m.allowance_quantity::text,
             m.inventory_usage_quantity::text, m.order_quantity::text, m.unit_code,
             m.unit_price::text, m.amount::text, m.material_type, m.revision_id, m.company_id
        FROM work_order_material_lines m
       WHERE m.name = ANY($1::text[])
       ORDER BY m.name, m.id
    `, [[AUTO_MARKER, DEVICE_MARKER]])).rows;

    const counts = (await client.query(`
      SELECT (SELECT count(*)::integer FROM domain_events) AS event_count,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
             (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count,
             (SELECT count(*)::integer FROM work_order_material_lines WHERE status = 'cancelled') AS legacy_cancelled
    `)).rows[0];

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
      target,
      actor: {
        companyId: target.company_id,
        companyMemberId: actor.company_member_id,
        userId: actor.user_id,
      },
      supplierId: supplier.id,
      markers,
      counts,
      legacyFingerprint: sha256(JSON.stringify(legacyRows)),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function assertApprovedMarker(row, context) {
  assert.equal(row.company_id, context.target.company_id);
  assert.equal(row.revision_id, context.target.revision_id);
  assert.equal(row.material_type, "fabric");
  assert.equal(row.status, "editing");
  assert.equal(row.archived_at, null);
  assert.equal(row.supplier_partner_id, context.supplierId);
  assert.equal(Number(row.required_quantity), 2);
  assert.equal(Number(row.allowance_quantity), 0.5);
  assert.equal(Number(row.inventory_usage_quantity), 0);
  assert.equal(Number(row.order_quantity), 2.5);
  assert.equal(row.unit_code, "m");
  assert.equal(Number(row.unit_price), 10_000);
  assert.equal(Number(row.amount), 25_000);
}

function assertContextBaseline(context, expected) {
  assert.equal(Number(context.target.work_order_version), expected.workOrderVersion);
  assert.equal(Number(context.target.revision_version), expected.revisionVersion);
  assert.equal(Number(context.target.material_rows), expected.materialRows);
  assert.equal(Number(context.target.material_version_sum), expected.materialVersionSum);
  assert.equal(Number(context.counts.event_count), expected.events);
  assert.equal(Number(context.counts.receipt_count), expected.receipts);
  assert.equal(Number(context.counts.migration_count), expected.migrationLedger);
  assert.equal(Number(context.counts.legacy_cancelled), expected.legacyCancelled);
}

async function snapshot(client, context) {
  await client.query("BEGIN READ ONLY");
  try {
    const parent = (await client.query(`
      SELECT w.entity_version AS work_order_version, r.entity_version AS revision_version,
             (SELECT count(*)::integer FROM work_order_material_lines m
               WHERE m.company_id = w.company_id AND m.revision_id = r.id) AS material_rows,
             (SELECT COALESCE(sum(m.entity_version), 0)::integer FROM work_order_material_lines m
               WHERE m.company_id = w.company_id AND m.revision_id = r.id) AS material_version_sum,
             (SELECT count(*)::integer FROM domain_events) AS event_count,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
             (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count,
             (SELECT count(*)::integer FROM work_order_material_lines WHERE status = 'cancelled') AS legacy_cancelled
        FROM work_orders w
        JOIN work_order_revisions r
          ON r.company_id = w.company_id AND r.id = w.current_revision_id
       WHERE w.company_id = $1 AND w.id = $2::uuid
    `, [context.target.company_id, context.target.work_order_id])).rows[0];
    const markers = (await client.query(`
      SELECT id, name, status, entity_version, archived_at, supplier_partner_id,
             required_quantity::text, allowance_quantity::text,
             inventory_usage_quantity::text, order_quantity::text,
             unit_code, unit_price::text, amount::text, material_type, revision_id, company_id
        FROM work_order_material_lines
       WHERE name = ANY($1::text[])
       ORDER BY name, id
    `, [[AUTO_MARKER, DEVICE_MARKER]])).rows;
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
      workOrderVersion: Number(parent.work_order_version),
      revisionVersion: Number(parent.revision_version),
      materialRows: Number(parent.material_rows),
      materialVersionSum: Number(parent.material_version_sum),
      events: Number(parent.event_count),
      receipts: Number(parent.receipt_count),
      migrationLedger: Number(parent.migration_count),
      legacyCancelled: Number(parent.legacy_cancelled),
      markers,
      legacyFingerprint: sha256(JSON.stringify(legacyRows)),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function assertDelta(before, after, expected) {
  assert.equal(after.workOrderVersion - before.workOrderVersion, expected.workOrderVersion);
  assert.equal(after.revisionVersion - before.revisionVersion, expected.revisionVersion);
  assert.equal(after.materialVersionSum - before.materialVersionSum, expected.materialVersionSum);
  assert.equal(after.materialRows - before.materialRows, expected.materialRows);
  assert.equal(after.events - before.events, expected.events);
  assert.equal(after.receipts - before.receipts, expected.receipts);
  assert.equal(after.migrationLedger, before.migrationLedger);
  assert.equal(after.legacyCancelled, before.legacyCancelled);
  assert.equal(after.legacyFingerprint, before.legacyFingerprint);
}

function fixtureBody(marker, expectedVersion) {
  return {
    clientRequestId: `${marker}-create`,
    expectedVersion,
    materialType: "fabric",
    materialId: null,
    name: marker,
    partnerId: null,
    colorOption: "ALPHA55 QA",
    usageArea: "synthetic dev/test material order lifecycle",
    requiredQuantity: "2",
    allowanceQuantity: "0.5",
    inventoryUsageQuantity: "0",
    orderQuantity: "2.5",
    unitCode: "m",
    unitPrice: "10000",
    memo: "WAFL alpha.55 QA 공급처를 사용하는 retained synthetic fixture",
  };
}

function zeroOrderFixtureBody(expectedVersion) {
  return {
    clientRequestId: `${ZERO_ORDER_MARKER}-create`,
    expectedVersion,
    materialType: "fabric",
    materialId: null,
    name: ZERO_ORDER_MARKER,
    partnerId: null,
    colorOption: "ALPHA55 ZERO ORDER QA",
    usageArea: "synthetic dev/test stock-covered zero-order lifecycle",
    requiredQuantity: "3",
    allowanceQuantity: "0.5",
    inventoryUsageQuantity: "3.5",
    orderQuantity: "0",
    unitCode: "m",
    unitPrice: "0",
    memo: "WAFL alpha.55 retained stock-covered zero-order fixture",
  };
}

async function readZeroOrderMarker(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const rows = (await client.query(`
      SELECT id, name, status, entity_version, archived_at, supplier_partner_id,
             required_quantity::text, allowance_quantity::text,
             inventory_usage_quantity::text, order_quantity::text,
             unit_code, unit_price::text, amount::text, material_type, revision_id, company_id
        FROM work_order_material_lines
       WHERE name = $1
       ORDER BY id
    `, [ZERO_ORDER_MARKER])).rows;
    await client.query("COMMIT");
    return rows;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function assertZeroOrderFixture(row, context) {
  assert.ok(row, "zero-order-fixture-missing");
  assert.equal(row.company_id, context.target.company_id);
  assert.equal(row.revision_id, context.target.revision_id);
  assert.equal(row.material_type, "fabric");
  assert.equal(row.status, "editing");
  assert.equal(Number(row.entity_version), 1);
  assert.equal(row.archived_at, null);
  assert.equal(row.supplier_partner_id, null);
  assert.equal(Number(row.required_quantity), 3);
  assert.equal(Number(row.allowance_quantity), 0.5);
  assert.equal(Number(row.inventory_usage_quantity), 3.5);
  assert.equal(Number(row.order_quantity), 0);
  assert.equal(row.unit_code, "m");
  assert.equal(Number(row.unit_price), 0);
  assert.equal(Number(row.amount), 0);
}

function assertZeroOrderPreparationBaseline(snapshotValue, context) {
  assert.deepEqual({
    workOrderVersion: snapshotValue.workOrderVersion,
    revisionVersion: snapshotValue.revisionVersion,
    materialVersionSum: snapshotValue.materialVersionSum,
    materialRows: snapshotValue.materialRows,
    events: snapshotValue.events,
    receipts: snapshotValue.receipts,
    migrationLedger: snapshotValue.migrationLedger,
    legacyCancelled: snapshotValue.legacyCancelled,
  }, {
    workOrderVersion: 57,
    revisionVersion: 57,
    materialVersionSum: 35,
    materialRows: 3,
    events: 90,
    receipts: 34,
    migrationLedger: 13,
    legacyCancelled: 2,
  });
  const auto = snapshotValue.markers.find((row) => row.name === AUTO_MARKER);
  const device = snapshotValue.markers.find((row) => row.name === DEVICE_MARKER);
  assert.deepEqual([auto?.status, Number(auto?.entity_version)], ["completed", 6]);
  assert.deepEqual([device?.status, Number(device?.entity_version)], ["editing", 5]);
  assert.equal(auto?.company_id, context.target.company_id);
  assert.equal(device?.company_id, context.target.company_id);
}

async function runZeroOrderFixture() {
  const guard = assertGuard();
  const client = new Client({
    connectionString: guard.connectionString,
    application_name: "wafl-alpha55-zero-order-fixture",
  });
  await client.connect();
  let child;
  try {
    const context = await readContext(client);
    const before = await snapshot(client, context);
    assertZeroOrderPreparationBaseline(before, context);
    const existing = await readZeroOrderMarker(client);
    assert.equal(existing.length, 0, "zero-order-marker-conflicts-with-approved-baseline");
    const fixtureFingerprint = sha256(JSON.stringify(before.markers));

    const port = await getFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [
      path.join("node_modules", "next", "dist", "bin", "next"),
      "start", "-H", "127.0.0.1", "-p", String(port),
    ], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    await waitForServer(baseUrl, child);

    const response = await requestJson(
      baseUrl,
      `/api/v2/work-orders/${context.target.work_order_id}/materials`,
      context.actor,
      zeroOrderFixtureBody(before.workOrderVersion),
      "alpha55-fixture-auto-zero-order-lifecycle-v1",
    );
    assert.equal(response.response.status, 201);
    assert.equal(response.payload?.ok, true);
    assert.equal(response.payload?.data?.result?.status, "editing");
    assert.equal(response.payload?.data?.result?.lineVersion, 1);
    assert.equal(response.payload?.data?.result?.nextVersion, 58);
    assert.equal(response.replay, false);
    assert.equal(response.transactionCount, 1);

    const after = await snapshot(client, context);
    assertDelta(before, after, {
      workOrderVersion: 1,
      revisionVersion: 1,
      materialVersionSum: 1,
      materialRows: 1,
      events: 1,
      receipts: 1,
    });
    assert.deepEqual({
      workOrderVersion: after.workOrderVersion,
      revisionVersion: after.revisionVersion,
      materialVersionSum: after.materialVersionSum,
      materialRows: after.materialRows,
      events: after.events,
      receipts: after.receipts,
    }, {
      workOrderVersion: 58,
      revisionVersion: 58,
      materialVersionSum: 36,
      materialRows: 4,
      events: 91,
      receipts: 35,
    });
    assert.equal(sha256(JSON.stringify(after.markers)), fixtureFingerprint, "fixture-a-or-b-changed");
    const created = await readZeroOrderMarker(client);
    assert.equal(created.length, 1, "zero-order-marker-count");
    assertZeroOrderFixture(created[0], context);
    assert.equal(created[0].id, response.payload.data.result.materialLineId);

    console.log(JSON.stringify({
      status: "ALPHA55_ZERO_ORDER_FIXTURE_CREATED",
      databaseFingerprint: guard.fingerprint,
      workOrderRef: shortRef(context.target.work_order_id),
      marker: ZERO_ORDER_MARKER,
      materialRef: shortRef(created[0].id),
      state: created[0].status,
      version: Number(created[0].entity_version),
      baseline: {
        workOrderVersion: after.workOrderVersion,
        revisionVersion: after.revisionVersion,
        materialVersionSum: after.materialVersionSum,
        events: after.events,
        receipts: after.receipts,
      },
      fixtureAAndBChanged: 0,
      legacyCancelledUnchanged: true,
      productionMutation: 0,
      archiveDeleteRestoreMutation: 0,
      automaticDuplicateUnknownMutation: 0,
    }));
  } finally {
    await stopOwnedChild(child);
    await client.end();
  }
}

async function run() {
  const guard = assertGuard();
  const client = new Client({
    connectionString: guard.connectionString,
    application_name: "wafl-alpha55-material-order-fixtures",
  });
  await client.connect();
  let child;
  try {
    const context = await readContext(client);
    let markersToCreate;
    let reusedExistingApprovedFixture = null;
    if (context.markers.length === 0) {
      assertContextBaseline(context, EXPECTED_BASELINE);
      markersToCreate = [AUTO_MARKER, DEVICE_MARKER];
    } else if (context.markers.length === 1 && context.markers[0]?.name === AUTO_MARKER) {
      assertContextBaseline(context, EXPECTED_PARTIAL_BASELINE);
      assertApprovedMarker(context.markers[0], context);
      assert.equal(Number(context.markers[0].entity_version), 1);
      reusedExistingApprovedFixture = AUTO_MARKER;
      markersToCreate = [DEVICE_MARKER];
    } else {
      fail("fixture-marker-set-conflicts-with-approved-resume-baseline");
    }

    const port = await getFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [
      path.join("node_modules", "next", "dist", "bin", "next"),
      "start", "-H", "127.0.0.1", "-p", String(port),
    ], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    await waitForServer(baseUrl, child);

    let before = await snapshot(client, context);
    const resumeBaseline = before;
    const materialPath = `/api/v2/work-orders/${context.target.work_order_id}/materials`;
    for (const marker of markersToCreate) {
      const body = fixtureBody(marker, before.workOrderVersion);
      body.partnerId = context.supplierId;
      const response = await requestJson(
        baseUrl,
        materialPath,
        context.actor,
        body,
        `alpha55-fixture-${marker.toLowerCase()}-v1`,
      );
      assert.equal(response.response.status, 201);
      assert.equal(response.payload?.ok, true);
      assert.equal(response.payload?.data?.result?.materialType, "fabric");
      assert.equal(response.payload?.data?.result?.status, "editing");
      assert.match(
        String(response.payload?.data?.result?.materialLineId ?? ""),
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      assert.equal(response.payload?.data?.result?.lifecycle, "active");
      assert.equal(response.payload?.data?.result?.lineVersion, 1);
      assert.equal(response.payload?.data?.result?.nextVersion, before.workOrderVersion + 1);
      assert.equal(response.payload?.data?.nextVersion, before.workOrderVersion + 1);
      assert.equal(response.replay, false);
      assert.equal(response.transactionCount, 1);

      const after = await snapshot(client, context);
      assertDelta(before, after, {
        workOrderVersion: 1,
        revisionVersion: 1,
        materialVersionSum: 1,
        materialRows: 1,
        events: 1,
        receipts: 1,
      });
      const created = after.markers.find((row) => row.name === marker);
      assert.ok(created, `fixture-marker-missing:${marker}`);
      assertApprovedMarker(created, context);
      assert.equal(created.id, response.payload.data.result.materialLineId);
      assert.equal(after.markers.filter((row) => row.name === marker).length, 1);
      before = after;
    }

    assert.equal(before.workOrderVersion, 44);
    assert.equal(before.revisionVersion, 44);
    assert.equal(before.materialVersionSum, 22);
    assert.equal(before.materialRows, 3);
    assert.equal(before.events, 77);
    assert.equal(before.receipts, 28);
    assert.equal(before.markers.length, 2);
    assert.equal(before.legacyCancelled, 2);
    assert.equal(before.legacyFingerprint, context.legacyFingerprint);

    console.log(JSON.stringify({
      status: "ALPHA55_SYNTHETIC_FIXTURES_CREATED",
      databaseFingerprint: guard.fingerprint,
      workOrderRef: shortRef(context.target.work_order_id),
      reusedExistingApprovedFixture,
      createdMarkers: markersToCreate,
      markers: before.markers.map((row) => ({
        name: row.name,
        status: row.status,
        version: Number(row.entity_version),
      })),
      delta: {
        workOrderVersion: before.workOrderVersion - resumeBaseline.workOrderVersion,
        revisionVersion: before.revisionVersion - resumeBaseline.revisionVersion,
        materialVersionSum: before.materialVersionSum - resumeBaseline.materialVersionSum,
        materialRows: before.materialRows - resumeBaseline.materialRows,
        events: before.events - resumeBaseline.events,
        receipts: before.receipts - resumeBaseline.receipts,
      },
      baseline: {
        workOrderVersion: before.workOrderVersion,
        revisionVersion: before.revisionVersion,
        materialVersionSum: before.materialVersionSum,
        events: before.events,
        receipts: before.receipts,
        migrationLedger: before.migrationLedger,
      },
      legacyCancelledUnchanged: true,
      productionMutation: 0,
      archiveDeleteRestoreMutation: 0,
      automaticDuplicateUnknownMutation: 0,
    }));
  } finally {
    await stopOwnedChild(child);
    await client.end();
  }
}

if (process.argv.includes("--zero-order")) {
  await runZeroOrderFixture();
} else {
  await run();
}
