#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import pg from "pg";

const { Client } = pg;
const root = process.cwd();
const companyId = "wafl-fn-company-a";
const statePath = path.join(root, ".tmp", "wafl-external-qa", "state.json");
const resultPath = path.join(root, ".tmp", "wafl-external-qa", "alpha62-batch-selection-runtime-result.json");
const env = Object.fromEntries(fs.readFileSync(path.join(root, ".env.local"), "utf8")
  .split(/\r?\n/)
  .map((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    return match ? [match[1], match[2].trim().replace(/^("|')|("|')$/g, "")] : null;
  })
  .filter(Boolean));
const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
assert.equal(state.status, "running");
assert.equal(state.runtimeQaMode, "size-measurement-standards");
assert.equal(state.mutationMode, "size-measurement-standards");
assert.equal(state.metroAdvertisedHost, state.tailscaleIpv4);
assert.equal(state.iosManifestLaunchHost, state.tailscaleIpv4);

const marker = `QA A62 size measurement isolated ${new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date()).replaceAll("-", "")}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
const suffix = marker.slice(-8).toLowerCase();
const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha62-batch-selection-runtime-qa" });

async function provision() {
  const child = spawn(process.execPath, [path.join(root, "scripts", "run-wafl-v2-alpha46-create-qa-draft.mjs")], {
    cwd: root,
    env: {
      ...process.env,
      DATABASE_URL: env.DATABASE_URL,
      WAFL_SESSION_SECRET: env.WAFL_SESSION_SECRET,
      WAFL_V2_RUNTIME: "test",
      WAFL_V2_TEST_PREFIX: "wafl-fn",
      WAFL_V2_CONFIRMATION: "EXECUTE WAFL V2 ALPHA62 ISOLATED QA DRAFT CREATE",
      WAFL_V2_READ_API_ENABLED: "1",
      WAFL_V2_READ_APPROVED: "1",
      WAFL_V2_COMMAND_API_ENABLED: "1",
      WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.25-dev-test-command-runtime",
      WAFL_V2_APPROVED_DB_FINGERPRINT: state.fingerprintVerified ? "01e5dcc7fea3" : "",
      WAFL_V2_TEMPORARY_DRAFT_NAME: marker,
      WAFL_V2_TEMPORARY_DRAFT_MARKER: marker,
      WAFL_V2_TEMPORARY_DRAFT_CLIENT_REQUEST_ID: `a62-isolated-create-${suffix}`,
      WAFL_V2_TEMPORARY_DRAFT_IDEMPOTENCY_KEY: `a62-isolated-create-${suffix}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (data) => { stdout += data; });
  child.stderr.on("data", (data) => { stderr += data; });
  const code = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", resolve);
  });
  assert.equal(code, 0, stderr);
  assert.match(stdout, /Result: PASS/);
}

async function fixture() {
  return (await client.query(`
    SELECT id::text AS work_order_id, current_revision_id::text AS revision_id, entity_version
    FROM work_orders
    WHERE company_id = $1 AND product_name = $2 AND deleted_at IS NULL
  `, [companyId, marker])).rows[0];
}

async function exactCleanup(work) {
  await client.query("BEGIN");
  try {
    const owned = (await client.query(`
      SELECT product_name, current_revision_id::text AS revision_id
      FROM work_orders
      WHERE company_id = $1 AND id = $2::uuid
      FOR UPDATE
    `, [companyId, work.work_order_id])).rows[0];
    assert.deepEqual(owned, { product_name: marker, revision_id: work.revision_id });
    const receipts = (await client.query(`
      SELECT company_id, command_code, idempotency_key
      FROM work_order_command_receipts
      WHERE company_id = $1 AND work_order_id = $2::uuid
    `, [companyId, work.work_order_id])).rows;
    for (const receipt of receipts) {
      await client.query(`
        UPDATE work_order_command_receipts
        SET work_order_id = NULL, result_revision_id = NULL
        WHERE company_id = $1 AND command_code = $2 AND idempotency_key = $3
      `, [receipt.company_id, receipt.command_code, receipt.idempotency_key]);
    }
    const specs = (await client.query(`
      SELECT id::text
      FROM work_order_size_specs
      WHERE company_id = $1 AND revision_id = $2::uuid
    `, [companyId, work.revision_id])).rows;
    for (const spec of specs) {
      await client.query("DELETE FROM work_order_size_spec_values WHERE company_id=$1 AND size_spec_id=$2::uuid", [companyId, spec.id]);
      await client.query("DELETE FROM work_order_size_spec_sizes WHERE company_id=$1 AND size_spec_id=$2::uuid", [companyId, spec.id]);
      await client.query("DELETE FROM work_order_size_spec_poms WHERE company_id=$1 AND size_spec_id=$2::uuid", [companyId, spec.id]);
      await client.query("DELETE FROM work_order_size_specs WHERE company_id=$1 AND id=$2::uuid", [companyId, spec.id]);
    }
    await client.query("DELETE FROM color_size_quantities WHERE company_id=$1 AND revision_id=$2::uuid", [companyId, work.revision_id]);
    await client.query("DELETE FROM work_order_sizes WHERE company_id=$1 AND revision_id=$2::uuid", [companyId, work.revision_id]);
    await client.query("DELETE FROM work_order_colors WHERE company_id=$1 AND revision_id=$2::uuid", [companyId, work.revision_id]);
    await client.query("UPDATE work_orders SET current_revision_id=NULL WHERE company_id=$1 AND id=$2::uuid AND current_revision_id=$3::uuid", [companyId, work.work_order_id, work.revision_id]);
    await client.query("DELETE FROM work_order_revisions WHERE company_id=$1 AND id=$2::uuid", [companyId, work.revision_id]);
    await client.query("DELETE FROM work_orders WHERE company_id=$1 AND id=$2::uuid AND current_revision_id IS NULL", [companyId, work.work_order_id]);
    await client.query("COMMIT");
    return { detachedReceiptReferences: receipts.length };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  await client.connect();
  let work = null;
  try {
    await provision();
    work = await fixture();
    assert.ok(work?.work_order_id, "fixture-missing");
    const specId = crypto.randomUUID();
    await client.query(`
      INSERT INTO work_order_size_specs (id, company_id, revision_id, measurement_unit)
      VALUES ($1::uuid, $2, $3::uuid, 'cm')
    `, [specId, companyId, work.revision_id]);

    let cookie = "";
    const base = `https://${state.tailscaleServeHostname}`;
    async function request(route, body, key, method = "POST") {
      const response = await fetch(`${base}${route}`, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Idempotency-Key": key,
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify(body),
        redirect: "manual",
        signal: AbortSignal.timeout(60_000),
      });
      const setCookie = response.headers.getSetCookie?.() ?? [];
      if (setCookie.length) cookie = setCookie.map((value) => value.split(";", 1)[0]).join("; ");
      let json = null;
      try { json = await response.json(); } catch {}
      return { response, json };
    }
    async function read(route) {
      const response = await fetch(`${base}${route}`, {
        headers: { Accept: "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        signal: AbortSignal.timeout(60_000),
      });
      assert.equal(response.status, 200, `${route}:${response.status}`);
      return response.json();
    }

    const auth = await request("/api/dev/mobile-connect/auto", {}, "auth");
    assert.equal(auth.response.status, 200);
    let version = Number(work.entity_version);
    const replayVersions = new Map();
    const calls = [];
    async function batch(targetKind, additions, deletionIds, label, replay = false) {
      const key = `a62-batch-${suffix}-${label}`;
      const expectedVersion = replay ? replayVersions.get(key) : version;
      const result = await request(`/api/v2/work-orders/${work.work_order_id}/size-color/selection-batch`, {
        clientRequestId: key, expectedVersion, targetKind, additions, deletionIds,
      }, key);
      assert.equal(result.response.status, 200, `${label}:${result.response.status}:${JSON.stringify(result.json)}`);
      assert.equal(result.response.headers.get("x-wafl-command-transaction-count"), "1");
      assert.equal(result.json?.data?.result?.workOrderId, work.work_order_id);
      if (replay) {
        assert.equal(result.response.headers.get("x-wafl-idempotent-replay"), "1");
      } else {
        replayVersions.set(key, expectedVersion);
        version = result.json.data.nextVersion;
      }
      calls.push({ label, replay, status: result.response.status, statementCount: Number(result.response.headers.get("x-wafl-command-statement-count")), transactionCount: 1 });
      return result.json.data.result;
    }
    async function quantity(colorId, sizeId, value, label) {
      const key = `a62-batch-${suffix}-${label}`;
      const result = await request(`/api/v2/work-orders/${work.work_order_id}/size-color/quantities/${colorId}/${sizeId}`, {
        clientRequestId: key, expectedVersion: version, quantity: value,
      }, key, "PATCH");
      assert.equal(result.response.status, 200, `${label}:${result.response.status}:${JSON.stringify(result.json)}`);
      version = result.json.data.nextVersion;
      return result.json.data.result;
    }

    const sizes = await batch("size", [
      { displayName: "L", hexValue: null },
      { displayName: "XL", hexValue: null },
    ], [], "size-add-two");
    assert.equal(sizes.createdItems.length, 2);
    const colors = await batch("color", [{ displayName: "남색", hexValue: "#17263D" }], [], "color-add-one");
    const largeId = sizes.createdItems.find((item) => item.displayName === "L").id;
    const extraLargeId = sizes.createdItems.find((item) => item.displayName === "XL").id;
    const navyId = colors.createdItems[0].id;
    await quantity(navyId, largeId, 30, "quantity-l");
    await quantity(navyId, extraLargeId, 70, "quantity-xl");

    const sizeMixed = await batch("size", [{ displayName: "2XL", hexValue: null }], [largeId], "size-mixed");
    assert.deepEqual([sizeMixed.createdItems.length, sizeMixed.deletedTargetIds.length, sizeMixed.deletedQuantityCellCount, sizeMixed.removedQuantity, sizeMixed.totalQuantity], [1, 1, 1, 30, 70]);
    await batch("size", [{ displayName: "2XL", hexValue: null }], [largeId], "size-mixed", true);
    const matrixAfterSize = await read(`/api/v2/work-orders/${work.work_order_id}/size-color`);
    assert.deepEqual(matrixAfterSize.data.sizes.map((item) => item.displayLabel), ["XL", "2XL"]);
    assert.equal(Number(matrixAfterSize.data.matrixTotal), 70);
    assert.equal(Number(matrixAfterSize.data.workOrderTotal), 70);
    assert.equal(Number(matrixAfterSize.data.revisionTotal), 70);
    const specAfterSize = await read(`/api/v2/work-orders/${work.work_order_id}/size-spec`);
    assert.deepEqual(specAfterSize.data.sizes.map((item) => item.displayLabel), ["XL", "2XL"]);

    const colorMixed = await batch("color", [{ displayName: "회색", hexValue: "#808080" }], [navyId], "color-mixed");
    assert.deepEqual([colorMixed.createdItems.length, colorMixed.deletedTargetIds.length, colorMixed.deletedQuantityCellCount, colorMixed.removedQuantity, colorMixed.totalQuantity], [1, 1, 1, 70, 0]);
    const colorAddOnly = await batch("color", [{ displayName: "남색", hexValue: "#17263D" }], [], "color-add-only");
    assert.equal(colorAddOnly.createdItems.length, 1);
    const finalMatrix = await read(`/api/v2/work-orders/${work.work_order_id}/size-color`);
    assert.deepEqual(finalMatrix.data.colors.map((item) => item.displayName), ["남색", "회색"]);
    assert.equal(Number(finalMatrix.data.matrixTotal), 0);
    assert.equal(finalMatrix.data.quantityCells.length, 0);

    const evidence = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM domain_events WHERE company_id=$1 AND entity_id=$2 AND command_code='work_order.structure_selection.batch') AS events,
        (SELECT count(*)::integer FROM work_order_command_receipts WHERE company_id=$1 AND work_order_id=$2::uuid AND command_code='work_order.structure_selection.batch') AS receipts
    `, [companyId, work.work_order_id])).rows[0];
    assert.deepEqual({ events: Number(evidence.events), receipts: Number(evidence.receipts) }, { events: 5, receipts: 5 });

    const cleanup = await exactCleanup(work);
    const residual = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM work_orders WHERE company_id=$1 AND id=$2::uuid) AS work_orders,
        (SELECT count(*)::integer FROM work_order_revisions WHERE company_id=$1 AND id=$3::uuid) AS revisions,
        (SELECT count(*)::integer FROM work_order_command_receipts WHERE company_id=$1 AND work_order_id=$2::uuid) AS linked_receipts,
        (SELECT count(*)::integer FROM domain_events WHERE company_id=$1 AND entity_id=$4::text) AS events
    `, [companyId, work.work_order_id, work.revision_id, work.work_order_id])).rows[0];
    assert.deepEqual({ workOrders: Number(residual.work_orders), revisions: Number(residual.revisions), linkedReceipts: Number(residual.linked_receipts) }, { workOrders: 0, revisions: 0, linkedReceipts: 0 });

    const result = {
      result: "PASS",
      checkpoint: "ALPHA62_BATCH_SELECTION_RUNTIME_PASS",
      marker,
      requestAccounting: { localOptionTap: 0, cancel: 0, batchApply: 5, replay: 1 },
      calls,
      sizeMixed: { removedQuantity: 30, totalQuantity: 70, finishedSpecSynchronized: true },
      colorMixed: { removedQuantity: 70, totalQuantity: 0 },
      evidence: { events: Number(residual.events), batchReceipts: Number(evidence.receipts), referencesDetached: cleanup.detachedReceiptReferences },
      cleanup: { businessResidual: 0, eventReceiptPreserved: true },
    };
    fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log("ALPHA62_BATCH_SELECTION_RUNTIME_PASS");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
