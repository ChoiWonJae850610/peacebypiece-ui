#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const ROOT = process.cwd();
const COMPANY_ID = "wafl-fn-company-a";
const STATE_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "state.json");
const EVIDENCE_PATH = path.join(ROOT, ".tmp", "wafl-v2-alpha79", "stage2b-runtime-evidence.json");
const EXPECTED_DB_FINGERPRINT = "01e5dcc7fea3";
const MISSING_NAME = "QA A79 generated missing recovery";
const CORRUPT_NAME = "QA A79 generated corrupt recovery";
const safeRef = (value) => crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);

function environment() {
  const values = {};
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/u)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/u);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

function dbFingerprint(connectionString) {
  const parsed = new URL(connectionString);
  return safeRef(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`);
}

function sessionCookie(response) {
  return (response.headers.getSetCookie?.() ?? []).map((item) => item.split(";", 1)[0]).join("; ");
}

async function main() {
  const env = environment();
  assert.ok(env.DATABASE_URL, "DATABASE_URL_MISSING");
  assert.equal(dbFingerprint(env.DATABASE_URL), EXPECTED_DB_FINGERPRINT, "DEV_TEST_DATABASE_FINGERPRINT_MISMATCH");
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  assert.equal(state.status, "running");
  assert.equal(state.nodeVersion, "24.14.0");
  assert.equal(state.makerQaProfile, "alpha67-current-maker");
  assert.equal(state.mutationMode, "current-maker-alpha67");
  assert.equal(state.developerAutoConnectReady, true);
  const publicBase = String(state.publicOrigin);
  const localBase = `http://127.0.0.1:${Number(state.nextPort)}`;
  const requests = [];
  let cookie = "";

  async function request(base, route, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);
    try {
      const response = await fetch(`${base}${route}`, {
        method: options.method ?? "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
          ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(options.key ? { "Idempotency-Key": options.key } : {}),
        },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json") ? await response.json() : null;
      requests.push({
        host: base === localBase ? "loopback-dev-runner" : "canonical-external-qa",
        method: options.method ?? "GET",
        route: route.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, "fixture"),
        status: response.status,
      });
      return { response, body };
    } finally {
      clearTimeout(timer);
    }
  }

  const auth = await request(publicBase, "/api/dev/mobile-connect/auto", { method: "POST", body: {} });
  assert.equal(auth.response.status, 200, "DEVELOPER_AUTO_CONNECT_FAILED");
  cookie = sessionCookie(auth.response);
  assert.ok(cookie, "DEVELOPER_SESSION_COOKIE_MISSING");

  const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha79-stage2b-recovery", statement_timeout: 180000 });
  await client.connect();
  try {
    const ledger = await client.query("SELECT count(*)::integer count FROM wafl_v2_migration_ledger");
    assert.equal(Number(ledger.rows[0].count), 22, "MIGRATION_LEDGER_NOT_22");
    const retained = await client.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND product_name='QA A73 product sketch retained' AND deleted_at IS NULL", [COMPANY_ID]);
    assert.equal(Number(retained.rows[0].count), 1, "RETAINED_A73_FIXTURE_MISSING");
    const source = (await client.query(`
      SELECT w.id::text work_order_id
      FROM work_orders w
      WHERE w.company_id=$1 AND w.status IN ('issued','revised','completed') AND w.deleted_at IS NULL
        AND w.product_name NOT LIKE 'QA A79 generated % recovery'
        AND EXISTS (SELECT 1 FROM work_order_revision_images i WHERE i.company_id=w.company_id
          AND i.revision_id=w.current_revision_id AND i.is_representative=true)
      ORDER BY CASE WHEN w.product_name='QA A79 generation failure retry automated' THEN 0 ELSE 1 END,w.updated_at DESC LIMIT 1
    `, [COMPANY_ID])).rows[0];
    assert.ok(source?.work_order_id, "CANONICAL_COPY_SOURCE_NOT_FOUND");

    async function findFixture(name) {
      return (await client.query(`SELECT id::text work_order_id,current_revision_id::text revision_id,status
        FROM work_orders WHERE company_id=$1 AND product_name=$2 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`, [COMPANY_ID, name])).rows[0] ?? null;
    }

    async function prepareFixture(name, suffix) {
      let fixture = await findFixture(name);
      if (!fixture) {
        const copyKey = `a79-stage2b-copy-${suffix}-20260912`;
        const copied = await request(publicBase, `/api/v2/work-orders/${source.work_order_id}/copy`, {
          method: "POST", key: copyKey, body: { clientRequestId: copyKey }, timeoutMs: 180_000,
        });
        assert.equal(copied.response.status, 201, `FIXTURE_COPY_FAILED_${suffix}:${copied.body?.error?.code ?? "UNKNOWN"}`);
        const workOrderId = String(copied.body?.data?.result?.workOrderId ?? "");
        const revisionId = String(copied.body?.data?.result?.revisionId ?? "");
        const detail = await request(publicBase, `/api/v2/work-orders/${workOrderId}`);
        assert.equal(detail.response.status, 200, `FIXTURE_DETAIL_FAILED_${suffix}`);
        const renameId = `a79-stage2b-name-${suffix}-20260912`;
        const renamed = await request(publicBase, `/api/v2/work-orders/${workOrderId}`, {
          method: "PATCH",
          body: { clientRequestId: renameId, expectedVersion: detail.body.data.header.entityVersion, patch: { productName: name } },
        });
        assert.equal(renamed.response.status, 200, `FIXTURE_RENAME_FAILED_${suffix}`);
        fixture = { work_order_id: workOrderId, revision_id: revisionId, status: "draft" };
      }
      if (fixture.status === "draft") {
        let detail = await request(publicBase, `/api/v2/work-orders/${fixture.work_order_id}`);
        assert.equal(detail.response.status, 200, `FIXTURE_READY_DETAIL_FAILED_${suffix}`);
        if (detail.body.data.header.readiness.hardBlockers.some((item) => item.code === "BASIC_PROCESS_ORDER_REQUIRED")) {
          const process = (await client.query(`SELECT id::text process_id,status FROM work_order_processes
            WHERE company_id=$1 AND revision_id=$2::uuid AND process_type_code='production_factory'
            ORDER BY display_order,id LIMIT 1`, [COMPANY_ID, fixture.revision_id])).rows[0];
          assert.equal(process?.status, "ready", `FIXTURE_PROCESS_NOT_READY_${suffix}`);
          const key = `a79-stage2b-order-${suffix}-20260912`;
          const ordered = await request(publicBase, `/api/v2/work-orders/${fixture.work_order_id}/processes/${process.process_id}/order-request`, {
            method: "POST", key, body: { clientRequestId: key, expectedVersion: detail.body.data.header.entityVersion },
          });
          assert.equal(ordered.response.status, 200, `FIXTURE_ORDER_FAILED_${suffix}`);
          detail = await request(publicBase, `/api/v2/work-orders/${fixture.work_order_id}`);
        }
        assert.equal(detail.body.data.header.readiness.canIssue, true, `FIXTURE_NOT_READY_${suffix}`);
        const key = `a79-stage2b-issue-${suffix}-20260912`;
        const issued = await request(publicBase, `/api/v2/work-orders/${fixture.work_order_id}/revisions/issue`, {
          method: "POST", key, timeoutMs: 120_000,
          body: {
            clientRequestId: key,
            expectedWorkOrderVersion: detail.body.data.header.entityVersion,
            expectedRevisionVersion: detail.body.data.header.currentRevisionVersion,
            expectedRevisionId: fixture.revision_id,
            issueNote: "alpha.79 Stage 2B generated artifact recovery QA",
          },
        });
        assert.equal(issued.response.status, 200, `FIXTURE_ISSUE_FAILED_${suffix}:${issued.body?.error?.code ?? "UNKNOWN"}`);
        fixture.status = "issued";
      }
      return fixture;
    }

    async function documents(fixture) {
      const page = await request(publicBase, `/api/v2/work-orders/${fixture.work_order_id}/documents?limit=50`);
      assert.equal(page.response.status, 200);
      return [...page.body.data.items].filter((item) => item.revisionId === fixture.revision_id)
        .sort((left, right) => right.generationNumber - left.generationNumber || right.id.localeCompare(left.id));
    }

    async function health(documentId) {
      const result = await request(publicBase, `/api/v2/work-orders/documents/${documentId}/health`);
      assert.equal(result.response.status, 200, `HEALTH_FAILED:${result.body?.error?.code ?? "UNKNOWN"}`);
      return result.body.data.health;
    }

    async function generate(fixture, key) {
      const result = await request(publicBase, `/api/v2/work-orders/${fixture.work_order_id}/documents/generate`, {
        method: "POST", key, body: { revisionId: fixture.revision_id }, timeoutMs: 180_000,
      });
      assert.equal(result.response.status, 200, `GENERATION_FAILED:${result.body?.error?.code ?? "UNKNOWN"}`);
      return result.body.data;
    }

    async function ensureHealthy(fixture, suffix) {
      let current = (await documents(fixture))[0] ?? null;
      if (!current || current.status !== "generated" || await health(current.id) !== "healthy") {
        await generate(fixture, `a79-stage2b-ensure-${suffix}-${crypto.randomUUID()}`);
        current = (await documents(fixture))[0];
      }
      assert.equal(current?.status, "generated");
      assert.equal(await health(current.id), "healthy");
      return current;
    }

    async function mutate(documentId, action) {
      const result = await request(localBase, "/api/dev/a79-stage2b-artifact-state", { method: "POST", body: { action, documentId }, timeoutMs: 60_000 });
      assert.equal(result.response.status, 200, `${action}_FAILED:${result.body?.error ?? "UNKNOWN"}`);
      assert.equal(result.body.data.unrelatedMutation, 0);
      return result.body.data;
    }

    async function counts(fixture) {
      const row = (await client.query(`SELECT
        (SELECT count(*)::integer FROM work_order_revisions WHERE company_id=$1 AND work_order_id=$2::uuid) revisions,
        (SELECT count(*)::integer FROM generated_documents WHERE company_id=$1 AND work_order_id=$2::uuid) documents,
        (SELECT count(*)::integer FROM domain_events WHERE company_id=$1 AND entity_type='work_order'
          AND entity_id=$2::text AND command_code='work_order.revision.issue') issue_events`, [COMPANY_ID, fixture.work_order_id])).rows[0];
      return { revisions: Number(row.revisions), documents: Number(row.documents), issueEvents: Number(row.issue_events) };
    }

    const missingFixture = await prepareFixture(MISSING_NAME, "missing");
    const corruptFixture = await prepareFixture(CORRUPT_NAME, "corrupt");

    const missingBefore = await counts(missingFixture);
    const missingN = await ensureHealthy(missingFixture, "missing-n");
    const missingMutation = await mutate(missingN.id, "DELETE_EXACT_GENERATED_OBJECT");
    assert.equal(missingMutation.after, "missing");
    assert.equal(await health(missingN.id), "missing");
    const replayKey = `a79-stage2b-missing-recovery-${crypto.randomUUID()}`;
    const [missingRecovery, missingReplay] = await Promise.all([
      generate(missingFixture, replayKey),
      generate(missingFixture, replayKey),
    ]);
    assert.equal(missingRecovery.generatedDocumentId, missingReplay.generatedDocumentId, "SAME_KEY_REPLAY_NOT_CANONICAL");
    const missingRecovered = (await documents(missingFixture))[0];
    assert.equal(missingRecovered.generationNumber, missingN.generationNumber + 1);
    assert.equal(await health(missingRecovered.id), "healthy");
    assert.equal((await documents(missingFixture)).find((item) => item.id === missingN.id)?.status, "generated");
    const physicalMutation = await mutate(missingRecovered.id, "DELETE_EXACT_GENERATED_OBJECT");
    assert.equal(physicalMutation.after, "missing");
    assert.equal(await health(missingRecovered.id), "missing");
    const missingAfter = await counts(missingFixture);
    assert.equal(missingAfter.revisions, missingBefore.revisions);
    assert.equal(missingAfter.issueEvents, missingBefore.issueEvents);

    const corruptBefore = await counts(corruptFixture);
    const corruptN = await ensureHealthy(corruptFixture, "corrupt-n");
    const corruptMutation = await mutate(corruptN.id, "CORRUPT_EXACT_GENERATED_OBJECT");
    assert.equal(corruptMutation.after, "corrupt");
    assert.equal(await health(corruptN.id), "corrupt");
    await generate(corruptFixture, `a79-stage2b-corrupt-recovery-${crypto.randomUUID()}`);
    const corruptRecovered = (await documents(corruptFixture))[0];
    assert.equal(corruptRecovered.generationNumber, corruptN.generationNumber + 1);
    assert.equal(await health(corruptRecovered.id), "healthy");
    assert.equal((await documents(corruptFixture)).find((item) => item.id === corruptN.id)?.status, "generated");
    const corruptAfter = await counts(corruptFixture);
    assert.equal(corruptAfter.revisions, corruptBefore.revisions);
    assert.equal(corruptAfter.issueEvents, corruptBefore.issueEvents);

    const evidence = {
      ok: true,
      checkpoint: "ALPHA79_STAGE2B_MISSING_CORRUPT_RECOVERY_IPHONE_IPAD_QA_REQUIRED",
      migrationLedger: "22/22",
      missing: {
        fixture: MISSING_NAME,
        oldGeneration: missingN.generationNumber,
        recoveredGeneration: missingRecovered.generationNumber,
        finalPhysicalHealth: "missing",
        oldGeneratedRowImmutable: true,
        sameKeyReplayCanonical: true,
        revisionDelta: missingAfter.revisions - missingBefore.revisions,
        issueEventDelta: missingAfter.issueEvents - missingBefore.issueEvents,
      },
      corrupt: {
        fixture: CORRUPT_NAME,
        oldGeneration: corruptN.generationNumber,
        recoveredGeneration: corruptRecovered.generationNumber,
        finalHealth: "healthy",
        oldGeneratedRowImmutable: true,
        revisionDelta: corruptAfter.revisions - corruptBefore.revisions,
        issueEventDelta: corruptAfter.issueEvents - corruptBefore.issueEvents,
      },
      exactOwnedR2Mutation: { delete: 2, overwrite: 1, unrelated: 0, production: 0 },
      productionOwnerAmbiguousBusinessMutation: [0, 0, 0],
      retainedRecipe: { name: "QA A73 product sketch retained", ref: "fb1f3f75fd06", count: 1 },
      physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
      requests,
    };
    fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
    fs.writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ ok: true, evidencePath: path.relative(ROOT, EVIDENCE_PATH), missingPhysicalReady: true, corruptAutomatedPass: true }));
  } finally {
    await client.end();
  }
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
