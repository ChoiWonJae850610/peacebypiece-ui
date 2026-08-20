#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const root = process.cwd();
const companyId = "wafl-fn-company-a";
const state = JSON.parse(fs.readFileSync(path.join(root, ".tmp", "wafl-external-qa", "state.json"), "utf8"));
const fixture = JSON.parse(fs.readFileSync(path.join(root, ".tmp", "wafl-v2-alpha66", "lineage-fixture.json"), "utf8"));
const env = Object.fromEntries(fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/u).map((line) => {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/u);
  return match ? [match[1], match[2].trim().replace(/^("|')|("|')$/gu, "")] : null;
}).filter(Boolean));
const outputDir = path.join(root, ".tmp", "wafl-v2-alpha66");
const resultPath = path.join(outputDir, "header-status-readiness-refresh-runtime-qa.json");
const suffix = crypto.randomBytes(4).toString("hex").toLowerCase();
const requests = [];
let cookie = "";
let lastResponseSafe = null;

assert.equal(state.status, "running");
assert.equal(state.makerQaProfile, "alpha65-current-maker");
assert.equal(state.developerAutoConnectReady, true);
assert.equal(state.metroAdvertisedHost, state.tailscaleIpv4);
assert.equal(state.iosManifestLaunchHost, state.tailscaleIpv4);

async function request(route, method = "GET", body = null, key = null) {
  const response = await fetch(`https://${state.tailscaleServeHostname}${route}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    redirect: "manual",
    signal: AbortSignal.timeout(60_000),
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const responseText = await response.text();
  const json = (() => { try { return JSON.parse(responseText); } catch { return null; } })();
  lastResponseSafe = json && typeof json === "object"
    ? { ok: json.ok ?? null, code: json.error?.code ?? null, message: json.error?.message ?? null }
    : null;
  requests.push({ method, route: route.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "fixture"), status: response.status });
  return { response, json };
}

function issueCodes(detail) {
  const readiness = detail?.json?.data?.header?.readiness;
  assert.ok(readiness && Array.isArray(readiness.issues), "canonical-readiness-missing");
  assert.equal(readiness.issues.length, readiness.hardBlockers.length + readiness.warnings.length, "canonical-readiness-count-mismatch");
  return readiness.issues.map((issue) => issue.code);
}

async function patchDueDate(workOrderId, expectedVersion, dueDate, label) {
  const key = `a66-readiness-${label}-${suffix}`;
  const patched = await request(`/api/v2/work-orders/${workOrderId}`, "PATCH", {
    clientRequestId: key,
    expectedVersion,
    patch: { dueDate },
  }, key);
  assert.equal(patched.response.status, 200, `${label}-status`);
  assert.ok(Number.isSafeInteger(patched.json?.data?.nextVersion), `${label}-next-version`);
  return patched.json.data.nextVersion;
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha66-readiness-refresh-runtime-qa", statement_timeout: 120000 });
  await client.connect();
  let workOrderId = null;
  let originalDueDate = null;
  let restored = false;
  try {
    const ledger = Number((await client.query("SELECT count(*)::integer count FROM wafl_v2_migration_ledger")).rows[0].count);
    assert.equal(ledger, 20);
    const target = (await client.query(`
      SELECT id::text, entity_version, due_date::text
      FROM work_orders
      WHERE company_id=$1 AND product_name LIKE $2 AND derivation_kind='rework' AND reorder_round=2 AND is_sample=false
      ORDER BY created_at DESC
      LIMIT 1
    `, [companyId, `${fixture.marker}%`])).rows[0];
    assert.ok(target, "retained-readiness-fixture-not-found");
    workOrderId = target.id;
    originalDueDate = target.due_date ?? null;

    const auth = await request("/api/dev/mobile-connect/auto", "POST", {});
    assert.equal(auth.response.status, 200, "developer-auto-connect");
    const before = await request(`/api/v2/work-orders/${workOrderId}`);
    assert.equal(before.response.status, 200, "detail-before");
    const beforeHeader = before.json.data.header;
    const beforeCodes = issueCodes(before);
    assert.ok(beforeCodes.length > 3, "readiness-fixture-needs-more-than-three-issues");
    assert.equal(beforeHeader.entityVersion, Number(target.entity_version), "authoritative-version-mismatch");
    assert.equal(beforeHeader.dueDate, originalDueDate, "authoritative-due-date-mismatch");

    const toggledDueDate = originalDueDate === null ? "2099-12-30" : null;
    const toggledVersion = await patchDueDate(workOrderId, beforeHeader.entityVersion, toggledDueDate, "toggle");
    const toggled = await request(`/api/v2/work-orders/${workOrderId}`);
    assert.equal(toggled.response.status, 200, "detail-after-toggle");
    const toggledCodes = issueCodes(toggled);
    const expectedDelta = originalDueDate === null ? -1 : 1;
    assert.equal(toggledCodes.length, beforeCodes.length + expectedDelta, "readiness-count-delta");
    assert.equal(toggledCodes.includes("DUE_DATE_REQUIRED"), toggledDueDate === null, "due-date-issue-state");
    assert.equal(toggled.json.data.header.readiness.basedOnVersion, toggledVersion, "toggle-readiness-version");
    assert.equal(toggled.json.data.header.readiness.source, "server_canonical", "toggle-readiness-source");

    const restoredVersion = await patchDueDate(workOrderId, toggledVersion, originalDueDate, "restore");
    restored = true;
    const after = await request(`/api/v2/work-orders/${workOrderId}`);
    assert.equal(after.response.status, 200, "detail-after-restore");
    const afterCodes = issueCodes(after);
    assert.deepEqual(afterCodes, beforeCodes, "readiness-issues-not-restored");
    assert.equal(after.json.data.header.dueDate, originalDueDate, "due-date-not-restored");
    assert.equal(after.json.data.header.readiness.basedOnVersion, restoredVersion, "restore-readiness-version");
    assert.equal(after.json.data.header.readiness.source, "server_canonical", "restore-readiness-source");

    const persisted = (await client.query("SELECT due_date::text FROM work_orders WHERE company_id=$1 AND id=$2::uuid", [companyId, workOrderId])).rows[0];
    assert.equal(persisted?.due_date ?? null, originalDueDate, "fixture-residual-due-date");
    const evidence = {
      result: "ALPHA66_HEADER_STATUS_LAYOUT_READINESS_REFRESH_RUNTIME_QA_PASS",
      checkpoint: "ALPHA66_HEADER_STATUS_LAYOUT_READINESS_REFRESH_IPHONE_REQA_REQUIRED",
      fixtureRef: fixture.rows.find((row) => row.derivationKind === "rework" && row.reorderRound === 2)?.workOrderRef ?? null,
      readinessCounts: { before: beforeCodes.length, toggled: toggledCodes.length, restored: afterCodes.length },
      transition: expectedDelta === -1 ? "N_TO_N_MINUS_1_THEN_N_PLUS_1_RESTORE" : "N_TO_N_PLUS_1_THEN_N_MINUS_1_RESTORE",
      overviewAndSheetSot: "header.readiness.issues",
      canonicalVersionReconciliation: "PASS",
      residual: 0,
      requests,
      migrationLedger: "20/20",
      migration021: 0,
      productionMutation: 0,
      ownerFixtureMutation: 0,
      physicalResultInferred: false,
    };
    fs.writeFileSync(resultPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ result: evidence.result, fixtureRef: evidence.fixtureRef, readinessCounts: evidence.readinessCounts, residual: 0, migrationLedger: evidence.migrationLedger }));
  } finally {
    if (workOrderId && !restored) {
      const current = (await client.query("SELECT entity_version,due_date::text FROM work_orders WHERE company_id=$1 AND id=$2::uuid", [companyId, workOrderId])).rows[0];
      if ((current?.due_date ?? null) !== originalDueDate) {
        await patchDueDate(workOrderId, Number(current.entity_version), originalDueDate, "failure-restore");
        const cleaned = (await client.query("SELECT due_date::text FROM work_orders WHERE company_id=$1 AND id=$2::uuid", [companyId, workOrderId])).rows[0];
        assert.equal(cleaned?.due_date ?? null, originalDueDate, "readiness-qa-failure-residual");
      }
    }
    await client.end();
  }
}

main().catch((error) => {
  console.error("alpha66-readiness-refresh-runtime-qa-failed", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: error instanceof Error ? error.message : "UNKNOWN",
    lastRequest: requests.at(-1) ?? null,
    lastResponse: lastResponseSafe,
  });
  process.exitCode = 1;
});
