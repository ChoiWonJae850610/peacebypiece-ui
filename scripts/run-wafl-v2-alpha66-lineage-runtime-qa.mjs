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
const resultPath = path.join(root, ".tmp", "wafl-v2-alpha66", "lineage-runtime-qa.json");
const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
const temporaryIds = [];
const requests = [];
let cookie = "";
let lastResponseSafe = null;
let lastResponseContentType = null;

assert.equal(state.status, "running");
assert.equal(state.makerQaProfile, "alpha65-current-maker");
assert.equal(state.developerAutoConnectReady, true);
assert.equal(state.metroAdvertisedHost, state.tailscaleIpv4);
assert.equal(state.iosManifestLaunchHost, state.tailscaleIpv4);

async function request(route, method = "GET", body = null, key = null) {
  const response = await fetch(`https://${state.tailscaleServeHostname}${route}`, {
    method,
    headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(key ? { "Idempotency-Key": key } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    redirect: "manual",
    signal: AbortSignal.timeout(60_000),
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const responseText = await response.text();
  const json = (() => { try { return JSON.parse(responseText); } catch { return null; } })();
  lastResponseContentType = response.headers.get("content-type");
  lastResponseSafe = json && typeof json === "object" ? { ok: json.ok ?? null, code: json.error?.code ?? null, message: json.error?.message ?? null } : null;
  requests.push({ method, route: route.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "fixture"), status: response.status });
  return { response, json };
}

async function cleanup(client, ids = temporaryIds) {
  if (!ids.length) return;
  await client.query("BEGIN");
  try {
    // Domain events are intentionally append-only and remain as the audit record of the isolated create/delete rehearsal.
    await client.query("DELETE FROM work_order_command_receipts WHERE company_id=$1 AND work_order_id=ANY($2::uuid[])", [companyId, ids]);
    await client.query("UPDATE work_orders SET current_revision_id=NULL WHERE company_id=$1 AND id=ANY($2::uuid[])", [companyId, ids]);
    await client.query("DELETE FROM work_order_revisions WHERE company_id=$1 AND work_order_id=ANY($2::uuid[])", [companyId, ids]);
    await client.query("DELETE FROM work_orders WHERE company_id=$1 AND id=ANY($2::uuid[])", [companyId, ids]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
}

async function main() {
  const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha66-lineage-runtime-qa", statement_timeout: 120000 });
  await client.connect();
  try {
    const ledger = Number((await client.query("SELECT count(*)::integer count FROM wafl_v2_migration_ledger")).rows[0].count);
    assert.equal(ledger, 20);
    const staleTemporaryIds = (await client.query("SELECT id::text FROM work_orders WHERE company_id=$1 AND product_name LIKE 'QA A66 create %'", [companyId])).rows.map((row) => row.id);
    await cleanup(client, staleTemporaryIds);
    assert.equal(Number((await client.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND product_name LIKE 'QA A66 create %'", [companyId])).rows[0].count), 0, "stale-temporary-create-cleanup");
    const auth = await request("/api/dev/mobile-connect/auto", "POST", {});
    assert.equal(auth.response.status, 200, "developer-auto-connect");
    const encoded = encodeURIComponent(fixture.marker);
    const expected = {
      all: { query: "", count: 7 },
      production: { query: "&character=production", count: 5 },
      sample: { query: "&character=sample", count: 2 },
      reorder: { query: "&lineage=reorder", count: 3 },
      rework: { query: "&lineage=rework", count: 3 },
    };
    const listedByIdentity = new Map();
    for (const [identity, expectation] of Object.entries(expected)) {
      const listed = await request(`/api/v2/work-orders?q=${encoded}${expectation.query}&limit=30`);
      assert.equal(listed.response.status, 200, `list-${identity}-status`);
      assert.equal(listed.json.data.items.length, expectation.count, `list-${identity}-count`);
      listedByIdentity.set(identity, listed.json.data.items);
    }
    assert.equal(listedByIdentity.get("production").filter((item) => item.identity.derivationKind === "original").length, 1, "production-original-count");
    const firstSample = await request(`/api/v2/work-orders?q=${encoded}&character=sample&limit=1`);
    assert.equal(firstSample.response.status, 200, "sample-cursor-page");
    assert.ok(firstSample.json.data.nextCursor);
    const mismatchedCursor = await request(`/api/v2/work-orders?q=${encoded}&lineage=rework&limit=1&cursor=${encodeURIComponent(firstSample.json.data.nextCursor)}`);
    assert.equal(mismatchedCursor.response.status, 400, "identity-filter-cursor-mismatch-must-fail");

    const rows = (await client.query("SELECT id::text,entity_version,derivation_kind,reorder_round,is_sample FROM work_orders WHERE company_id=$1 AND product_name LIKE $2 ORDER BY product_name", [companyId, `${fixture.marker}%`])).rows;
    const general = rows.find((row) => row.derivation_kind === "original" && !row.is_sample);
    const derived = rows.find((row) => row.derivation_kind === "rework" && Number(row.reorder_round) === 2 && !row.is_sample);
    const sampleRework = rows.find((row) => row.derivation_kind === "rework" && Number(row.reorder_round) === 0 && row.is_sample);
    const reorder = rows.find((row) => row.derivation_kind === "reorder" && Number(row.reorder_round) === 1);
    assert.ok(general && derived && sampleRework && reorder);
    const detail = await request(`/api/v2/work-orders/${derived.id}`);
    assert.equal(detail.response.status, 200, "derived-detail");
    assert.equal(detail.json.data.header.identity.derivationKind, "rework");
    assert.ok(detail.json.data.header.sourceSummary?.productName.includes(fixture.marker));
    assert.equal(detail.json.data.header.readiness.issues.length, detail.json.data.header.readiness.hardBlockers.length + detail.json.data.header.readiness.warnings.length, "canonical-readiness-count");
    assert.ok(detail.json.data.header.readiness.issues.length > 3, "physical-readiness-fixture-needs-more-than-three-issues");

    const sampleReorderFilter = await request(`/api/v2/work-orders?q=${encoded}&character=sample&lineage=reorder&limit=30`);
    assert.equal(sampleReorderFilter.response.status, 200);
    assert.equal(sampleReorderFilter.json.data.items.length, 0, "sample-reorder-filter-must-be-empty");
    const sampleReworkFilter = await request(`/api/v2/work-orders?q=${encoded}&character=sample&lineage=rework&limit=30`);
    assert.equal(sampleReworkFilter.response.status, 200);
    assert.equal(sampleReworkFilter.json.data.items.length, 1, "sample-rework-filter-must-return-one");

    const forbiddenKey = `a66-sample-reorder-forbidden-${suffix.toLowerCase()}`;
    const forbidden = await request(`/api/v2/work-orders/${reorder.id}/sample`, "PATCH", { clientRequestId: forbiddenKey, expectedVersion: Number(reorder.entity_version), isSample: true }, forbiddenKey);
    assert.equal(forbidden.response.status, 409, "reorder-sample-mutation-must-fail");

    const sampleOnKey = `a66-sample-on-${suffix.toLowerCase()}`;
    const sampleOn = await request(`/api/v2/work-orders/${general.id}/sample`, "PATCH", { clientRequestId: sampleOnKey, expectedVersion: Number(general.entity_version), isSample: true }, sampleOnKey);
    assert.equal(sampleOn.response.status, 200);
    assert.equal(sampleOn.json.data.result.isSample, true);
    const sampleOffKey = `a66-sample-off-${suffix.toLowerCase()}`;
    const sampleOff = await request(`/api/v2/work-orders/${general.id}/sample`, "PATCH", { clientRequestId: sampleOffKey, expectedVersion: sampleOn.json.data.nextVersion, isSample: false }, sampleOffKey);
    assert.equal(sampleOff.response.status, 200);
    assert.equal(sampleOff.json.data.result.isSample, false);

    for (const [label, isSample] of [["sample-on", true], ["sample-off", false]]) {
      const key = `a66-create-${suffix.toLowerCase()}-${label}`;
      const created = await request("/api/v2/work-orders", "POST", { clientRequestId: key, productName: `QA A66 create ${suffix} ${label}`, isSample }, key);
      assert.equal(created.response.status, 201, `create-${label}`);
      temporaryIds.push(created.json.data.result.workOrderId);
      assert.equal(created.json.data.result.isSample, isSample);
      assert.equal(created.json.data.result.derivationKind, "original");
      assert.equal(created.json.data.result.reorderRound, 0);
    }
    await cleanup(client);
    const residual = Number((await client.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND id=ANY($2::uuid[])", [companyId, temporaryIds])).rows[0].count);
    assert.equal(residual, 0, "temporary-create-residual");
    const retained = (await client.query("SELECT count(*)::integer count,bool_and(is_sample=false) FILTER (WHERE derivation_kind='original' AND product_name LIKE '%01 본생산 원본') general_restored FROM work_orders WHERE company_id=$1 AND product_name LIKE $2", [companyId, `${fixture.marker}%`])).rows[0];
    assert.equal(Number(retained.count), 7);
    assert.equal(retained.general_restored, true);
    const evidence = { result: "ALPHA66_SAMPLE_REORDER_PREISSUE_RUNTIME_QA_PASS", checkpoint: "ALPHA66_SAMPLE_REORDER_INVARIANT_PREISSUE_CHECKLIST_IPHONE_REQA_REQUIRED", fixture: fixture.marker, fixtureRows: 7, filterCounts: { ...Object.fromEntries(Object.entries(expected).map(([key, value]) => [key, value.count])), productionOriginal: 1 }, sampleReorderFilterCount: 0, sampleReworkFilterCount: 1, reorderSampleMutationRejected: true, readinessFixtureRef: fixture.rows.find((row) => row.derivationKind === "rework" && row.reorderRound === 2)?.workOrderRef ?? null, readinessIssueCount: detail.json.data.header.readiness.issues.length, cursorFilterBinding: "PASS", sampleCreateOnOff: "PASS", sampleEditRestore: "PASS", sourceSummary: "PASS", requests, temporaryResidual: 0, migrationLedger: "20/20", productionMutation: 0, ownerFixtureMutation: 0, physicalResultInferred: false };
    fs.writeFileSync(resultPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ result: evidence.result, fixture: evidence.fixture, fixtureRows: 7, requests: requests.length, temporaryResidual: 0, migrationLedger: evidence.migrationLedger, productionMutation: 0, ownerFixtureMutation: 0 }));
  } finally {
    try { await cleanup(client); } finally { await client.end(); }
  }
}

main().catch((error) => { console.error("alpha66-lineage-runtime-qa-failed", { errorName: error instanceof Error ? error.name : "UnknownError", errorCode: error instanceof Error ? error.message : "UNKNOWN", lastRequest: requests.at(-1) ?? null, lastResponse: lastResponseSafe, lastResponseContentType }); process.exitCode = 1; });
