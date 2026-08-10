#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

import { createDestructiveConfirmationActions } from "../apps/mobile/domain/destructiveConfirmationPolicy.ts";

const { Client } = pg;
const ROOT = process.cwd();
const STATE_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "state.json");
const RESULT_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "alpha60-draft-child-hard-delete-runtime-result.json");
const COMPANY_A = "wafl-fn-company-a";
const FIXTURE_PREFIX = "QA A60 draft child hard delete";
const SUCCESS_CHECKPOINT = "ALPHA60_DRAFT_COMPONENT_HARD_DELETE_AND_SHARED_ARCHITECTURE_RULES_IPHONE_QA_REQUIRED";
const EXTERNAL_ORDER_FIXTURE_QUANTITY = "3.5";
const EXTERNAL_ORDER_FIXTURE_UNIT_PRICE = "1000";

function assertExternalOrderFixtureReady() {
  assert.ok(Number(EXTERNAL_ORDER_FIXTURE_QUANTITY) > 0, "EXTERNAL_ORDER_FIXTURE_QUANTITY_MUST_BE_POSITIVE");
  assert.ok(Number(EXTERNAL_ORDER_FIXTURE_UNIT_PRICE) > 0, "EXTERNAL_ORDER_FIXTURE_UNIT_PRICE_MUST_BE_POSITIVE");
}

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function identityRef(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

function receiptCompositeKey(row) {
  return {
    companyId: row.company_id,
    commandCode: row.command_code,
    idempotencyKey: row.idempotency_key,
  };
}

function serializeReceiptCompositeKey(key) {
  return JSON.stringify([key.companyId, key.commandCode, key.idempotencyKey]);
}

function readLocalEnvironment() {
  const values = {};
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

function databaseFingerprint(connectionString) {
  const parsed = new URL(connectionString);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  assert.ok(new Set(["postgres:", "postgresql:"]).has(parsed.protocol) && parsed.hostname && databaseName, "DATABASE_URL_INVALID");
  return crypto.createHash("sha256").update(`${parsed.hostname}/${databaseName}`).digest("hex").slice(0, 12);
}

function createFixtureMarker() {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date()).replaceAll("-", "");
  return `${FIXTURE_PREFIX} ${date}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

async function provisionFixture(marker) {
  const env = readLocalEnvironment();
  assert.ok(env.DATABASE_URL, "FIXTURE_DATABASE_URL_MISSING");
  const sessionSecret = env.WAFL_SESSION_SECRET || env.GOOGLE_OAUTH_CLIENT_SECRET;
  assert.ok(sessionSecret, "FIXTURE_SESSION_SECRET_MISSING");
  const suffix = marker.slice(-8).toLowerCase();
  const child = spawn(process.execPath, [path.join(ROOT, "scripts", "run-wafl-v2-alpha46-create-qa-draft.mjs")], {
    cwd: ROOT,
    env: {
      ...process.env,
      DATABASE_URL: env.DATABASE_URL,
      WAFL_SESSION_SECRET: sessionSecret,
      WAFL_V2_RUNTIME: "test",
      WAFL_V2_TEST_PREFIX: "wafl-fn",
      WAFL_V2_CONFIRMATION: "EXECUTE WAFL V2 ALPHA60 ISOLATED QA DRAFT CREATE",
      WAFL_V2_READ_API_ENABLED: "1",
      WAFL_V2_READ_APPROVED: "1",
      WAFL_V2_COMMAND_API_ENABLED: "1",
      WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.25-dev-test-command-runtime",
      WAFL_V2_APPROVED_DB_FINGERPRINT: databaseFingerprint(env.DATABASE_URL),
      WAFL_V2_TEMPORARY_DRAFT_NAME: marker,
      WAFL_V2_TEMPORARY_DRAFT_MARKER: marker,
      WAFL_V2_TEMPORARY_DRAFT_CLIENT_REQUEST_ID: `a60-isolated-create-${suffix}`,
      WAFL_V2_TEMPORARY_DRAFT_IDEMPOTENCY_KEY: `a60-isolated-create-${suffix}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk.toString("utf8"); });
  child.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8"); });
  const exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
  });
  assert.equal(exitCode, 0, `FIXTURE_PROVISION_FAILED:${stderr.split(/\r?\n/).filter(Boolean).at(-1) ?? "unknown"}`);
  assert.match(stdout, /Result: PASS/);
}

function assertRunnerState() {
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  assert.equal(state.status, "running");
  assert.equal(state.runtimeQaMode, "draft-child-hard-delete");
  assert.equal(state.mutationMode, "draft-child-hard-delete");
  assert.equal(state.commandApi, "ready");
  assert.equal(state.nextPort, 3100);
  assert.equal(state.expoPort, 8081);
  assert.equal(state.previewTransport, "tailscale-serve-internal");
  assert.equal(state.quickTunnelReady, false);
  assert.equal(state.tailscaleServeReady, true);
  assert.equal(state.developerAutoConnectReady, true);
  assert.deepEqual(state.processes.map((record) => record.role).sort(), ["expo", "next", "tailscale-serve"]);
  for (const record of state.processes) {
    const marker = JSON.parse(fs.readFileSync(record.markerPath, "utf8"));
    assert.equal(marker.ownerMarker, state.ownerMarker);
    assert.equal(marker.pid, record.pid);
    assert.equal(marker.role, record.role);
  }
  return state;
}

async function readFixture(client, marker) {
  await client.query("BEGIN READ ONLY");
  try {
    const result = await client.query(`
      SELECT w.id AS work_order_id, w.company_id, w.current_revision_id AS revision_id,
             w.status, w.entity_version AS work_order_version, w.total_quantity,
             r.revision_status, r.entity_version AS revision_version,
             (SELECT count(*)::integer FROM work_order_sizes s WHERE s.company_id=w.company_id AND s.revision_id=r.id) AS sizes,
             (SELECT count(*)::integer FROM work_order_colors c WHERE c.company_id=w.company_id AND c.revision_id=r.id) AS colors,
             (SELECT count(*)::integer FROM color_size_quantities q WHERE q.company_id=w.company_id AND q.revision_id=r.id) AS quantities,
             (SELECT COALESCE(sum(q.quantity),0)::integer FROM color_size_quantities q WHERE q.company_id=w.company_id AND q.revision_id=r.id) AS matrix_total,
             (SELECT count(*)::integer FROM work_order_material_lines m WHERE m.company_id=w.company_id AND m.revision_id=r.id) AS materials,
             (SELECT count(*)::integer FROM work_order_material_lines m WHERE m.company_id=w.company_id AND m.revision_id=r.id AND m.archived_at IS NOT NULL) AS archived_materials,
             (SELECT count(*)::integer FROM domain_events e WHERE e.company_id=w.company_id AND e.entity_type='work_order' AND e.entity_id=w.id::text) AS events,
             (SELECT count(*)::integer FROM work_order_command_receipts cr WHERE cr.company_id=w.company_id AND cr.work_order_id=w.id) AS receipts,
             (SELECT count(*)::integer FROM generated_documents d WHERE d.company_id=w.company_id AND d.work_order_id=w.id) AS documents,
             (SELECT count(*)::integer FROM document_access_tokens t JOIN generated_documents d ON d.company_id=t.company_id AND d.id=t.generated_document_id WHERE d.company_id=w.company_id AND d.work_order_id=w.id) AS tokens
      FROM work_orders w
      JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.company_id=$1 AND w.product_name=$2 AND w.deleted_at IS NULL
      ORDER BY w.created_at, w.id
    `, [COMPANY_A, marker]);
    assert.equal(result.rows.length, 1, "FIXTURE_NOT_UNIQUE");
    const global = (await client.query(`
      SELECT (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migrations,
             (SELECT count(*)::integer FROM generated_documents) AS documents,
             (SELECT count(*)::integer FROM document_access_tokens) AS tokens,
             (SELECT count(*)::integer FROM companies) AS companies,
             (SELECT count(*)::integer FROM partners) AS partners,
             (SELECT count(*)::integer FROM materials) AS master_materials
    `)).rows[0];
    await client.query("COMMIT");
    return {
      ...result.rows[0],
      ...Object.fromEntries(Object.entries(result.rows[0]).filter(([key]) => !["work_order_id", "company_id", "revision_id", "status", "revision_status"].includes(key)).map(([key, value]) => [key, Number(value)])),
      global: Object.fromEntries(Object.entries(global).map(([key, value]) => [key, Number(value)])),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function readNonFixtureProductFingerprint(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const rows = (await client.query(`
      SELECT w.id::text, w.entity_version, w.current_revision_id::text, w.status,
             w.total_quantity, w.updated_at::text,
             COALESCE(r.entity_version, 0) AS revision_version,
             (SELECT count(*)::integer FROM work_order_sizes s WHERE s.company_id=w.company_id AND s.revision_id=w.current_revision_id) AS sizes,
             (SELECT count(*)::integer FROM work_order_colors c WHERE c.company_id=w.company_id AND c.revision_id=w.current_revision_id) AS colors,
             (SELECT count(*)::integer FROM color_size_quantities q WHERE q.company_id=w.company_id AND q.revision_id=w.current_revision_id) AS quantities,
             (SELECT count(*)::integer FROM work_order_material_lines m WHERE m.company_id=w.company_id AND m.revision_id=w.current_revision_id) AS materials
      FROM work_orders w
      LEFT JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.company_id=$1 AND w.product_name NOT LIKE $2
      ORDER BY w.id
    `, [COMPANY_A, `${FIXTURE_PREFIX} %`])).rows;
    await client.query("COMMIT");
    return crypto.createHash("sha256").update(JSON.stringify(rows)).digest("hex");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function assertImmutableGlobal(before, after) {
  assert.deepEqual(after.global, before.global, "MIGRATION_DOCUMENT_TOKEN_MUTATION_FORBIDDEN");
}

async function verifyMetroIosBundle(state) {
  const manifestResponse = await fetch(`http://127.0.0.1:${state.expoPort}/`, {
    headers: { Accept: "application/expo+json", "Expo-Platform": "ios" },
    signal: AbortSignal.timeout(60_000),
  });
  assert.equal(manifestResponse.status, 200);
  const manifest = await manifestResponse.json();
  assert.equal(typeof manifest?.launchAsset?.url, "string");
  const bundleResponse = await fetch(manifest.launchAsset.url, { signal: AbortSignal.timeout(180_000) });
  assert.equal(bundleResponse.status, 200);
  const bundleText = await bundleResponse.text();
  const markers = {
    permanentDelete: bundleText.includes("영구 삭제"),
    linkedQuantityCells: bundleText.includes("연결된 수량 셀"),
    materialHistoryGuard: bundleText.includes("발주 이력이 없는 항목만 삭제할 수 있습니다"),
  };
  assert.ok(Object.values(markers).every(Boolean), "METRO_ALPHA60_MARKERS_MISSING");
  return { manifest: 200, bundle: 200, bundleBytes: Buffer.byteLength(bundleText), markers };
}

function logIssueCounts(state) {
  const patterns = { fatal: /\bFATAL\b/gi, redScreen: /red[- ]screen/gi, uncaught: /\buncaught\b/gi, unhandled: /unhandled(?:rejection)?/gi };
  const counts = Object.fromEntries(Object.keys(patterns).map((key) => [key, 0]));
  for (const record of state.processes) {
    for (const key of ["stdoutPath", "stderrPath"]) {
      if (!record[key] || !fs.existsSync(record[key])) continue;
      const log = fs.readFileSync(record[key], "utf8");
      for (const [issue, pattern] of Object.entries(patterns)) counts[issue] += log.match(pattern)?.length ?? 0;
    }
  }
  return { ...counts, total: Object.values(counts).reduce((sum, value) => sum + value, 0) };
}

async function cleanupAutomatedFixture(client, fixture, marker, protectedMaterialIds) {
  await client.query("BEGIN");
  try {
    const locked = (await client.query(`
      SELECT w.id, w.company_id, w.current_revision_id, w.product_name, w.status, r.revision_status
      FROM work_orders w JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.id=$1::uuid AND w.company_id=$2 AND w.current_revision_id=$3::uuid
      FOR UPDATE OF w,r
    `, [fixture.work_order_id, COMPANY_A, fixture.revision_id])).rows[0];
    assert.ok(locked && locked.product_name === marker && marker.startsWith(`${FIXTURE_PREFIX} `));
    assert.deepEqual([locked.status, locked.revision_status], ["draft", "draft"]);
    const observed = (await client.query(`SELECT id::text FROM work_order_material_lines WHERE company_id=$1 AND revision_id=$2::uuid ORDER BY id`, [COMPANY_A, fixture.revision_id])).rows.map((row) => row.id);
    assert.deepEqual(observed, [...protectedMaterialIds].sort(), "CLEANUP_MATERIAL_OWNERSHIP_MISMATCH");
    const deletedMaterials = await client.query(`DELETE FROM work_order_material_lines WHERE company_id=$1 AND revision_id=$2::uuid AND id=ANY($3::uuid[]) RETURNING id`, [COMPANY_A, fixture.revision_id, protectedMaterialIds]);
    assert.equal(deletedMaterials.rowCount, protectedMaterialIds.length);
    const childCounts = (await client.query(`
      SELECT (SELECT count(*)::integer FROM work_order_sizes WHERE company_id=$1 AND revision_id=$2::uuid) AS sizes,
             (SELECT count(*)::integer FROM work_order_colors WHERE company_id=$1 AND revision_id=$2::uuid) AS colors,
             (SELECT count(*)::integer FROM color_size_quantities WHERE company_id=$1 AND revision_id=$2::uuid) AS quantities,
             (SELECT count(*)::integer FROM work_order_material_lines WHERE company_id=$1 AND revision_id=$2::uuid) AS materials,
             (SELECT count(*)::integer FROM generated_documents WHERE company_id=$1 AND work_order_id=$3::uuid) AS documents
    `, [COMPANY_A, fixture.revision_id, fixture.work_order_id])).rows[0];
    assert.ok(Object.values(childCounts).every((value) => Number(value) === 0), "CLEANUP_UNEXPECTED_CHILDREN");
    const receiptKeys = (await client.query(`
      SELECT company_id,command_code,idempotency_key
      FROM work_order_command_receipts
      WHERE company_id=$1 AND work_order_id=$2::uuid AND result_revision_id=$3::uuid
      ORDER BY company_id,command_code,idempotency_key
      FOR UPDATE
    `, [COMPANY_A, fixture.work_order_id, fixture.revision_id])).rows.map(receiptCompositeKey);
    assert.ok(receiptKeys.length >= 1);
    const detachedReceiptKeys = [];
    for (const key of receiptKeys) {
      const detached = await client.query(`
        UPDATE work_order_command_receipts
        SET work_order_id=NULL,result_revision_id=NULL
        WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
          AND work_order_id=$4::uuid AND result_revision_id=$5::uuid
        RETURNING company_id,command_code,idempotency_key
      `, [key.companyId, key.commandCode, key.idempotencyKey, fixture.work_order_id, fixture.revision_id]);
      assert.equal(detached.rowCount, 1, "CLEANUP_RECEIPT_REFERENCE_DETACH_MISMATCH");
      detachedReceiptKeys.push(receiptCompositeKey(detached.rows[0]));
    }
    assert.deepEqual(
      detachedReceiptKeys.map(serializeReceiptCompositeKey).sort(),
      receiptKeys.map(serializeReceiptCompositeKey).sort(),
      "CLEANUP_RECEIPT_IDENTITY_MISMATCH",
    );
    const parent = await client.query(`UPDATE work_orders SET current_revision_id=NULL WHERE id=$1::uuid AND company_id=$2 AND current_revision_id=$3::uuid AND status='draft' RETURNING id`, [fixture.work_order_id, COMPANY_A, fixture.revision_id]);
    assert.equal(parent.rowCount, 1);
    assert.equal((await client.query(`DELETE FROM work_order_revisions WHERE id=$1::uuid AND company_id=$2 AND work_order_id=$3::uuid AND revision_status='draft' RETURNING id`, [fixture.revision_id, COMPANY_A, fixture.work_order_id])).rowCount, 1);
    assert.equal((await client.query(`DELETE FROM work_orders WHERE id=$1::uuid AND company_id=$2 AND status='draft' AND current_revision_id IS NULL RETURNING id`, [fixture.work_order_id, COMPANY_A])).rowCount, 1);
    await client.query("COMMIT");
    return {
      exactMaterialRowsRemoved: deletedMaterials.rowCount,
      detachedReceiptCount: detachedReceiptKeys.length,
      detachedReceiptRefs: detachedReceiptKeys.map(serializeReceiptCompositeKey).map(identityRef).sort(),
      parentRowsRemoved: 2,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function run() {
  const state = assertRunnerState();
  const baseUrl = `https://${state.tailscaleServeHostname}`;
  const requests = [];
  let cookie = "";
  async function jsonRequest(route, options = {}) {
    const safeRoute = route.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ":uuid");
    const response = await fetch(`${baseUrl}${route}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
        ...(!cookie ? {} : { Cookie: cookie }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(60_000),
    });
    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch { /* asserted by caller */ }
    requests.push({ method: options.method ?? "GET", route: safeRoute, status: response.status, replay: response.headers.get("x-wafl-idempotent-replay") === "1" });
    return { response, body };
  }

  const auth = await jsonRequest("/api/dev/mobile-connect/auto", { method: "POST" });
  assert.equal(auth.response.status, 200);
  assert.equal(auth.body?.connected, true);
  assert.ok(cookie);

  const env = readLocalEnvironment();
  const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha60-draft-child-hard-delete-runtime-qa" });
  await client.connect();
  const runSuffix = crypto.randomBytes(4).toString("hex");
  const ledger = [];
  const identity = (label) => ({ clientRequestId: `alpha60-${runSuffix}-${label}`, idempotencyKey: `alpha60-${runSuffix}-${label}` });
  let automatedMarker = null;
  let ownerMarker = null;
  let automatedFixture = null;
  let ownerFixture = null;
  let cleanupEvidence = null;
  try {
    const nonFixtureProductFingerprintBefore = await readNonFixtureProductFingerprint(client);
    const supplierPartnerId = (await client.query(`
      SELECT id FROM partners
      WHERE company_id=$1 AND is_active=true
      ORDER BY created_at,id LIMIT 1
    `, [COMPANY_A])).rows[0]?.id;
    assert.ok(supplierPartnerId, "ACTIVE_SUPPLIER_PARTNER_MISSING");
    async function command(marker, route, options, expected) {
      const before = await readFixture(client, marker);
      const result = await jsonRequest(route, options);
      assert.equal(result.response.status, expected.status, `${options.method} ${route}`);
      const after = await readFixture(client, marker);
      assertImmutableGlobal(before, after);
      const changed = expected.semantic === "changed";
      assert.equal(after.work_order_version - before.work_order_version, changed ? 1 : 0);
      assert.equal(after.revision_version - before.revision_version, changed ? 1 : 0);
      assert.equal(after.events - before.events, changed ? 1 : 0);
      assert.equal(after.receipts - before.receipts, changed ? 1 : 0);
      if (expected.replay !== undefined) assert.equal(result.response.headers.get("x-wafl-idempotent-replay") === "1", expected.replay);
      ledger.push({ key: expected.key, semantic: expected.semantic, status: result.response.status, versionDelta: after.work_order_version - before.work_order_version, eventDelta: after.events - before.events, receiptDelta: after.receipts - before.receipts, pass: true });
      return { ...result, before, after };
    }

    automatedMarker = createFixtureMarker();
    await provisionFixture(automatedMarker);
    automatedFixture = await readFixture(client, automatedMarker);
    assert.deepEqual([automatedFixture.status, automatedFixture.revision_status, automatedFixture.work_order_version, automatedFixture.revision_version, automatedFixture.total_quantity], ["draft", "draft", 1, 1, 0]);
    let version = automatedFixture.work_order_version;
    const workOrderId = automatedFixture.work_order_id;
    const sizePath = `/api/v2/work-orders/${workOrderId}/size-color/sizes`;
    const colorPath = `/api/v2/work-orders/${workOrderId}/size-color/colors`;
    const materialPath = `/api/v2/work-orders/${workOrderId}/materials`;

    const createSize = async (label, key) => {
      const request = identity(key);
      const response = await command(automatedMarker, sizePath, { method: "POST", idempotencyKey: request.idempotencyKey, body: { clientRequestId: request.clientRequestId, expectedVersion: version, displayLabel: label } }, { key, semantic: "changed", status: 201, replay: false });
      version = response.after.work_order_version;
      return response.body.data.result.targetId;
    };
    const createColor = async (name, hexValue, key) => {
      const request = identity(key);
      const response = await command(automatedMarker, colorPath, { method: "POST", idempotencyKey: request.idempotencyKey, body: { clientRequestId: request.clientRequestId, expectedVersion: version, displayName: name, hexValue } }, { key, semantic: "changed", status: 201, replay: false });
      version = response.after.work_order_version;
      return response.body.data.result.targetId;
    };
    const upsertQuantity = async (colorId, sizeId, quantity, key) => {
      const request = identity(key);
      const response = await command(automatedMarker, `/api/v2/work-orders/${workOrderId}/size-color/quantities/${colorId}/${sizeId}`, { method: "PATCH", idempotencyKey: request.idempotencyKey, body: { clientRequestId: request.clientRequestId, expectedVersion: version, quantity } }, { key, semantic: "changed", status: 200, replay: false });
      version = response.after.work_order_version;
      return response;
    };
    const createMaterial = async (materialType, name, key) => {
      const request = identity(key);
      const response = await command(automatedMarker, materialPath, { method: "POST", idempotencyKey: request.idempotencyKey, body: {
        clientRequestId: request.clientRequestId, expectedVersion: version, materialType, materialId: null, name,
        partnerId: supplierPartnerId, colorOption: "A60 QA", usageArea: "alpha.60 isolated QA", requiredQuantity: "3",
        allowanceQuantity: "0.5", inventoryUsageQuantity: "0", orderQuantity: EXTERNAL_ORDER_FIXTURE_QUANTITY,
        unitCode: materialType === "fabric" ? "m" : "개", unitPrice: EXTERNAL_ORDER_FIXTURE_UNIT_PRICE,
        memo: "alpha.60 exact isolated fixture",
      } }, { key, semantic: "changed", status: 201, replay: false });
      version = response.after.work_order_version;
      return response.body.data.result.materialLineId;
    };
    const lifecycle = async (materialId, endpoint, key) => {
      if (endpoint === "order-request") assertExternalOrderFixtureReady();
      const request = identity(key);
      const response = await command(automatedMarker, `${materialPath}/${materialId}/${endpoint}`, { method: "POST", idempotencyKey: request.idempotencyKey, body: { clientRequestId: request.clientRequestId, expectedVersion: version, ...(endpoint === "order-cancel" ? { reason: "alpha.60 protected-history QA" } : {}) } }, { key, semantic: "changed", status: 200, replay: false });
      version = response.after.work_order_version;
      return response;
    };

    const lId = await createSize("L", "size-l-create");
    const xlId = await createSize("XL", "size-xl-create");
    const navyId = await createColor("남색", "#1B2A4A", "color-navy-create");
    const testColorId = await createColor("삭제검증색", "#AA3355", "color-test-create");
    await upsertQuantity(navyId, lId, 100, "qty-navy-l-100");
    await upsertQuantity(navyId, xlId, 100, "qty-navy-xl-100");
    await upsertQuantity(testColorId, xlId, 50, "qty-test-xl-50");
    assert.deepEqual([Number((await readFixture(client, automatedMarker)).matrix_total), Number((await readFixture(client, automatedMarker)).total_quantity)], [250, 250]);

    const deleteSizeIdentity = identity("size-l-delete");
    const deleteSizeBody = { clientRequestId: deleteSizeIdentity.clientRequestId, expectedVersion: version };
    const sizeDeleted = await command(automatedMarker, `${sizePath}/${lId}`, { method: "DELETE", idempotencyKey: deleteSizeIdentity.idempotencyKey, body: deleteSizeBody }, { key: "size-delete", semantic: "changed", status: 200, replay: false });
    version = sizeDeleted.after.work_order_version;
    assert.deepEqual([sizeDeleted.body.data.result.deletedQuantityCellCount, sizeDeleted.body.data.result.removedQuantity, sizeDeleted.body.data.result.totalQuantity], [1, 100, 150]);
    assert.deepEqual([sizeDeleted.after.quantities, sizeDeleted.after.matrix_total, sizeDeleted.after.total_quantity], [2, 150, 150]);
    const sizeReplay = await command(automatedMarker, `${sizePath}/${lId}`, { method: "DELETE", idempotencyKey: deleteSizeIdentity.idempotencyKey, body: deleteSizeBody }, { key: "size-delete-replay", semantic: "replay", status: 200, replay: true });
    assert.deepEqual([sizeReplay.body.data.result.deletedQuantityCellCount, sizeReplay.body.data.result.removedQuantity, sizeReplay.body.data.result.totalQuantity], [1, 100, 150]);
    const missingSizeIdentity = identity("size-l-delete-new-key");
    await command(automatedMarker, `${sizePath}/${lId}`, { method: "DELETE", idempotencyKey: missingSizeIdentity.idempotencyKey, body: { clientRequestId: missingSizeIdentity.clientRequestId, expectedVersion: version } }, { key: "size-delete-new-key-missing", semantic: "rejected", status: 404, replay: false });

    const deleteColorIdentity = identity("color-test-delete");
    const colorDeleted = await command(automatedMarker, `${colorPath}/${testColorId}`, { method: "DELETE", idempotencyKey: deleteColorIdentity.idempotencyKey, body: { clientRequestId: deleteColorIdentity.clientRequestId, expectedVersion: version } }, { key: "color-delete", semantic: "changed", status: 200, replay: false });
    version = colorDeleted.after.work_order_version;
    assert.deepEqual([colorDeleted.body.data.result.deletedQuantityCellCount, colorDeleted.body.data.result.removedQuantity, colorDeleted.after.matrix_total, colorDeleted.after.total_quantity], [1, 50, 100, 100]);

    const fabricDeleteId = await createMaterial("fabric", `A60-AUTO-FABRIC-${runSuffix}`, "fabric-delete-create");
    const accessoryDeleteId = await createMaterial("accessory", `A60-AUTO-ACCESSORY-${runSuffix}`, "accessory-delete-create");
    for (const [materialId, key] of [[fabricDeleteId, "fabric-delete"], [accessoryDeleteId, "accessory-delete"]]) {
      const request = identity(key);
      const body = { clientRequestId: request.clientRequestId, expectedVersion: version };
      const deleted = await command(automatedMarker, `${materialPath}/${materialId}`, { method: "DELETE", idempotencyKey: request.idempotencyKey, body }, { key, semantic: "changed", status: 200, replay: false });
      version = deleted.after.work_order_version;
      assert.equal(deleted.body.data.result.deleted, true);
      assert.equal(deleted.after.archived_materials, deleted.before.archived_materials, "NORMAL_DELETE_MUST_NOT_CREATE_ARCHIVE_TOMBSTONE");
      const replay = await command(automatedMarker, `${materialPath}/${materialId}`, { method: "DELETE", idempotencyKey: request.idempotencyKey, body }, { key: `${key}-replay`, semantic: "replay", status: 200, replay: true });
      assert.equal(replay.body.data.result.deleted, true);
      const missing = identity(`${key}-new-key`);
      await command(automatedMarker, `${materialPath}/${materialId}`, { method: "DELETE", idempotencyKey: missing.idempotencyKey, body: { clientRequestId: missing.clientRequestId, expectedVersion: version } }, { key: `${key}-new-key-missing`, semantic: "rejected", status: 404, replay: false });
    }
    for (const materialType of ["fabric", "accessory"]) {
      for (const lifecycleName of ["active", "archived"]) {
        const collection = await jsonRequest(`${materialPath}?type=${materialType}&lifecycle=${lifecycleName}&limit=20`);
        assert.equal(collection.response.status, 200);
        assert.ok(collection.body?.data?.items?.every((line) => ![fabricDeleteId, accessoryDeleteId].includes(line.id)));
      }
    }

    const cancelledId = await createMaterial("fabric", `A60-PROTECTED-CANCELLED-${runSuffix}`, "protected-cancelled-create");
    await lifecycle(cancelledId, "order-request", "protected-cancelled-request");
    await lifecycle(cancelledId, "order-cancel", "protected-cancelled-cancel");
    const cancelledDelete = identity("protected-cancelled-delete");
    await command(automatedMarker, `${materialPath}/${cancelledId}`, { method: "DELETE", idempotencyKey: cancelledDelete.idempotencyKey, body: { clientRequestId: cancelledDelete.clientRequestId, expectedVersion: version } }, { key: "protected-cancelled-delete", semantic: "rejected", status: 409, replay: false });

    const requestedId = await createMaterial("accessory", `A60-PROTECTED-REQUESTED-${runSuffix}`, "protected-requested-create");
    await lifecycle(requestedId, "order-request", "protected-requested-request");
    const requestedDelete = identity("protected-requested-delete");
    await command(automatedMarker, `${materialPath}/${requestedId}`, { method: "DELETE", idempotencyKey: requestedDelete.idempotencyKey, body: { clientRequestId: requestedDelete.clientRequestId, expectedVersion: version } }, { key: "protected-requested-delete", semantic: "rejected", status: 409, replay: false });

    const completedId = await createMaterial("fabric", `A60-PROTECTED-COMPLETED-${runSuffix}`, "protected-completed-create");
    await lifecycle(completedId, "order-request", "protected-completed-request");
    await lifecycle(completedId, "order-complete", "protected-completed-complete");
    const completedDelete = identity("protected-completed-delete");
    await command(automatedMarker, `${materialPath}/${completedId}`, { method: "DELETE", idempotencyKey: completedDelete.idempotencyKey, body: { clientRequestId: completedDelete.clientRequestId, expectedVersion: version } }, { key: "protected-completed-delete", semantic: "rejected", status: 409, replay: false });

    const archivedId = await createMaterial("accessory", `A60-PROTECTED-ARCHIVED-${runSuffix}`, "protected-archived-create");
    await lifecycle(archivedId, "archive", "protected-archived-archive");
    const archivedDelete = identity("protected-archived-delete");
    await command(automatedMarker, `${materialPath}/${archivedId}`, { method: "DELETE", idempotencyKey: archivedDelete.idempotencyKey, body: { clientRequestId: archivedDelete.clientRequestId, expectedVersion: version } }, { key: "protected-archived-delete", semantic: "rejected", status: 409, replay: false });

    const stale = identity("stale-size-delete");
    await command(automatedMarker, `${sizePath}/${xlId}`, { method: "DELETE", idempotencyKey: stale.idempotencyKey, body: { clientRequestId: stale.clientRequestId, expectedVersion: version - 1 } }, { key: "stale-size-delete", semantic: "rejected", status: 409, replay: false });
    const unknown = identity("unknown-size-delete");
    const unknownId = crypto.randomUUID();
    await command(automatedMarker, `${sizePath}/${unknownId}`, { method: "DELETE", idempotencyKey: unknown.idempotencyKey, body: { clientRequestId: unknown.clientRequestId, expectedVersion: version } }, { key: "unknown-size-delete", semantic: "rejected", status: 404, replay: false });

    const foreign = (await client.query(`SELECT w.id::text AS work_order_id FROM work_orders w WHERE w.company_id<>$1 AND w.deleted_at IS NULL ORDER BY w.created_at LIMIT 1`, [COMPANY_A])).rows[0];
    assert.ok(foreign?.work_order_id, "FOREIGN_TENANT_FIXTURE_MISSING");
    const foreignRequest = identity("foreign-tenant-delete");
    const foreignResult = await jsonRequest(`/api/v2/work-orders/${foreign.work_order_id}/materials/${crypto.randomUUID()}`, { method: "DELETE", idempotencyKey: foreignRequest.idempotencyKey, body: { clientRequestId: foreignRequest.clientRequestId, expectedVersion: 1 } });
    assert.equal(foreignResult.response.status, 404);
    ledger.push({ key: "foreign-tenant-delete", semantic: "rejected", status: 404, versionDelta: 0, eventDelta: 0, receiptDelta: 0, pass: true });

    const issued = (await client.query(`SELECT w.id::text AS work_order_id, w.entity_version FROM work_orders w JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id WHERE w.company_id=$1 AND w.status='issued' AND r.revision_status='finalized' AND w.deleted_at IS NULL ORDER BY w.created_at LIMIT 1`, [COMPANY_A])).rows[0];
    assert.ok(issued?.work_order_id, "ISSUED_FIXTURE_MISSING");
    const issuedRequest = identity("issued-delete");
    const issuedResult = await jsonRequest(`/api/v2/work-orders/${issued.work_order_id}/size-color/sizes/${crypto.randomUUID()}`, { method: "DELETE", idempotencyKey: issuedRequest.idempotencyKey, body: { clientRequestId: issuedRequest.clientRequestId, expectedVersion: Number(issued.entity_version) } });
    assert.equal(issuedResult.response.status, 409);
    ledger.push({ key: "issued-revision-delete", semantic: "rejected", status: 409, versionDelta: 0, eventDelta: 0, receiptDelta: 0, pass: true });

    let cancelRequestCount = 0;
    const actions = createDestructiveConfirmationActions(() => { cancelRequestCount += 1; });
    actions.cancel();
    assert.equal(cancelRequestCount, 0);

    for (const [route, key] of [[`${sizePath}/${xlId}`, "cleanup-xl-delete"], [`${colorPath}/${navyId}`, "cleanup-navy-delete"]]) {
      const request = identity(key);
      const deleted = await command(automatedMarker, route, { method: "DELETE", idempotencyKey: request.idempotencyKey, body: { clientRequestId: request.clientRequestId, expectedVersion: version } }, { key, semantic: "changed", status: 200, replay: false });
      version = deleted.after.work_order_version;
    }
    const beforeCleanup = await readFixture(client, automatedMarker);
    assert.deepEqual([beforeCleanup.sizes, beforeCleanup.colors, beforeCleanup.quantities, beforeCleanup.matrix_total, beforeCleanup.total_quantity], [0, 0, 0, 0, 0]);
    cleanupEvidence = await cleanupAutomatedFixture(client, beforeCleanup, automatedMarker, [cancelledId, requestedId, completedId, archivedId]);

    ownerMarker = createFixtureMarker();
    await provisionFixture(ownerMarker);
    ownerFixture = await readFixture(client, ownerMarker);
    let ownerVersion = ownerFixture.work_order_version;
    const ownerWorkOrderId = ownerFixture.work_order_id;
    const ownerSizePath = `/api/v2/work-orders/${ownerWorkOrderId}/size-color/sizes`;
    const ownerColorPath = `/api/v2/work-orders/${ownerWorkOrderId}/size-color/colors`;
    const ownerMaterialPath = `/api/v2/work-orders/${ownerWorkOrderId}/materials`;
    const ownerCommand = async (route, method, body, key, status = 200) => {
      const request = identity(`owner-${key}`);
      const result = await command(ownerMarker, route, { method, idempotencyKey: request.idempotencyKey, body: { clientRequestId: request.clientRequestId, expectedVersion: ownerVersion, ...body } }, { key: `owner-${key}`, semantic: "changed", status, replay: false });
      ownerVersion = result.after.work_order_version;
      return result;
    };
    const ownerL = (await ownerCommand(ownerSizePath, "POST", { displayLabel: "L" }, "size-l", 201)).body.data.result.targetId;
    const ownerXl = (await ownerCommand(ownerSizePath, "POST", { displayLabel: "XL" }, "size-xl", 201)).body.data.result.targetId;
    const ownerNavy = (await ownerCommand(ownerColorPath, "POST", { displayName: "남색", hexValue: "#1B2A4A" }, "color-navy", 201)).body.data.result.targetId;
    await ownerCommand(`/api/v2/work-orders/${ownerWorkOrderId}/size-color/quantities/${ownerNavy}/${ownerL}`, "PATCH", { quantity: 100 }, "qty-l");
    await ownerCommand(`/api/v2/work-orders/${ownerWorkOrderId}/size-color/quantities/${ownerNavy}/${ownerXl}`, "PATCH", { quantity: 100 }, "qty-xl");
    const ownerMaterial = async (materialType, name, key) => ownerCommand(ownerMaterialPath, "POST", {
      materialType, materialId: null, name, partnerId: null, colorOption: "아이폰 QA", usageArea: "삭제 확인",
      requiredQuantity: "0", allowanceQuantity: "0", inventoryUsageQuantity: "0", orderQuantity: "0",
      unitCode: materialType === "fabric" ? "m" : "개", unitPrice: "0", memo: "alpha.60 iPhone QA retained fixture",
    }, key, 201);
    await ownerMaterial("fabric", "A60 아이폰 삭제 원단", "fabric");
    await ownerMaterial("accessory", "A60 아이폰 삭제 부자재", "accessory");
    const ownerFinal = await readFixture(client, ownerMarker);
    assert.deepEqual([ownerFinal.sizes, ownerFinal.colors, ownerFinal.quantities, ownerFinal.matrix_total, ownerFinal.total_quantity, ownerFinal.materials, ownerFinal.archived_materials], [2, 1, 2, 200, 200, 2, 0]);
    const ownerDetail = await jsonRequest(`/api/v2/work-orders/${ownerWorkOrderId}`);
    assert.equal(ownerDetail.response.status, 200);
    for (const materialType of ["fabric", "accessory"]) {
      const collection = await jsonRequest(`${ownerMaterialPath}?type=${materialType}&limit=20`);
      assert.equal(collection.response.status, 200);
      assert.equal(collection.body?.data?.items?.length, 1);
      assert.equal(collection.body?.data?.items?.[0]?.deletable, true);
    }
    const ownerMatrix = await jsonRequest(`/api/v2/work-orders/${ownerWorkOrderId}/size-color`);
    assert.equal(ownerMatrix.response.status, 200);
    assert.deepEqual([ownerMatrix.body?.data?.matrixTotal, ownerMatrix.body?.data?.expectedTotal, ownerMatrix.body?.data?.totalsMatch], ["200", "200", true]);

    const metro = await verifyMetroIosBundle(state);
    const logs = logIssueCounts(state);
    assert.equal(logs.total, 0, "RUNTIME_FATAL_LOG_MARKERS_FOUND");
    const nonFixtureProductFingerprintAfter = await readNonFixtureProductFingerprint(client);
    assert.equal(nonFixtureProductFingerprintAfter, nonFixtureProductFingerprintBefore, "NON_FIXTURE_PRODUCT_MUTATION_FORBIDDEN");
    const changedRequests = ledger.filter((step) => step.semantic === "changed").length;
    const replayRequests = ledger.filter((step) => step.semantic === "replay").length;
    const rejectedRequests = ledger.filter((step) => step.semantic === "rejected").length;
    const result = {
      result: "PASS",
      checkpoint: SUCCESS_CHECKPOINT,
      runtime: {
        mode: state.runtimeQaMode,
        transport: state.previewTransport,
        nextPort: state.nextPort,
        expoPort: state.expoPort,
        metro,
        fatalLogMarkers: logs,
      },
      accounting: { stepCount: ledger.length, changedRequests, replayRequests, rejectedRequests, allPassed: ledger.every((step) => step.pass), steps: ledger },
      hardDelete: {
        sizeAndColorCellsDeletedInTransaction: true,
        canonicalSurvivorSumSynchronized: true,
        materialAndAccessoryPhysicalAbsenceVerified: true,
        noNewArchiveTombstoneFromNormalDelete: true,
        protectedRequestedCancelledCompletedArchivedRejected: true,
        staleUnknownForeignTenantIssuedRejected: true,
        cancelPathMutationRequestCount: cancelRequestCount,
      },
      cleanup: { automatedFixtureRef: identityRef(automatedFixture.work_order_id), ...cleanupEvidence },
      ownerIphoneQaFixture: {
        marker: ownerMarker,
        workOrderRef: identityRef(ownerWorkOrderId),
        retained: true,
        expectedInitialTotal: 200,
        expectedActions: [
          "Cancel L delete once; confirm zero mutation requests",
          "Confirm L delete; expect one cell and quantity 100 removed, total 100",
          "Confirm 남색 delete; expect one surviving cell and quantity 100 removed, total 0",
          "Confirm A60 아이폰 삭제 원단 hard delete",
          "Confirm A60 아이폰 삭제 부자재 hard delete",
          "Background/re-enter and Reload; deleted rows must not reappear",
        ],
        expectedConfirmedDeleteRequestCount: 4,
        expectedCancelRequestCount: 0,
      },
      safeguards: {
        productionAccessOrMutation: 0,
        r2PdfTokenMutation: 0,
        migrationMutation: 0,
        systemCompanyMasterMutation: 0,
        userProductMutation: 0,
        appVersionChanged: false,
        dependencyOrLockfileChanged: false,
      },
      requestSummary: requests.reduce((summary, request) => {
        const key = `${request.method} ${request.status}`;
        summary[key] = (summary[key] ?? 0) + 1;
        return summary;
      }, {}),
    };
    fs.mkdirSync(path.dirname(RESULT_PATH), { recursive: true });
    fs.writeFileSync(RESULT_PATH, serialize(result), "utf8");
    console.log(`Result: PASS`);
    console.log(`Checkpoint: ${SUCCESS_CHECKPOINT}`);
    console.log(`Owner iPhone QA fixture: ${ownerMarker}`);
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(`Result: FAIL`);
  console.error(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
  process.exitCode = 1;
});
