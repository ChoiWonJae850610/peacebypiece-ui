#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

import {
  createR2WorkerSignedUrl,
  normalizeWorkerBaseUrl,
} from "../lib/storage/r2/r2WorkerSignature.mjs";

const { Client } = pg;
const PASS_NAME = process.argv.includes("--corrected")
  ? "corrected"
  : process.argv.includes("--resume-diagnosis") ? "diagnosis-resume" : "diagnosis";
const STATE_PATH = path.join(process.cwd(), ".tmp", "wafl-external-qa", "state.json");
const EVIDENCE_PATH = path.join(
  process.cwd(),
  ".tmp",
  "wafl-external-qa",
  `alpha57-v3-worker-read-${PASS_NAME}.jsonl`,
);
const SUMMARY_PATH = path.join(
  process.cwd(),
  ".tmp",
  "wafl-external-qa",
  `alpha57-v3-worker-read-${PASS_NAME}-summary.json`,
);
const ALPHA57_ONE = "ALPHA57_AUTO_WORK_ORDER_IMAGE_ONE.png";
const ALPHA57_TWO = "ALPHA57_AUTO_WORK_ORDER_IMAGE_TWO.png";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function shortRef(value) {
  return value ? sha256(String(value)).slice(0, 12) : null;
}

function readDotEnv() {
  const result = {};
  const raw = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (
      value.length >= 2
      && ((value.startsWith("\"") && value.endsWith("\""))
        || (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    result[match[1]] = value;
  }
  return result;
}

function readRunnerState() {
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  assert.equal(state.status, "running");
  assert.equal(state.runtimeQaMode, "work-order-image");
  assert.equal(state.previewTransport, "tailscale-serve-internal");
  assert.equal(state.tailscaleServeReady, true);
  assert.equal(state.developerAutoConnectReady, true);
  return state;
}

function appendEvidence(record) {
  fs.appendFileSync(EVIDENCE_PATH, `${JSON.stringify(record)}\n`, "utf8");
}

function responseBodySummary(contentType, text, bytes) {
  if (/application\/json/i.test(contentType)) {
    try {
      const body = JSON.parse(text);
      return {
        kind: "json",
        ok: body?.ok ?? null,
        errorCode: body?.error?.code ?? body?.error ?? body?.code ?? null,
        message: typeof body?.error?.message === "string"
          ? body.error.message.slice(0, 300)
          : typeof body?.message === "string" ? body.message.slice(0, 300) : null,
        dataShape: body?.data && typeof body.data === "object"
          ? Object.keys(body.data).sort()
          : null,
        itemCount: Array.isArray(body?.data?.items) ? body.data.items.length : null,
      };
    } catch {
      return { kind: "invalid-json", byteLength: bytes.byteLength, textPrefix: text.slice(0, 300) };
    }
  }
  return {
    kind: "binary",
    byteLength: bytes.byteLength,
    contentSha256: bytes.byteLength ? sha256(bytes) : null,
  };
}

async function captureRequest(input) {
  const requestId = crypto.randomUUID();
  const started = performance.now();
  let response;
  let bytes = Buffer.alloc(0);
  let networkError = null;
  try {
    response = await fetch(input.url, {
      method: input.method ?? "GET",
      redirect: input.redirect ?? "manual",
      cache: "no-store",
      headers: {
        "X-WAFL-Probe-Request-Id": requestId,
        ...(input.headers ?? {}),
      },
      body: input.body,
      signal: AbortSignal.timeout(60_000),
    });
    bytes = Buffer.from(await response.arrayBuffer());
  } catch (error) {
    networkError = error instanceof Error ? error.message : "UNKNOWN_NETWORK_ERROR";
  }
  const elapsedMs = Math.round((performance.now() - started) * 100) / 100;
  const contentType = response?.headers.get("content-type") ?? null;
  const text = bytes.toString("utf8");
  const body = response
    ? responseBodySummary(contentType ?? "", text, bytes)
    : { kind: "network-error", code: networkError };
  const entry = {
    sequence: input.sequence,
    timestamp: new Date().toISOString(),
    pass: PASS_NAME,
    layer: input.layer,
    label: input.label,
    endpoint: input.endpoint,
    method: input.method ?? "GET",
    request: input.request,
    workerRoute: input.workerRoute,
    r2Operation: input.r2Operation,
    objectIdentifier: input.objectIdentifier,
    responseStatus: response?.status ?? null,
    contentType,
    responseBody: body,
    errorCode: body.errorCode ?? body.code ?? null,
    requestId,
    correlationId: response?.headers.get("x-wafl-correlation-id") ?? null,
    workerVersion: response?.headers.get("x-peacebypiece-worker-version") ?? null,
    elapsedMs,
    directR2Access: false,
    workerBypass: false,
  };
  appendEvidence(entry);
  return { entry, response, bytes, text };
}

function storageKeyDescriptor(key) {
  const parts = String(key).split("/");
  return {
    hash: shortRef(key),
    segmentCount: parts.length,
    directory: parts.length >= 5 ? parts[4] : null,
    extension: path.extname(parts.at(-1) ?? "").toLowerCase(),
  };
}

function fingerprintRows(rows) {
  return sha256(JSON.stringify(rows));
}

async function snapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const parentRows = (await client.query(`
      SELECT w.company_id, w.id AS work_order_id, w.current_revision_id AS revision_id,
             w.entity_version AS work_order_version, r.entity_version AS revision_version,
             w.representative_image_id,
             (SELECT count(*)::integer FROM domain_events) AS event_count,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
             (SELECT count(*)::integer FROM work_order_images) AS image_count,
             (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count
        FROM work_orders w
        JOIN work_order_revisions r
          ON r.company_id=w.company_id AND r.id=w.current_revision_id
       WHERE EXISTS (
         SELECT 1
           FROM work_order_material_lines marker
          WHERE marker.company_id=w.company_id
            AND marker.revision_id=r.id
            AND marker.name='UNITEDITABLEMATERI'
       )
       LIMIT 1
    `)).rows;
    assert.equal(parentRows.length, 1);
    const parent = parentRows[0];
    const images = (await client.query(`
      SELECT i.id AS image_id, i.original_filename, i.storage_object_key,
             i.mime_type, i.size_bytes, i.deleted_at, i.purge_after_at,
             ri.display_order, ri.is_representative
        FROM work_order_images i
        LEFT JOIN work_order_revision_images ri
          ON ri.company_id=i.company_id
         AND ri.revision_id=$3::uuid
         AND ri.image_id=i.id
       WHERE i.company_id=$1 AND i.work_order_id=$2::uuid
       ORDER BY i.created_at, i.id
    `, [parent.company_id, parent.work_order_id, parent.revision_id])).rows;
    const otherRows = (await client.query(`
      SELECT i.work_order_id, i.id, i.deleted_at, i.purge_after_at,
             i.storage_object_key, i.is_current_representative,
             ri.revision_id, ri.display_order, ri.is_representative
        FROM work_order_images i
        LEFT JOIN work_order_revision_images ri
          ON ri.company_id=i.company_id AND ri.image_id=i.id
       WHERE i.company_id=$1 AND i.work_order_id<>$2::uuid
       ORDER BY i.work_order_id, i.id, ri.revision_id
    `, [parent.company_id, parent.work_order_id])).rows;
    await client.query("COMMIT");
    return {
      companyId: parent.company_id,
      workOrderId: parent.work_order_id,
      revisionId: parent.revision_id,
      workOrderVersion: Number(parent.work_order_version),
      revisionVersion: Number(parent.revision_version),
      representativeImageId: parent.representative_image_id,
      events: Number(parent.event_count),
      receipts: Number(parent.receipt_count),
      imageRows: Number(parent.image_count),
      migrationLedger: Number(parent.migration_count),
      images,
      activeCount: images.filter((row) => row.deleted_at === null).length,
      deletedCount: images.filter((row) => row.deleted_at !== null).length,
      otherWorkOrderFingerprint: fingerprintRows(otherRows),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function snapshotEvidence(label, value) {
  return {
    sequence: 0,
    timestamp: new Date().toISOString(),
    pass: PASS_NAME,
    layer: "mutation-guard",
    label,
    endpoint: "postgres://approved-dev-test/read-only",
    method: "BEGIN READ ONLY",
    request: { body: null },
    workerRoute: null,
    r2Operation: "none",
    objectIdentifier: null,
    responseStatus: 200,
    contentType: "application/json",
    responseBody: {
      workOrderRef: shortRef(value.workOrderId),
      revisionRef: shortRef(value.revisionId),
      workOrderVersion: value.workOrderVersion,
      revisionVersion: value.revisionVersion,
      representativeRef: shortRef(value.representativeImageId),
      eventCount: value.events,
      receiptCount: value.receipts,
      imageRowCount: value.imageRows,
      activeCount: value.activeCount,
      deletedCount: value.deletedCount,
      migrationLedger: value.migrationLedger,
      otherWorkOrderFingerprint: value.otherWorkOrderFingerprint,
    },
    errorCode: null,
    requestId: crypto.randomUUID(),
    correlationId: null,
    workerVersion: null,
    elapsedMs: null,
    directR2Access: false,
    workerBypass: false,
  };
}

function assertZeroMutation(before, after) {
  assert.equal(after.workOrderVersion - before.workOrderVersion, 0);
  assert.equal(after.revisionVersion - before.revisionVersion, 0);
  assert.equal(after.events - before.events, 0);
  assert.equal(after.receipts - before.receipts, 0);
  assert.equal(after.imageRows - before.imageRows, 0);
  assert.equal(after.activeCount - before.activeCount, 0);
  assert.equal(after.deletedCount - before.deletedCount, 0);
  assert.equal(after.representativeImageId, before.representativeImageId);
  assert.equal(after.migrationLedger - before.migrationLedger, 0);
  assert.equal(after.otherWorkOrderFingerprint, before.otherWorkOrderFingerprint);
}

async function run() {
  fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
  fs.writeFileSync(EVIDENCE_PATH, "", { encoding: "utf8", flag: "wx" });
  const env = readDotEnv();
  const databaseUrl = env.DATABASE_URL;
  const workerBaseUrl = normalizeWorkerBaseUrl(env.R2_WORKER_UPLOAD_URL);
  const workerSecret = env.R2_WORKER_UPLOAD_SECRET;
  assert.ok(databaseUrl);
  assert.ok(workerBaseUrl);
  assert.ok(workerSecret);
  const state = readRunnerState();
  const nextBaseUrl = `https://${state.tailscaleServeHostname}`;
  const client = new Client({
    connectionString: databaseUrl,
    application_name: `wafl-alpha57-v3-worker-read-${PASS_NAME}`,
  });
  await client.connect();
  let sequence = 0;
  let cookie = "";
  const results = [];

  function workerUrl(key) {
    return createR2WorkerSignedUrl({
      uploadUrl: workerBaseUrl,
      secret: workerSecret,
      method: "GET",
      key,
      expiresAt: Math.floor(Date.now() / 1000) + 300,
    });
  }

  function workerRequestDescription(url, key) {
    const parsed = new URL(url);
    return {
      path: parsed.pathname,
      query: {
        key: storageKeyDescriptor(key),
        expires: parsed.searchParams.has("expires") ? "present" : "missing",
        signature: parsed.searchParams.has("signature") ? "present-redacted" : "missing",
      },
      body: null,
    };
  }

  async function workerDirect(label, image) {
    const url = workerUrl(image.storage_object_key);
    const parsed = new URL(url);
    const result = await captureRequest({
      sequence: ++sequence,
      layer: "worker-direct",
      label,
      endpoint: { kind: "worker", hostHash: shortRef(parsed.host), path: parsed.pathname },
      method: "GET",
      url,
      request: workerRequestDescription(url, image.storage_object_key),
      workerRoute: "r2-upload-worker.fetch",
      r2Operation: "GET",
      objectIdentifier: storageKeyDescriptor(image.storage_object_key),
      redirect: "manual",
    });
    results.push(result.entry);
  }

  async function nextAdapter(label, image, expectWorker) {
    const requestPath = `/api/v2/work-orders/images/file?key=${encodeURIComponent(image.storage_object_key)}`;
    const nextResult = await captureRequest({
      sequence: ++sequence,
      layer: "next-worker",
      label: `${label}:next`,
      endpoint: { kind: "next", path: "/api/v2/work-orders/images/file" },
      method: "GET",
      url: `${nextBaseUrl}${requestPath}`,
      headers: cookie ? { Cookie: cookie } : {},
      request: {
        path: "/api/v2/work-orders/images/file",
        query: { key: storageKeyDescriptor(image.storage_object_key) },
        body: null,
      },
      workerRoute: expectWorker ? "r2-upload-worker.fetch" : "blocked-before-worker-by-policy",
      r2Operation: expectWorker ? "GET" : "none",
      objectIdentifier: storageKeyDescriptor(image.storage_object_key),
      redirect: "manual",
    });
    results.push(nextResult.entry);
    const location = nextResult.response?.headers.get("location") ?? null;
    if (location && nextResult.response?.status === 307) {
      const parsed = new URL(location);
      const workerResult = await captureRequest({
        sequence: ++sequence,
        layer: "next-worker",
        label: `${label}:worker-follow`,
        endpoint: { kind: "worker", hostHash: shortRef(parsed.host), path: parsed.pathname },
        method: "GET",
        url: location,
        request: workerRequestDescription(location, image.storage_object_key),
        workerRoute: "r2-upload-worker.fetch",
        r2Operation: "GET",
        objectIdentifier: storageKeyDescriptor(image.storage_object_key),
        redirect: "manual",
      });
      results.push(workerResult.entry);
    }
  }

  async function appRead(label, requestPath, options = {}) {
    const result = await captureRequest({
      sequence: ++sequence,
      layer: "app-facing",
      label,
      endpoint: { kind: "next", path: requestPath.split("?")[0] },
      method: "GET",
      url: `${nextBaseUrl}${requestPath}`,
      headers: cookie ? { Cookie: cookie } : {},
      request: {
        path: requestPath.split("?")[0],
        query: options.query ?? null,
        body: null,
      },
      workerRoute: options.workerRoute ?? null,
      r2Operation: options.r2Operation ?? "none",
      objectIdentifier: options.image ? storageKeyDescriptor(options.image.storage_object_key) : null,
      redirect: options.redirect ?? "manual",
    });
    results.push(result.entry);
    return result;
  }

  try {
    const before = await snapshot(client);
    appendEvidence(snapshotEvidence("before", before));
    const representative = before.images.find((row) => row.image_id === before.representativeImageId);
    const alpha57One = before.images.find((row) => row.original_filename === ALPHA57_ONE);
    const alpha57Two = before.images.find((row) => row.original_filename === ALPHA57_TWO);
    const activeNonRepresentativeCandidate = before.images.find((row) => (
      row.deleted_at === null
      && row.image_id !== before.representativeImageId
      && row.display_order !== null
    ));
    const activeNonRepresentativeAvailable = Boolean(activeNonRepresentativeCandidate);
    const activeNonRepresentative = activeNonRepresentativeCandidate ?? representative;
    assert.ok(representative);
    assert.equal(representative.image_id, alpha57One?.image_id);
    assert.ok(activeNonRepresentative);
    assert.ok(alpha57Two?.deleted_at);
    appendEvidence({
      sequence: 0,
      timestamp: new Date().toISOString(),
      pass: PASS_NAME,
      layer: "fixture-topology",
      label: "active-nonrepresentative-selection",
      endpoint: "postgres://approved-dev-test/read-only",
      method: "BEGIN READ ONLY",
      request: { body: null },
      workerRoute: null,
      r2Operation: "none",
      objectIdentifier: storageKeyDescriptor(activeNonRepresentative.storage_object_key),
      responseStatus: 200,
      contentType: "application/json",
      responseBody: {
        activeNonRepresentativeAvailable,
        representativeFallbackUsed: !activeNonRepresentativeAvailable,
        fixtureMutationToCreateMissingImage: 0,
      },
      errorCode: null,
      requestId: crypto.randomUUID(),
      correlationId: null,
      workerVersion: null,
      elapsedMs: null,
      directR2Access: false,
      workerBypass: false,
    });

    await workerDirect("representative-metadata-lookup", representative);
    await workerDirect("active-metadata-lookup", activeNonRepresentative);
    await workerDirect("deleted-metadata-lookup", alpha57Two);
    await workerDirect("representative-file-get", representative);
    await workerDirect("active-file-get", activeNonRepresentative);
    await workerDirect("deleted-file-get-policy", alpha57Two);

    const auth = await captureRequest({
      sequence: ++sequence,
      layer: "app-facing",
      label: "developer-auto-connect",
      endpoint: { kind: "next", path: "/api/dev/mobile-connect/auto" },
      method: "POST",
      url: `${nextBaseUrl}/api/dev/mobile-connect/auto`,
      request: { path: "/api/dev/mobile-connect/auto", query: null, body: null },
      workerRoute: null,
      r2Operation: "none",
      objectIdentifier: null,
      redirect: "manual",
    });
    results.push(auth.entry);
    const setCookies = auth.response?.headers.getSetCookie?.() ?? [];
    cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");

    await nextAdapter("representative-file", representative, true);
    await nextAdapter("active-file", activeNonRepresentative, true);
    await nextAdapter("deleted-file-policy", alpha57Two, false);

    await appRead("assets-read", `/api/v2/work-orders/${before.workOrderId}/assets?limit=50`, {
      query: { limit: 50 },
    });
    await appRead("detail-read", `/api/v2/work-orders/${before.workOrderId}`);
    await appRead("list-read", "/api/v2/work-orders?limit=30", { query: { limit: 30 } });
    await appRead(
      "representative-file-read",
      `/api/v2/work-orders/images/file?key=${encodeURIComponent(representative.storage_object_key)}`,
      { query: { key: storageKeyDescriptor(representative.storage_object_key) }, image: representative, workerRoute: "r2-upload-worker.fetch", r2Operation: "GET", redirect: "follow" },
    );
    await appRead(
      "active-nonrepresentative-file-read",
      `/api/v2/work-orders/images/file?key=${encodeURIComponent(activeNonRepresentative.storage_object_key)}`,
      { query: { key: storageKeyDescriptor(activeNonRepresentative.storage_object_key) }, image: activeNonRepresentative, workerRoute: "r2-upload-worker.fetch", r2Operation: "GET", redirect: "follow" },
    );
    await appRead(
      "deleted-file-read-policy",
      `/api/v2/work-orders/images/file?key=${encodeURIComponent(alpha57Two.storage_object_key)}`,
      { query: { key: storageKeyDescriptor(alpha57Two.storage_object_key) }, image: alpha57Two, workerRoute: "blocked-before-worker-by-policy", r2Operation: "none", redirect: "follow" },
    );

    const after = await snapshot(client);
    appendEvidence(snapshotEvidence("after", after));
    assertZeroMutation(before, after);

    const http400 = results.filter((entry) => entry.responseStatus === 400);
    const summary = {
      result: "PASS_DIAGNOSTIC_COMPLETED",
      pass: PASS_NAME,
      evidencePath: path.relative(process.cwd(), EVIDENCE_PATH),
      probeCount: results.length,
      fixtureTopology: {
        activeNonRepresentativeAvailable,
        representativeFallbackUsedForActiveProbe: !activeNonRepresentativeAvailable,
      },
      http400: http400.map((entry) => ({
        sequence: entry.sequence,
        layer: entry.layer,
        label: entry.label,
        errorCode: entry.errorCode,
      })),
      statuses: results.map((entry) => ({
        sequence: entry.sequence,
        layer: entry.layer,
        label: entry.label,
        status: entry.responseStatus,
        errorCode: entry.errorCode,
      })),
      mutationDelta: {
        workOrderVersion: after.workOrderVersion - before.workOrderVersion,
        revisionVersion: after.revisionVersion - before.revisionVersion,
        event: after.events - before.events,
        receipt: after.receipts - before.receipts,
        workOrderImages: after.imageRows - before.imageRows,
        representativeChanged: after.representativeImageId === before.representativeImageId ? 0 : 1,
        migrationLedger: after.migrationLedger - before.migrationLedger,
        r2Put: 0,
        r2Delete: 0,
        directR2S3Access: 0,
        otherWorkOrderMutation: after.otherWorkOrderFingerprint === before.otherWorkOrderFingerprint ? 0 : 1,
      },
    };
    fs.writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(summary));

    if (PASS_NAME === "corrected") {
      assert.equal(http400.length, 0);
      const expected = new Map([
        ["representative-metadata-lookup", 200],
        ["active-metadata-lookup", 200],
        ["deleted-metadata-lookup", 200],
        ["representative-file-get", 200],
        ["active-file-get", 200],
        ["deleted-file-get-policy", 200],
        ["developer-auto-connect", 200],
        ["representative-file:next", 307],
        ["representative-file:worker-follow", 200],
        ["active-file:next", 307],
        ["active-file:worker-follow", 200],
        ["deleted-file-policy:next", 404],
        ["assets-read", 200],
        ["detail-read", 200],
        ["list-read", 200],
        ["representative-file-read", 200],
        ["active-nonrepresentative-file-read", 200],
        ["deleted-file-read-policy", 404],
      ]);
      for (const entry of results) {
        assert.equal(entry.responseStatus, expected.get(entry.label), entry.label);
      }
    }
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(JSON.stringify({
    result: "FAIL",
    pass: PASS_NAME,
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: error instanceof Error ? error.message : "unknown",
    evidencePath: path.relative(process.cwd(), EVIDENCE_PATH),
  }));
  process.exitCode = 1;
});
