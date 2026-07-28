#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

const PARENT_MARKER = "UNITEDITABLEMATERI";
const IMAGE_ONE_NAME = "ALPHA57_AUTO_WORK_ORDER_IMAGE_ONE.png";
const IMAGE_TWO_NAME = "ALPHA57_AUTO_WORK_ORDER_IMAGE_TWO.png";
const RESULT_PATH = path.join(
  process.cwd(),
  ".tmp",
  "wafl-external-qa",
  "alpha57-work-order-image-runtime-result.json",
);
const IMAGE_ONE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nVQAAAAASUVORK5CYII=",
  "base64",
);
const IMAGE_TWO = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAusB9Y9ZB0YAAAAASUVORK5CYII=",
  "base64",
);

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function shortRef(value) {
  return sha256(String(value)).slice(0, 12);
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
  assert.equal(state.runtimeQaMode, "work-order-image");
  assert.equal(state.commandApi, "ready");
  assert.equal(state.mutationMode, "work-order-image-upload-primary-delete");
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

function imageFingerprint(rows) {
  return sha256(JSON.stringify(rows.map((row) => ({
    workOrderId: row.work_order_id,
    imageId: row.image_id,
    filename: row.original_filename,
    storageObjectKey: row.storage_object_key,
    deletedAt: row.deleted_at,
    purgeAfterAt: row.purge_after_at,
    representative: row.is_representative,
    displayOrder: row.display_order,
  }))));
}

async function snapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const parentRows = (await client.query(`
      SELECT w.company_id, w.id AS work_order_id, w.current_revision_id AS revision_id,
             w.entity_version AS work_order_version, r.entity_version AS revision_version,
             w.status AS work_order_status, r.revision_status, w.representative_image_id,
             (SELECT count(*)::integer FROM domain_events) AS event_count,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
             (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count
        FROM work_orders w
        JOIN work_order_revisions r
          ON r.company_id=w.company_id AND r.id=w.current_revision_id
       WHERE EXISTS (
         SELECT 1
           FROM work_order_material_lines marker
          WHERE marker.company_id=w.company_id
            AND marker.revision_id=r.id
            AND marker.name=$1
       )
       LIMIT 1
    `, [PARENT_MARKER])).rows;
    assert.equal(parentRows.length, 1, "alpha57-parent-count");
    const parent = parentRows[0];
    const targetImages = (await client.query(`
      SELECT i.work_order_id, i.id AS image_id, i.original_filename, i.storage_object_key,
             i.deleted_at, i.purge_after_at, ri.is_representative, ri.display_order
        FROM work_order_images i
        LEFT JOIN work_order_revision_images ri
          ON ri.company_id=i.company_id AND ri.image_id=i.id AND ri.revision_id=$3::uuid
       WHERE i.company_id=$1 AND i.work_order_id=$2::uuid
       ORDER BY i.created_at, i.id
    `, [parent.company_id, parent.work_order_id, parent.revision_id])).rows;
    const otherImages = (await client.query(`
      SELECT i.work_order_id, i.id AS image_id, i.original_filename, i.storage_object_key,
             i.deleted_at, i.purge_after_at, ri.is_representative, ri.display_order
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
      workOrderStatus: parent.work_order_status,
      revisionStatus: parent.revision_status,
      representativeImageId: parent.representative_image_id,
      events: Number(parent.event_count),
      receipts: Number(parent.receipt_count),
      migrationLedger: Number(parent.migration_count),
      targetImages,
      targetImageRows: targetImages.length,
      targetActiveImages: targetImages.filter((row) => row.deleted_at === null).length,
      targetRevisionLinks: targetImages.filter((row) => row.display_order !== null).length,
      otherImageFingerprint: imageFingerprint(otherImages),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function assertStartingBaseline(before) {
  assert.equal(before.workOrderStatus, "draft");
  assert.equal(before.revisionStatus, "draft");
  assert.equal(before.migrationLedger, 13);
  assert.equal(
    before.targetImages.some((row) => row.original_filename === IMAGE_ONE_NAME || row.original_filename === IMAGE_TWO_NAME),
    false,
    "alpha57-runtime-image-marker-must-not-preexist",
  );
}

function assertStep(before, after, expected) {
  assert.equal(after.workOrderVersion - before.workOrderVersion, expected.mutated ? 1 : 0);
  assert.equal(after.revisionVersion - before.revisionVersion, expected.mutated ? 1 : 0);
  assert.equal(after.events - before.events, expected.mutated ? 1 : 0);
  assert.equal(after.receipts - before.receipts, expected.mutated ? 1 : 0);
  assert.equal(after.targetImageRows - before.targetImageRows, expected.imageRows ?? 0);
  assert.equal(after.targetActiveImages - before.targetActiveImages, expected.activeImages ?? 0);
  assert.equal(after.targetRevisionLinks - before.targetRevisionLinks, expected.revisionLinks ?? 0);
  assert.equal(after.migrationLedger, before.migrationLedger);
  assert.equal(after.otherImageFingerprint, before.otherImageFingerprint);
}

async function verifyMetroIosBundle(state) {
  const manifestResponse = await fetch(`http://127.0.0.1:${state.expoPort}/`, {
    headers: { Accept: "application/expo+json", "Expo-Platform": "ios" },
    signal: AbortSignal.timeout(60_000),
  });
  assert.equal(manifestResponse.status, 200);
  assert.match(manifestResponse.headers.get("content-type") ?? "", /application\/expo\+json/);
  const manifest = await manifestResponse.json();
  assert.equal(typeof manifest?.launchAsset?.url, "string");
  const bundleResponse = await fetch(manifest.launchAsset.url, { signal: AbortSignal.timeout(180_000) });
  assert.equal(bundleResponse.status, 200);
  assert.match(bundleResponse.headers.get("content-type") ?? "", /application\/javascript/);
  const bundleText = await bundleResponse.text();
  const markers = {
    imagePickerModule: bundleText.includes("expo-image-picker"),
    gallery: bundleText.includes("work-order-image-gallery"),
    libraryButton: bundleText.includes("work-order-image-library"),
    cameraButton: bundleText.includes("work-order-image-camera"),
  };
  assert.deepEqual(markers, {
    imagePickerModule: true,
    gallery: true,
    libraryButton: true,
    cameraButton: true,
  });
  return {
    manifestStatus: manifestResponse.status,
    bundleStatus: bundleResponse.status,
    bundleBytes: Buffer.byteLength(bundleText),
    markers,
  };
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

async function run() {
  const state = assertRunnerState();
  const client = new Client({
    connectionString: readDatabaseUrl(),
    application_name: "wafl-alpha57-work-order-image-runtime-qa",
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
      signal: AbortSignal.timeout(60_000),
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
        ok: body?.ok === true,
        errorCode: body?.error?.code ?? null,
        transactionCount: response.headers.get("x-wafl-command-transaction-count"),
        idempotencyKeyPresent: Boolean(options.idempotencyKey),
      });
    }
    return { response, body };
  }

  async function prepareUpload(workOrderId, filename, bytes, command) {
    const prepared = await jsonRequest(`/api/v2/work-orders/${workOrderId}/images/upload`, {
      method: "POST",
      command,
      body: { file: { name: filename, type: "image/png", size: bytes.byteLength } },
    });
    assert.equal(prepared.response.status, 200);
    const target = prepared.body?.data?.uploadTarget;
    assert.equal(target?.fileName, filename);
    assert.equal(target?.contentType, "image/png");
    assert.equal(target?.fileSize, bytes.byteLength);
    assert.equal(target?.method, "PUT");
    assert.equal(typeof target?.uploadUrl, "string");
    assert.equal(typeof target?.storageKey, "string");
    const uploadResponse = await fetch(target.uploadUrl, {
      method: "PUT",
      headers: Object.fromEntries(Object.entries(target.headers ?? {}).map(([key, value]) => [key, String(value)])),
      body: bytes,
      signal: AbortSignal.timeout(60_000),
    });
    assert.ok(uploadResponse.ok, `r2-upload-${command}-${uploadResponse.status}`);
    return { target, uploadStatus: uploadResponse.status };
  }

  async function imageCommand(route, command, expectedVersion, extraBody = {}) {
    return jsonRequest(route, {
      method: "POST",
      command,
      idempotencyKey: `alpha57.${command}.v${expectedVersion}`,
      body: {
        clientRequestId: `alpha57.${command}.client.v${expectedVersion}`,
        expectedVersion,
        ...extraBody,
      },
    });
  }

  try {
    const before = await snapshot(client);
    assertStartingBaseline(before);
    const metro = await verifyMetroIosBundle(state);

    const unauthenticated = await jsonRequest("/api/auth/me");
    assert.equal(unauthenticated.response.status, 401);
    const auth = await jsonRequest("/api/dev/mobile-connect/auto", { method: "POST" });
    assert.equal(auth.response.status, 200);
    assert.equal(auth.body?.connected, true);
    assert.ok(cookie);
    const me = await jsonRequest("/api/auth/me");
    assert.equal(me.response.status, 200);
    assert.equal(me.body?.authenticated, true);

    let current = before;
    const firstPrepared = await prepareUpload(current.workOrderId, IMAGE_ONE_NAME, IMAGE_ONE, "prepare-one");
    let next = await snapshot(client);
    assertStep(current, next, { mutated: false });
    current = next;

    const firstComplete = await imageCommand(
      `/api/v2/work-orders/${current.workOrderId}/images/upload/complete`,
      "complete-one",
      current.workOrderVersion,
      { uploadTarget: firstPrepared.target },
    );
    assert.equal(firstComplete.response.status, 201);
    const firstId = String(firstComplete.body?.data?.imageId ?? "");
    assert.match(firstId, /^[0-9a-f-]{36}$/i);
    next = await snapshot(client);
    assertStep(current, next, { mutated: true, imageRows: 1, activeImages: 1, revisionLinks: 1 });
    assert.equal(next.representativeImageId, current.representativeImageId, "upload-must-not-auto-promote");
    current = next;

    const secondPrepared = await prepareUpload(current.workOrderId, IMAGE_TWO_NAME, IMAGE_TWO, "prepare-two");
    next = await snapshot(client);
    assertStep(current, next, { mutated: false });
    current = next;

    const secondComplete = await imageCommand(
      `/api/v2/work-orders/${current.workOrderId}/images/upload/complete`,
      "complete-two",
      current.workOrderVersion,
      { uploadTarget: secondPrepared.target },
    );
    assert.equal(secondComplete.response.status, 201);
    const secondId = String(secondComplete.body?.data?.imageId ?? "");
    assert.match(secondId, /^[0-9a-f-]{36}$/i);
    assert.notEqual(firstId, secondId);
    next = await snapshot(client);
    assertStep(current, next, { mutated: true, imageRows: 1, activeImages: 1, revisionLinks: 1 });
    assert.equal(next.representativeImageId, current.representativeImageId, "second-upload-must-not-auto-promote");
    current = next;

    const firstPrimary = await imageCommand(
      `/api/v2/work-orders/${current.workOrderId}/images/${firstId}/representative`,
      "primary-one",
      current.workOrderVersion,
    );
    assert.equal(firstPrimary.response.status, 200);
    assert.equal(firstPrimary.body?.data?.isRepresentative, true);
    next = await snapshot(client);
    assertStep(current, next, { mutated: true });
    assert.equal(next.representativeImageId, firstId);
    current = next;

    const secondPrimary = await imageCommand(
      `/api/v2/work-orders/${current.workOrderId}/images/${secondId}/representative`,
      "primary-two",
      current.workOrderVersion,
    );
    assert.equal(secondPrimary.response.status, 200);
    next = await snapshot(client);
    assertStep(current, next, { mutated: true });
    assert.equal(next.representativeImageId, secondId);
    current = next;

    const deletePrimary = await imageCommand(
      `/api/v2/work-orders/${current.workOrderId}/images/${secondId}/delete`,
      "delete-primary-two",
      current.workOrderVersion,
    );
    assert.equal(deletePrimary.response.status, 200);
    assert.equal(deletePrimary.body?.data?.deleted, true);
    next = await snapshot(client);
    assertStep(current, next, { mutated: true, activeImages: -1, revisionLinks: -1 });
    assert.equal(next.representativeImageId, null, "representative-delete-must-not-auto-promote");
    const deletedSecond = next.targetImages.find((row) => row.image_id === secondId);
    assert.ok(deletedSecond?.deleted_at);
    assert.ok(deletedSecond?.purge_after_at);
    current = next;

    const restoreFirstPrimary = await imageCommand(
      `/api/v2/work-orders/${current.workOrderId}/images/${firstId}/representative`,
      "primary-one-final",
      current.workOrderVersion,
    );
    assert.equal(restoreFirstPrimary.response.status, 200);
    next = await snapshot(client);
    assertStep(current, next, { mutated: true });
    assert.equal(next.representativeImageId, firstId);
    current = next;

    const assets = await jsonRequest(`/api/v2/work-orders/${current.workOrderId}/assets?limit=50`);
    assert.equal(assets.response.status, 200);
    assert.equal(assets.body?.data?.entityVersion, current.workOrderVersion);
    const imageItems = (assets.body?.data?.items ?? []).filter((item) => item.assetType === "image");
    const firstAsset = imageItems.find((item) => item.id === firstId);
    assert.equal(firstAsset?.filename, IMAGE_ONE_NAME);
    assert.equal(firstAsset?.isRepresentative, true);
    assert.equal(typeof firstAsset?.viewUrl, "string");
    assert.equal(imageItems.some((item) => item.id === secondId), false);

    const detail = await jsonRequest(`/api/v2/work-orders/${current.workOrderId}`);
    assert.equal(detail.response.status, 200);
    assert.equal(detail.body?.data?.header?.entityVersion, current.workOrderVersion);
    assert.equal(detail.body?.data?.header?.representativeImage?.imageId, firstId);
    const list = await jsonRequest("/api/v2/work-orders?limit=30");
    assert.equal(list.response.status, 200);
    const listItem = (list.body?.data?.items ?? []).find((item) => item.workOrderId === current.workOrderId);
    assert.ok(listItem, "target-work-order-not-visible-in-list");
    assert.equal(listItem.representativeThumbnail?.imageId, firstId);

    const imageFile = await fetch(`${runtimeBaseUrl}${firstAsset.viewUrl}`, {
      headers: { Cookie: cookie },
      redirect: "manual",
      signal: AbortSignal.timeout(60_000),
    });
    assert.equal(imageFile.status, 200);
    assert.match(imageFile.headers.get("content-type") ?? "", /image\/png/);
    assert.ok((await imageFile.arrayBuffer()).byteLength > 0);

    const eventCodes = await readNewEventCodes(client, current.workOrderId, 6);
    assert.deepEqual(eventCodes, [
      "work_order.image.upload",
      "work_order.image.upload",
      "work_order.image.representative.set",
      "work_order.image.representative.set",
      "work_order.image.delete",
      "work_order.image.representative.set",
    ]);
    assert.equal(current.workOrderVersion - before.workOrderVersion, 6);
    assert.equal(current.revisionVersion - before.revisionVersion, 6);
    assert.equal(current.events - before.events, 6);
    assert.equal(current.receipts - before.receipts, 6);
    assert.equal(current.targetImageRows - before.targetImageRows, 2);
    assert.equal(current.targetActiveImages - before.targetActiveImages, 1);
    assert.equal(current.targetRevisionLinks - before.targetRevisionLinks, 1);
    assert.equal(current.otherImageFingerprint, before.otherImageFingerprint);
    assert.equal(requestLedger.filter((entry) => entry.command.startsWith("prepare-")).length, 2);
    assert.equal(requestLedger.filter((entry) => entry.transactionCount === "1").length, 6);
    assert.equal(requestLedger.filter((entry) => entry.status >= 400).length, 0);

    const output = {
      result: "PASS",
      checkpoint: "ALPHA57_WORK_ORDER_IMAGE_IMPLEMENTATION_COMPLETE_DEVELOPMENT_BUILD_REQUIRED",
      runtimeQaMode: state.runtimeQaMode,
      mutationMode: state.mutationMode,
      fixture: {
        workOrderRef: shortRef(current.workOrderId),
        revisionRef: shortRef(current.revisionId),
        imageOneRef: shortRef(firstId),
        imageTwoRef: shortRef(secondId),
      },
      metro,
      api: {
        authenticated: true,
        prepareRequests: 2,
        objectPutRequests: 2,
        commandTransactions: 6,
        commandFailures: 0,
        assetReadStatus: assets.response.status,
        detailReadStatus: detail.response.status,
        listReadStatus: list.response.status,
        fileReadStatus: imageFile.status,
      },
      mutation: {
        workOrderVersionDelta: current.workOrderVersion - before.workOrderVersion,
        revisionVersionDelta: current.revisionVersion - before.revisionVersion,
        eventDelta: current.events - before.events,
        receiptDelta: current.receipts - before.receipts,
        imageRowDelta: current.targetImageRows - before.targetImageRows,
        activeImageDelta: current.targetActiveImages - before.targetActiveImages,
        revisionImageLinkDelta: current.targetRevisionLinks - before.targetRevisionLinks,
        schemaMigrationDelta: current.migrationLedger - before.migrationLedger,
        otherWorkOrderImageMutation: current.otherImageFingerprint === before.otherImageFingerprint ? 0 : 1,
        r2ObjectPutCount: 2,
      },
      policy: {
        uploadDoesNotAutoPromote: true,
        representativeDeleteLeavesNoPrimary: true,
        automaticPrimaryPromotion: 0,
        cancelPermissionRuntimeMutation: 0,
        backgroundMutation: 0,
        duplicateCommand: 0,
        finalRepresentativeImageReadyForDeviceQa: true,
      },
      eventCodes,
      requestLedger,
    };
    fs.mkdirSync(path.dirname(RESULT_PATH), { recursive: true });
    fs.writeFileSync(RESULT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(output));
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(JSON.stringify({
    result: "FAIL",
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: error instanceof Error ? error.message : "unknown",
  }));
  process.exitCode = 1;
});
